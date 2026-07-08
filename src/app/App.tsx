import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resetStats } from '@/lib/stats'
import { RulesSheet } from '@/components/ui/RulesSheet'
import { TopBar } from '@/components/ui/TopBar'
import { SettingsSheet, applyTheme, readTheme, type ThemeMode } from '@/features/settings'
import { AppRoutes } from './router'
import { GameProvider } from './provider'

/**
 * Outer chrome: dark radial background + a full-height responsive column. The
 * top bar (if any) pins at the top; the routed content grows to fill and centers
 * vertically in the remaining space, so short screens use the whole viewport
 * height (balanced whitespace) instead of hugging the top.
 */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(120%_90%_at_50%_-10%,var(--bg-glow)_0%,var(--bg)_60%)] text-text">
      <div className="mx-auto flex min-h-screen max-w-[940px] flex-col p-[clamp(20px,5vw,40px)]">
        {children}
      </div>
    </div>
  )
}

export function App() {
  const location = useLocation()
  const navigate = useNavigate()
  // The "Comment jouer" sheet is shared across routes (home + playing HUD), so
  // its open state lives here, above <Routes>.
  const [rulesOpen, setRulesOpen] = useState(false)
  const openRules = () => setRulesOpen(true)

  // Settings modal (shared like the rules sheet) + theme state. The initial
  // theme was already applied to <html> in main.tsx; we mirror it in state so
  // the segmented control reflects and drives it.
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openSettings = () => setSettingsOpen(true)
  const [theme, setThemeState] = useState<ThemeMode>(readTheme)
  const setTheme = (mode: ThemeMode) => {
    applyTheme(mode)
    setThemeState(mode)
  }

  // The persistent TopBar shows on every nav screen but is absent during
  // gameplay (`/jouer/...`), where the playing/reveal HUD owns navigation.
  const showTopBar = !location.pathname.startsWith('/jouer/')

  return (
    <GameProvider>
      <Shell>
        {showTopBar && (
          <TopBar
            onHome={() => navigate('/')}
            onOpenRules={openRules}
            onOpenSettings={openSettings}
          />
        )}
        {/* Content fills the height below the bar and centers vertically. */}
        <main className="flex min-h-0 flex-1 flex-col justify-center">
          <AppRoutes rulesOpen={rulesOpen} />
        </main>
      </Shell>
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onSetTheme={setTheme}
        onResetStats={() => {
          resetStats()
          setSettingsOpen(false)
        }}
      />
    </GameProvider>
  )
}
