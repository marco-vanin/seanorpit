import { useEffect } from 'react'
import { C, slotColor } from '../../theme'

/**
 * Dismissible "Comment jouer" sheet shared by the home screen and the playing
 * HUD. Renders nothing when closed. Dismissed by the backdrop, the close button,
 * or Escape. Mobile-first bottom-sheet that centers as a card on wider screens.
 */
export function RulesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Escape closes the sheet while it is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const steps: { accent: string; text: string }[] = [
    { accent: slotColor('a'), text: 'Écoute l’extrait audio' },
    { accent: slotColor('b'), text: 'Devine lequel des deux artistes chante' },
    { accent: C.gold, text: 'Enchaîne les bonnes réponses pour faire grimper ta série' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comment jouer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(6, 7, 10, 0.72)',
        padding: 'clamp(0px, 3vw, 24px)',
        animation: 'floatIn .2s ease both',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: `linear-gradient(180deg, ${C.surface2} 0%, var(--surface-3) 100%)`,
          border: `1px solid ${C.border}`,
          borderRadius:
            'clamp(16px, 5vw, 22px) clamp(16px, 5vw, 22px) clamp(0px, 3vw, 22px) clamp(0px, 3vw, 22px)',
          padding: '26px 24px 30px',
          animation: 'floatIn .28s ease both',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(22px, 6vw, 26px)',
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            Comment jouer
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              cursor: 'pointer',
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 18,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
          {steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '16px 18px',
              }}
            >
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: C.monoFont,
                  fontWeight: 600,
                  fontSize: 14,
                  color: step.accent,
                  background: `color-mix(in oklab, ${step.accent} 16%, ${C.surface})`,
                  border: `1px solid ${step.accent}`,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 'clamp(15px, 4vw, 16px)', lineHeight: 1.4 }}>
                {step.text}
              </span>
            </li>
          ))}
        </ol>

        <div
          style={{
            fontFamily: C.monoFont,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted2,
            margin: '24px 0 12px',
          }}
        >
          Les modes
        </div>
        <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
          <ModeRow icon="🎧" name="Classique" desc="10 titres · 30 s chacun" />
          <ModeRow icon="💀" name="Mort subite" desc="une erreur et c’est terminé" />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 22,
            fontFamily: C.monoFont,
            fontSize: 11,
            letterSpacing: 1,
            color: C.muted2,
            flexWrap: 'wrap',
          }}
        >
          <span>Raccourcis :</span>
          <span>
            <Kbd>A</Kbd> / <Kbd>B</Kbd> choisir
          </span>
          <span>
            <Kbd>espace</Kbd> lecture
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            cursor: 'pointer',
            width: '100%',
            border: 'none',
            background: C.text,
            color: C.bg,
            fontFamily: C.sansFont,
            fontSize: 16,
            fontWeight: 600,
            padding: 14,
            borderRadius: 12,
          }}
        >
          C’est parti !
        </button>
      </div>
    </div>
  )
}

function ModeRow({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '12px 14px',
      }}
    >
      <span aria-hidden style={{ fontSize: 20 }}>
        {icon}
      </span>
      <div style={{ fontSize: 14 }}>
        <span style={{ fontWeight: 600 }}>{name}</span>{' '}
        <span style={{ color: C.muted2 }}>— {desc}</span>
      </div>
    </div>
  )
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
