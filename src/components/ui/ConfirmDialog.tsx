import { useEffect } from 'react'
import { cn } from '@/utils/cn'

/**
 * Shared themed confirm dialog, reusing the RulesSheet/SettingsSheet modal
 * chrome (centered card, blurred backdrop, floatIn/popIn). Renders nothing when
 * closed. Dismissed (cancel) by the backdrop, the Annuler button, or Escape.
 * The primary confirm reads danger (`--bad`, red) when `danger`, else the filled
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
      className="fixed inset-0 z-[120] flex animate-[floatIn_0.2s_ease_both] items-center justify-center bg-[rgba(6,7,10,0.6)] p-5 backdrop-blur-lg"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] animate-[popIn_0.25s_ease_both] rounded-[22px] border border-border-2 bg-surface-2 px-6 pt-[26px] pb-[22px] shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.4px]">{title}</h2>
        {body && <p className="mt-[10px] mb-0 text-[14px] leading-[1.5] text-muted">{body}</p>}

        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-[12px] border border-border-2 bg-transparent px-4 py-[13px] font-sans text-[15px] font-semibold text-text"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 cursor-pointer rounded-[12px] border-none px-4 py-[13px] font-sans text-[15px] font-semibold',
              danger ? 'bg-bad text-[#0c0d11]' : 'bg-text text-bg',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
