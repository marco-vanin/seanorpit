import type { CSSProperties } from 'react'
import { Waveform } from './Waveform'
import { Artwork } from '@/components/ui/Artwork'
import type { Selection } from '@/features/game/hooks/useGame'
import { cn } from '@/utils/cn'

interface PlayingScreenProps {
  qNumber: number
  total: number
  score: number
  streak: number
  /** Endless mode (Mort subite): the HUD hides the fixed "/ total". */
  endless: boolean
  playing: boolean
  timerEnabled: boolean
  timeLeft: number
  seconds: number
  /** Elapsed / total clip seconds for the readout (duration 0 when unknown). */
  elapsed: number
  duration: number
  /** Slot A / B artist names + accent colors from the active matchup. */
  nameA: string
  nameB: string
  accentA: string
  accentB: string
  /** Slot A / B artwork (the two candidates — NEVER the current track's art). */
  imageA?: string
  imageB?: string
  onToggle: () => void
  onGuessA: () => void
  onGuessB: () => void
  hasAudio: boolean
  loading: boolean
  blocked: boolean
  selected: Selection
  answerCorrect: boolean
  /** First-play one-time hint near the choices; hidden after the first guess. */
  showHint: boolean
  muted: boolean
  onToggleMute: () => void
  /** Abandon the run — opens the confirm dialog owned by the route. */
  onQuit: () => void
}

export function PlayingScreen({
  qNumber,
  total,
  score,
  streak,
  endless,
  playing,
  timerEnabled,
  timeLeft,
  seconds,
  elapsed,
  duration,
  nameA,
  nameB,
  accentA,
  accentB,
  imageA,
  imageB,
  onToggle,
  onGuessA,
  onGuessB,
  hasAudio,
  loading,
  blocked,
  selected,
  answerCorrect,
  showHint,
  muted,
  onToggleMute,
  onQuit,
}: PlayingScreenProps) {
  // Result color of the picked button during the suspense beat, mirroring the
  // reveal: green when correct, red when wrong. Timeout → no flash.
  const flashColor = answerCorrect ? 'var(--ok)' : 'var(--bad)'
  const timePct = seconds ? Math.max(0, (timeLeft / seconds) * 100) : 100
  const timerColor = timeLeft <= Math.max(3, seconds * 0.25) ? 'var(--bad)' : 'var(--text)'

  // The clip is live and playing normally — show the elapsed timecode; otherwise
  // fall back to a descriptive state (unavailable / loading / blocked).
  const clipLive = hasAudio && !loading && !blocked
  const clipTotal = duration > 0 ? duration : seconds || 30

  let playHint: string
  if (!hasAudio) playHint = 'Extrait indisponible — fie-toi à ton instinct'
  else if (loading) playHint = 'Chargement de l’extrait…'
  else if (blocked) playHint = 'Touche ▶ pour lancer l’extrait'
  else if (!playing) playHint = 'En pause'
  else playHint = 'Lecture en cours — extrait 30 s'

  return (
    <div className="mx-auto max-w-[580px] [animation:floatIn_.35s_ease_both]">
      {/* HUD */}
      <div className="mb-[26px] flex items-center justify-between font-mono">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onQuit}
            aria-label="Quitter la partie"
            className="inline-flex shrink-0 cursor-pointer items-center gap-[5px] rounded-full border border-border-2 bg-transparent px-3 py-[5px] font-mono text-[12px] leading-none tracking-[1px] text-muted-2 uppercase"
          >
            <span aria-hidden>✕</span> Quitter
          </button>
          <div className="text-[13px] tracking-[2px] text-muted-2 uppercase">
            Titre <span className="text-text">{qNumber}</span>
            {endless ? '' : ` / ${total}`}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <div className="text-muted-2">
            Score <span className="font-semibold text-text">{score}</span>
          </div>
          <div className="text-muted-2">
            Série <span className="font-semibold text-gold">{streak}</span>
          </div>
          <button
            onClick={onToggleMute}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            aria-pressed={muted}
            className={cn(
              'shrink-0 cursor-pointer border-none bg-transparent p-1 text-[18px] leading-none text-text',
              muted ? 'opacity-[0.55]' : 'opacity-100',
            )}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Player card */}
      <div className="rounded-[22px] border border-border bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--surface-3)_100%)] px-10 pt-11 pb-10 text-center">
        <div className="relative mx-auto mb-[30px] size-[132px]">
          {playing && (
            <div className="absolute inset-0 rounded-full bg-text opacity-[0.12] [animation:pulseRing_1.8s_ease-out_infinite]" />
          )}
          <button
            onClick={onToggle}
            aria-label={playing ? 'Mettre en pause' : 'Lire'}
            className="relative flex size-[132px] cursor-pointer items-center justify-center rounded-full border-none bg-text text-[40px] text-bg"
          >
            {playing ? '❚❚' : '▶'}
          </button>
        </div>

        <Waveform playing={playing} />

        {clipLive ? (
          <div className="mt-[14px] flex items-center justify-center gap-2 font-mono text-[12px] tracking-[1px] text-muted-2">
            <span className="text-text">{fmtClip(elapsed)}</span>
            <span>/ {fmtClip(clipTotal)}</span>
            <span
              aria-hidden
              className="size-1 rounded-full"
              style={{ background: playing ? 'var(--slot-a)' : 'var(--muted-2)' }}
            />
            <span className="tracking-[2px] uppercase">{playing ? 'lecture' : 'en pause'}</span>
          </div>
        ) : (
          <div className="mt-[14px] font-mono text-[12px] tracking-[2px] text-muted-4 uppercase">
            {playHint}
          </div>
        )}

        {timerEnabled && (
          <div className="mt-7 h-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-[width] duration-[950ms] ease-linear"
              style={{ background: timerColor, width: `${timePct}%` }}
            />
          </div>
        )}
      </div>

      {/* First-play hint — shown once, until the first explicit guess. */}
      {showHint && (
        <div className="mt-[22px] text-center font-mono text-[12px] tracking-[1px] text-muted">
          👆 Touche l’artiste que tu penses entendre
        </div>
      )}

      {/* Choices — the two candidate artists (never the current track's art). */}
      <div className={cn('grid grid-cols-2 gap-[14px]', showHint ? 'mt-3' : 'mt-[18px]')}>
        <ArtistCard
          name={nameA}
          badge="A"
          image={imageA}
          accent={accentA}
          onClick={onGuessA}
          locked={selected !== null}
          flashColor={selected === 'a' ? flashColor : null}
        />
        <ArtistCard
          name={nameB}
          badge="B"
          image={imageB}
          accent={accentB}
          onClick={onGuessB}
          locked={selected !== null}
          flashColor={selected === 'b' ? flashColor : null}
        />
      </div>

      {/* Keyboard hint (desktop; harmless on touch). */}
      <div className="mt-[18px] flex flex-wrap items-center justify-center gap-[14px] font-mono text-[11px] tracking-[1px] text-muted-2">
        <span>
          <Kbd>A</Kbd> / <Kbd>B</Kbd> choisir
        </span>
        <span>
          <Kbd>espace</Kbd> lecture
        </span>
      </div>
    </div>
  )
}

