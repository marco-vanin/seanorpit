import { C, slotColor } from '../../theme'
import type { Matchup } from '../../game/matchups'
import type { Mode } from '../../game/modes'
import { ModeCards } from './ModeCards'

/**
 * Curated mode-select at `/duel/:matchupId`. The two artist names as a header
 * (slot colors) + the three mode cards with per-mode best. Mobile-first.
 */
export function ModeSelectScreen({
  matchup,
  onSelect,
  onBack,
}: {
  matchup: Matchup
  onSelect: (mode: Mode) => void
  onBack: () => void
}) {
  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .45s ease both' }}>
      <button
        onClick={onBack}
        aria-label="Retour à l'accueil"
        style={{
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          color: C.muted2,
          fontFamily: C.monoFont,
          fontSize: 13,
          letterSpacing: 1,
          marginBottom: 20,
        }}
      >
        ← Accueil
      </button>

      <MatchupHeader matchup={matchup} />

      <p
        style={{
          margin: '0 auto 30px',
          color: C.muted,
          fontSize: 'clamp(14px, 4vw, 16px)',
        }}
      >
        Choisis ton mode de jeu.
      </p>

      <ModeCards matchup={matchup} onSelect={onSelect} />
    </div>
  )
}

/** "«A» or «B»" in slot colors — shared header. */
export function MatchupHeader({ matchup }: { matchup: Matchup }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(12px, 4vw, 22px)',
        marginBottom: 14,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 'clamp(28px, 9vw, 46px)',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -1.5,
          color: slotColor('a'),
        }}
      >
        {matchup.a.name}
      </span>
      <span
        style={{
          fontFamily: C.monoFont,
          fontSize: 16,
          fontWeight: 600,
          color: C.muted5,
          border: `1.5px solid ${C.border2}`,
          borderRadius: 999,
          width: 46,
          height: 46,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        or
      </span>
      <span
        style={{
          fontSize: 'clamp(28px, 9vw, 46px)',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -1.5,
          color: slotColor('b'),
        }}
      >
        {matchup.b.name}
      </span>
    </div>
  )
}
