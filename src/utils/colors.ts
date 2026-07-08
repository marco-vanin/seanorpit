import type { Matchup, Side } from '@/types'

/**
 * Dynamic slot-accent helpers returning a CSS-var string, for the runtime cases
 * a static utility class can't express (a color chosen from data at render
 * time). A = blue (`--slot-a`), B = pink (`--slot-b`).
 */
export function slotColor(side: Side): string {
  return side === 'a' ? 'var(--slot-a)' : 'var(--slot-b)'
}

/** Slot accent for a side: matchup override, else A = blue, B = pink. */
export function sideColor(matchup: Matchup, side: Side): string {
  return matchup[side].color ?? slotColor(side)
}
