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
  onOpenRules,
  onOpenSettings,
}: {
  onSelectMatchup: (matchup: Matchup) => void
  onCustom: () => void
  onOpenRules: () => void
  onOpenSettings: () => void
}) {
  // Lifetime totals for the stats strip (read once per mount from localStorage).
  const stats = lifetimeStats()
  return (
    <div style={{ animation: 'floatIn .5s ease both' }}>
      {/* Top bar: brand + help */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(40px, 9vw, 72px)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <svg
            width="26"
            height="26"
            viewBox="0 0 32 32"
            aria-hidden="true"
            style={{ display: 'block', flexShrink: 0 }}
          >
            <circle cx="12" cy="16" r="10" fill="var(--sean)" />
            <circle cx="21.5" cy="16" r="11.5" fill="var(--bg)" />
            <circle cx="21.5" cy="16" r="10" fill="var(--pit)" />
          </svg>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.4, color: C.text }}>
            Blind Duel
          </span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onOpenRules}
            aria-label="Comment jouer"
            style={{
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: C.monoFont,
              fontSize: 13,
              letterSpacing: 1,
              color: C.text,
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 999,
              padding: '8px 16px',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: C.gold,
                color: C.bg,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ?
            </span>
            Comment jouer
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Paramètres"
            style={{
              cursor: 'pointer',
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.text,
              background: C.surface,
              border: `1px solid ${C.border2}`,
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ⚙
          </button>
        </div>
      </div>

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
              'radial-gradient(circle, color-mix(in oklab, var(--sean) 20%, transparent), transparent 70%)',
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
              'radial-gradient(circle, color-mix(in oklab, var(--pit) 18%, transparent), transparent 70%)',
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
            boxShadow: '0 14px 44px -14px color-mix(in oklab, var(--sean) 50%, transparent)',
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
        <LifetimeStat value={`${stats.accuracy}%`} label="Précision moy." color={C.sean} divider />
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
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
    '--sean-bright': 'oklch(0.82 0.13 155)',
    '--pit-bright': 'oklch(0.82 0.13 55)',
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
          <span style={{ color: 'var(--sean-bright)' }}>{matchup.a.name}</span>
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
          <span style={{ color: 'var(--pit-bright)' }}>{matchup.b.name}</span>
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
