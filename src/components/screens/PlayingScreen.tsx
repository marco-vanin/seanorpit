import type { CSSProperties } from 'react'
import { Waveform } from '../Waveform'
import { Artwork } from '../ui/Artwork'
import { C } from '../../theme'
import type { Selection } from '../../game/useGame'

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
  const flashColor = answerCorrect ? C.ok : C.bad
  const timePct = seconds ? Math.max(0, (timeLeft / seconds) * 100) : 100
  const timerColor = timeLeft <= Math.max(3, seconds * 0.25) ? C.bad : C.text

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
    <div style={{ animation: 'floatIn .35s ease both', maxWidth: 580, margin: '0 auto' }}>
      {/* HUD */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 26,
          fontFamily: C.monoFont,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            onClick={onQuit}
            aria-label="Quitter la partie"
            style={{
              cursor: 'pointer',
              flexShrink: 0,
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
          <div
            style={{ fontSize: 13, letterSpacing: 2, color: C.muted2, textTransform: 'uppercase' }}
          >
            Titre <span style={{ color: C.text }}>{qNumber}</span>
            {endless ? '' : ` / ${total}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <div style={{ color: C.muted2 }}>
            Score <span style={{ color: C.text, fontWeight: 600 }}>{score}</span>
          </div>
          <div style={{ color: C.muted2 }}>
            Série <span style={{ color: C.gold, fontWeight: 600 }}>{streak}</span>
          </div>
          <button
            onClick={onToggleMute}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            aria-pressed={muted}
            style={{
              cursor: 'pointer',
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              padding: 4,
              lineHeight: 1,
              fontSize: 18,
              color: C.text,
              opacity: muted ? 0.55 : 1,
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Player card */}
      <div
        style={{
          background: `linear-gradient(180deg, ${C.surface2} 0%, var(--surface-3) 100%)`,
          border: `1px solid ${C.border}`,
          borderRadius: 22,
          padding: '44px 40px 40px',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', width: 132, height: 132, margin: '0 auto 30px' }}>
          {playing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: C.text,
                opacity: 0.12,
                animation: 'pulseRing 1.8s ease-out infinite',
              }}
            />
          )}
          <button
            onClick={onToggle}
            aria-label={playing ? 'Mettre en pause' : 'Lire'}
            style={{
              position: 'relative',
              cursor: 'pointer',
              width: 132,
              height: 132,
              borderRadius: '50%',
              border: 'none',
              background: C.text,
              color: C.bg,
              fontSize: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {playing ? '❚❚' : '▶'}
          </button>
        </div>

        <Waveform playing={playing} />

        {clipLive ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 14,
              fontFamily: C.monoFont,
              fontSize: 12,
              letterSpacing: 1,
              color: C.muted2,
            }}
          >
            <span style={{ color: C.text }}>{fmtClip(elapsed)}</span>
            <span>/ {fmtClip(clipTotal)}</span>
            <span
              aria-hidden
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: playing ? C.slotA : C.muted2,
              }}
            />
            <span style={{ textTransform: 'uppercase', letterSpacing: 2 }}>
              {playing ? 'lecture' : 'en pause'}
            </span>
          </div>
        ) : (
          <div
            style={{
              fontFamily: C.monoFont,
              fontSize: 12,
              letterSpacing: 2,
              color: C.muted4,
              textTransform: 'uppercase',
              marginTop: 14,
            }}
          >
            {playHint}
          </div>
        )}

        {timerEnabled && (
          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: C.border,
              marginTop: 28,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 999,
                background: timerColor,
                width: `${timePct}%`,
                transition: 'width .95s linear',
              }}
            />
          </div>
        )}
      </div>

      {/* First-play hint — shown once, until the first explicit guess. */}
      {showHint && (
        <div
          style={{
            fontFamily: C.monoFont,
            fontSize: 12,
            letterSpacing: 1,
            color: C.muted,
            textAlign: 'center',
            marginTop: 22,
          }}
        >
          👆 Touche l’artiste que tu penses entendre
        </div>
      )}

      {/* Choices — the two candidate artists (never the current track's art). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginTop: showHint ? 12 : 18,
        }}
      >
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          marginTop: 18,
          fontFamily: C.monoFont,
          fontSize: 11,
          letterSpacing: 1,
          color: C.muted2,
          flexWrap: 'wrap',
        }}
      >
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
    <kbd
      style={{
        background: 'var(--kbd-bg)',
        border: `1px solid ${C.border2}`,
        borderRadius: 5,
        padding: '2px 7px',
        color: C.muted,
        fontFamily: C.monoFont,
        fontSize: 11,
      }}
    >
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
  // Pin the dark palette locally so the artwork card keeps its dark treatment
  // (bright accents + white name over a dark scrim) even in light mode.
  const base = {
    position: 'relative',
    cursor: locked ? 'default' : 'pointer',
    fontFamily: C.sansFont,
    textAlign: 'left',
    background: '#0c0d11',
    border: `2px solid ${flashColor ?? C.border}`,
    borderRadius: 18,
    padding: 0,
    overflow: 'hidden',
    aspectRatio: '1',
    boxShadow: flashColor
      ? `0 0 0 3px color-mix(in oklab, ${flashColor} 28%, transparent)`
      : 'none',
    transition: 'border-color .15s, box-shadow .15s, transform .15s',
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
      style={base}
      onMouseEnter={(e) => {
        if (locked) return
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={(e) => {
        if (locked) return
        e.currentTarget.style.borderColor = C.border
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
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(12,13,17,0) 42%, rgba(12,13,17,0.84) 100%)',
        }}
      />

      {/* Filled A / B badge (slot color), echoing the keyboard shortcut. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          fontFamily: C.monoFont,
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          background: accent,
          borderRadius: 8,
          padding: '3px 9px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
        }}
      >
        {badge}
      </span>

      {/* Artist name, bottom-left. */}
      <span
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          right: 16,
          fontSize: 'clamp(18px, 5vw, 24px)',
          fontWeight: 700,
          letterSpacing: -0.5,
          lineHeight: 1.1,
          color: '#f2f3f7',
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
    </button>
  )
}
