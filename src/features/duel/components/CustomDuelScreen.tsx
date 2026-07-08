import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { buildCustomMatchup, type ArtistHit } from '@/lib/itunes'
import type { Matchup, Mode } from '@/types'
import { cn } from '@/utils/cn'
import { SlotCard } from './SlotCard'
import { DuelReady } from './DuelReady'
import suggestedData from '../suggested.json'

/** Curated suggestion pool (real ids + photos) for the random duel. */
const SUGGESTED = suggestedData as ArtistHit[]

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; matchup: Matchup }

/**
 * Custom-duel builder at `/duel/custom` — "Compose ton duel". Two tall search
 * cards side by side (A / "or" / B): each holds an always-visible artist search
 * (photo results) that becomes a square photo tile once picked. "🎲 Duel au
 * hasard" fills both from the suggestion pool; "Préparer le duel" fetches +
 * filters both catalogs and — on ≥ 8 clean tracks per side — reveals the mode
 * cards (`DuelReady`). All French; the built matchup is session-only.
 */
export function CustomDuelScreen({ onPlay }: { onPlay: (matchup: Matchup, mode: Mode) => void }) {
  const [a, setA] = useState<ArtistHit | undefined>()
  const [b, setB] = useState<ArtistHit | undefined>()
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  const clearError = () => setPhase((p) => (p.kind === 'error' ? { kind: 'idle' } : p))
  const selectA = (hit?: ArtistHit) => {
    setA(hit)
    clearError()
  }
  const selectB = (hit?: ArtistHit) => {
    setB(hit)
    clearError()
  }

  const randomDuel = () => {
    const pool = [...SUGGESTED]
    const ra = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    const rb = pool[Math.floor(Math.random() * pool.length)]
    setA(ra)
    setB(rb)
    clearError()
  }

  const canSubmit = !!a && !!b && phase.kind !== 'loading'
  const bothReady = !!a && !!b

  const handleSubmit = async () => {
    if (!a || !b || phase.kind === 'loading') return
    setPhase({ kind: 'loading' })
    try {
      const result = await buildCustomMatchup(a, b)
      if (result.ok) setPhase({ kind: 'ready', matchup: result.matchup })
      else setPhase({ kind: 'error', message: result.message })
    } catch {
      setPhase({ kind: 'error', message: 'Problème de réseau — réessaie.' })
    }
  }

  const ready = phase.kind === 'ready' ? phase.matchup : null

  if (ready) {
    return (
      <DuelReady
        matchup={ready}
        onSelect={(mode) => onPlay(ready, mode)}
        onBack={() => setPhase({ kind: 'idle' })}
        backLabel="← Changer d'artistes"
      />
    )
  }

  return (
    <div className="mx-auto max-w-[880px] [animation:floatIn_.45s_ease_both]">
      <div className="mb-[26px]">
        <h1 className="mb-2 text-[clamp(30px,6vw,42px)] font-bold tracking-[-1.5px]">
          Compose ton duel
        </h1>
        <p className="m-0 max-w-[560px] text-[clamp(14px,4vw,16px)] leading-[1.5] text-muted">
          Cherche deux artistes — on récupère leurs extraits et on prépare le blindtest.
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-[18px] sm:grid-cols-[1fr_auto_1fr]">
        <SlotCard
          side="a"
          selected={a}
          onSelect={selectA}
          otherId={b?.artistId}
          examples="ex. Drake, Shakira, Kendrick Lamar…"
        />

        <div className="flex items-center justify-center">
          <span
            className={cn(
              'inline-flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-[14px] font-semibold transition-[color,border-color] duration-200',
              bothReady ? 'border-gold text-gold' : 'border-border-2 text-muted-5',
            )}
          >
            or
          </span>
        </div>

        <SlotCard
          side="b"
          selected={b}
          onSelect={selectB}
          otherId={a?.artistId}
          examples="ex. The Weeknd, Beyoncé, Dua Lipa…"
        />
      </div>

      {phase.kind === 'error' && (
        <div
          role="alert"
          className="mt-[18px] rounded-[14px] border border-bad bg-[color-mix(in_oklab,var(--bad)_12%,transparent)] px-4 py-[14px] text-[14px] leading-[1.45] text-text"
        >
          {phase.message}
        </div>
      )}

      {/* actions: random visible left, primary aligned end */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={randomDuel}
          disabled={phase.kind === 'loading'}
          className={cn(
            'inline-flex items-center gap-[9px] rounded-[12px] border-[1.5px] border-border-2 bg-surface px-[22px] py-[14px] font-sans text-[15px] font-semibold text-text transition-[border-color,background] duration-150 hover:border-gold hover:bg-[var(--surface-hover)]',
            phase.kind === 'loading' ? 'cursor-default' : 'cursor-pointer',
          )}
        >
          <span aria-hidden className="text-[17px]">
            🎲
          </span>{' '}
          Duel au hasard
        </button>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn('ml-auto px-8', !canSubmit && 'cursor-default opacity-50')}
        >
          {phase.kind === 'loading' ? 'Préparation du duel…' : 'Préparer le duel'}
        </Button>
      </div>

      {phase.kind === 'loading' && (
        <div className="mt-[14px] font-mono text-[12px] tracking-[1px] text-muted-3">
          Récupération et filtrage des titres…
        </div>
      )}
    </div>
  )
}
