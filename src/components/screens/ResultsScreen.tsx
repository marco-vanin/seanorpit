import { Button } from '../ui/Button'
import { C } from '../../theme'
import { accuracyPct, gradeFor } from '../../game/scoring'

export function ResultsScreen({
  score,
  total,
  bestStreak,
  best,
  onPlayAgain,
}: {
  score: number
  total: number
  bestStreak: number
  best: number
  onPlayAgain: () => void
}) {
  const accuracy = accuracyPct(score, total)
  const grade = gradeFor(accuracy)

  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .45s ease both' }}>
      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 13,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.muted2,
          marginBottom: 20,
        }}
      >
        Manche terminée
      </div>

      <div
        style={{
          fontSize: 'clamp(56px, 18vw, 88px)',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -3,
          marginBottom: 4,
        }}
      >
        {score}
        <span style={{ color: C.muted5, fontSize: 'clamp(28px, 9vw, 44px)' }}>/{total}</span>
      </div>

      <div style={{ fontSize: 19, color: grade.color, fontWeight: 600, marginBottom: 40 }}>
        {grade.label}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 42,
          flexWrap: 'wrap',
        }}
      >
        <Stat value={`${accuracy}%`} label="Précision" />
        <Stat value={bestStreak} label="Meilleure série" color={C.gold} />
        <Stat value={best} label="Record" />
      </div>

      <Button onClick={onPlayAgain}>Rejouer</Button>
    </div>
  )
}

function Stat({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '22px 30px',
        minWidth: 150,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 700, color: color ?? C.text }}>{value}</div>
      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          letterSpacing: 1,
          color: C.muted2,
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  )
}
