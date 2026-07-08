import { useEffect, useState, type CSSProperties } from 'react'
import { C } from '../../theme'
import type { ThemeMode } from '../../game/theme-mode'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * Dismissible "Paramètres" modal, shared across routes like RulesSheet. Holds a
 * Thème segmented control (Sombre / Clair) and a danger "Réinitialiser mes
 * stats" action behind a themed confirm. Sound is controlled by the HUD 🔊/🔇,
 * not here. Renders nothing when closed; dismissed by the backdrop, the close
 * button, or Escape.
 */
export function SettingsSheet({
  open,
  onClose,
  theme,
  onSetTheme,
  onResetStats,
}: {
  open: boolean
  onClose: () => void
  theme: ThemeMode
  onSetTheme: (mode: ThemeMode) => void
  onResetStats: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Escape closes the modal while it is open (the reset confirm handles its own).
  useEffect(() => {
    if (!open || confirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, confirmOpen, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paramètres"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(6, 7, 10, 0.55)',
        backdropFilter: 'blur(8px)',
        padding: 20,
        animation: 'floatIn .2s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: C.surface2,
          border: `1px solid ${C.border2}`,
          borderRadius: 22,
          padding: '26px 24px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          animation: 'popIn .25s ease both',
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
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: -0.5 }}>
            Paramètres
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              cursor: 'pointer',
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: `1px solid ${C.border2}`,
              background: 'transparent',
              color: C.muted2,
              fontSize: 15,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Thème */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: C.monoFont,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: C.muted,
              marginBottom: 10,
            }}
          >
            Thème
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: 'var(--kbd-bg)',
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 4,
            }}
          >
            <button onClick={() => onSetTheme('dark')} style={segStyle(theme === 'dark')}>
              🌙 Sombre
            </button>
            <button onClick={() => onSetTheme('light')} style={segStyle(theme === 'light')}>
              ☀️ Clair
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--hairline)', margin: '18px 0' }} />

        {/* Réinitialiser mes stats (danger) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Statistiques</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
              Efface tes stats et tous tes records
            </div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            style={{
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: C.sansFont,
              fontSize: 14,
              fontWeight: 600,
              padding: '9px 16px',
              borderRadius: 10,
              background: 'transparent',
              color: C.bad,
              border: `1px solid ${C.bad}`,
            }}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Réinitialiser mes stats ?"
        body="Cette action est irréversible."
        confirmLabel="Réinitialiser"
        danger
        onConfirm={() => {
          setConfirmOpen(false)
          onResetStats()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

/** Segmented-control button style; active reads as a raised tab. */
function segStyle(active: boolean): CSSProperties {
  return {
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 12px',
    borderRadius: 9,
    fontFamily: C.sansFont,
    fontSize: 14,
    fontWeight: 600,
    transition: 'background .15s, color .15s',
    ...(active
      ? { background: 'var(--tab-active)', color: C.text, border: `1px solid var(--border-3)` }
      : { background: 'transparent', color: C.muted, border: '1px solid transparent' }),
  }
}
