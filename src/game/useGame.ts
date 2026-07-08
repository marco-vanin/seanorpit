import { useCallback, useEffect, useRef, useState } from 'react'
import type { Matchup, Side, Song } from './matchups'
import type { Mode } from './modes'

export type Screen = 'playing' | 'reveal' | 'results'
/** The player's choice: a slot, a timeout, or nothing yet. */
export type Selection = Side | 'timeout' | null

/** Suspense beat between tapping an answer and the reveal mounting (ms). */
export const REVEAL_DELAY_MS = 450

const MUTED_KEY = 'spvp_muted'
const HINT_SEEN_KEY = 'spvp_hint_seen'

/** localStorage best key for a curated (matchup, mode) pair. */
function bestKeyFor(matchup: Matchup, mode: Mode): string {
  return `spvp_best_${matchup.id}_${mode.key}`
}

/**
 * Read the best for a (matchup, mode). Custom matchups persist nothing → 0.
 * One-time migration for `seanpit`: if the per-matchup key is unset but the
 * legacy per-mode key (`spvp_best_<modeKey>` == mode.bestKey) exists, seed the
 * new key from it. The legacy key is left untouched.
 */
function readBestFor(matchup: Matchup, mode: Mode): number {
  if (matchup.source === 'custom') return 0
  try {
    const key = bestKeyFor(matchup, mode)
    const raw = localStorage.getItem(key)
    if (raw !== null) return parseInt(raw, 10) || 0
    if (matchup.id === 'seanpit') {
      const legacy = localStorage.getItem(mode.bestKey)
      if (legacy !== null) {
        const v = parseInt(legacy, 10) || 0
        try {
          localStorage.setItem(key, String(v))
        } catch {
          /* ignore — private mode / storage disabled */
        }
        return v
      }
    }
    return 0
  } catch {
    return 0
  }
}

function writeBestFor(matchup: Matchup, mode: Mode, value: number): void {
  if (matchup.source === 'custom') return
  try {
    localStorage.setItem(bestKeyFor(matchup, mode), String(value))
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
 * list) so all `spvp_life*` totals and every `spvp_best*` record — including
 * per-(matchup,mode) keys and legacy per-mode keys — are removed in one pass.
 * Theme (`bd_theme`), mute (`spvp_muted`) and the first-play hint
 * (`spvp_hint_seen`) are intentionally left untouched. Iterates a snapshot of
 * the keys so deleting during the loop is safe. Guarded for private mode.
 */
export function resetStats(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('spvp_life') || key.startsWith('spvp_best')) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1'
  } catch {
    return false
  }
}

function writeMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, value ? '1' : '0')
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

