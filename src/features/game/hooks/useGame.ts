import { useCallback, useState } from 'react'
import type { Matchup, Mode, Side, Song } from '@/types'
import { readBestFor, recordGame, writeBestFor } from '@/lib/stats'
import { useCountdown } from './useCountdown'
import {
  orderFor,
  readHintSeen,
  readMuted,
  runEndsFor,
  songAt,
  totalFor,
  writeHintSeen,
  writeMuted,
  type GameState,
  type Selection,
} from './gameState'

export type { Screen, Selection } from './gameState'

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

/**
 * Game orchestrator. Owns the run state and actions; delegates the per-question
 * timer + reveal beat to `useCountdown`, and record/lifetime persistence to
 * `@/lib/stats`. The public return shape and actions are unchanged — components
 * call it exactly as before.
 */
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
        recordGame({ answered: s.qIndex + 1, score: s.score, bestStreak: s.bestStreak })
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

  useCountdown(state, setState, answer)

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
