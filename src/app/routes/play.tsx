import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Side } from '@/types'
import { modeBySlug } from '@/config/modes'
import { matchupById } from '@/features/duel/api/matchups'
import { PlayingScreen } from '@/features/game/components/PlayingScreen'
import { RevealScreen } from '@/features/game/components/RevealScreen'
import { useAudioPlayer } from '@/features/game/hooks/useAudioPlayer'
import type { Selection } from '@/features/game/hooks/useGame'
import { playSting, unlockAudio } from '@/features/game/utils/stings'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { slotColor } from '@/utils/colors'
import { useGameContext } from '../provider'

/** `/jouer/:matchup/:mode` — the live round (playing + reveal + abandon confirm). */
export function PlayRoute({ rulesOpen }: { rulesOpen: boolean }) {
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
