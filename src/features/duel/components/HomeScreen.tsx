import type { Matchup } from '@/types'
import { lifetimeStats } from '@/lib/stats'
import { Button } from '@/components/ui/Button'
import { CURATED } from '../matchups'
import { LifetimeStatsStrip } from './LifetimeStatsStrip'
import { MatchupCard } from './MatchupCard'

/**
 * Home hub at `/`. "Blind Duel" headline + pitch, a primary "Créer un duel" CTA
 * (custom is the star), then a "Duels prêts à jouer" section with one card per
 * curated matchup ("«A» or «B»" in slot colors). Mobile-first, single column,
 * `clamp()` type.
 */
export function HomeScreen({
  onSelectMatchup,
  onCustom,
}: {
  onSelectMatchup: (matchup: Matchup) => void
  onCustom: () => void
}) {
  // Lifetime totals for the stats strip (read once per mount from localStorage).
  const stats = lifetimeStats()
  return (
    <div className="animate-[floatIn_0.5s_ease_both]">
      {/* Hero */}
      <div className="relative mb-10 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-70px] left-[6%] -z-10 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--slot-a)_20%,transparent),transparent_70%)] blur-[48px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-40px] right-[6%] -z-10 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--slot-b)_18%,transparent),transparent_70%)] blur-[48px]"
        />
        <div className="mb-5 font-mono text-[12px] tracking-[4px] text-muted uppercase">
          Blindtest audio · Devine l'artiste
        </div>

        <h1 className="m-0 mb-5 text-[clamp(52px,11vw,104px)] leading-[0.95] font-bold tracking-[-4px]">
          Blind Duel
        </h1>

        <p className="mx-auto mb-8 max-w-[430px] text-[clamp(15px,4.4vw,18px)] leading-[1.55] text-muted-2">
          Un extrait, deux artistes, quelques secondes pour trancher. Compose ton propre duel ou
          défie un classique.
        </p>

        <Button
          onClick={onCustom}
          aria-label="Créer un duel personnalisé"
          className="mx-auto block w-full max-w-[380px] shadow-[0_14px_44px_-14px_color-mix(in_oklab,var(--slot-a)_50%,transparent)]"
        >
          ✨ Créer un duel
        </Button>
      </div>

      {/* Lifetime stats strip. */}
      <LifetimeStatsStrip stats={stats} />

      <div className="mx-auto mb-[14px] text-left font-mono text-[12px] tracking-[3px] text-muted uppercase">
        Duels prêts à jouer
      </div>

      <div className="mx-auto grid grid-cols-[repeat(auto-fit,minmax(min(270px,100%),1fr))] gap-[14px] text-left">
        {CURATED.map((matchup) => (
          <MatchupCard
            key={matchup.id}
            matchup={matchup}
            onClick={() => onSelectMatchup(matchup)}
          />
        ))}
      </div>
    </div>
  )
}
