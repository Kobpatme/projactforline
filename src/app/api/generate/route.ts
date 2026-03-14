import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { supabase } from '@/lib/supabase';
import { pickRandomActions, buildStickerPrompt } from '@/lib/actions';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * POST /api/generate
 *
 * Handles sticker generation.
 * 1. Uploads source image to Supabase Storage
 * 2. Creates a record in sticker_projects
 * 3. Triggers 10 Replicate predictions
 * 4. Returns the project details
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    console.log('--- Generation Request Start ---');
    console.log('Image received:', image ? `${image.name} (${image.size} bytes)` : 'None');

    if (!image) {
      console.error('Validation Error: No image file provided');
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // 1. Upload source image to Supabase Storage
    const fileName = `${Date.now()}-${image.name}`;
    console.log('Uploading to Supabase Storage: source-images/', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('source-images')
      .upload(fileName, image);

    if (uploadError) {
      console.error('Supabase Storage Upload Error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload source image',
        details: uploadError.message 
      }, { status: 500 });
    }
    
    console.log('Upload successful:', uploadData.path);

    const { data: { publicUrl: sourceImageUrl } } = supabase.storage
      .from('source-images')
      .getPublicUrl(uploadData.path);

    // 2. Create sticker_project
    // NOTE: In a real app, you'd get the user_id from auth. For now, we'll assume a placeholder or that RLS allows it if configured for public/testing
    const { data: projectData, error: projectError } = await supabase
      .from('sticker_projects')
      .insert({
        source_image_url: sourceImageUrl,
        status: 'processing',
      })
      .select()
      .single();

    if (projectError) {
      console.error('Supabase Database Error (Project):', projectError);
      return NextResponse.json({ 
        error: 'Failed to create project record',
        details: projectError.message 
      }, { status: 500 });
    }

    console.log('Project created ID:', projectData.id);

    const projectId = projectData.id;

    // 3. Pick 10 actions and start generations
    const selectedActions = pickRandomActions(10);

    // Prepare result records first to get the structure
    const stickerTasks = selectedActions.map((action, index) => ({
      project_id: projectId,
      action_name: action.name,
      order_index: index,
      // image_url will be updated later
    }));

    // Insert task placeholders into sticker_results
    const { error: resultsError } = await supabase
      .from('sticker_results')
      .insert(stickerTasks);

    if (resultsError) {
      console.error('DB Results Error:', resultsError);
    }

    // 4. Trigger Replicate Predictions (Non-blocking / Background)
    // We trigger them all and the client will poll for changes in 'sticker_results'
    // Specifically using fofr/instant-id which is excellent for face-to-illustration
    for (const action of selectedActions) {
      const prompt = buildStickerPrompt(action);
      
      // We don't await here to keep the API response fast, 
      // but we need a way to update the database when done.
      // Replicate Webhooks are better, but for this simple setup we'll trigger them
      // and have a background listener or just poll.
      
      replicate.predictions.create({
        version: "zsxkib/instant-id:06652496a4146a47a166299d91f4b8801d0a5f973715d18e8073b64bc95f590a", // Example ID for InstantID
        input: {
          image: sourceImageUrl,
          prompt: prompt,
          negative_prompt: "realistic, photo, 3d, noise, messy, low quality",
          style_name: "Watercolor", // Gives a nice sticker look
          adapter_strength_ratio: 0.8,
          identity_net_strength_ratio: 0.8,
        },
        // In a real app, use webhooks here:
        // webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate?projectId=${projectId}&action=${action.name}`
      }).then(async (prediction) => {
        // Simple polling/waiting logic within the background promise for demo purposes
        // Ideally, Replicate Webhooks would update the database.
        let result = await replicate.wait(prediction);
        if (result.status === 'succeeded' && result.output) {
          const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
          
          // Update sticker_results with the generated image URL
          await supabase
            .from('sticker_results')
            .update({ image_url: imageUrl })
            .eq('project_id', projectId)
            .eq('action_name', action.name);
        }
      }).catch(err => {
        console.error(`Replicate Error for ${action.name}:`, err);
      });
    }

    return NextResponse.json({
      success: true,
      projectId: projectId,
      message: 'Generation started. 10 stickers are being created.',
    });
  } catch (error) {
    console.error('Generate API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
