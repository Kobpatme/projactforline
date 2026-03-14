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

    // 4. Trigger Replicate Prediction for the FIRST action only
    // This starts the "Webhook Daisy Chain". The webhook will trigger the next one.
    
    // Set up webhook URL
    // Use the explicit app URL if provided (best for production), otherwise fallback to headers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (
      `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('x-forwarded-host') || request.headers.get('host')}`
    );

    const firstAction = selectedActions[0];
    const prompt = buildStickerPrompt(firstAction);
      
    const webhookUrl = `${baseUrl}/api/webhooks/replicate?projectId=${projectId}&actionName=${encodeURIComponent(firstAction.name)}`;
    console.log(`Starting Sequence. Triggering FIRST action: ${firstAction.name} with webhook: ${webhookUrl}`);

    replicate.predictions.create({
      version: "fofr/instant-id:80321287eeba72bafeaaf4531be3eb71e21b777a80b192ea6daee041db9fb99e", 
      input: {
        image: sourceImageUrl,
        prompt: prompt,
        negative_prompt: "realistic, photo, 3d, noise, messy, low quality",
        style_name: "Watercolor", 
        adapter_strength_ratio: 0.8,
        identity_net_strength_ratio: 0.8,
      },
      webhook: webhookUrl,
      webhook_events_filter: ["completed"]
    }).catch(err => {
      console.error(`Replicate Error for ${firstAction.name}:`, err);
    });

    return NextResponse.json({
      success: true,
      projectId: projectId,
      message: 'Generation started. 10 stickers are being created.',
    });
  } catch (error: any) {
    console.error('Generate API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
