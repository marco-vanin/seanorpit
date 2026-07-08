import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/utils/cn'
import type { ThemeMode } from '../theme-mode'

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
      className="fixed inset-0 z-[100] flex animate-[floatIn_0.2s_ease_both] items-center justify-center bg-[rgba(6,7,10,0.55)] p-5 backdrop-blur-lg"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] animate-[popIn_0.25s_ease_both] rounded-[22px] border border-border-2 bg-surface-2 px-6 py-[26px] shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="mb-[22px] flex items-center justify-between">
          <h2 className="m-0 text-[21px] font-bold tracking-[-0.5px]">Paramètres</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="h-[34px] w-[34px] cursor-pointer rounded-full border border-border-2 bg-transparent text-[15px] leading-none text-muted-2"
          >
            ✕
          </button>
        </div>

        {/* Thème */}
        <div className="mb-[18px]">
          <div className="mb-[10px] font-mono text-[11px] tracking-[2px] text-muted uppercase">
            Thème
          </div>
          <div className="flex gap-1.5 rounded-[12px] border border-border bg-kbd-bg p-1">
            <SegButton active={theme === 'dark'} onClick={() => onSetTheme('dark')}>
              🌙 Sombre
            </SegButton>
            <SegButton active={theme === 'light'} onClick={() => onSetTheme('light')}>
              ☀️ Clair
            </SegButton>
          </div>
        </div>

        <div className="my-[18px] h-px bg-hairline" />

        {/* Réinitialiser mes stats (danger) */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[15px] font-semibold">Statistiques</div>
            <div className="mt-0.5 text-[13px] text-muted">
              Efface tes stats et tous tes records
            </div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="shrink-0 cursor-pointer rounded-[10px] border border-bad bg-transparent px-4 py-[9px] font-sans text-[14px] font-semibold text-bad"
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

/** Segmented-control button; active reads as a raised tab. */
function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] px-3 py-[9px] font-sans text-[14px] font-semibold transition-[background,color] duration-150',
        active
          ? 'border border-border-3 bg-tab-active text-text'
          : 'border border-transparent bg-transparent text-muted',
      )}
    >
      {children}
    </button>
  )
}