/** Two-digit m:ss for the clip timecode. */
function fmtClip(s: number): string {
  const total = Math.max(0, Math.floor(s))
  const m = Math.floor(total / 60)
  const ss = total % 60
  return `${m}:${ss < 10 ? '0' : ''}${ss}`
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded-[5px] border border-border-2 bg-kbd-bg px-[7px] py-0.5 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  )
}

function ArtistCard({
  name,
  badge,
  image,
  accent,
  onClick,
  locked,
  flashColor,
}: {
  name: string
  /** Corner label ("A" / "B") echoing the keyboard shortcut. */
  badge: string
  image?: string
  accent: string
  onClick: () => void
  locked: boolean
  /** When set, this card is the picked choice and flashes its result color. */
  flashColor: string | null
}) {
  // During the suspense beat the picked card shows its result color; every card
  // is inert (no hover swap, no pointer) once a choice is locked in.
  //
  // DARK-PINNED: pin the dark palette (text/slot/ok/bad vars) locally so the
  // artwork card keeps its dark treatment — bright accents + white name over a
  // dark scrim — even in light mode. The dynamic border/glow (flash result) and
  // the pin vars stay inline; static geometry is classes. Do NOT flatten.
  const box: CSSProperties = {
    border: `2px solid ${flashColor ?? 'var(--border)'}`,
    boxShadow: flashColor
      ? `0 0 0 3px color-mix(in oklab, ${flashColor} 28%, transparent)`
      : 'none',
    '--text': '#f2f3f7',
    '--slot-a': 'oklch(0.7 0.19 268)',
    '--slot-a-bright': 'oklch(0.78 0.16 268)',
    '--slot-b': 'oklch(0.72 0.24 350)',
    '--slot-b-bright': 'oklch(0.8 0.2 350)',
    '--ok': 'oklch(0.74 0.17 152)',
    '--bad': 'oklch(0.66 0.22 25)',
  } as CSSProperties
  return (
    <button
      onClick={onClick}
      disabled={locked}
      aria-label={`C’est ${name}`}
      style={box}
      className={cn(
        'relative aspect-square overflow-hidden rounded-[18px] bg-[#0c0d11] p-0 text-left font-sans transition-[border-color,box-shadow,transform] duration-150',
        locked ? 'cursor-default' : 'cursor-pointer',
      )}
      onMouseEnter={(e) => {
        if (locked) return
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={(e) => {
        if (locked) return
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Candidate artist photo as background, with placeholder fallback. */}
      <Artwork
        src={image}
        name={name}
        color={accent}
        size={168}
        radius={0}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />

      {/* Dark scrim so the name stays readable over any photo. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,17,0)_42%,rgba(12,13,17,0.84)_100%)]"
      />

      {/* Filled A / B badge (slot color), echoing the keyboard shortcut. */}
      <span
        aria-hidden
        className="absolute top-3 left-3 rounded-lg px-[9px] py-[3px] font-mono text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
        style={{ background: accent }}
      >
        {badge}
      </span>

      {/* Artist name, bottom-left. */}
      <span className="absolute right-4 bottom-4 left-4 line-clamp-2 text-[clamp(18px,5vw,24px)] leading-[1.1] font-bold tracking-[-0.5px] text-[#f2f3f7] [overflow-wrap:anywhere] [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]">
        {name}
      </span>
    </button>
  )
}
