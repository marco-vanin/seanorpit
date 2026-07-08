/**
 * Asset-free Web Audio sound stings for the reveal beat. No React, no imports.
 * One shared AudioContext with a master gain capped at 0.2 → destination.
 * Every browser API is guarded so this is SSR- and old-browser-safe: if there
 * is no AudioContext constructor, all calls no-op silently.
 */

export type StingKind = 'correct' | 'wrong' | 'timeout'

interface WebAudioWindow {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let unavailable = false

/** Lazily create the shared context + master gain. Returns null if unsupported. */
function getContext(): AudioContext | null {
  if (ctx) return ctx
  if (unavailable) return null
  if (typeof window === 'undefined') {
    unavailable = true
    return null
  }
  const w = window as unknown as WebAudioWindow
  const Ctor = w.AudioContext ?? w.webkitAudioContext
  if (!Ctor) {
    unavailable = true
    return null
  }
  try {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.2 // master ceiling — stings stay gentle
    master.connect(ctx.destination)
    return ctx
  } catch {
    unavailable = true
    ctx = null
    master = null
    return null
  }
}

/**
 * Resume the shared context if the browser suspended it. Call from user-gesture
 * handlers (tap / click) so iOS Safari unlocks audio.
 */
export function unlockAudio(): void {
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') {
    // Fire and forget — resume() rejects harmlessly if already running.
    void c.resume().catch(() => {})
  }
}

/** Attack, in seconds — shared by every envelope. */
const ATTACK = 0.008

/**
 * Schedule one oscillator note with an attack + exponential decay envelope,
 * disconnecting on `onended` so nodes don't pile up.
 */
function note(
  c: AudioContext,
  bus: GainNode,
  type: OscillatorType,
  fromHz: number,
  toHz: number,
  startAt: number,
  durationS: number,
  peak: number,
): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(fromHz, startAt)
  if (toHz !== fromHz) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), startAt + durationS)
  }
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peak, startAt + ATTACK)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationS)
  osc.connect(gain)
  gain.connect(bus)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
  osc.start(startAt)
  osc.stop(startAt + durationS + 0.02)
}

/**
 * Play a sting. Returns immediately when `muted` or when Web Audio is
 * unavailable. Stings are independent of the <audio> element so they never
 * collide with a loading clip.
 */
export function playSting(kind: StingKind, muted: boolean): void {
  if (muted) return
  const c = getContext()
  if (!c || !master) return
  unlockAudio()
  const t = c.currentTime

  switch (kind) {
    case 'correct':
      // Two ascending sine notes — bright "ding-up".
      note(c, master, 'sine', 660, 660, t, 0.09, 0.18)
      note(c, master, 'sine', 988, 988, t + 0.08, 0.09, 0.18)
      break
    case 'wrong':
      // Low soft triangle glide — not a harsh error beep.
      note(c, master, 'triangle', 200, 150, t, 0.2, 0.16)
      break
    case 'timeout':
      // Slower, sadder sine "wah" descent — distinct from wrong.
      note(c, master, 'sine', 440, 293, t, 0.38, 0.15)
      break
  }
}
