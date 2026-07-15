import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Mode } from '@/types'
import { matchupById } from '@/features/duel/api/matchups'
import { ModeSelectScreen } from '@/features/duel/components/ModeSelectScreen'
import { unlockAudio } from '@/features/game/utils/stings'
import { useGameContext } from '../provider'

/** `/duel/:matchupId` — curated mode-select for a known matchup. */
export function CuratedDuelRoute() {
  const game = useGameContext()
  const navigate = useNavigate()
  const { matchupId } = useParams()
  const matchup = matchupId ? matchupById(matchupId) : undefined

  if (!matchup) return <Navigate to="/" replace />

  const handleSelect = (mode: Mode) => {
    unlockAudio()
    game.start(matchup, mode)
    navigate(`/jouer/${matchup.id}/${mode.slug}`)
  }

  return <ModeSelectScreen matchup={matchup} onSelect={handleSelect} />
}
