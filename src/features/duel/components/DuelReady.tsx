import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { duelShareUrl, shareDuel } from '@/utils/share'
import type { Matchup, Mode } from '@/types'
import { cn } from '@/utils/cn'
import { ModeCards } from './ModeCards'
import { MatchupHeader } from './ModeSelectScreen'

/**
 * The "Duel prêt ✓" preview — shared by the builder's ready state and the
 * shared-duel recipient route so both are visually identical: header + track
 * count + mode cards + a "Partager ce duel" action (copies the link + "Lien
 * copié" toast) + a back control. Share is hidden for curated matchups (no ids).
 */
export function DuelReady({
  matchup,
  onSelect,
  onBack,
  backLabel,
}: {
  matchup: Matchup
  onSelect: (mode: Mode) => void
  onBack?: () => void
  backLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)
  useEffect(() => () => void (timerRef.current && window.clearTimeout(timerRef.current)), [])

  const canShare = duelShareUrl(matchup) !== null

  const handleShare = async () => {
    const outcome = await shareDuel(matchup)
    if (outcome === 'copied') {
      setCopied(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 2200)
    }
  }

  return (
    <div className="text-center [animation:floatIn_.35s_ease_both]">
      <div className="mb-[14px] font-mono text-[12px] tracking-[2px] text-muted-2 uppercase">
        Duel prêt ✓
      </div>
      <MatchupHeader matchup={matchup} />
      <p className="mx-auto mb-7 text-[15px] text-muted">
        {matchup.songs.length} extraits chargés. Choisis ton mode.
      </p>
      <ModeCards matchup={matchup} onSelect={onSelect} />

      {canShare && (
        <div className="mt-[18px] flex justify-center">
          <Button variant="ghost" onClick={handleShare}>
            🔗 Partager ce duel
          </Button>
        </div>
      )}
      <div
        aria-live="polite"
        className={cn(
          'mt-[10px] h-4 font-mono text-[12px] text-slot-a transition-opacity duration-200',
          copied ? 'opacity-100' : 'opacity-0',
        )}
      >
        ✓ Lien copié
      </div>

      {onBack && backLabel && (
        <button
          onClick={onBack}
          className="mt-[14px] cursor-pointer border-none bg-transparent p-0 font-mono text-[13px] tracking-[1px] text-muted"
        >
          {backLabel}
        </button>
      )}
    </div>
  )
}
