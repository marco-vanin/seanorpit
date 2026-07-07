import { Button } from '../ui/Button'
import { C } from '../../theme'
import { accuracyPct, gradeFor } from '../../game/scoring'
import type { Mode } from '../../game/modes'

/**
 * Mode-aware results. Classique / Blitz are framed "X / 10" with the accuracy
 * grade; Mort subite is framed as a run length ("Série de X"). Two actions:
 * Rejouer (same mode) and Retour à l'accueil.
 */
export function ResultsScreen({
  mode,
  score,
  total,
  bestStreak,
  best,
  onPlayAgain,
  onHome,
}: {
  mode: Mode
  score: number
  total: number
  bestStreak: number
  best: number
  onPlayAgain: () => void
  onHome: () => void
}) {
  const endless = mode.questions === 'endless'
  const accuracy = accuracyPct(score, total)
  const grade = gradeFor(accuracy)

  // Mort subite headline message, run-length based.
  const endlessMsg =
    score === 0
      ? 'Éliminé d’entrée — réessaie.'
      : score >= best && best > 0
        ? 'Nouveau record ! 🔥'
        : `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} avant la faute.`

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
        {mode.icon} {mode.label} · terminé
      </div>

      {endless ? (
        <div
          style={{
            fontSize: 'clamp(30px, 10vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1,
            marginBottom: 6,
          }}
        >
          Série de <span style={{ color: C.gold }}>{score}</span>
        </div>
      ) : (
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
      )}

      <div
        style={{
          fontSize: 19,
          color: endless ? C.gold : grade.color,
          fontWeight: 600,
          marginBottom: 40,
        }}
      >
        {endless ? endlessMsg : grade.label}
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
        {endless ? (
          <>
            <Stat value={score} label="Cette série" color={C.gold} />
            <Stat value={best} label="Record" />
          </>
        ) : (
          <>
            <Stat value={`${accuracy}%`} label="Précision" />
            <Stat value={bestStreak} label="Meilleure série" color={C.gold} />
            <Stat value={best} label="Record" />
          </>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Button onClick={onPlayAgain}>Rejouer</Button>
        <Button
          onClick={onHome}
          style={{ background: 'transparent', color: C.text, border: `1.5px solid ${C.border2}` }}
        >
          Retour à l’accueil
        </Button>
      </div>
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
