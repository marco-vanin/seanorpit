import { Button } from '../ui/Button'
import { C, artistColor } from '../../theme'
import { ARTIST_NAME, type Song } from '../../game/songs'
import type { Selection } from '../../game/useGame'

export function RevealScreen({
  correct,
  selected,
  song,
  isLast,
  streakTier,
  streak,
  onNext,
}: {
  correct: boolean
  selected: Selection
  song: Song | null
  isLast: boolean
  streakTier: 0 | 1 | 2
  streak: number
  onNext: () => void
}) {
  const resultLabel = correct ? 'Correct' : selected === 'timeout' ? 'Temps écoulé' : 'Raté'
  const resultColor = correct ? C.sean : C.pit
  const resultBg = correct ? 'oklch(0.78 0.15 155 / 0.14)' : 'oklch(0.78 0.15 55 / 0.14)'

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
            background: 'oklch(0.82 0.14 85 / 0.12)',
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

      <div
        style={{
          width: 88,
          height: 88,
          margin: '0 auto 28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 42,
          background: resultBg,
          color: resultColor,
        }}
      >
        {correct ? '✓' : '✕'}
      </div>

      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          letterSpacing: 2,
          color: C.muted2,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Le titre était
      </div>
      <div
        style={{
          fontSize: 'clamp(28px, 8vw, 40px)',
          fontWeight: 700,
          letterSpacing: -1,
          marginBottom: 6,
        }}
      >
        « {song?.t ?? ''} »
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: song ? artistColor(song.a) : C.text,
          marginBottom: 8,
        }}
      >
        {song ? ARTIST_NAME[song.a] : ''}
      </div>
      <div style={{ color: C.muted2, fontSize: 15, marginBottom: 38 }}>{song?.m ?? ''}</div>

      <Button onClick={onNext}>{isLast ? 'Voir les résultats →' : 'Titre suivant →'}</Button>
    </div>
  )
}
