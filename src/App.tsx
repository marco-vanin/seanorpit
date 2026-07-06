import { useGame } from './game/useGame'
import { useAudioPlayer } from './game/useAudioPlayer'
import { previewFor } from './game/previews'
import { HomeScreen } from './components/screens/HomeScreen'
import { PlayingScreen } from './components/screens/PlayingScreen'
import { RevealScreen } from './components/screens/RevealScreen'
import { ResultsScreen } from './components/screens/ResultsScreen'
import { C } from './theme'

export function App() {
  const game = useGame()
  const { state } = game

  // Play the current track's 30s clip while the question is live (never on
  // reveal/results, so the answer isn't spoiled by the audio continuing).
  const clipUrl = state.screen === 'playing' && game.song ? previewFor(game.song.t) : undefined
  const audio = useAudioPlayer(clipUrl, state.screen === 'playing' && state.playing)

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
      <div style={{ width: '100%', maxWidth: 940 }}>
        {state.screen === 'home' && (
          <HomeScreen best={state.best} total={game.total} onStart={game.start} />
        )}

        {state.screen === 'playing' && (
          <PlayingScreen
            qNumber={game.qNumber}
            total={game.total}
            score={state.score}
            streak={state.streak}
            playing={state.playing}
            timerEnabled={game.timerEnabled}
            timeLeft={state.timeLeft}
            seconds={game.seconds}
            onToggle={game.togglePlay}
            onGuessSean={game.guessSean}
            onGuessPit={game.guessPit}
            hasAudio={audio.hasAudio && !audio.error}
            loading={audio.hasAudio && !audio.ready && !audio.error}
            blocked={audio.blocked}
          />
        )}

        {state.screen === 'reveal' && (
          <RevealScreen
            correct={game.correct}
            selected={state.selected}
            song={game.song}
            isLast={game.isLast}
            onNext={game.next}
          />
        )}

        {state.screen === 'results' && (
          <ResultsScreen
            score={state.score}
            total={game.total}
            bestStreak={state.bestStreak}
            best={state.best}
            onPlayAgain={game.playAgain}
          />
        )}
      </div>
    </div>
  )
}
