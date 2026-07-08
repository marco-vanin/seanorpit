import type { CSSProperties } from 'react'
import { C } from '../../theme'
import { MODE_LIST, type Mode } from '../../game/modes'
import type { Matchup } from '../../game/matchups'
import { bestFor } from '../../game/useGame'

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 14,
        margin: '0 auto',
        textAlign: 'left',
      }}
    >
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
  // Classique reads green; Mort subite reads gold.
  const accent = mode.endOnWrong ? C.gold : C.sean
  const recordValue =
    best <= 0
      ? '—'
      : mode.questions === 'endless'
        ? `série de ${best}`
        : `${best} / ${mode.questions}`

  const base: CSSProperties = {
    cursor: 'pointer',
    position: 'relative',
    fontFamily: C.sansFont,
    width: '100%',
    textAlign: 'left',
    background: `linear-gradient(135deg, var(--surface-hover), var(--surface-3))`,
    border: `1.5px solid ${C.border}`,
    borderRadius: 18,
    padding: '22px 24px',
    transition: 'border-color .15s, transform .15s',
  }
  return (
    <button
      onClick={() => onSelect(mode)}
      aria-label={`Jouer en mode ${mode.label}`}
      style={base}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          {mode.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: C.text }}>
              {mode.label}
            </span>
            <span
              style={{
                fontFamily: C.monoFont,
                fontSize: 12,
                letterSpacing: 1,
                color: accent,
                textTransform: 'uppercase',
              }}
            >
              {mode.badge}
            </span>
          </div>
          <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.5, marginTop: 4 }}>
            {mode.blurb}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <span
          style={{
            fontFamily: C.monoFont,
            fontSize: 12,
            letterSpacing: 1,
            color: C.muted2,
            textTransform: 'uppercase',
          }}
        >
          Record · <span style={{ color: best > 0 ? accent : C.text }}>{recordValue}</span>
        </span>
        <span style={{ fontFamily: C.monoFont, fontSize: 13, color: accent }}>Jouer →</span>
      </div>
    </button>
  )
}
