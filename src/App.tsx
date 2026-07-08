import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useGame, resetStats, type Game, type Selection } from './game/useGame'
import { useAudioPlayer } from './game/useAudioPlayer'
import { unlockAudio, playSting } from './game/stings'
import { modeBySlug, type Mode } from './game/modes'
import { matchupById, type Matchup, type Side } from './game/matchups'
import { buildCustomMatchupByIds } from './game/itunes'
import { HomeScreen } from './components/screens/HomeScreen'
import { ModeSelectScreen } from './components/screens/ModeSelectScreen'
import { CustomDuelScreen, DuelReady } from './components/screens/CustomDuelScreen'
import { PlayingScreen } from './components/screens/PlayingScreen'
import { RevealScreen } from './components/screens/RevealScreen'
import { ResultsScreen } from './components/screens/ResultsScreen'
import { Button } from './components/ui/Button'
import { RulesSheet } from './components/ui/RulesSheet'
import { SettingsSheet } from './components/ui/SettingsSheet'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { TopBar } from './components/ui/TopBar'
import { applyTheme, readTheme, type ThemeMode } from './game/theme-mode'
import { C, slotColor } from './theme'

/**
 * The single shared game instance lives here, above <Routes>, so navigating
 * /jouer/:matchup/:mode → /resultats keeps the same state — and the in-memory
 * custom matchup survives across the builder → play → results flow. Routes read
 * it from context, never call useGame() themselves.
 */
const GameContext = createContext<Game | null>(null)

function useGameContext(): Game {
  const game = useContext(GameContext)
  if (!game) throw new Error('useGameContext must be used within <GameContext.Provider>')
  return game
}

