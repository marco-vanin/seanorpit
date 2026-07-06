import { C } from '../theme'

const BAR_COUNT = 44

/**
 * Animated equalizer bars. When `playing`, bars pulse via the `eq` keyframes;
 * when paused they flatten. Purely decorative (no real audio yet).
 */
export function Waveform({ playing }: { playing: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 3,
        height: 60,
        color: C.muted5,
      }}
    >
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const h = 8 + Math.abs(Math.sin(i * 1.7)) * 44
        return (
          <span
            key={i}
            style={{
              display: 'block',
              width: 4,
              borderRadius: 2,
              background: 'currentColor',
              height: playing ? h : 6,
              transformOrigin: 'bottom',
              animation: playing
                ? `eq ${0.6 + (i % 7) * 0.08}s ease-in-out ${(i % 11) * 0.05}s infinite alternate`
                : 'none',
              transition: 'height .2s ease',
            }}
          />
        )
      })}
    </div>
  )
}
