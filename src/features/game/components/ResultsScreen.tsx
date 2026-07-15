import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { slotColor } from '@/utils/colors'
import { accuracyPct, gradeFor } from '@/features/game/utils/scoring'
import { duelShareUrl, shareDuel } from '@/utils/share'
import type { Matchup, Mode } from '@/types'
import { cn } from '@/utils/cn'

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
    ? `Duon — ${matchup.a.name} or ${matchup.b.name} : série de ${score} en Mort subite. Sauras-tu faire mieux ?`
    : `Duon — ${matchup.a.name} or ${matchup.b.name} : ${score}/${total} — ${grade.label}. Sauras-tu faire mieux ?`

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
    <div className="text-center [animation:floatIn_.45s_ease_both]">
      <div className="mb-5 font-mono text-[13px] tracking-[4px] text-muted-2 uppercase">
        {mode.icon} {mode.label} · terminé
      </div>

      {/* The shareable score card. */}
      <div className="mx-auto mb-6 max-w-[420px] overflow-hidden rounded-[22px] border border-border-2 bg-[linear-gradient(180deg,var(--surface-2),var(--surface-3))] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="bg-[radial-gradient(120%_80%_at_50%_-20%,var(--surface-hover)_0%,transparent_60%)] px-[26px] pt-[26px] pb-[22px]">
          <div className="mb-[18px] flex flex-wrap items-center justify-center gap-[10px] text-[clamp(16px,5vw,22px)] font-bold tracking-[-0.5px]">
            <span className="[overflow-wrap:anywhere]" style={{ color: slotColor('a') }}>
              {matchup.a.name}
            </span>
            <span className="font-mono text-[12px] text-muted-2">or</span>
            <span className="[overflow-wrap:anywhere]" style={{ color: slotColor('b') }}>
              {matchup.b.name}
            </span>
          </div>

          {endless ? (
            <div className="text-[clamp(30px,10vw,48px)] leading-[1.1] font-bold tracking-[-1px]">
              Série de <span className="text-gold">{score}</span>
            </div>
          ) : (
            <div className="text-[clamp(56px,18vw,84px)] leading-none font-bold tracking-[-3px]">
              {score}
              <span className="text-[clamp(28px,9vw,42px)] text-muted-5">/{total}</span>
            </div>
          )}

          <div
            className="mt-[6px] text-[17px] font-semibold"
            style={{ color: endless ? 'var(--gold)' : grade.color }}
          >
            {endless ? endlessMsg : grade.label}
          </div>

          <div className="mt-[22px] flex justify-center gap-[26px] font-mono">
            {endless ? (
              <>
                <CardStat value={score} label="Cette série" color="var(--gold)" />
                <CardStat value={bestDisplay} label={isCustom ? 'Éphémère' : 'Record'} />
              </>
            ) : (
              <>
                <CardStat value={`${accuracy}%`} label="Précision" />
                <CardStat value={bestStreak} label="Meilleure série" color="var(--gold)" />
                <CardStat value={bestDisplay} label={isCustom ? 'Éphémère' : 'Record'} />
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border p-3 font-mono text-[11px] tracking-[2px] text-muted-2 uppercase">
          blind duel · sauras-tu faire mieux ?
        </div>
      </div>

      {/* Share actions. */}
      <div className="mb-3 flex flex-wrap justify-center gap-3">
        <Button onClick={doCopy}>📋 Copier le score</Button>
        {duelUrl && (
          <Button variant="ghost" onClick={doShareDuel}>
            🔗 Partager ce duel
          </Button>
        )}
      </div>
      <div
        aria-live="polite"
        className={cn(
          'mb-5 h-4 font-mono text-[12px] text-slot-a transition-opacity duration-200',
          toastOn ? 'opacity-100' : 'opacity-0',
        )}
      >
        {toastMsg}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onPlayAgain}>Rejouer</Button>
        <Button variant="ghost" onClick={onHome}>
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
      <div className="text-[22px] font-bold" style={{ color: color ?? 'var(--text)' }}>
        {value}
      </div>
      <div className="mt-[2px] text-[10px] tracking-[1px] text-muted-2 uppercase">{label}</div>
    </div>
  )
}
