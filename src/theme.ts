/**
 * TS mirror of the design tokens in `src/index.css`, for inline-style usage.
 * Keep these in sync with the CSS custom properties in src/index.css.
 */
export const C = {
  bg: 'var(--bg)',
  text: 'var(--text)',
  muted: 'var(--muted)',
  muted2: 'var(--muted-2)',
  muted3: 'var(--muted-3)',
  muted4: 'var(--muted-4)',
  muted5: 'var(--muted-5)',
  border: 'var(--border)',
  border2: 'var(--border-2)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',

  sean: 'var(--sean)',
  pit: 'var(--pit)',
  gold: 'var(--gold)',

  sansFont: "'Space Grotesk', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', monospace",
} as const

/** Slot accent helper: A = green, B = orange. */
export function slotColor(side: 'a' | 'b'): string {
  return side === 'a' ? C.sean : C.pit
}
