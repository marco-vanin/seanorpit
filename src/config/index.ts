/**
 * App-wide tuning constants + the localStorage key namespace. Centralized here
 * so the literal `bd_*` strings live in one place — but the string values are
 * unchanged, so existing users' persisted stats survive the refactor.
 */

/** Suspense beat between tapping an answer and the reveal mounting (ms). */
export const REVEAL_DELAY_MS = 450

/** All persisted state lives under the app's `bd_` namespace. */
export const STORAGE_KEYS = {
  muted: 'bd_muted',
  hintSeen: 'bd_hint_seen',
  theme: 'bd_theme',
  lifeGames: 'bd_life_games',
  lifeCorrect: 'bd_life_correct',
  lifeAnswered: 'bd_life_answered',
  lifeRecStreak: 'bd_life_recstreak',
  // ── Daily challenge (Duel du jour) — additive, independent of the stats above.
  dailyLast: 'bd_daily_last',
  dailyStreak: 'bd_daily_streak',
  dailyBest: 'bd_daily_best',
  dailyResult: 'bd_daily_result',
} as const

/** localStorage best key for a curated (matchup, mode) pair. */
export function bestKey(matchupId: string, modeKey: string): string {
  return `bd_best_${matchupId}_${modeKey}`
}