/**
 * Outer chrome: dark radial background + a full-height responsive column. The
 * top bar (if any) pins at the top; the routed content grows to fill and centers
 * vertically in the remaining space, so short screens use the whole viewport
 * height (balanced whitespace) instead of hugging the top.
 */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(120% 90% at 50% -10%, var(--bg-glow) 0%, var(--bg) 60%)',
        color: C.text,
      }}
    >
      <div
        style={{
          maxWidth: 940,
          minHeight: '100vh',
          margin: '0 auto',
          padding: 'clamp(20px, 5vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function App() {
  const game = useGame()
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
    <GameContext.Provider value={game}>
      <Shell>
        {showTopBar && (
          <TopBar
            onHome={() => navigate('/')}
            onOpenRules={openRules}
            onOpenSettings={openSettings}
          />
        )}
        {/* Content fills the height below the bar and centers vertically. */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/duel/custom" element={<CustomDuelRoute />} />
            {/* Two segments — distinct from the one-segment /duel/custom and
                /duel/:matchupId, so it never shadows them. */}
            <Route path="/duel/:idA/:idB" element={<SharedDuelRoute />} />
            <Route path="/duel/:matchupId" element={<CuratedDuelRoute />} />
            <Route path="/jouer/:matchup/:mode" element={<PlayRoute rulesOpen={rulesOpen} />} />
            <Route path="/resultats" element={<ResultsRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
    </GameContext.Provider>
  )
}

function HomeRoute() {
  const navigate = useNavigate()
  return (
    <HomeScreen
      onSelectMatchup={(matchup) => navigate(`/duel/${matchup.id}`)}
      onCustom={() => navigate('/duel/custom')}
    />
  )
}

function CuratedDuelRoute() {
  const game = useGameContext()
  const navigate = useNavigate()
  const { matchupId } = useParams()
  const matchup = matchupId ? matchupById(matchupId) : undefined

  if (!matchup) return <Navigate to="/" replace />

  const handleSelect = (mode: Mode) => {
    unlockAudio()
    game.start(matchup, mode)
    navigate(`/jouer/${matchup.id}/${mode.slug}`)
  }

  return <ModeSelectScreen matchup={matchup} onSelect={handleSelect} />
}

function CustomDuelRoute() {
  const game = useGameContext()
  const navigate = useNavigate()

  const handlePlay = (matchup: Matchup, mode: Mode) => {
    unlockAudio()
    game.start(matchup, mode)
    navigate(`/jouer/custom/${mode.slug}`)
  }

  return <CustomDuelScreen onPlay={handlePlay} />
}

/** True only for a bare positive integer (no signs, decimals, or leading text). */
function isPositiveIntId(v: string | undefined): v is string {
  return v !== undefined && /^\d+$/.test(v) && Number(v) > 0
}

/**
 * Recipient of a shared custom duel at `/duel/:idA/:idB`. Guards the two ids to
 * positive integers (else → home), then hands off to the keyed loader so a
 * different id pair remounts and refetches cleanly.
 */
function SharedDuelRoute() {
  const { idA, idB } = useParams()
  if (!isPositiveIntId(idA) || !isPositiveIntId(idB)) return <Navigate to="/" replace />
  return <SharedDuelLoader key={`${idA}/${idB}`} idA={Number(idA)} idB={Number(idB)} />
}

type SharedPhase =
  { kind: 'loading' } | { kind: 'ready'; matchup: Matchup } | { kind: 'error'; message: string }

/**
 * Re-resolves both artist ids and rebuilds the matchup (reusing the exact
 * `buildCustomMatchup` filter + ≥ 8 fairness via `buildCustomMatchupByIds`).
 * Loading / preview / error are all first-class — never a blank screen. Picking
 * a mode starts the shared game instance and navigates into play, exactly like
 * the builder's ready state.
 */
function SharedDuelLoader({ idA, idB }: { idA: number; idB: number }) {
  const game = useGameContext()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<SharedPhase>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setPhase({ kind: 'loading' })
    buildCustomMatchupByIds(idA, idB)
      .then((res) => {
        if (cancelled) return
        if (res.ok) setPhase({ kind: 'ready', matchup: res.matchup })
        else setPhase({ kind: 'error', message: res.message })
      })
      .catch(() => {
        if (!cancelled) setPhase({ kind: 'error', message: 'Problème de réseau — réessaie.' })
      })
    return () => {
      cancelled = true
    }
  }, [idA, idB, attempt])

  if (phase.kind === 'loading') {
    return (
      <div style={{ textAlign: 'center', animation: 'floatIn .45s ease both', padding: '60px 0' }}>
        <div
          style={{
            fontFamily: C.monoFont,
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted2,
          }}
        >
          Chargement du duel…
        </div>
      </div>
    )
  }

  if (phase.kind === 'error') {
    return (
      <div style={{ textAlign: 'center', animation: 'floatIn .45s ease both', padding: '40px 0' }}>
        <div
          style={{
            maxWidth: 420,
            margin: '0 auto 24px',
            background: 'color-mix(in oklab, var(--bad) 12%, transparent)',
            border: `1px solid ${C.bad}`,
            borderRadius: 14,
            padding: '16px 18px',
            color: C.text,
            fontSize: 15,
            lineHeight: 1.45,
          }}
          role="alert"
        >
          {phase.message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={() => setAttempt((n) => n + 1)}>Réessayer</Button>
        </div>
      </div>
    )
  }

  const matchup = phase.matchup
  const handleSelect = (mode: Mode) => {
    unlockAudio()
    game.start(matchup, mode)
    navigate(`/jouer/custom/${mode.slug}`)
  }

  return <DuelReady matchup={matchup} onSelect={handleSelect} />
}

function PlayRoute({ rulesOpen }: { rulesOpen: boolean }) {
  const game = useGameContext()
  const { state } = game
  const params = useParams()
  const navigate = useNavigate()

  // Abandon confirm lives here (route-owned): the HUD "Quitter" opens it; on
  // confirm we reset the run (quit → null matchup stops the clip) and go home.
  const [quitOpen, setQuitOpen] = useState(false)

  // Keyboard controls: A/B (or ←/→) guess, space play/pause, Enter → next on
  // reveal. Subscribed once; a ref carries the latest handler so it always sees
  // current state without re-subscribing. Inert while the rules sheet is open.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const mode = params.mode ? modeBySlug(params.mode) : undefined
  const isCustom = params.matchup === 'custom'
  const curated = !isCustom && params.matchup ? matchupById(params.matchup) : undefined
  // The custom matchup only exists in memory once built via the builder.
  const activeCustom = game.matchup?.id === 'custom' ? game.matchup : undefined
  const matchup = isCustom ? activeCustom : curated

  const { start } = game
  const activeMatchupId = game.matchup?.id
  const activeModeKey = game.mode?.key

  // Auto-start curated deep-links (/jouer/:id/:mode). Custom is never auto-started
  // — a cold custom URL has no in-memory matchup and redirects home below.
  useEffect(() => {
    if (!mode || !curated) return
    if (activeMatchupId !== curated.id || activeModeKey !== mode.key) {
      unlockAudio()
      start(curated, mode)
    }
  }, [mode, curated, activeMatchupId, activeModeKey, start])

  // Leave the play route once the run ends (reveal → results is route-owned).
  useEffect(() => {
    if (state.screen === 'results') navigate('/resultats', { replace: true })
  }, [state.screen, navigate])

  // Drive the current track's clip while the question is live (never on
  // reveal/results).
  const clipUrl = state.screen === 'playing' && game.song ? game.song.previewUrl : undefined
  const audio = useAudioPlayer(clipUrl, state.screen === 'playing' && state.playing, state.muted)

  // Fire the timeout sting once when `selected` transitions null → 'timeout'.
  const prevSelected = useRef<Selection>(null)
  useEffect(() => {
    const prev = prevSelected.current
    prevSelected.current = state.selected
    if (prev === null && state.selected === 'timeout') {
      playSting('timeout', state.muted)
    }
  }, [state.selected, state.muted])

  if (!mode) return <Navigate to="/" replace />
  // Invalid curated id, or a cold/reloaded custom URL with no in-memory matchup.
  if (!matchup) return <Navigate to="/" replace />

  const handleGuess = (side: Side) => {
    unlockAudio()
    if (state.selected === null) {
      playSting(game.song?.side === side ? 'correct' : 'wrong', state.muted)
    }
    game.guess(side)
  }

  const handleToggle = () => {
    unlockAudio()
    game.togglePlay()
  }

  const handleToggleMute = () => {
    unlockAudio()
    game.toggleMute()
  }

  // Refreshed every render so the window listener always sees current state.
  keyHandlerRef.current = (e: KeyboardEvent) => {
    if (rulesOpen || quitOpen) return
    if (state.screen === 'playing' && state.selected === null) {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') handleGuess('a')
      else if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowRight') handleGuess('b')
      else if (e.key === ' ') {
        e.preventDefault()
        handleToggle()
      }
    } else if (state.screen === 'reveal' && e.key === 'Enter') {
      game.next()
    }
  }

  // The abandon confirm is shared by both the playing HUD and the reveal screen,
  // so render it alongside whichever screen is active.
  const content =
    state.screen === 'reveal' ? (
      <RevealScreen
        correct={game.correct}
        selected={state.selected}
        matchup={matchup}
        song={game.song}
        isLast={game.isLast}
        streakTier={game.streakTier}
        streak={state.streak}
        onNext={game.next}
        onQuit={() => setQuitOpen(true)}
      />
    ) : (
      <PlayingScreen
        qNumber={game.qNumber}
        total={game.total}
        score={state.score}
        streak={state.streak}
        endless={game.mode?.questions === 'endless'}
        playing={state.playing}
        timerEnabled={game.timerEnabled}
        timeLeft={state.timeLeft}
        seconds={game.seconds}
        elapsed={audio.elapsed}
        duration={audio.duration}
        nameA={matchup.a.name}
        nameB={matchup.b.name}
        accentA={slotColor('a')}
        accentB={slotColor('b')}
        imageA={matchup.a.image}
        imageB={matchup.b.image}
        onToggle={handleToggle}
        onGuessA={() => handleGuess('a')}
        onGuessB={() => handleGuess('b')}
        hasAudio={audio.hasAudio && !audio.error}
        loading={audio.hasAudio && !audio.ready && !audio.error}
        blocked={audio.blocked}
        selected={game.selected}
        answerCorrect={game.answerCorrect}
        showHint={game.showHint}
        muted={state.muted}
        onToggleMute={handleToggleMute}
        onQuit={() => setQuitOpen(true)}
      />
    )

  return (
    <>
      {content}
      <ConfirmDialog
        open={quitOpen}
        title="Abandonner la partie ?"
        body="Ta progression sera perdue."
        confirmLabel="Abandonner"
        cancelLabel="Continuer"
        danger
        onConfirm={() => {
          setQuitOpen(false)
          game.quit()
          navigate('/')
        }}
        onCancel={() => setQuitOpen(false)}
      />
    </>
  )
}

function ResultsRoute() {
  const game = useGameContext()
  const { state } = game
  const navigate = useNavigate()

  // Guard: cold hit / refresh with no finished run → home. A reloaded custom run
  // also lands here (in-memory matchup gone) and correctly redirects.
  if (game.matchup == null || game.mode == null || state.screen !== 'results') {
    return <Navigate to="/" replace />
  }

  const matchup = game.matchup
  const mode = game.mode

  const handlePlayAgain = () => {
    unlockAudio()
    game.playAgain()
    navigate(`/jouer/${matchup.id}/${mode.slug}`)
  }

  return (
    <ResultsScreen
      matchup={matchup}
      mode={mode}
      score={state.score}
      total={game.total}
      bestStreak={state.bestStreak}
      best={state.best}
      onPlayAgain={handlePlayAgain}
      onHome={() => navigate('/')}
    />
  )
}
