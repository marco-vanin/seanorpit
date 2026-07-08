import { useEffect } from 'react'
import { C } from '../../theme'

/**
 * Shared themed confirm dialog, reusing the RulesSheet/SettingsSheet modal
 * chrome (centered card, blurred backdrop, floatIn/popIn). Renders nothing when
 * closed. Dismissed (cancel) by the backdrop, the Annuler button, or Escape.
 * The primary confirm reads danger (`C.pit`) when `danger`, else the filled
 * white button. Used for "Abandonner la partie ?" and "Réinitialiser mes stats ?".
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean
  title: string
  body?: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  // Escape cancels while the dialog is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(6, 7, 10, 0.6)',
        backdropFilter: 'blur(8px)',
        padding: 20,
        animation: 'floatIn .2s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          background: C.surface2,
          border: `1px solid ${C.border2}`,
          borderRadius: 22,
          padding: '26px 24px 22px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          animation: 'popIn .25s ease both',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>{title}</h2>
        {body && (
          <p style={{ margin: '10px 0 0', color: C.muted, fontSize: 14, lineHeight: 1.5 }}>
            {body}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={onCancel}
            style={{
              cursor: 'pointer',
              flex: 1,
              fontFamily: C.sansFont,
              fontSize: 15,
              fontWeight: 600,
              padding: '13px 16px',
              borderRadius: 12,
              background: 'transparent',
              color: C.text,
              border: `1px solid ${C.border2}`,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              cursor: 'pointer',
              flex: 1,
              fontFamily: C.sansFont,
              fontSize: 15,
              fontWeight: 600,
              padding: '13px 16px',
              borderRadius: 12,
              border: 'none',
              background: danger ? C.pit : C.text,
              color: danger ? '#0c0d11' : C.bg,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
