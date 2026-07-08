import type { CSSProperties } from 'react'
import { Button } from '../ui/Button'
import { Artwork } from '../ui/Artwork'
import { C, slotColor } from '../../theme'
import { CURATED, type Matchup } from '../../game/matchups'
import { lifetimeStats } from '../../game/useGame'

/**
 * Home hub at `/`. "Blind Duel" headline + pitch, a primary "Créer un duel" CTA
 * (custom is the star), then a "Duels populaires" section with one card per
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
    <div style={{ animation: 'floatIn .5s ease both' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -70,
            left: '6%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--slot-a) 20%, transparent), transparent 70%)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -40,
            right: '6%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--slot-b) 18%, transparent), transparent 70%)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
        <div
          style={{
            fontFamily: C.monoFont,
            fontSize: 12,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 20,
          }}
        >
          Blindtest audio · Devine l'artiste
        </div>

        <h1
          style={{
            fontSize: 'clamp(52px, 11vw, 104px)',
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: -4,
            margin: '0 0 20px',
          }}
        >
          Blind Duel
        </h1>

        <p
          style={{
            maxWidth: 430,
            margin: '0 auto 32px',
            color: C.muted2,
            fontSize: 'clamp(15px, 4.4vw, 18px)',
            lineHeight: 1.55,
          }}
        >
          Un extrait, deux artistes, quelques secondes pour trancher. Compose ton propre duel ou
          défie un classique.
        </p>

        <Button
          onClick={onCustom}
          aria-label="Créer un duel personnalisé"
          style={{
            width: '100%',
            maxWidth: 380,
            margin: '0 auto',
            display: 'block',
            boxShadow: '0 14px 44px -14px color-mix(in oklab, var(--slot-a) 50%, transparent)',
          }}
        >
          ✨ Créer un duel
        </Button>
      </div>

      {/* Lifetime stats strip. */}
      <div
        style={{
          display: 'flex',
          maxWidth: 460,
          margin: '0 auto 44px',
          border: `1px solid var(--hairline)`,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--nav-bg)',
        }}
      >
        <LifetimeStat value={stats.games} label="Parties" />
        <LifetimeStat value={`${stats.accuracy}%`} label="Précision moy." color={C.slotA} divider />
        <LifetimeStat value={stats.recordStreak} label="Record série" color={C.gold} divider />
      </div>

      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: C.muted,
          textAlign: 'left',
          margin: '0 auto 14px',
        }}
      >
        Duels prêts à jouer
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))',
          gap: 14,
          margin: '0 auto',
          textAlign: 'left',
        }}
      >
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

function LifetimeStat({
  value,
  label,
  color,
  divider,
}: {
  value: string | number
  label: string
  color?: string
  divider?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: '16px 8px',
        textAlign: 'center',
        borderLeft: divider ? `1px solid var(--hairline)` : 'none',
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? C.text }}>{value}</div>
      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 10,
          letterSpacing: 1,
          color: C.muted,
          textTransform: 'uppercase',
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function MatchupCard({ matchup, onClick }: { matchup: Matchup; onClick: () => void }) {
  // Pin the dark palette locally so these album-art cards keep their dark
  // treatment (bright names over a dark scrim) even when the app is in light mode.
  const base = {
    position: 'relative',
    cursor: 'pointer',
    fontFamily: C.sansFont,
    width: '100%',
    textAlign: 'left',
    background: C.surface,
    border: `1.5px solid ${C.border}`,
    borderRadius: 18,
    padding: 0,
    overflow: 'hidden',
    minHeight: 'clamp(132px, 38vw, 168px)',
    transition: 'border-color .15s, transform .15s',
    '--muted-2': '#b6bac6',
    '--slot-a': 'oklch(0.7 0.19 268)',
    '--slot-a-bright': 'oklch(0.78 0.16 268)',
    '--slot-b': 'oklch(0.72 0.24 350)',
    '--slot-b-bright': 'oklch(0.8 0.2 350)',
  } as CSSProperties
  return (
    <button
      onClick={onClick}
      aria-label={`Jouer le duel ${matchup.a.name} contre ${matchup.b.name}`}
      style={base}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.muted4
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Split album-art background: A left half, B right half. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
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
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(12,13,17,0.5) 0%, rgba(12,13,17,0.72) 55%, rgba(12,13,17,0.92) 100%)',
        }}
      />

      {/* Foreground content. */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: 'clamp(132px, 38vw, 168px)',
          gap: 8,
          padding: '20px 22px',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 'clamp(22px, 6.5vw, 28px)',
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.1,
            textShadow: '0 1px 12px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ color: 'var(--slot-a-bright)', overflowWrap: 'anywhere', minWidth: 0 }}>
            {matchup.a.name}
          </span>
          <span
            style={{
              fontFamily: C.monoFont,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--muted-2)',
              textTransform: 'lowercase',
            }}
          >
            or
          </span>
          <span style={{ color: 'var(--slot-b-bright)', overflowWrap: 'anywhere', minWidth: 0 }}>
            {matchup.b.name}
          </span>
        </span>
        <span
          style={{
            fontFamily: C.monoFont,
            fontSize: 12,
            letterSpacing: 1,
            color: 'var(--muted-2)',
            textTransform: 'uppercase',
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}
        >
          2 modes de jeu →
        </span>
      </div>
    </button>
  )
}
