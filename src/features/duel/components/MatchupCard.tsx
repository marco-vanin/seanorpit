import type { CSSProperties } from 'react'
import type { Matchup } from '@/types'
import { slotColor } from '@/utils/colors'
import { Artwork } from '@/components/ui/Artwork'

/**
 * A curated-duel card for the home grid: split album-art background (A left /
 * B right), a dark scrim, then "«A» or «B»" in bright slot colors.
 *
 * DARK-PINNED: these album-art cards override `--muted-2` and the slot accents
 * locally (an inline CSS-var block) so they keep their dark treatment — bright
 * names over a dark scrim — even when the app is in light mode. Do NOT flatten
 * these to a single theme token or they'll flip in light mode.
 */
const DARK_PIN: CSSProperties = {
  '--muted-2': '#b6bac6',
  '--slot-a': 'oklch(0.7 0.19 268)',
  '--slot-a-bright': 'oklch(0.78 0.16 268)',
  '--slot-b': 'oklch(0.72 0.24 350)',
  '--slot-b-bright': 'oklch(0.8 0.2 350)',
} as CSSProperties

export function MatchupCard({ matchup, onClick }: { matchup: Matchup; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Jouer le duel ${matchup.a.name} contre ${matchup.b.name}`}
      style={DARK_PIN}
      className="relative min-h-[clamp(132px,38vw,168px)] w-full cursor-pointer overflow-hidden rounded-[18px] border-[1.5px] border-border bg-surface p-0 text-left font-sans transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-muted-4"
    >
      {/* Split album-art background: A left half, B right half. */}
      <div className="absolute inset-0 flex">
        <Artwork
          src={matchup.a.image}
          name={matchup.a.name}
          color={slotColor('a')}
          size={120}
          radius={0}
          style={{ width: '50%', height: '100%', border: 'none' }}
        />
        <Artwork
          src={matchup.b.image}
          name={matchup.b.name}
          color={slotColor('b')}
          size={120}
          radius={0}
          style={{ width: '50%', height: '100%', border: 'none' }}
        />
      </div>

      {/* Mandatory dark scrim for text legibility over any cover. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,17,0.5)_0%,rgba(12,13,17,0.72)_55%,rgba(12,13,17,0.92)_100%)]"
      />

      {/* Foreground content. */}
      <div className="relative flex min-h-[clamp(132px,38vw,168px)] flex-col justify-end gap-2 px-[22px] py-5">
        <span className="flex flex-wrap items-center gap-3 text-[clamp(22px,6.5vw,28px)] leading-[1.1] font-bold tracking-[-1px] [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
          <span className="min-w-0 [overflow-wrap:anywhere] text-slot-a-bright">
            {matchup.a.name}
          </span>
          <span className="font-mono text-[13px] font-semibold text-muted-2 lowercase">or</span>
          <span className="min-w-0 [overflow-wrap:anywhere] text-slot-b-bright">
            {matchup.b.name}
          </span>
        </span>
        <span className="font-mono text-[12px] tracking-[1px] text-muted-2 uppercase [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
          2 modes de jeu →
        </span>
      </div>
    </button>
  )
}
