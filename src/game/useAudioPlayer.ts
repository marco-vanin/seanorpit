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
 * Drives a single <audio> element for the current track's preview clip.
 * `src` changes per question; `playing` mirrors the game's play/pause.
 *
 * When `clipSeconds` is undefined the clip loops, so it keeps playing for the
 * whole question and never reveals the title (Classique / Mort subite).
 *
 * When `clipSeconds` is set (Blitz) the clip plays **once then falls silent**:
 * looping is off and a `timeupdate` listener pauses the element the moment its
 * own `currentTime` passes the cap. The cap is relative to the element's clock,
 * so pause/resume inside the window resumes toward the cap, then goes quiet — it
 * never loops or restarts.
 */
export function useAudioPlayer(
  src: string | undefined,
  playing: boolean,
  muted: boolean,
  clipSeconds?: number,
): AudioStatus {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [blocked, setBlocked] = useState(false)

  // Create the element once.
  useEffect(() => {
    const el = new Audio()
    el.preload = 'auto'
    ref.current = el
    return () => {
      el.pause()
      el.removeAttribute('src')
      ref.current = null
    }
  }, [])

  // Load a new clip when the track changes. Also (re)installs the audible-cap
  // listener for Blitz, torn down on src change / unmount so no phantom audio.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setReady(false)
    setError(false)
    setBlocked(false)
    // Loop only when there is no audible cap; Blitz plays once then silence.
    el.loop = clipSeconds === undefined
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

    let onTimeUpdate: (() => void) | null = null
    if (clipSeconds !== undefined) {
      onTimeUpdate = () => {
        if (el.currentTime >= clipSeconds) el.pause()
      }
      el.addEventListener('timeupdate', onTimeUpdate)
    }

    return () => {
      el.removeEventListener('canplay', onReady)
      el.removeEventListener('error', onError)
      if (onTimeUpdate) el.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [src, clipSeconds])

  // Mirror the master mute onto the element (music obeys the master mute).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = muted
  }, [muted])

  // Reflect play/pause. For Blitz, once currentTime has passed the cap the
  // element is already paused and we don't force it back to playing.
  useEffect(() => {
    const el = ref.current
    if (!el || !src) return
    if (playing) {
      if (clipSeconds !== undefined && el.currentTime >= clipSeconds) return
      el.play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true)) // autoplay blocked — user can tap play
    } else {
      el.pause()
    }
  }, [playing, src, clipSeconds])

  return { hasAudio: !!src, ready, error, blocked }
}
