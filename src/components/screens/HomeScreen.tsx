import type { CSSProperties } from 'react'
import { Button } from '../ui/Button'
import { Artwork } from '../ui/Artwork'
import { C, slotColor } from '../../theme'
import { CURATED, type Matchup } from '../../game/matchups'

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
  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .5s ease both' }}>
      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 13,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.muted2,
          marginBottom: 18,
        }}
      >
        Blindtest audio · Devine l'artiste
      </div>

      <h1
        style={{
          fontSize: 'clamp(44px, 15vw, 88px)',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -3,
          margin: '0 0 16px',
        }}
      >
        Blind Duel
      </h1>

      <p
        style={{
          maxWidth: 460,
          margin: '0 auto 30px',
          color: C.muted,
          fontSize: 'clamp(15px, 4.4vw, 17px)',
          lineHeight: 1.5,
        }}
      >
        Deux artistes, un extrait, une seule bonne réponse. Compose ton duel ou lance-toi sur un
        classique.
      </p>

      <Button
        onClick={onCustom}
        aria-label="Créer un duel personnalisé"
        style={{ width: '100%', maxWidth: 460, margin: '0 auto 40px', display: 'block' }}
      >
        ✨ Créer un duel
      </Button>

      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: C.muted3,
          textAlign: 'left',
          maxWidth: 460,
          margin: '0 auto 14px',
        }}
      >
        Duels populaires
      </div>

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

function MatchupCard({ matchup, onClick }: { matchup: Matchup; onClick: () => void }) {
  const base: CSSProperties = {
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
  }
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
          <span style={{ color: slotColor('a') }}>{matchup.a.name}</span>
          <span
            style={{
              fontFamily: C.monoFont,
              fontSize: 13,
              fontWeight: 600,
              color: C.muted,
              textTransform: 'lowercase',
            }}
          >
            or
          </span>
          <span style={{ color: slotColor('b') }}>{matchup.b.name}</span>
        </span>
        <span
          style={{
            fontFamily: C.monoFont,
            fontSize: 12,
            letterSpacing: 1,
            color: C.muted,
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
