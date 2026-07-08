import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { C, slotColor } from '../../theme'
import { accuracyPct, gradeFor } from '../../game/scoring'
import { duelShareUrl, shareDuel } from '../../game/share'
import type { Mode } from '../../game/modes'
import type { Matchup } from '../../game/matchups'

/**
 * Matchup + mode-aware results, framed as a shareable score card. Classique is
 * "X / 10" with the accuracy grade; Mort subite is a run length ("Série de X").
 * Curated shows a persisted record; custom shows none. The score can be copied
 * to the clipboard, and a custom duel's link shared; then Rejouer / Accueil.
 */
export function ResultsScreen({
  matchup,
  mode,
  score,
  total,
  bestStreak,
  best,
  onPlayAgain,
  onHome,
}: {
  matchup: Matchup
  mode: Mode
  score: number
  total: number
  bestStreak: number
  best: number
  onPlayAgain: () => void
  onHome: () => void
}) {
  // One toast area, message-driven so it serves both the score copy and the duel
  // link copy (kept mounted while fading so the text doesn't blink out).
  const [toastMsg, setToastMsg] = useState('')
  const [toastOn, setToastOn] = useState(false)
  const timerRef = useRef<number | null>(null)
  useEffect(() => () => void (timerRef.current && window.clearTimeout(timerRef.current)), [])
  const flashToast = (msg: string) => {
    setToastMsg(msg)
    setToastOn(true)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setToastOn(false), 2200)
  }

  const endless = mode.questions === 'endless'
  const isCustom = matchup.source === 'custom'
  // Custom duels are shareable via their stateless artist-id link; curated aren't.
  const duelUrl = isCustom ? duelShareUrl(matchup) : null
  const accuracy = accuracyPct(score, total)
  const grade = gradeFor(accuracy)
  // Custom duels persist no best; treat it as 0 so no record is ever claimed.
  const effectiveBest = isCustom ? 0 : best
  const bestDisplay = effectiveBest > 0 ? effectiveBest : '—'

  // Mort subite headline message, run-length based.
  const endlessMsg =
    score === 0
      ? 'Éliminé d’entrée — réessaie.'
      : score >= effectiveBest && effectiveBest > 0
        ? 'Nouveau record ! 🔥'
        : `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} avant la faute.`

  // Spoiler-free share text (no answers, just the result).
  const shareText = endless
    ? `Blind Duel — ${matchup.a.name} or ${matchup.b.name} : série de ${score} en Mort subite. Sauras-tu faire mieux ?`
    : `Blind Duel — ${matchup.a.name} or ${matchup.b.name} : ${score}/${total} — ${grade.label}. Sauras-tu faire mieux ?`

  const doCopy = () => {
    try {
      navigator.clipboard?.writeText(shareText)
    } catch {
      /* clipboard unavailable — the toast still confirms intent */
    }
    flashToast('✓ Copié dans le presse-papier')
  }

  // Duel link share (custom only): copies the link (no native sheet) + toast.
  const doShareDuel = async () => {
    const outcome = await shareDuel(matchup)
    if (outcome === 'copied') flashToast('✓ Lien copié')
  }

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

      {/* The shareable score card. */}
      <div
        style={{
          maxWidth: 420,
          margin: '0 auto 24px',
          borderRadius: 22,
          overflow: 'hidden',
          border: `1px solid ${C.border2}`,
          background: `linear-gradient(180deg, ${C.surface2}, var(--surface-3))`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            padding: '26px 26px 22px',
            background:
              'radial-gradient(120% 80% at 50% -20%, var(--surface-hover) 0%, transparent 60%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
              fontSize: 'clamp(16px, 5vw, 22px)',
              fontWeight: 700,
              letterSpacing: -0.5,
              marginBottom: 18,
            }}
          >
            <span style={{ color: slotColor('a'), overflowWrap: 'anywhere' }}>
              {matchup.a.name}
            </span>
            <span style={{ fontFamily: C.monoFont, fontSize: 12, color: C.muted2 }}>or</span>
            <span style={{ color: slotColor('b'), overflowWrap: 'anywhere' }}>
              {matchup.b.name}
            </span>
          </div>

          {endless ? (
            <div
              style={{
                fontSize: 'clamp(30px, 10vw, 48px)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: -1,
              }}
            >
              Série de <span style={{ color: C.gold }}>{score}</span>
            </div>
          ) : (
            <div
              style={{
                fontSize: 'clamp(56px, 18vw, 84px)',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: -3,
              }}
            >
              {score}
              <span style={{ color: C.muted5, fontSize: 'clamp(28px, 9vw, 42px)' }}>/{total}</span>
            </div>
          )}

          <div
            style={{
              fontSize: 17,
              color: endless ? C.gold : grade.color,
              fontWeight: 600,
              marginTop: 6,
            }}
          >
            {endless ? endlessMsg : grade.label}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 26,
              marginTop: 22,
              fontFamily: C.monoFont,
            }}
          >
            {endless ? (
              <>
                <CardStat value={score} label="Cette série" color={C.gold} />
                <CardStat value={bestDisplay} label={isCustom ? 'Éphémère' : 'Record'} />
              </>
            ) : (
              <>
                <CardStat value={`${accuracy}%`} label="Précision" />
                <CardStat value={bestStreak} label="Meilleure série" color={C.gold} />
                <CardStat value={bestDisplay} label={isCustom ? 'Éphémère' : 'Record'} />
              </>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: 12,
            fontFamily: C.monoFont,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted2,
          }}
        >
          blind duel · sauras-tu faire mieux ?
        </div>
      </div>

      {/* Share actions. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <Button onClick={doCopy}>📋 Copier le score</Button>
        {duelUrl && (
          <Button
            onClick={doShareDuel}
            style={{ background: 'transparent', color: C.text, border: `1.5px solid ${C.border2}` }}
          >
            🔗 Partager ce duel
          </Button>
        )}
      </div>
      <div
        aria-live="polite"
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          color: C.slotA,
          marginBottom: 20,
          height: 16,
          opacity: toastOn ? 1 : 0,
          transition: 'opacity .2s',
        }}
      >
        {toastMsg}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
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

function CardStat({
  value,
  label,
  color,
}: {
  value: string | number
  label: string
  color?: string
}) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? C.text }}>{value}</div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1,
          color: C.muted2,
          textTransform: 'uppercase',
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  )
}
