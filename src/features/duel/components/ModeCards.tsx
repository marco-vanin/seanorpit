import type { CSSProperties } from 'react'
import { MODE_LIST } from '@/config/modes'
import type { Matchup, Mode } from '@/types'
import { bestFor } from '@/lib/stats'
import { cn } from '@/utils/cn'

/**
 * The mode cards (Classique / Mort subite) for a given matchup. Shows each
 * mode's per-(matchup, mode) best — curated only; custom shows "—".
 * Single column, mobile-first.
 */
export function ModeCards({
  matchup,
  onSelect,
}: {
  matchup: Matchup
  onSelect: (mode: Mode) => void
}) {
  return (
    <div className="mx-auto grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[14px] text-left">
      {MODE_LIST.map((mode) => (
        <ModeCard key={mode.key} matchup={matchup} mode={mode} onSelect={onSelect} />
      ))}
    </div>
  )
}

function ModeCard({
  matchup,
  mode,
  onSelect,
}: {
  matchup: Matchup
  mode: Mode
  onSelect: (mode: Mode) => void
}) {
  const best = matchup.source === 'custom' ? 0 : bestFor(matchup, mode)
  // Classique reads green; Mort subite reads gold. Dynamic per card → exposed as
  // the `--accent` CSS var so the hover border + accent text can be static classes.
  const accent = mode.endOnWrong ? 'var(--gold)' : 'var(--slot-a)'
  const recordValue =
    best <= 0
      ? '—'
      : mode.questions === 'endless'
        ? `série de ${best}`
        : `${best} / ${mode.questions}`

  return (
    <button
      onClick={() => onSelect(mode)}
      aria-label={`Jouer en mode ${mode.label}`}
      style={{ '--accent': accent } as CSSProperties}
      className="relative w-full cursor-pointer rounded-[18px] border-[1.5px] border-border bg-[linear-gradient(135deg,var(--surface-hover),var(--surface-3))] px-6 py-[22px] text-left font-sans transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-[26px]"
        >
          {mode.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-[10px]">
            <span className="text-[22px] font-bold tracking-[-0.5px] text-text">{mode.label}</span>
            <span className="font-mono text-[12px] tracking-[1px] text-[var(--accent)] uppercase">
              {mode.badge}
            </span>
          </div>
          <div className="mt-1 text-[14px] leading-[1.5] text-muted">{mode.blurb}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-[14px]">
        <span className="font-mono text-[12px] tracking-[1px] text-muted-2 uppercase">
          Record ·{' '}
          <span className={cn(best > 0 ? 'text-[var(--accent)]' : 'text-text')}>{recordValue}</span>
        </span>
        <span className="font-mono text-[13px] text-[var(--accent)]">Jouer →</span>
      </div>
    </button>
  )
}
