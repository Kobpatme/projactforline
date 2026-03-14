// ============================================
// LINE Sticker Generator — Action / Emotion Logic
// ============================================

import { StickerAction } from './types';

/**
 * Predefined list of 10 specific emotions/actions for LINE stickers.
 */
export const STICKER_ACTIONS: StickerAction[] = [
  { name: 'Greeting',    emoji: '👋', prompt: 'waving hand with a big friendly smile, saying Hi' },
  { name: 'Love/Like',   emoji: '😍', prompt: 'making a heart shape with hands, eyes sparkling with joy' },
  { name: 'Agree/OK',    emoji: '👍', prompt: 'giving a double thumbs up, confident and happy face' },
  { name: 'Thinking',    emoji: '🤔', prompt: 'hand on chin, looking up with a thoughtful expression and a light bulb' },
  { name: 'Crying',      emoji: '😢', prompt: 'exaggerated crying eyes with blue water streams, dramatic but cute' },
  { name: 'Angry',       emoji: '😠', prompt: 'red face, steam coming from ears, crossing arms' },
  { name: 'Surprised',   emoji: '😲', prompt: 'wide eyes, open mouth, hands on cheeks, shocked expression' },
  { name: 'Sleeping',    emoji: '😴', prompt: 'closed eyes, Zzz bubbles floating, peaceful sleeping face' },
  { name: 'Celebrating', emoji: '🎉', prompt: 'throwing confetti, holding a party popper, very excited' },
  { name: 'Thank you',   emoji: '🙏', prompt: 'bowing politely with a warm smile, hands pressed together' },
];

/**
 * Picks N random actions from the predefined list.
 * Since the user provided exactly 10, this will return all 10 by default.
 */
export function pickRandomActions(count: number = 10): StickerAction[] {
  // Use all if count is 10, otherwise shuffle and pick
  if (count >= STICKER_ACTIONS.length) {
    return [...STICKER_ACTIONS];
  }

  const shuffled = [...STICKER_ACTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generates the full AI prompt for a specific sticker action.
 * Uses the user's specified base style.
 */
export function buildStickerPrompt(action: StickerAction): string {
  const baseStyle = "Line sticker style, flat vector illustration, bold clean outlines, thick white border around the character, minimal shading, expressive facial features, isolated on plain white background, high quality, 2d style";
  
  return `${baseStyle}, ${action.prompt}`;
}
