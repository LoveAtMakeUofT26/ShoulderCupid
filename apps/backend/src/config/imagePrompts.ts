export interface AppearanceSpec {
  hair_color: string
  hair_style: string
  eye_color: string
  outfit_color: string
  gender: string
}

/**
 * Build a consistent prompt for chibi anime cupid coach images.
 * Kept for storage in generation_metadata (can be used for future AI image gen).
 */
export function buildCoachImagePrompt(
  traits: string[],
  appearance: AppearanceSpec
): string {
  const traitDescriptors = traits.slice(0, 3).join(', ')

  return [
    'chibi anime cupid character',
    `${appearance.gender}`,
    `${appearance.hair_color} ${appearance.hair_style} hair`,
    `${appearance.eye_color} eyes`,
    `${appearance.outfit_color} outfit accents`,
    'personality: ' + traitDescriptors,
    'cute kawaii style',
  ].join(', ')
}

// Map common appearance colors to hex for DiceBear background
const COLOR_MAP: Record<string, string> = {
  gold: 'f5c542',
  crimson: 'dc3545',
  teal: '20c997',
  lavender: 'b197fc',
  emerald: '2ecc71',
  pink: 'f5a3b1',
  blue: '6ea8fe',
  red: 'e8566c',
  silver: 'adb5bd',
  purple: 'a855f7',
}

/**
 * Build a DiceBear avatar URL for a coach.
 * Deterministic (same name + appearance = same avatar), instant, no API key needed.
 */
export function buildAvatarUrl(name: string, appearance: AppearanceSpec): string {
  const seed = `${name}-${appearance.hair_color}-${appearance.eye_color}`
  const bg = COLOR_MAP[appearance.outfit_color.toLowerCase()] ?? 'f5a3b1'
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&size=256`
}
