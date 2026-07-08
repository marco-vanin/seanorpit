/**
 * Stats + record persistence over localStorage, keyed from `@/config`. Read by
 * the home strip (`duel`) and settings (`settings`), written by the game engine
 * (`game`). Living in the shared `lib` layer removes the duel→game and
 * settings→game edges. The `bd_*` key strings are unchanged so existing users'
 * stats survive.
 */
import type { Matchup, Mode } from '@/types'
import { STORAGE_KEYS, bestKey } from '@/config'

// ── Per-(matchup, mode) best ────────────────────────────────────────────────

/** Read the best for a (matchup, mode). Custom matchups persist nothing → 0. */
export function readBestFor(matchup: Matchup, mode: Mode): number {
  if (matchup.source === 'custom') return 0
  try {
    const raw = localStorage.getItem(bestKey(matchup.id, mode.key))
    return raw !== null ? parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

export function writeBestFor(matchup: Matchup, mode: Mode, value: number): void {
  if (matchup.source === 'custom') return
  try {
    localStorage.setItem(bestKey(matchup.id, mode.key), String(value))
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

/** Read the persisted best for a (matchup, mode) without starting a run. */
export function bestFor(matchup: Matchup, mode: Mode): number {
  return readBestFor(matchup, mode)
}

/**
 * Clear every persisted lifetime stat and record. Prefix-based (not a hardcoded
 * list) so all `bd_life*` totals and every per-(matchup,mode) `bd_best*` record
 * are removed in one pass.
 * Theme (`bd_theme`), mute (`bd_muted`) and the first-play hint
 * (`bd_hint_seen`) are intentionally left untouched. Iterates a snapshot of
 * the keys so deleting during the loop is safe. Guarded for private mode.
 */
export function resetStats(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('bd_life') || key.startsWith('bd_best')) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

// ── Lifetime stats (home strip) ─────────────────────────────────────────────
// Cumulative across every finished game: games played, correct answers,
// answered questions (for average accuracy), and the all-time best streak.

function readInt(key: string): number {
  try {
    return parseInt(localStorage.getItem(key) || '0', 10) || 0
  } catch {
    return 0
  }
}

export interface LifetimeStats {
  /** Games completed. */
  games: number
  /** Average accuracy across all answered questions, 0–100. */
  accuracy: number
  /** All-time best streak. */
  recordStreak: number
}

/** Read the persisted lifetime stats for the home strip. */
export function lifetimeStats(): LifetimeStats {
  const games = readInt(STORAGE_KEYS.lifeGames)
  const correct = readInt(STORAGE_KEYS.lifeCorrect)
  const answered = readInt(STORAGE_KEYS.lifeAnswered)
  return {
    games,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    recordStreak: readInt(STORAGE_KEYS.lifeRecStreak),
  }
}

/** One finished run's totals to fold into the lifetime stats. */
export interface FinishedRun {
  /** Questions answered this run. */
  answered: number
  /** Correct answers this run. */
  score: number
  /** Best streak reached this run. */
  bestStreak: number
}

/** Fold one finished run into the lifetime totals. */
export function recordGame(run: FinishedRun): void {
  try {
    localStorage.setItem(STORAGE_KEYS.lifeGames, String(readInt(STORAGE_KEYS.lifeGames) + 1))
    localStorage.setItem(
      STORAGE_KEYS.lifeCorrect,
      String(readInt(STORAGE_KEYS.lifeCorrect) + run.score),
    )
    localStorage.setItem(
      STORAGE_KEYS.lifeAnswered,
      String(readInt(STORAGE_KEYS.lifeAnswered) + run.answered),
    )
    localStorage.setItem(
      STORAGE_KEYS.lifeRecStreak,
      String(Math.max(readInt(STORAGE_KEYS.lifeRecStreak), run.bestStreak)),
    )
  } catch {
    /* ignore — private mode / storage disabled */
  }
}
