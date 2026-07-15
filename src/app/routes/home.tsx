import { useNavigate } from 'react-router-dom'
import { HomeScreen } from '@/features/duel/components/HomeScreen'

/** `/` — the home hub: curated duels + the "create a duel" CTA. */
export function HomeRoute() {
  const navigate = useNavigate()
  return (
    <HomeScreen
      onSelectMatchup={(matchup) => navigate(`/duel/${matchup.id}`)}
      onCustom={() => navigate('/duel/custom')}
      onPlayDaily={() => navigate('/quotidien')}
    />
  )
}
