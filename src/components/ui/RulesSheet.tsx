import { useEffect } from 'react'
import { slotColor } from '@/utils/colors'

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
    { accent: 'var(--gold)', text: 'Enchaîne les bonnes réponses pour faire grimper ta série' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comment jouer"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex animate-[floatIn_0.2s_ease_both] items-end justify-center bg-[rgba(6,7,10,0.72)] p-[clamp(0px,3vw,24px)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] animate-[floatIn_0.28s_ease_both] rounded-t-[clamp(16px,5vw,22px)] rounded-b-[clamp(0px,3vw,22px)] border border-border bg-gradient-to-b from-surface-2 to-surface-3 px-6 pt-[26px] pb-[30px]"
      >
        <div className="mb-[22px] flex items-center justify-between">
          <h2 className="m-0 text-[clamp(22px,6vw,26px)] font-bold tracking-[-0.5px]">
            Comment jouer
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-[18px] leading-none text-text"
          >
            ✕
          </button>
        </div>

        <ol className="m-0 grid list-none gap-[14px] p-0">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-[14px] rounded-[14px] border border-border bg-surface px-[18px] py-4"
            >
              <span
                aria-hidden
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full font-mono text-[14px] font-semibold"
                style={{
                  color: step.accent,
                  background: `color-mix(in oklab, ${step.accent} 16%, var(--surface))`,
                  border: `1px solid ${step.accent}`,
                }}
              >
                {i + 1}
              </span>
              <span className="text-[clamp(15px,4vw,16px)] leading-[1.4]">{step.text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 mb-3 font-mono text-[11px] tracking-[2px] text-muted-2 uppercase">
          Les modes
        </div>
        <div className="mb-[22px] grid gap-2.5">
          <ModeRow icon="🎧" name="Classique" desc="10 titres · 30 s chacun" />
          <ModeRow icon="💀" name="Mort subite" desc="une erreur et c’est terminé" />
        </div>

        <div className="mb-[22px] flex flex-wrap items-center justify-center gap-[14px] font-mono text-[11px] tracking-[1px] text-muted-2">
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
          className="w-full cursor-pointer rounded-[12px] border-none bg-text p-[14px] font-sans text-[16px] font-semibold text-bg"
        >
          C’est parti !
        </button>
      </div>
    </div>
  )
}

function ModeRow({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-[14px] py-3">
      <span aria-hidden className="text-[20px]">
        {icon}
      </span>
      <div className="text-[14px]">
        <span className="font-semibold">{name}</span> <span className="text-muted-2">— {desc}</span>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded-[5px] border border-border-2 bg-kbd-bg px-[7px] py-0.5 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  )
}
