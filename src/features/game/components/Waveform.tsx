const BAR_COUNT = 44

/**
 * Animated equalizer bars. When `playing`, bars pulse via the `eq` keyframes;
 * when paused they flatten. Purely decorative (no real audio yet). Per-bar
 * height + animation delay are computed at render time, so they stay inline.
 */
export function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-[60px] items-end justify-center gap-[3px] text-muted-5">
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const h = 8 + Math.abs(Math.sin(i * 1.7)) * 44
        return (
          <span
            key={i}
            className="block w-1 origin-bottom rounded-[2px] bg-current transition-[height] duration-200 ease-in-out"
            style={{
              height: playing ? h : 6,
              animation: playing
                ? `eq ${0.6 + (i % 7) * 0.08}s ease-in-out ${(i % 11) * 0.05}s infinite alternate`
                : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
