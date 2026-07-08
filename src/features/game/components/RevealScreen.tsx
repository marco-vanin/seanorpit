import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/Button'
import { Artwork } from '@/components/ui/Artwork'
import { sideColor } from '@/utils/colors'
import type { Matchup, Side, Song } from '@/types'
import type { Selection } from '@/features/game/hooks/useGame'
import { cn } from '@/utils/cn'

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
  const resultColor = correct ? 'var(--ok)' : 'var(--bad)'

  // Hype block only on a correct reveal that reached tier 1+ (streak ≥ 3).
  const showHype = correct && streakTier >= 1
  const hypeHeadline = streakTier === 2 ? 'EN FEU 🔥🔥🔥' : 'EN FEU 🔥'
  const hypeSub = streakTier === 2 ? `${streak} d’affilée !!` : `Série de ${streak} !`

  return (
    <div className="text-center [animation:floatIn_.35s_ease_both]">
      <div className="mb-4 flex justify-start">
        <button
          onClick={onQuit}
          aria-label="Quitter la partie"
          className="inline-flex cursor-pointer items-center gap-[5px] rounded-full border border-border-2 bg-transparent px-3 py-[5px] font-mono text-[12px] leading-none tracking-[1px] text-muted-2 uppercase"
        >
          <span aria-hidden>✕</span> Quitter
        </button>
      </div>

      {/* Result badge circle + label. */}
      <div className="mb-[22px] flex flex-col items-center gap-[14px]">
        <span
          aria-hidden
          className="flex size-[76px] items-center justify-center rounded-full text-[38px] font-bold text-white [animation:popIn_.3s_ease_both]"
          style={{
            background: resultColor,
            boxShadow: `0 0 0 8px color-mix(in oklab, ${resultColor} 22%, transparent), 0 10px 30px rgba(0,0,0,0.3)`,
          }}
        >
          {correct ? '✓' : '✕'}
        </span>
        <div
          className="font-mono text-[15px] font-bold tracking-[3px] uppercase"
          style={{ color: resultColor }}
        >
          {resultLabel}
        </div>
      </div>

      {showHype && (
        <div className="mb-6 rounded-[16px] border border-gold bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] px-5 py-[18px]">
          <div className="font-mono text-[clamp(20px,7vw,30px)] font-bold tracking-[3px] text-gold uppercase">
            {hypeHeadline}
          </div>
          <div className="mt-[6px] font-mono text-[clamp(12px,3.5vw,15px)] tracking-[1px] text-gold">
            {hypeSub}
          </div>
        </div>
      )}

      {/* Face-off: the two candidates, the correct side lit + ✓, other dimmed;
          the player's wrong pick (never a timeout) marked ✗. */}
      <div className="mx-auto mb-7 grid max-w-[460px] grid-cols-2 gap-[14px]">
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
      <div className="mb-[34px] flex flex-wrap items-center justify-center gap-5">
        <div className="shrink-0 [animation:popIn_.4s_ease_both]">
          <Artwork
            src={song ? matchup[song.side].image : undefined}
            name={song ? matchup[song.side].name : ''}
            color={song ? sideColor(matchup, song.side) : 'var(--muted-4)'}
            size={120}
            radius={14}
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
          />
        </div>
        <div className="min-w-0 text-left">
          <div className="mb-2 font-mono text-[12px] tracking-[2px] text-muted-2 uppercase">
            Le titre était
          </div>
          <div className="mb-[6px] text-[clamp(26px,7vw,36px)] leading-[1.05] font-bold tracking-[-1px] [overflow-wrap:anywhere]">
            « {song?.title ?? ''} »
          </div>
          <div
            className={cn(
              'mb-1 text-[18px] font-semibold [overflow-wrap:anywhere]',
              song ? 'text-ok' : 'text-text',
            )}
          >
            {song ? matchup[song.side].name : ''}
          </div>
          <div className="text-[14px] text-muted-2">{song?.meta ?? ''}</div>
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
 *
 * DARK-PINNED: the tile pins the dark palette (text/slot/ok/bad vars) locally so
 * the artwork keeps its dark treatment — bright accents + white name over a dark
 * scrim, correct result colors — even in light mode. Do NOT flatten these.
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
  const lit = correct || wrongPick
  const litColor = correct ? 'var(--ok)' : 'var(--bad)'
  const box: CSSProperties = {
    border: `2px solid ${lit ? litColor : 'var(--border)'}`,
    boxShadow: lit ? `0 0 0 3px color-mix(in oklab, ${litColor} 24%, transparent)` : 'none',
    opacity: lit ? 1 : 0.5,
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
    <div
      className="relative aspect-square overflow-hidden rounded-[18px] transition-opacity duration-200"
      style={box}
    >
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
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,17,0)_45%,rgba(12,13,17,0.9))]"
      />
      {badge && (
        <span
          aria-hidden
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full font-bold text-white"
          style={{
            background: litColor,
            boxShadow: `0 0 14px ${litColor}`,
            fontSize: correct ? 17 : 16,
          }}
        >
          {badge}
        </span>
      )}
      {wrongPick && (
        <span className="absolute bottom-11 left-4 font-mono text-[11px] font-semibold tracking-[1px] text-bad uppercase">
          Ton choix
        </span>
      )}
      <span className="absolute right-4 bottom-4 left-4 line-clamp-2 text-[clamp(17px,5vw,22px)] leading-[1.1] font-bold tracking-[-0.5px] text-white [overflow-wrap:anywhere] [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]">
        {name}
      </span>
    </div>
  )
}
