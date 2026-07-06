import { Button } from '../ui/Button'
import { C } from '../../theme'

export function HomeScreen({
  best,
  total,
  onStart,
}: {
  best: number
  total: number
  onStart: () => void
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
          marginBottom: 28,
        }}
      >
        Blindtest audio · Devine l'artiste
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(38px, 12vw, 64px)',
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
            fontSize: 22,
            fontWeight: 600,
            color: C.muted5,
            border: `1.5px solid ${C.border2}`,
            borderRadius: 999,
            width: 58,
            height: 58,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          vs
        </span>
        <span
          style={{
            fontSize: 'clamp(38px, 12vw, 64px)',
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
          margin: '0 auto 40px',
          color: C.muted,
          fontSize: 17,
          lineHeight: 1.5,
        }}
      >
        Un extrait démarre. Quelques secondes, pas plus. Le roi du dancehall jamaïcain ou Mr.
        Worldwide ? Fie-toi à ton instinct.
      </p>

      <Button onClick={onStart} style={{ fontSize: 18, padding: '16px 42px' }}>
        Démarrer la manche →
      </Button>

      <div
        style={{
          marginTop: 34,
          fontFamily: C.monoFont,
          fontSize: 13,
          color: C.muted3,
        }}
      >
        Meilleur score <span style={{ color: C.text, fontWeight: 600 }}>{best}</span> / {total}
      </div>
    </div>
  )
}
