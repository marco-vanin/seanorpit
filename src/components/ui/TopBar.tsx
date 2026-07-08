/**
 * Persistent navigation bar shown on the nav screens (home, custom builder,
 * mode-select, results, shared-duel) — never on gameplay (`/jouer/...`). Left:
 * the brand (overlapping-circles logo + "Blind Duel") as a home button. Right:
 * the "? Comment jouer" pill + the ⚙ settings button.
 */
export function TopBar({
  onHome,
  onOpenRules,
  onOpenSettings,
}: {
  onHome: () => void
  onOpenRules: () => void
  onOpenSettings: () => void
}) {
  return (
    <div className="mb-[clamp(28px,6vw,48px)] flex items-center justify-between">
      <button
        onClick={onHome}
        aria-label="Accueil"
        className="inline-flex cursor-pointer items-center gap-[9px] border-none bg-transparent p-0"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          aria-hidden="true"
          className="block shrink-0"
        >
          <circle cx="12" cy="16" r="10" fill="var(--slot-a)" />
          <circle cx="21.5" cy="16" r="11.5" fill="var(--bg)" />
          <circle cx="21.5" cy="16" r="10" fill="var(--slot-b)" />
        </svg>
        <span className="text-[17px] font-bold tracking-[-0.4px] text-text">Blind Duel</span>
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenRules}
          aria-label="Comment jouer"
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border-2 bg-surface px-4 py-2 font-mono text-[13px] tracking-[1px] text-text"
        >
          <span
            aria-hidden
            className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gold text-[12px] font-bold text-bg"
          >
            ?
          </span>
          Comment jouer
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="Paramètres"
          className="inline-flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-2 bg-surface text-[16px] leading-none text-text"
        >
          ⚙
        </button>
      </div>
    </div>
  )
}
