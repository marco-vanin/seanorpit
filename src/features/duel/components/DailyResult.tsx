import { useEffect, useRef, useState } from 'react'
import { formatDayMonth, readDaily, todayKey } from '@/lib/daily'
import { dailyShareText } from '@/utils/share'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { dailyMatchup } from '../api/daily'
import { MatchupHeader } from './ModeSelectScreen'

/**
 * The "already played today" screen at `/quotidien` (hard lock). Shows today's
 * result + streak + a spoiler-free share + "Reviens demain". Reached only once
 * the daily is done; playing itself happens via the `/jouer/quotidien` branch.
 * The matchup is revealed here (post-play, no longer a spoiler).
 */
export function DailyResult({ onHome }: { onHome: () => void }) {
  const dateKey = todayKey()
  const matchup = dailyMatchup(dateKey)
  const daily = readDaily()

  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)
  useEffect(() => () => void (timerRef.current && window.clearTimeout(timerRef.current)), [])

  const onShare = () => {
    const text = dailyShareText(
      matchup,
      dateKey,
      daily.todayScore ?? 0,
      daily.todayTotal ?? 0,
      daily.streak,
    )
    try {
      navigator.clipboard?.writeText(text)
    } catch {
      /* clipboard unavailable — the toast still confirms intent */
    }
    setCopied(true)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className="mx-auto max-w-[460px] text-center [animation:floatIn_.4s_ease_both]">
      <div className="mb-4 font-mono text-[12px] tracking-[3px] text-gold uppercase">
        ⭐ Duel du jour · {formatDayMonth(dateKey)}
      </div>

      <MatchupHeader matchup={matchup} />

      <div className="mt-4 text-[clamp(34px,11vw,52px)] leading-none font-bold text-ok">
        ✓ {daily.todayScore}/{daily.todayTotal}
      </div>
      <div className="mt-3 font-mono text-[13px] text-muted-2">
        {daily.streak >= 1 && <span className="text-gold">série 🔥 {daily.streak} · </span>}
        Reviens demain
      </div>

      <div className="mx-auto mt-7 flex max-w-[320px] flex-col gap-3">
        <Button
          variant="ghost"
          onClick={onShare}
          aria-label="Partager mon résultat du jour"
          className="border-[color-mix(in_oklab,var(--gold)_45%,var(--border-2))] text-gold"
        >
          📋 Partager
        </Button>
        <div
          aria-live="polite"
          className={cn(
            'h-4 font-mono text-[12px] text-gold transition-opacity duration-200',
            copied ? 'opacity-100' : 'opacity-0',
          )}
        >
          ✓ Copié
        </div>
        <Button variant="ghost" onClick={onHome}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  )
}
