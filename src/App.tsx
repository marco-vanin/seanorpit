import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useGame, type Game, type Selection } from './game/useGame'
import { useAudioPlayer } from './game/useAudioPlayer'
import { unlockAudio, playSting } from './game/stings'
import { modeBySlug, type Mode } from './game/modes'
import { matchupById, type Matchup, type Side } from './game/matchups'
import { HomeScreen } from './components/screens/HomeScreen'
import { ModeSelectScreen } from './components/screens/ModeSelectScreen'
import { CustomDuelScreen } from './components/screens/CustomDuelScreen'
import { PlayingScreen } from './components/screens/PlayingScreen'
import { RevealScreen } from './components/screens/RevealScreen'
import { ResultsScreen } from './components/screens/ResultsScreen'
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
          <Route path="/duel/custom" element={<CustomDuelRoute />} />
          <Route path="/duel/:matchupId" element={<CuratedDuelRoute />} />
          <Route path="/jouer/:matchup/:mode" element={<PlayRoute />} />
          <Route path="/resultats" element={<ResultsRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
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

  return <ModeSelectScreen matchup={matchup} onSelect={handleSelect} onBack={() => navigate('/')} />
}

function CustomDuelRoute() {
  const game = useGameContext()
  const navigate = useNavigate()

  const handlePlay = (matchup: Matchup, mode: Mode) => {
    unlockAudio()
    game.start(matchup, mode)
    navigate(`/jouer/custom/${mode.slug}`)
  }

  return <CustomDuelScreen onPlay={handlePlay} onBack={() => navigate('/')} />
}

function PlayRoute() {
  const game = useGameContext()
  const { state } = game
  const params = useParams()
  const navigate = useNavigate()

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

  if (state.screen === 'reveal') {
    return (
      <RevealScreen
        correct={game.correct}
        selected={state.selected}
        matchup={matchup}
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
      nameA={matchup.a.name}
      nameB={matchup.b.name}
      accentA={slotColor('a')}
      accentB={slotColor('b')}
      onToggle={handleToggle}
      onGuessA={() => handleGuess('a')}
      onGuessB={() => handleGuess('b')}
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
