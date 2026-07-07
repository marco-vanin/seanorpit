import { useCallback, useEffect, useRef, useState } from 'react'
import type { Matchup, Side, Song } from './matchups'
import type { Mode } from './modes'

export type Screen = 'playing' | 'reveal' | 'results'
/** The player's choice: a slot, a timeout, or nothing yet. */
export type Selection = Side | 'timeout' | null

/** Suspense beat between tapping an answer and the reveal mounting (ms). */
export const REVEAL_DELAY_MS = 450

const MUTED_KEY = 'spvp_muted'

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
  muted: boolean
  start: (matchup: Matchup, mode: Mode) => void
  guess: (side: Side) => void
  next: () => void
  togglePlay: () => void
  toggleMute: () => void
  playAgain: () => void
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
    muted: state.muted,
    start,
    guess,
    next,
    togglePlay,
    toggleMute,
    playAgain,
  }
}
