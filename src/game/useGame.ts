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

const BEST_KEY = 'spvp_best'

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
  start: () => void
  guessSean: () => void
  guessPit: () => void
  next: () => void
  togglePlay: () => void
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
      return {
        ...s,
        selected: choice ?? 'timeout',
        screen: 'reveal',
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

  const song: Song | null = state.order.length ? (SONGS[state.order[state.qIndex]] ?? null) : null
  const correct = !!song && state.selected === song.a

  return {
    state,
    total,
    seconds: secondsPerQuestion,
    timerEnabled: showTimer,
    song,
    correct,
    qNumber: state.qIndex + 1,
    isLast: state.qIndex + 1 >= state.order.length,
    start,
    guessSean,
    guessPit,
    next,
    togglePlay,
    playAgain,
  }
}
