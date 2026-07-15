import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Matchup, Mode } from '@/types'
import { buildCustomMatchupByIds } from '@/lib/itunes'
import { DuelReady } from '@/features/duel/components/DuelReady'
import { unlockAudio } from '@/features/game/utils/stings'
import { Button } from '@/components/ui/Button'
import { useGameContext } from '../provider'

/** True only for a bare positive integer (no signs, decimals, or leading text). */
function isPositiveIntId(v: string | undefined): v is string {
  return v !== undefined && /^\d+$/.test(v) && Number(v) > 0
}

/**
 * Recipient of a shared custom duel at `/duel/:idA/:idB`. Guards the two ids to
 * positive integers (else → home), then hands off to the keyed loader so a
 * different id pair remounts and refetches cleanly.
 */
export function SharedDuelRoute() {
  const { idA, idB } = useParams()
  if (!isPositiveIntId(idA) || !isPositiveIntId(idB)) return <Navigate to="/" replace />
  return <SharedDuelLoader key={`${idA}/${idB}`} idA={Number(idA)} idB={Number(idB)} />
}

type SharedPhase =
  { kind: 'loading' } | { kind: 'ready'; matchup: Matchup } | { kind: 'error'; message: string }

/**
 * Re-resolves both artist ids and rebuilds the matchup (reusing the exact
 * `buildCustomMatchup` filter + ≥ 8 fairness via `buildCustomMatchupByIds`).
 * Loading / preview / error are all first-class — never a blank screen. Picking
 * a mode starts the shared game instance and navigates into play, exactly like
 * the builder's ready state.
 */
function SharedDuelLoader({ idA, idB }: { idA: number; idB: number }) {
  const game = useGameContext()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<SharedPhase>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setPhase({ kind: 'loading' })
    buildCustomMatchupByIds(idA, idB)
      .then((res) => {
        if (cancelled) return
        if (res.ok) setPhase({ kind: 'ready', matchup: res.matchup })
        else setPhase({ kind: 'error', message: res.message })
      })
      .catch(() => {
        if (!cancelled) setPhase({ kind: 'error', message: 'Problème de réseau — réessaie.' })
      })
    return () => {
      cancelled = true
    }
  }, [idA, idB, attempt])

  if (phase.kind === 'loading') {
    return (
      <div className="animate-[floatIn_0.45s_ease_both] py-[60px] text-center">
        <div className="font-mono text-[13px] tracking-[2px] text-muted-2 uppercase">
          Chargement du duel…
        </div>
      </div>
    )
  }

  if (phase.kind === 'error') {
    return (
      <div className="animate-[floatIn_0.45s_ease_both] py-10 text-center">
        <div
          className="mx-auto mb-6 max-w-[420px] rounded-[14px] border border-bad bg-[color-mix(in_oklab,var(--bad)_12%,transparent)] px-[18px] py-4 text-[15px] leading-[1.45] text-text"
          role="alert"
        >
          {phase.message}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => setAttempt((n) => n + 1)}>Réessayer</Button>
        </div>
      </div>
    )
  }

  const matchup = phase.matchup
  const handleSelect = (mode: Mode) => {
    unlockAudio()
    game.start(matchup, mode)
    navigate(`/jouer/custom/${mode.slug}`)
  }

  return <DuelReady matchup={matchup} onSelect={handleSelect} />
}
