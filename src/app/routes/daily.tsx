import { useNavigate } from 'react-router-dom'
import { readDaily } from '@/lib/daily'
import { DailyModeSelect } from '@/features/duel/components/DailyModeSelect'
import { DailyResult } from '@/features/duel/components/DailyResult'

/**
 * `/quotidien` — the daily-challenge entry point. Hard-locked: if today's daily
 * is already played, show the result + share screen (Reviens demain). Otherwise
 * show the mode-select page (locked to Classique); picking the mode hands off to
 * the refresh-robust `/jouer/quotidien` branch, which auto-starts the
 * deterministic daily — keeping a single start path.
 */
export function DailyRoute() {
  const navigate = useNavigate()
  if (readDaily().playedToday) return <DailyResult onHome={() => navigate('/')} />
  return <DailyModeSelect onPlay={() => navigate('/jouer/quotidien/classique')} />
}
