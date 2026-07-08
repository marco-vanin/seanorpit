import { slotColor } from '@/utils/colors'
import type { Matchup, Side, Mode } from '@/types'
import { Artwork } from '@/components/ui/Artwork'
import { ModeCards } from './ModeCards'

/**
 * Curated mode-select at `/duel/:matchupId`. The two artist names as a header
 * (slot colors) + the three mode cards with per-mode best. Mobile-first.
 */
export function ModeSelectScreen({
  matchup,
  onSelect,
}: {
  matchup: Matchup
  onSelect: (mode: Mode) => void
}) {
  return (
    <div className="mx-auto max-w-[840px] text-center [animation:floatIn_.45s_ease_both]">
      <MatchupHeader matchup={matchup} />

      <p className="mx-auto mb-[30px] text-[clamp(14px,4vw,16px)] text-muted">
        Deux façons de jouer. Choisis la tienne.
      </p>

      <ModeCards matchup={matchup} onSelect={onSelect} />
    </div>
  )
}

/** "«A» or «B»" in slot colors with each artist's artwork — shared header. */
export function MatchupHeader({ matchup }: { matchup: Matchup }) {
  return (
    <div className="mb-[14px] flex flex-wrap items-center justify-center gap-[clamp(12px,4vw,22px)]">
      <HeaderSide matchup={matchup} side="a" />
      <span className="inline-flex size-[46px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-2 font-mono text-[16px] font-semibold text-muted-5">
        or
      </span>
      <HeaderSide matchup={matchup} side="b" />
    </div>
  )
}

/** One side of the header: artwork above the artist name, in the slot color. */
function HeaderSide({ matchup, side }: { matchup: Matchup; side: Side }) {
  const artist = matchup[side]
  const accent = slotColor(side)
  return (
    <div className="flex min-w-0 flex-col items-center gap-[10px]">
      <Artwork
        src={artist.image}
        name={artist.name}
        color={accent}
        size={72}
        radius={16}
        style={{ border: `1.5px solid ${accent}` }}
      />
      <span
        className="max-w-full text-[clamp(24px,8vw,40px)] leading-none font-bold tracking-[-1.5px] [overflow-wrap:anywhere]"
        style={{ color: accent }}
      >
        {artist.name}
      </span>
    </div>
  )
}
