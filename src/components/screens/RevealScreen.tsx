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
  onQuit,
}: {
  correct: boolean
  selected: Selection
  matchup: Matchup
  song: Song | null
  isLast: boolean
  streakTier: 0 | 1 | 2
  streak: number
  onNext: () => void
  /** Abandon the run — opens the confirm dialog owned by the route. */
  onQuit: () => void
}) {
  const resultLabel = correct ? 'Correct' : selected === 'timeout' ? 'Temps écoulé' : 'Raté'
  const resultColor = correct ? C.ok : C.bad

  // Hype block only on a correct reveal that reached tier 1+ (streak ≥ 3).
  const showHype = correct && streakTier >= 1
  const hypeHeadline = streakTier === 2 ? 'EN FEU 🔥🔥🔥' : 'EN FEU 🔥'
  const hypeSub = streakTier === 2 ? `${streak} d’affilée !!` : `Série de ${streak} !`

  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .35s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
        <button
          onClick={onQuit}
          aria-label="Quitter la partie"
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: C.monoFont,
            fontSize: 12,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: C.muted2,
            background: 'transparent',
            border: `1px solid ${C.border2}`,
            borderRadius: 999,
            padding: '5px 12px',
            lineHeight: 1,
          }}
        >
          <span aria-hidden>✕</span> Quitter
        </button>
      </div>

      {/* Result badge circle + label. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 38,
            fontWeight: 700,
            color: '#fff',
            background: resultColor,
            boxShadow: `0 0 0 8px color-mix(in oklab, ${resultColor} 22%, transparent), 0 10px 30px rgba(0,0,0,0.3)`,
            animation: 'popIn .3s ease both',
          }}
        >
          {correct ? '✓' : '✕'}
        </span>
        <div
          style={{
            fontFamily: C.monoFont,
            fontSize: 15,
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontWeight: 700,
            color: resultColor,
          }}
        >
          {resultLabel}
        </div>
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
          marginBottom: 28,
          maxWidth: 460,
          marginLeft: 'auto',
          marginRight: 'auto',
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
              overflowWrap: 'anywhere',
            }}
          >
            « {song?.title ?? ''} »
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: song ? C.ok : C.text,
              marginBottom: 4,
              overflowWrap: 'anywhere',
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
 * One artist in the reveal face-off. The correct side lights up (green ok
 * border + glow + ✓ badge + name); a wrong player pick lights up red (bad
 * border + glow + ✕ badge + "Ton choix" marker). Other tiles are dimmed. On a
 * timeout neither side is marked wrong.
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
  // (bright accents + white name over a dark scrim) even in light mode. Pin
  // ok/bad too so the result colors stay correct on this always-dark tile.
  const lit = correct || wrongPick
  const litColor = correct ? C.ok : C.bad
  const box = {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    aspectRatio: '1 / 1',
    border: `2px solid ${lit ? litColor : C.border}`,
    boxShadow: lit ? `0 0 0 3px color-mix(in oklab, ${litColor} 24%, transparent)` : 'none',
    opacity: lit ? 1 : 0.5,
    transition: 'opacity .2s',
    '--text': '#f2f3f7',
    '--slot-a': 'oklch(0.7 0.19 268)',
    '--slot-a-bright': 'oklch(0.78 0.16 268)',
    '--slot-b': 'oklch(0.72 0.24 350)',
    '--slot-b-bright': 'oklch(0.8 0.2 350)',
    '--ok': 'oklch(0.74 0.17 152)',
    '--bad': 'oklch(0.66 0.22 25)',
  } as CSSProperties
  const badge = correct ? '✓' : wrongPick ? '✕' : null
  return (
    <div style={box}>
      <Artwork
        src={image}
        name={name}
        color={accent}
        size={200}
        radius={0}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(12,13,17,0) 45%, rgba(12,13,17,0.9))',
        }}
      />
      {badge && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: correct ? 17 : 16,
            fontWeight: 700,
            color: '#fff',
            background: litColor,
            boxShadow: `0 0 14px ${litColor}`,
          }}
        >
          {badge}
        </span>
      )}
      {wrongPick && (
        <span
          style={{
            position: 'absolute',
            left: 16,
            bottom: 44,
            fontFamily: C.monoFont,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: C.bad,
          }}
        >
          Ton choix
        </span>
      )}
      <span
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          right: 16,
          fontSize: 'clamp(17px, 5vw, 22px)',
          fontWeight: 700,
          letterSpacing: -0.5,
          lineHeight: 1.1,
          color: '#fff',
          textShadow: '0 1px 12px rgba(0,0,0,0.7)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'anywhere',
        }}
      >
        {name}
      </span>
    </div>
  )
}
