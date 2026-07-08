import type { Matchup, Mode, Side, Song } from '@/types'
import { STORAGE_KEYS } from '@/config'

export type Screen = 'playing' | 'reveal' | 'results'
/** The player's choice: a slot, a timeout, or nothing yet. */
export type Selection = Side | 'timeout' | null

export interface GameState {
  matchup: Matchup | null
  mode: Mode | null
  screen: Screen
  order: number[]
  qIndex: number
  score: number
  streak: number
  bestStreak: number
  playing: boolean
  selected: Selection
  timeLeft: number
  best: number
  muted: boolean
  /** True once the player has made their first explicit guess ever. */
  hintSeen: boolean
}

// ── Session prefs (mute + first-play hint) ──────────────────────────────────

export function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.muted) === '1'
  } catch {
    return false
  }
}

export function writeMuted(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.muted, value ? '1' : '0')
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

/** Whether the first-play hint has already been consumed by an explicit guess. */
export function readHintSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.hintSeen) === '1'
  } catch {
    return false
  }
}

export function writeHintSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.hintSeen, '1')
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

// ── Pure round helpers ──────────────────────────────────────────────────────

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build the question order for a matchup+mode: finite slice or full shuffle. */
export function orderFor(matchup: Matchup, mode: Mode): number[] {
  const indices = matchup.songs.map((_, i) => i)
  const shuffled = shuffle(indices)
  return mode.questions === 'endless'
    ? shuffled
    : shuffled.slice(0, Math.min(mode.questions, matchup.songs.length))
}

/** The song pool for a state (the active matchup's songs, or empty). */
function poolFor(s: GameState): readonly Song[] {
  return s.matchup ? s.matchup.songs : []
}

export function songAt(s: GameState): Song | null {
  const pool = poolFor(s)
  return pool.length ? (pool[s.order[s.qIndex]] ?? null) : null
}

/** Round length for a state: fixed count, or the shuffled endless-pool size. */
export function totalFor(s: GameState): number {
  if (!s.mode || !s.matchup) return 0
  return s.mode.questions === 'endless'
    ? s.order.length
    : Math.min(s.mode.questions, s.matchup.songs.length)
}

/**
 * Whether the run ends after the current (answered) question. Used by both the
 * reveal button label (`isLast`) and `next()`. Only meaningful once a choice is
 * locked in for Mort subite's wrong-answer branch; the finite/endless branches
 * are purely positional.
 */
export function runEndsFor(s: GameState): boolean {
  const mode = s.mode
  if (!mode || !s.matchup) return false
  const total = totalFor(s)
  const song = songAt(s)
  const answerCorrect = !!song && s.selected === song.side
  const answeredWrong = s.selected !== null && !answerCorrect
  const finiteLast = mode.questions !== 'endless' && s.qIndex + 1 >= total
  const endlessLast = mode.questions === 'endless' && s.qIndex + 1 >= s.order.length
  return (mode.endOnWrong && answeredWrong) || finiteLast || endlessLast
}
