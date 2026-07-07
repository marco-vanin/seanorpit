import type { CSSProperties } from 'react'
import { Waveform } from '../Waveform'
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
  /** Slot A / B artist names + accent colors from the active matchup. */
  nameA: string
  nameB: string
  accentA: string
  accentB: string
  onToggle: () => void
  onGuessA: () => void
  onGuessB: () => void
  hasAudio: boolean
  loading: boolean
  blocked: boolean
  selected: Selection
  answerCorrect: boolean
  muted: boolean
  onToggleMute: () => void
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
  nameA,
  nameB,
  accentA,
  accentB,
  onToggle,
  onGuessA,
  onGuessB,
  hasAudio,
  loading,
  blocked,
  selected,
  answerCorrect,
  muted,
  onToggleMute,
}: PlayingScreenProps) {
  // Result color of the picked button during the suspense beat, mirroring the
  // reveal: green when correct, red-orange when wrong. Timeout → no flash.
  const flashColor = answerCorrect ? C.sean : C.pit
  const timePct = seconds ? Math.max(0, (timeLeft / seconds) * 100) : 100
  const timerColor = timeLeft <= Math.max(3, seconds * 0.25) ? C.pit : C.text

  let playHint: string
  if (!hasAudio) playHint = 'Extrait indisponible — fie-toi à ton instinct'
  else if (loading) playHint = 'Chargement de l’extrait…'
  else if (blocked) playHint = 'Touche ▶ pour lancer l’extrait'
  else if (!playing) playHint = 'En pause'
  else playHint = 'Lecture en cours — extrait 30 s'

  return (
    <div style={{ animation: 'floatIn .35s ease both' }}>
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
        <div
          style={{ fontSize: 13, letterSpacing: 2, color: C.muted2, textTransform: 'uppercase' }}
        >
          Titre <span style={{ color: C.text }}>{qNumber}</span>
          {endless ? '' : ` / ${total}`}
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
          background: `linear-gradient(180deg, ${C.surface2} 0%, #101219 100%)`,
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

        <div
          style={{
            fontFamily: C.monoFont,
            fontSize: 12,
            letterSpacing: 2,
            color: C.muted4,
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        >
          {playHint}
        </div>

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

      {/* Choices */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginTop: 22,
        }}
      >
        <ChoiceButton
          label={nameA}
          option="Option A"
          accent={accentA}
          hoverBg="#14181a"
          onClick={onGuessA}
          locked={selected !== null}
          flashColor={selected === 'a' ? flashColor : null}
        />
        <ChoiceButton
          label={nameB}
          option="Option B"
          accent={accentB}
          hoverBg="#191614"
          onClick={onGuessB}
          locked={selected !== null}
          flashColor={selected === 'b' ? flashColor : null}
        />
      </div>
    </div>
  )
}

function ChoiceButton({
  label,
  option,
  accent,
  hoverBg,
  onClick,
  locked,
  flashColor,
}: {
  label: string
  option: string
  accent: string
  hoverBg: string
  onClick: () => void
  locked: boolean
  /** When set, this button is the picked choice and flashes its result color. */
  flashColor: string | null
}) {
  // During the suspense beat the picked button shows its result color; every
  // button is inert (no hover swap, no pointer) once a choice is locked in.
  const flashBg = (color: string) => `color-mix(in oklab, ${color} 16%, ${C.surface})`
  const base: CSSProperties = {
    cursor: locked ? 'default' : 'pointer',
    fontFamily: C.sansFont,
    textAlign: 'left',
    background: flashColor ? flashBg(flashColor) : C.surface,
    border: `1.5px solid ${flashColor ?? C.border}`,
    borderRadius: 16,
    padding: '22px 24px',
    transition: 'border-color .15s, background .15s',
  }
  return (
    <button
      onClick={onClick}
      disabled={locked}
      style={base}
      onMouseEnter={(e) => {
        if (locked) return
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.background = hoverBg
      }}
      onMouseLeave={(e) => {
        if (locked) return
        e.currentTarget.style.borderColor = C.border
        e.currentTarget.style.background = C.surface
      }}
    >
      <div
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          letterSpacing: 2,
          color: accent,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {option}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: C.text }}>{label}</div>
    </button>
  )
}