/** Whether the first-play hint has already been consumed by an explicit guess. */
function readHintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function writeHintSeen(): void {
  try {
    localStorage.setItem(HINT_SEEN_KEY, '1')
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

// ── Lifetime stats (home strip) ─────────────────────────────────────────────
// Cumulative across every finished game: games played, correct answers,
// answered questions (for average accuracy), and the all-time best streak.
const LIFE_GAMES_KEY = 'spvp_life_games'
const LIFE_CORRECT_KEY = 'spvp_life_correct'
const LIFE_ANSWERED_KEY = 'spvp_life_answered'
const LIFE_RECSTREAK_KEY = 'spvp_life_recstreak'

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
  const games = readInt(LIFE_GAMES_KEY)
  const correct = readInt(LIFE_CORRECT_KEY)
  const answered = readInt(LIFE_ANSWERED_KEY)
  return {
    games,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    recordStreak: readInt(LIFE_RECSTREAK_KEY),
  }
}

/** Fold one finished run into the lifetime totals. Answered = questions seen. */
function recordGame(s: GameState): void {
  try {
    const answered = s.qIndex + 1
    localStorage.setItem(LIFE_GAMES_KEY, String(readInt(LIFE_GAMES_KEY) + 1))
    localStorage.setItem(LIFE_CORRECT_KEY, String(readInt(LIFE_CORRECT_KEY) + s.score))
    localStorage.setItem(LIFE_ANSWERED_KEY, String(readInt(LIFE_ANSWERED_KEY) + answered))
    localStorage.setItem(
      LIFE_RECSTREAK_KEY,
      String(Math.max(readInt(LIFE_RECSTREAK_KEY), s.bestStreak)),
    )
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build the question order for a matchup+mode: finite slice or full shuffle. */
function orderFor(matchup: Matchup, mode: Mode): number[] {
  const indices = matchup.songs.map((_, i) => i)
  const shuffled = shuffle(indices)
  return mode.questions === 'endless'
    ? shuffled
    : shuffled.slice(0, Math.min(mode.questions, matchup.songs.length))
}

interface GameState {
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

/** The song pool for a state (the active matchup's songs, or empty). */
function poolFor(s: GameState): readonly Song[] {
  return s.matchup ? s.matchup.songs : []
}

function songAt(s: GameState): Song | null {
  const pool = poolFor(s)
  return pool.length ? (pool[s.order[s.qIndex]] ?? null) : null
}

/** Round length for a state: fixed count, or the shuffled endless-pool size. */
function totalFor(s: GameState): number {
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
function runEndsFor(s: GameState): boolean {
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

export interface Game {
  state: GameState
  matchup: Matchup | null
  mode: Mode | null
  total: number
  seconds: number
  timerEnabled: boolean
  song: Song | null
  correct: boolean
  qNumber: number
  /** True when the current answer ends the run (per-mode; see `runEndsFor`). */
  isLast: boolean
  /** Current player choice during the reveal beat (and reveal screen). */
  selected: Selection
  /** Whether the current `selected` choice was correct. */
  answerCorrect: boolean
  /** Streak celebration tier: 0 none, 1 (streak≥3), 2 (streak≥5). */
  streakTier: 0 | 1 | 2
  /** True until the player makes their first explicit guess (one-time hint). */
  showHint: boolean
  muted: boolean
  start: (matchup: Matchup, mode: Mode) => void
  guess: (side: Side) => void
  next: () => void
  togglePlay: () => void
  toggleMute: () => void
  playAgain: () => void
  /** Abandon the current run: reset to the initial inert shape, keep prefs. */
  quit: () => void
}

export function useGame(): Game {
  const [state, setState] = useState<GameState>(() => ({
    matchup: null,
    mode: null,
    screen: 'playing',
    order: [],
    qIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    playing: true,
    selected: null,
    timeLeft: 0,
    best: 0,
    muted: readMuted(),
    hintSeen: readHintSeen(),
  }))

  const start = useCallback((matchup: Matchup, mode: Mode) => {
    setState((s) => ({
      ...s,
      matchup,
      mode,
      screen: 'playing',
      order: orderFor(matchup, mode),
      qIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      selected: null,
      playing: true,
      timeLeft: mode.timerSeconds,
      best: readBestFor(matchup, mode),
    }))
  }, [])

  const answer = useCallback((choice: Selection) => {
    setState((s) => {
      if (!s.mode || !s.matchup || s.selected !== null) return s
      const song = songAt(s)
      const correct = !!song && choice === song.side
      const streak = correct ? s.streak + 1 : 0
      // First explicit guess (never a timeout) consumes the one-time hint.
      const consumesHint = choice !== null && !s.hintSeen
      if (consumesHint) writeHintSeen()
      // NOTE: screen stays 'playing' during the suspense beat — the reveal
      // transition effect flips it to 'reveal' after REVEAL_DELAY_MS. Setting
      // `playing: false` here hard-stops the clip immediately.
      return {
        ...s,
        selected: choice ?? 'timeout',
        playing: false,
        score: correct ? s.score + 1 : s.score,
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        hintSeen: s.hintSeen || consumesHint,
      }
    })
  }, [])

  const guess = useCallback((side: Side) => answer(side), [answer])

  const next = useCallback(() => {
    setState((s) => {
      if (!s.mode || !s.matchup) return s
      if (runEndsFor(s)) {
        const best = Math.max(s.best, s.score)
        writeBestFor(s.matchup, s.mode, best)
        recordGame(s)
        return { ...s, screen: 'results', best }
      }
      return {
        ...s,
        screen: 'playing',
        qIndex: s.qIndex + 1,
        selected: null,
        playing: true,
        timeLeft: s.mode.timerSeconds,
      }
    })
  }, [])

  const togglePlay = useCallback(() => {
    setState((s) => ({ ...s, playing: !s.playing }))
  }, [])

  const toggleMute = useCallback(() => {
    setState((s) => {
      const muted = !s.muted
      writeMuted(muted)
      return { ...s, muted }
    })
  }, [])

  const playAgain = useCallback(() => {
    setState((s) => {
      if (!s.mode || !s.matchup) return s
      const { matchup, mode } = s
      return {
        ...s,
        matchup,
        mode,
        screen: 'playing',
        order: orderFor(matchup, mode),
        qIndex: 0,
        score: 0,
        streak: 0,
        bestStreak: 0,
        selected: null,
        playing: true,
        timeLeft: mode.timerSeconds,
        best: readBestFor(matchup, mode),
      }
    })
  }, [])

  // Abandon the current run. Reset to the initial inert shape: matchup/mode go
  // null so the countdown + reveal effects early-return and `clipUrl` resolves
  // to undefined (the clip stops). `screen` is 'playing' (NOT 'results'), so the
  // PlayRoute results-redirect never fires; the caller navigates home, which
  // unmounts the play route. Mute + hint prefs are preserved.
  const quit = useCallback(() => {
    setState((s) => ({
      ...s,
      matchup: null,
      mode: null,
      screen: 'playing',
      order: [],
      qIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      playing: true,
      selected: null,
      timeLeft: 0,
      best: 0,
    }))
  }, [])

  // Per-question countdown. Ticks once a second while a question is live; on
  // reaching zero it auto-answers as a timeout. Inert until a run is started.
  const answerRef = useRef(answer)
  answerRef.current = answer
  useEffect(() => {
    if (!state.mode || !state.matchup) return
    if (state.screen !== 'playing' || state.selected !== null) return
    // Pausing the clip pauses the countdown too — freeze the timer while paused.
    if (!state.playing) return
    if (state.timeLeft <= 0) {
      answerRef.current(null)
      return
    }
    const id = window.setTimeout(() => {
      setState((s) =>
        s.mode && s.matchup && s.screen === 'playing' && s.selected === null && s.playing
          ? { ...s, timeLeft: s.timeLeft - 1 }
          : s,
      )
    }, 1000)
    return () => window.clearTimeout(id)
  }, [state.mode, state.matchup, state.screen, state.selected, state.playing, state.timeLeft])

  // Reveal transition. Once a choice is locked in (`selected !== null`) the
  // screen stays 'playing' for the suspense beat, then floats to 'reveal'.
  // During this window the countdown effect above early-returns (selected set
  // + playing false), so `timeLeft` is untouched and the clip never resumes.
  useEffect(() => {
    if (state.screen !== 'playing' || state.selected === null) return
    const id = window.setTimeout(() => {
      setState((s) =>
        s.screen === 'playing' && s.selected !== null ? { ...s, screen: 'reveal' } : s,
      )
    }, REVEAL_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [state.screen, state.selected])

  const song = songAt(state)
  const correct = !!song && state.selected === song.side
  const streakTier: 0 | 1 | 2 = state.streak >= 5 ? 2 : state.streak >= 3 ? 1 : 0

  return {
    state,
    matchup: state.matchup,
    mode: state.mode,
    total: totalFor(state),
    seconds: state.mode?.timerSeconds ?? 0,
    timerEnabled: true,
    song,
    correct,
    qNumber: state.qIndex + 1,
    isLast: runEndsFor(state),
    selected: state.selected,
    answerCorrect: correct,
    streakTier,
    showHint: !state.hintSeen,
    muted: state.muted,
    start,
    guess,
    next,
    togglePlay,
    toggleMute,
    playAgain,
    quit,
  }
}
