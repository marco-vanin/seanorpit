import { createContext, useContext, type ReactNode } from 'react'
import { useGame, type Game } from '@/features/game'

/**
 * The single shared game instance lives here, above <Routes>, so navigating
 * /jouer/:matchup/:mode → /resultats keeps the same state — and the in-memory
 * custom matchup survives across the builder → play → results flow. Routes read
 * it from context, never call useGame() themselves.
 */
const GameContext = createContext<Game | null>(null)

export function useGameContext(): Game {
  const game = useContext(GameContext)
  if (!game) throw new Error('useGameContext must be used within <GameProvider>')
  return game
}

/** Provides the shared game instance to the routed content. */
export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGame()
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>
}
