import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';
import { getActionByName, buildStickerPrompt } from '@/lib/actions';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const actionName = url.searchParams.get('actionName');

    if (!projectId || !actionName) {
      console.error('Webhook missing parameters:', { projectId, actionName });
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const body = await request.json();
    console.log(`Webhook received for Project: ${projectId}, Action: ${actionName}, Status: ${body.status}`);

    if (body.status === 'succeeded' && body.output) {
      // For InstantID, output is usually an array of URLs
      const imageUrl = Array.isArray(body.output) ? body.output[0] : body.output;

      const { error } = await supabase
        .from('sticker_results')
        .update({ image_url: imageUrl })
        .eq('project_id', projectId)
        .eq('action_name', actionName);

      if (error) {
        console.error('Supabase update error in webhook:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully updated sticker: ${actionName}`);
      
      // --- SEQUENCE LOGIC: TRIGGER THE NEXT STICKER ---
      return await triggerNextSticker(request, projectId);

    } else if (body.status === 'failed') {
       console.error(`Replicate generation failed for ${actionName}:`, body.error);
       // Even if it fails, we should move on to the next one to not break the chain
       return await triggerNextSticker(request, projectId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function triggerNextSticker(request: NextRequest, projectId: string) {
  // 1. Get the project source image URL
  const { data: project } = await supabase
    .from('sticker_projects')
    .select('source_image_url')
    .eq('id', projectId)
    .single();

  if (!project) return NextResponse.json({ success: true, message: 'Project not found for chaining' });

  // 2. Find the next pending action
  const { data: nextTask } = await supabase
    .from('sticker_results')
    .select('action_name, order_index')
    .eq('project_id', projectId)
    .is('image_url', null)
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (nextTask) {
      const nextActionDef = getActionByName(nextTask.action_name);
      if (nextActionDef) {
          const prompt = buildStickerPrompt(nextActionDef);
          
          const protocol = request.headers.get('x-forwarded-proto') || 'https';
          const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
          const baseUrl = `${protocol}://${host}`;
          
          const webhookUrl = `${baseUrl}/api/webhooks/replicate?projectId=${projectId}&actionName=${encodeURIComponent(nextTask.action_name)}`;

          // Trigger next replicate
          await replicate.predictions.create({
            version: "zsxkib/instant-id:06652496a4146a47a166299d91f4b8801d0a5f973715d18e8073b64bc95f590a", 
            input: {
              image: project.source_image_url,
              prompt: prompt,
              negative_prompt: "realistic, photo, 3d, noise, messy, low quality",
              style_name: "Watercolor", 
              adapter_strength_ratio: 0.8,
              identity_net_strength_ratio: 0.8,
            },
            webhook: webhookUrl,
            webhook_events_filter: ["completed"]
          });
          console.log(`Triggered NEXT sequence in chain for: ${nextTask.action_name}`);
      }
  } else {
     console.log(`All 10 stickers completed sequentially for project ${projectId}.`);
     // Update project status to completed
     await supabase.from('sticker_projects').update({ status: 'completed' }).eq('id', projectId);
  }

  return NextResponse.json({ success: true });
}
