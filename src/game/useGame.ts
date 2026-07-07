import { useCallback, useEffect, useRef, useState } from 'react'
import { SONGS, type ArtistKey, type Song } from './songs'

/** Round configuration. */
export const GAME_CONFIG = {
  questionsPerRound: 10,
  // Match the full 30s preview clip so you never time out before the song ends.
  secondsPerQuestion: 30,
  showTimer: true,
} as const

export type Screen = 'home' | 'playing' | 'reveal' | 'results'
/** The player's choice: an artist, a timeout, or nothing yet. */
export type Selection = ArtistKey | 'timeout' | null

/** Suspense beat between tapping an answer and the reveal mounting (ms). */
export const REVEAL_DELAY_MS = 450

const BEST_KEY = 'spvp_best'
const MUTED_KEY = 'spvp_muted'

function readBest(): number {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0
  } catch {
    return 0
  }
}

function writeBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value))
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

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface GameState {
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

export interface Game {
  state: GameState
  total: number
  seconds: number
  timerEnabled: boolean
  song: Song | null
  correct: boolean
  qNumber: number
  isLast: boolean
  /** Current player choice during the reveal beat (and reveal screen). */
  selected: Selection
  /** Whether the current `selected` choice was correct. */
  answerCorrect: boolean
  /** Streak celebration tier: 0 none, 1 (streak≥3), 2 (streak≥5). */
  streakTier: 0 | 1 | 2
  muted: boolean
  start: () => void
  guessSean: () => void
  guessPit: () => void
  next: () => void
  togglePlay: () => void
  toggleMute: () => void
  playAgain: () => void
}

export function useGame(): Game {
  const { questionsPerRound, secondsPerQuestion, showTimer } = GAME_CONFIG
  const total = Math.min(questionsPerRound, SONGS.length)

  const [state, setState] = useState<GameState>(() => ({
    screen: 'home',
    order: [],
    qIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    playing: true,
    selected: null,
    timeLeft: 0,
    best: readBest(),
    muted: readMuted(),
  }))

  const start = useCallback(() => {
    const order = shuffle(SONGS.map((_, i) => i)).slice(0, total)
    setState((s) => ({
      ...s,
      screen: 'playing',
      order,
      qIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      selected: null,
      playing: true,
      timeLeft: secondsPerQuestion,
    }))
  }, [total, secondsPerQuestion])

  const answer = useCallback((choice: Selection) => {
    setState((s) => {
      if (s.selected !== null) return s
      const song = SONGS[s.order[s.qIndex]]
      const correct = !!song && choice === song.a
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

  const guessSean = useCallback(() => answer('sean'), [answer])
  const guessPit = useCallback(() => answer('pit'), [answer])

  const next = useCallback(() => {
    setState((s) => {
      if (s.qIndex + 1 >= s.order.length) {
        const best = Math.max(s.best, s.score)
        writeBest(best)
        return { ...s, screen: 'results', best }
      }
      return {
        ...s,
        screen: 'playing',
        qIndex: s.qIndex + 1,
        selected: null,
        playing: true,
        timeLeft: secondsPerQuestion,
      }
    })
  }, [secondsPerQuestion])

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

  const playAgain = useCallback(() => start(), [start])

  // Per-question countdown. Ticks once a second while a question is live; on
  // reaching zero it auto-answers as a timeout.
  const answerRef = useRef(answer)
  answerRef.current = answer
  useEffect(() => {
    if (!showTimer) return
    if (state.screen !== 'playing' || state.selected !== null) return
    // Pausing the clip pauses the countdown too — freeze the timer while paused.
    if (!state.playing) return
    if (state.timeLeft <= 0) {
      answerRef.current(null)
      return
    }
    const id = window.setTimeout(() => {
      setState((s) =>
        s.screen === 'playing' && s.selected === null && s.playing
          ? { ...s, timeLeft: s.timeLeft - 1 }
          : s,
      )
    }, 1000)
    return () => window.clearTimeout(id)
  }, [showTimer, state.screen, state.selected, state.playing, state.timeLeft])

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

  const song: Song | null = state.order.length ? (SONGS[state.order[state.qIndex]] ?? null) : null
  const correct = !!song && state.selected === song.a
  const streakTier: 0 | 1 | 2 = state.streak >= 5 ? 2 : state.streak >= 3 ? 1 : 0

  return {
    state,
    total,
    seconds: secondsPerQuestion,
    timerEnabled: showTimer,
    song,
    correct,
    qNumber: state.qIndex + 1,
    isLast: state.qIndex + 1 >= state.order.length,
    selected: state.selected,
    answerCorrect: correct,
    streakTier,
    muted: state.muted,
    start,
    guessSean,
    guessPit,
    next,
    togglePlay,
    toggleMute,
    playAgain,
  }
}
