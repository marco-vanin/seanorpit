import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useGame, type Game, type Selection } from './game/useGame'
import { useAudioPlayer } from './game/useAudioPlayer'
import { previewFor } from './game/previews'
import { unlockAudio, playSting } from './game/stings'
import { modeBySlug, type Mode } from './game/modes'
import { HomeScreen } from './components/screens/HomeScreen'
import { PlayingScreen } from './components/screens/PlayingScreen'
import { RevealScreen } from './components/screens/RevealScreen'
import { ResultsScreen } from './components/screens/ResultsScreen'
import { C } from './theme'

/**
 * The single shared game instance lives here, above <Routes>, so that
 * navigating /jouer/:mode → /resultats keeps the same state. Routes must read
 * it from context, never call useGame() themselves.
 */
const GameContext = createContext<Game | null>(null)

function useGameContext(): Game {
  const game = useContext(GameContext)
  if (!game) throw new Error('useGameContext must be used within <GameContext.Provider>')
  return game
}

/** Outer chrome: dark radial background + centered responsive column. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(20px, 5vw, 40px)',
        background: 'radial-gradient(120% 90% at 50% -10%, #171922 0%, #0c0d11 60%)',
        color: C.text,
      }}
    >
      <div style={{ width: '100%', maxWidth: 940 }}>{children}</div>
    </div>
  )
}

export function App() {
  const game = useGame()

  return (
    <GameContext.Provider value={game}>
      <Shell>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/jouer/:mode" element={<PlayRoute />} />
          <Route path="/resultats" element={<ResultsRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </GameContext.Provider>
  )
}

function HomeRoute() {
  const game = useGameContext()
  const navigate = useNavigate()

  const handleSelect = (mode: Mode) => {
    unlockAudio()
    game.start(mode)
    navigate(`/jouer/${mode.slug}`)
  }

  return <HomeScreen onSelect={handleSelect} />
}

function PlayRoute() {
  const game = useGameContext()
  const { state } = game
  const params = useParams()
  const navigate = useNavigate()
  const resolved = params.mode ? modeBySlug(params.mode) : undefined
  const { start } = game
  const activeModeKey = game.mode?.key

  // Auto-start on cold entry / slug change so bare /jouer/:mode deep-links work.
  useEffect(() => {
    if (!resolved) return
    if (activeModeKey !== resolved.key) {
      unlockAudio()
      start(resolved)
    }
  }, [resolved, activeModeKey, start])

  // Leave the play route once the run ends (reveal → results is route-owned).
  useEffect(() => {
    if (state.screen === 'results') navigate('/resultats', { replace: true })
  }, [state.screen, navigate])

  // Drive the current track's clip while the question is live (never on
  // reveal/results). Blitz caps audible playback at mode.clipSeconds.
  const clipUrl = state.screen === 'playing' && game.song ? previewFor(game.song.t) : undefined
  const audio = useAudioPlayer(
    clipUrl,
    state.screen === 'playing' && state.playing,
    state.muted,
    game.mode?.clipSeconds,
  )

  // Fire the timeout sting once when `selected` transitions null → 'timeout'.
  const prevSelected = useRef<Selection>(null)
  useEffect(() => {
    const prev = prevSelected.current
    prevSelected.current = state.selected
    if (prev === null && state.selected === 'timeout') {
      playSting('timeout', state.muted)
    }
  }, [state.selected, state.muted])

  if (!resolved) return <Navigate to="/" replace />

  const handleGuessSean = () => {
    unlockAudio()
    if (state.selected === null) {
      playSting(game.song?.a === 'sean' ? 'correct' : 'wrong', state.muted)
    }
    game.guessSean()
  }

  const handleGuessPit = () => {
    unlockAudio()
    if (state.selected === null) {
      playSting(game.song?.a === 'pit' ? 'correct' : 'wrong', state.muted)
    }
    game.guessPit()
  }

  const handleToggle = () => {
    unlockAudio()
    game.togglePlay()
  }

  const handleToggleMute = () => {
    unlockAudio()
    game.toggleMute()
  }

  if (state.screen === 'reveal') {
    return (
      <RevealScreen
        correct={game.correct}
        selected={state.selected}
        song={game.song}
        isLast={game.isLast}
        streakTier={game.streakTier}
        streak={state.streak}
        onNext={game.next}
      />
    )
  }

  return (
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
      clipSeconds={game.mode?.clipSeconds}
      onToggle={handleToggle}
      onGuessSean={handleGuessSean}
      onGuessPit={handleGuessPit}
      hasAudio={audio.hasAudio && !audio.error}
      loading={audio.hasAudio && !audio.ready && !audio.error}
      blocked={audio.blocked}
      selected={game.selected}
      answerCorrect={game.answerCorrect}
      muted={state.muted}
      onToggleMute={handleToggleMute}
    />
  )
}

function ResultsRoute() {
  const game = useGameContext()
  const { state } = game
  const navigate = useNavigate()

  // Guard: cold hit / refresh with no finished run → home.
  if (game.mode == null || state.screen !== 'results') {
    return <Navigate to="/" replace />
  }

  const handlePlayAgain = () => {
    const mode = game.mode
    if (!mode) return
    unlockAudio()
    game.playAgain()
    navigate(`/jouer/${mode.slug}`)
  }

  return (
    <ResultsScreen
      mode={game.mode}
      score={state.score}
      total={game.total}
      bestStreak={state.bestStreak}
      best={state.best}
      onPlayAgain={handlePlayAgain}
      onHome={() => navigate('/')}
    />
  )
}
