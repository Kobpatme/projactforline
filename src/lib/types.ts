// ============================================
// LINE Sticker Generator — Type Definitions
// ============================================

export type ProjectStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface StickerProject {
  id: string;
  user_id: string;
  source_image_url: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface StickerResult {
  id: string;
  project_id: string;
  image_url: string | null;
  action_name: string;
  order_index: number;
  created_at: string;
}

export interface StickerAction {
  name: string;
  emoji: string;
  prompt: string;
}

export interface GenerateRequest {
  imageFile: File;
  projectId?: string;
}

export interface GenerateResponse {
  projectId: string;
  status: ProjectStatus;
  results: StickerResult[];
}
