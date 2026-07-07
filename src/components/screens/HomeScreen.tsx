import type { CSSProperties } from 'react'
import { C } from '../../theme'
import { MODE_LIST, type Mode } from '../../game/modes'
import { bestForMode } from '../../game/useGame'

/**
 * Mode-select hub at `/`. Title + pitch + one card per mode (icon, label,
 * one-line rule, per-mode best). Tap a card → start that mode. Mobile-first,
 * single column; the grid just relaxes the gap on wider screens.
 */
export function HomeScreen({ onSelect }: { onSelect: (mode: Mode) => void }) {
  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .5s ease both' }}>
      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 13,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.muted2,
          marginBottom: 24,
        }}
      >
        Blindtest audio · Devine l'artiste
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(14px, 5vw, 28px)',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(34px, 11vw, 60px)',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -2,
            color: C.sean,
          }}
        >
          Sean Paul
        </span>
        <span
          style={{
            fontFamily: C.monoFont,
            fontSize: 20,
            fontWeight: 600,
            color: C.muted5,
            border: `1.5px solid ${C.border2}`,
            borderRadius: 999,
            width: 52,
            height: 52,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          or
        </span>
        <span
          style={{
            fontSize: 'clamp(34px, 11vw, 60px)',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -2,
            color: C.pit,
          }}
        >
          Pitbull
        </span>
      </div>

      <p
        style={{
          maxWidth: 460,
          margin: '0 auto 36px',
          color: C.muted,
          fontSize: 'clamp(15px, 4.4vw, 17px)',
          lineHeight: 1.5,
        }}
      >
        Sean Paul ou Pitbull ? À toi de trancher. Choisis ton mode de jeu.
      </p>

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
          <ModeCard key={mode.key} mode={mode} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function ModeCard({ mode, onSelect }: { mode: Mode; onSelect: (mode: Mode) => void }) {
  const best = bestForMode(mode)
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
