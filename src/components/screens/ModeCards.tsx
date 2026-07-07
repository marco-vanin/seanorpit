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
        gridTemplateColumns: '1fr',
        gap: 14,
        maxWidth: 460,
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
  const base: CSSProperties = {
    cursor: 'pointer',
    fontFamily: C.sansFont,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    textAlign: 'left',
    background: C.surface,
    border: `1.5px solid ${C.border}`,
    borderRadius: 18,
    padding: '18px 20px',
    transition: 'border-color .15s, background .15s, transform .15s',
  }
  return (
    <button
      onClick={() => onSelect(mode)}
      aria-label={`Jouer en mode ${mode.label}`}
      style={base}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.muted4
        e.currentTarget.style.background = C.surface2
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.background = C.surface
        e.currentTarget.style.transform = 'none'
      }}
    >
      <span style={{ fontSize: 34, lineHeight: 1, flexShrink: 0 }} aria-hidden>
        {mode.icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 21,
            fontWeight: 600,
            color: C.text,
            marginBottom: 3,
          }}
        >
          {mode.label}
        </span>
        <span style={{ display: 'block', fontSize: 14, color: C.muted }}>{mode.rule}</span>
      </span>
      <span
        style={{
          flexShrink: 0,
          textAlign: 'right',
          fontFamily: C.monoFont,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: C.muted3,
          lineHeight: 1.5,
        }}
      >
        Record
        <span style={{ display: 'block', fontSize: 18, fontWeight: 600, color: C.gold }}>
          {best > 0 ? best : '—'}
        </span>
      </span>
    </button>
  )
}
