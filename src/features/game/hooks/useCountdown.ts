import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { REVEAL_DELAY_MS } from '@/config'
import type { GameState, Selection } from './gameState'

/**
 * The per-question countdown + reveal beat, extracted from the game orchestrator.
 * Ticks the timer once a second while a question is live; on reaching zero it
 * auto-answers as a timeout. Once a choice is locked in, holds 'playing' for the
 * suspense beat, then floats the screen to 'reveal'. Behaviour is identical to
 * the pre-split effects.
 */
export function useCountdown(
  state: GameState,
  setState: Dispatch<SetStateAction<GameState>>,
  answer: (choice: Selection) => void,
): void {
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
  }, [
    state.mode,
    state.matchup,
    state.screen,
    state.selected,
    state.playing,
    state.timeLeft,
    setState,
  ])

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
  }, [state.screen, state.selected, setState])
}
