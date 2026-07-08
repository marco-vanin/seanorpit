import { C } from '../../theme'

/**
 * Persistent navigation bar shown on the nav screens (home, custom builder,
 * mode-select, results, shared-duel) — never on gameplay (`/jouer/...`). Left:
 * the brand (overlapping-circles logo + "Blind Duel") as a home button. Right:
 * the "? Comment jouer" pill + the ⚙ settings button. Extracted verbatim from
 * HomeScreen's former inline top bar, with the brand made tappable → Accueil.
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'clamp(28px, 6vw, 48px)',
      }}
    >
      <button
        onClick={onHome}
        aria-label="Accueil"
        style={{
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          aria-hidden="true"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <circle cx="12" cy="16" r="10" fill="var(--slot-a)" />
          <circle cx="21.5" cy="16" r="11.5" fill="var(--bg)" />
          <circle cx="21.5" cy="16" r="10" fill="var(--slot-b)" />
        </svg>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.4, color: C.text }}>
          Blind Duel
        </span>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onOpenRules}
          aria-label="Comment jouer"
          style={{
            cursor: 'pointer',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: C.monoFont,
            fontSize: 13,
            letterSpacing: 1,
            color: C.text,
            background: C.surface,
            border: `1px solid ${C.border2}`,
            borderRadius: 999,
            padding: '8px 16px',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: C.gold,
              color: C.bg,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ?
          </span>
          Comment jouer
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="Paramètres"
          style={{
            cursor: 'pointer',
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.text,
            background: C.surface,
            border: `1px solid ${C.border2}`,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>
    </div>
  )
}
