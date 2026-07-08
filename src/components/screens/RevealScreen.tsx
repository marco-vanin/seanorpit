import type { CSSProperties } from 'react'
import { Button } from '../ui/Button'
import { Artwork } from '../ui/Artwork'
import { C } from '../../theme'
import { sideColor, type Matchup, type Side, type Song } from '../../game/matchups'
import type { Selection } from '../../game/useGame'

export function RevealScreen({
  correct,
  selected,
  matchup,
  song,
  isLast,
  streakTier,
  streak,
  onNext,
}: {
  correct: boolean
  selected: Selection
  matchup: Matchup
  song: Song | null
  isLast: boolean
  streakTier: 0 | 1 | 2
  streak: number
  onNext: () => void
}) {
  const resultLabel = correct ? 'Correct' : selected === 'timeout' ? 'Temps écoulé' : 'Raté'
  const resultColor = correct ? C.sean : C.pit

  // Hype block only on a correct reveal that reached tier 1+ (streak ≥ 3).
  const showHype = correct && streakTier >= 1
  const hypeHeadline = streakTier === 2 ? 'EN FEU 🔥🔥🔥' : 'EN FEU 🔥'
  const hypeSub = streakTier === 2 ? `${streak} d’affilée !!` : `Série de ${streak} !`

  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .35s ease both' }}>
      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 14,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: resultColor,
          marginBottom: 20,
          fontWeight: 600,
        }}
      >
        {resultLabel}
      </div>

      {showHype && (
        <div
          style={{
            marginBottom: 24,
            padding: '18px 20px',
            borderRadius: 16,
            background: 'color-mix(in oklab, var(--gold) 12%, transparent)',
            border: `1px solid ${C.gold}`,
          }}
        >
          <div
            style={{
              fontFamily: C.monoFont,
              fontSize: 'clamp(20px, 7vw, 30px)',
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: C.gold,
            }}
          >
            {hypeHeadline}
          </div>
          <div
            style={{
              fontFamily: C.monoFont,
              fontSize: 'clamp(12px, 3.5vw, 15px)',
              letterSpacing: 1,
              color: C.gold,
              marginTop: 6,
            }}
          >
            {hypeSub}
          </div>
        </div>
      )}

      {/* Face-off: the two candidates, the correct side lit + ✓, other dimmed;
          the player's wrong pick (never a timeout) marked ✗. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 30,
        }}
      >
        {(['a', 'b'] as Side[]).map((side) => {
          const isCorrect = song?.side === side
          const isWrongPick =
            (selected === 'a' || selected === 'b') && selected === side && !isCorrect
          return (
            <FaceoffTile
              key={side}
              name={matchup[side].name}
              image={matchup[side].image}
              accent={sideColor(matchup, side)}
              correct={isCorrect}
              wrongPick={isWrongPick}
            />
          )
        })}
      </div>

      {/* The revealed track: its artist's artwork beside the title. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 34,
        }}
      >
        <div style={{ animation: 'popIn .4s ease both', flexShrink: 0 }}>
          <Artwork
            src={song ? matchup[song.side].image : undefined}
            name={song ? matchup[song.side].name : ''}
            color={song ? sideColor(matchup, song.side) : C.muted4}
            size={120}
            radius={14}
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
          />
        </div>
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div
            style={{
              fontFamily: C.monoFont,
              fontSize: 12,
              letterSpacing: 2,
              color: C.muted2,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Le titre était
          </div>
          <div
            style={{
              fontSize: 'clamp(26px, 7vw, 36px)',
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.05,
              marginBottom: 6,
            }}
          >
            « {song?.title ?? ''} »
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: song ? sideColor(matchup, song.side) : C.text,
              marginBottom: 4,
            }}
          >
            {song ? matchup[song.side].name : ''}
          </div>
          <div style={{ color: C.muted2, fontSize: 14 }}>{song?.meta ?? ''}</div>
        </div>
      </div>

      <Button onClick={onNext}>{isLast ? 'Voir les résultats →' : 'Titre suivant →'}</Button>
    </div>
  )
}

/**
 * One artist in the reveal face-off. The correct side lights up (slot-color
 * border + glow + ✓ badge); the other is dimmed. A wrong player pick carries a
 * ✗ badge in its slot color. On a timeout neither side is marked wrong.
 */
function FaceoffTile({
  name,
  image,
  accent,
  correct,
  wrongPick,
}: {
  name: string
  image?: string
  accent: string
  correct: boolean
  wrongPick: boolean
}) {
  // Pin the dark palette locally so the artwork tile keeps its dark treatment
  // (bright accents + white name over a dark scrim) even in light mode.
  const box = {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    border: `1.5px solid ${correct ? accent : C.border}`,
    boxShadow: correct ? `0 0 0 3px color-mix(in oklab, ${accent} 24%, transparent)` : 'none',
    opacity: correct ? 1 : 0.5,
    transition: 'opacity .2s',
    '--text': '#f2f3f7',
    '--sean': 'oklch(0.78 0.15 155)',
    '--pit': 'oklch(0.78 0.15 55)',
  } as CSSProperties
  const badge = correct ? '✓' : wrongPick ? '✕' : null
  const badgeColor = correct ? accent : C.pit
  return (
    <div style={box}>
      <div style={{ position: 'relative', minHeight: 'clamp(120px, 36vw, 160px)' }}>
        <Artwork
          src={image}
          name={name}
          color={accent}
          size={160}
          radius={0}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(12,13,17,0.35) 0%, rgba(12,13,17,0.7) 55%, rgba(12,13,17,0.94) 100%)',
          }}
        />
        {badge && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 30,
              height: 30,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: C.bg,
              background: badgeColor,
              boxShadow: `0 0 12px ${badgeColor}`,
            }}
          >
            {badge}
          </span>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px 16px',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(17px, 5vw, 22px)',
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: 1.1,
              color: correct ? accent : C.text,
              textShadow: '0 1px 12px rgba(0,0,0,0.7)',
            }}
          >
            {name}
          </span>
        </div>
      </div>
    </div>
  )
}
