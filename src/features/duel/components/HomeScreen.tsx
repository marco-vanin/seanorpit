import type { Matchup } from '@/types'
import { lifetimeStats } from '@/lib/stats'
import { readDaily } from '@/lib/daily'
import { Button } from '@/components/ui/Button'
import { CURATED } from '../api/matchups'
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
  onPlayDaily,
}: {
  onSelectMatchup: (matchup: Matchup) => void
  onCustom: () => void
  onPlayDaily: () => void
}) {
  // Lifetime totals for the stats strip (read once per mount from localStorage).
  const stats = lifetimeStats()
  // Daily state for the "Duel du jour" button (streak chip + played tick). The
  // duel itself is a surprise — never revealed on home, only after clicking.
  const daily = readDaily()
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

        <div className="mx-auto flex w-full max-w-[440px] flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={onCustom}
            aria-label="Créer un duel personnalisé"
            className="shadow-[0_14px_44px_-14px_color-mix(in_oklab,var(--slot-a)_50%,transparent)] sm:flex-1"
          >
            ✨ Créer un duel
          </Button>
          <Button
            variant="ghost"
            onClick={onPlayDaily}
            aria-label="Jouer le duel du jour"
            className="sm:flex-1"
          >
            <span className="inline-flex items-center gap-2">
              {daily.playedToday ? '✓ Duel du jour' : '🎯 Duel du jour'}
              {daily.streak >= 1 && <span className="text-gold">🔥 {daily.streak}</span>}
            </span>
          </Button>
        </div>
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
