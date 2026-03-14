import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    } else if (body.status === 'failed') {
       console.error(`Replicate generation failed for ${actionName}:`, body.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
