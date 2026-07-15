import { formatDayMonth, todayKey } from '@/lib/daily'
import { MODES } from '@/config/modes'
import type { Mode } from '@/types'
import { dailyMatchup } from '../api/daily'
import { ModeSelectScreen } from './ModeSelectScreen'

/**
 * The daily's pre-play screen: the same mode-select page, but locked to Classique
 * (no real choice) with a "Duel du jour" kicker. Revealing the matchup here is
 * fine — the surprise was only kept off the home button. Picking the (only) mode
 * hands off to the deterministic `/jouer/quotidien` play branch.
 */
export function DailyModeSelect({ onPlay }: { onPlay: (mode: Mode) => void }) {
  const dateKey = todayKey()
  const matchup = dailyMatchup(dateKey)
  return (
    <ModeSelectScreen
      matchup={matchup}
      modes={[MODES.classique]}
      label={`⭐ Duel du jour · ${formatDayMonth(dateKey)}`}
      subtitle="Le défi du jour, en Classique — une fois par jour."
      onSelect={onPlay}
    />
  )
}
