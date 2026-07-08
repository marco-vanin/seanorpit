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
  dim: 'var(--dim)',
  border: 'var(--border)',
  border2: 'var(--border-2)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',

  slotA: 'var(--slot-a)', // A-slot accent (blue)
  slotB: 'var(--slot-b)', // B-slot accent (pink)
  ok: 'var(--ok)', // correct result (green)
  bad: 'var(--bad)', // wrong result (red)
  gold: 'var(--gold)',

  sansFont: "'Space Grotesk', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', monospace",
} as const

/** Slot accent helper: A = blue, B = pink. */
export function slotColor(side: 'a' | 'b'): string {
  return side === 'a' ? C.slotA : C.slotB
}
