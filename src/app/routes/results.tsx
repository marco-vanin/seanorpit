import { Navigate, useNavigate } from 'react-router-dom'
import { ResultsScreen } from '@/features/game/components/ResultsScreen'
import { unlockAudio } from '@/features/game/utils/stings'
import { useGameContext } from '../provider'

/** `/resultats` — end-of-run score card. */
export function ResultsRoute() {
  const game = useGameContext()
  const { state } = game
  const navigate = useNavigate()

  // Guard: cold hit / refresh with no finished run → home. A reloaded custom run
  // also lands here (in-memory matchup gone) and correctly redirects.
  if (game.matchup == null || game.mode == null || state.screen !== 'results') {
    return <Navigate to="/" replace />
  }

  const matchup = game.matchup
  const mode = game.mode

  const handlePlayAgain = () => {
    unlockAudio()
    game.playAgain()
    navigate(`/jouer/${matchup.id}/${mode.slug}`)
  }

  return (
    <ResultsScreen
      matchup={matchup}
      mode={mode}
      score={state.score}
      total={game.total}
      bestStreak={state.bestStreak}
      best={state.best}
      onPlayAgain={handlePlayAgain}
      onHome={() => navigate('/')}
    />
  )
}
