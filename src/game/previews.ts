import previews from './previews.json'

/**
 * Title → 30-second preview clip URL (Apple/iTunes CDN), resolved at build time
 * by `scripts/fetch-previews.mjs`. Missing entries just fall back to no audio.
 */
const PREVIEWS = previews as Record<string, string>

export function previewFor(title: string): string | undefined {
  return PREVIEWS[title]
}
