import { useEffect, useRef, useState } from 'react'

export interface AudioStatus {
  /** A clip URL is available for the current track. */
  hasAudio: boolean
  /** The clip is buffered and playable. */
  ready: boolean
  /** The clip failed to load. */
  error: boolean
  /** Autoplay was blocked by the browser — a tap is needed to start. */
  blocked: boolean
}

/**
 * Drives a single looping <audio> element for the current track's preview clip.
 * `src` changes per question; `playing` mirrors the game's play/pause. The clip
 * loops so it keeps playing for the whole question, and never reveals the title.
 */
export function useAudioPlayer(
  src: string | undefined,
  playing: boolean,
  muted: boolean,
): AudioStatus {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [blocked, setBlocked] = useState(false)

  // Create the element once.
  useEffect(() => {
    const el = new Audio()
    el.loop = true
    el.preload = 'auto'
    ref.current = el
    return () => {
      el.pause()
      el.removeAttribute('src')
      ref.current = null
    }
  }, [])

  // Load a new clip when the track changes.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setReady(false)
    setError(false)
    setBlocked(false)
    if (!src) {
      el.pause()
      el.removeAttribute('src')
      return
    }
    el.src = src
    el.currentTime = 0
    el.load()
    const onReady = () => setReady(true)
    const onError = () => setError(true)
    el.addEventListener('canplay', onReady)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('canplay', onReady)
      el.removeEventListener('error', onError)
    }
  }, [src])

  // Mirror the master mute onto the element (music obeys the master mute).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = muted
  }, [muted])

  // Reflect play/pause.
  useEffect(() => {
    const el = ref.current
    if (!el || !src) return
    if (playing) {
      el.play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true)) // autoplay blocked — user can tap play
    } else {
      el.pause()
    }
  }, [playing, src])

  return { hasAudio: !!src, ready, error, blocked }
}
