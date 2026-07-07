import { useEffect, useRef } from 'react'
import { useGame, type Selection } from './game/useGame'
import { useAudioPlayer } from './game/useAudioPlayer'
import { previewFor } from './game/previews'
import { unlockAudio, playSting } from './game/stings'
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
  const audio = useAudioPlayer(clipUrl, state.screen === 'playing' && state.playing, state.muted)

  // Fire the timeout sting once when `selected` transitions null → 'timeout'.
  // (sean/pit stings fire at tap time from the gesture handlers below, so iOS
  // Safari has already unlocked the AudioContext for them.)
  const prevSelected = useRef<Selection>(null)
  useEffect(() => {
    const prev = prevSelected.current
    prevSelected.current = state.selected
    if (prev === null && state.selected === 'timeout') {
      playSting('timeout', state.muted)
    }
  }, [state.selected, state.muted])

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

  const handleStart = () => {
    unlockAudio()
    game.start()
  }

  const handleToggle = () => {
    unlockAudio()
    game.togglePlay()
  }

  const handleToggleMute = () => {
    unlockAudio()
    game.toggleMute()
  }

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
          <HomeScreen best={state.best} total={game.total} onStart={handleStart} />
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
        )}

        {state.screen === 'reveal' && (
          <RevealScreen
            correct={game.correct}
            selected={state.selected}
            song={game.song}
            isLast={game.isLast}
            streakTier={game.streakTier}
            streak={state.streak}
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
