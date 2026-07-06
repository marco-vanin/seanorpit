/**
 * TS mirror of the design tokens in `src/index.css`, for inline-style usage.
 * Keep these in sync with the CSS custom properties in src/index.css.
 */
export const C = {
  bg: '#0c0d11',
  text: '#edeef2',
  muted: '#9a9eae',
  muted2: '#7c8091',
  muted3: '#6a6e7e',
  muted4: '#5c6070',
  muted5: '#4d5162',
  border: '#21232d',
  border2: '#24262f',
  surface: '#12141b',
  surface2: '#15171f',

  sean: 'oklch(0.78 0.15 155)',
  pit: 'oklch(0.78 0.15 55)',
  gold: 'oklch(0.82 0.14 85)',

  sansFont: "'Space Grotesk', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', monospace",
} as const

/** Artist accent color helper. */
export function artistColor(artist: 'sean' | 'pit'): string {
  return artist === 'sean' ? C.sean : C.pit
}
