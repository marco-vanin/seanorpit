import { useNavigate } from 'react-router-dom'
import type { Matchup, Mode } from '@/types'
import { CustomDuelScreen } from '@/features/duel/components/CustomDuelScreen'
import { unlockAudio } from '@/features/game/utils/stings'
import { useGameContext } from '../provider'

/** `/duel/custom` — the "Compose ton duel" builder. */
export function CustomDuelRoute() {
  const game = useGameContext()
  const navigate = useNavigate()

  const handlePlay = (matchup: Matchup, mode: Mode) => {
    unlockAudio()
    game.start(matchup, mode)
    navigate(`/jouer/custom/${mode.slug}`)
  }

  return <CustomDuelScreen onPlay={handlePlay} />
}
