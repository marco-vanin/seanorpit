import type { CSSProperties } from 'react'
import { Waveform } from '../Waveform'
import { C } from '../../theme'

interface PlayingScreenProps {
  qNumber: number
  total: number
  score: number
  streak: number
  playing: boolean
  timerEnabled: boolean
  timeLeft: number
  seconds: number
  onToggle: () => void
  onGuessSean: () => void
  onGuessPit: () => void
  hasAudio: boolean
  loading: boolean
  blocked: boolean
}

export function PlayingScreen({
  qNumber,
  total,
  score,
  streak,
  playing,
  timerEnabled,
  timeLeft,
  seconds,
  onToggle,
  onGuessSean,
  onGuessPit,
  hasAudio,
  loading,
  blocked,
}: PlayingScreenProps) {
  const timePct = seconds ? Math.max(0, (timeLeft / seconds) * 100) : 100
  const timerColor = timeLeft <= Math.max(3, seconds * 0.25) ? C.pit : C.text

  let playHint: string
  if (!hasAudio) playHint = 'Extrait indisponible — fie-toi à ton instinct'
  else if (loading) playHint = 'Chargement de l’extrait…'
  else if (blocked) playHint = 'Touche ▶ pour lancer l’extrait'
  else playHint = playing ? 'Lecture en cours — extrait 30 s' : 'En pause'

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
          Titre <span style={{ color: C.text }}>{qNumber}</span> / {total}
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          <div style={{ color: C.muted2 }}>
            Score <span style={{ color: C.text, fontWeight: 600 }}>{score}</span>
          </div>
          <div style={{ color: C.muted2 }}>
            Série <span style={{ color: C.gold, fontWeight: 600 }}>{streak}</span>
          </div>
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
          label="Sean Paul"
          option="Option A"
          accent={C.sean}
          hoverBg="#14181a"
          onClick={onGuessSean}
        />
        <ChoiceButton
          label="Pitbull"
          option="Option B"
          accent={C.pit}
          hoverBg="#191614"
          onClick={onGuessPit}
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
}: {
  label: string
  option: string
  accent: string
  hoverBg: string
  onClick: () => void
}) {
  const base: CSSProperties = {
    cursor: 'pointer',
    fontFamily: C.sansFont,
    textAlign: 'left',
    background: C.surface,
    border: `1.5px solid ${C.border}`,
    borderRadius: 16,
    padding: '22px 24px',
    transition: 'border-color .15s, background .15s',
  }
  return (
    <button
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.background = hoverBg
      }}
      onMouseLeave={(e) => {
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
