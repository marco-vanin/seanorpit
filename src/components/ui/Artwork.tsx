import { useEffect, useState, type CSSProperties } from 'react'

/**
 * Album artwork with a graceful fallback. Renders a lazy `<img>` when `src` is
 * present; on load error OR when `src` is missing, renders a neutral tile with
 * the artist's initial letter (muted background, slot-color accent). One
 * consistent artwork surface across the builder slots, search dropdown rows,
 * home cards, and the mode-select header.
 *
 * `size`, `radius` and `color` are runtime props (chosen per call site), so they
 * stay as inline style / CSS values a static utility class can't express. The
 * `style` override wins over the box defaults (call sites pass `border:'none'`).
 */
export function Artwork({
  src,
  name,
  color = 'var(--muted-4)',
  size = 44,
  radius = 10,
  style,
}: {
  src?: string
  name: string
  /** Accent for the placeholder initial (usually the slot color). */
  color?: string
  size?: number
  radius?: number
  style?: CSSProperties
}) {
  const [broken, setBroken] = useState(false)
  // Reset the error state when the source changes (e.g. a slot re-fills).
  useEffect(() => setBroken(false), [src])

  const box: CSSProperties = {
    flexShrink: 0,
    width: size,
    height: size,
    borderRadius: radius,
    objectFit: 'cover',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    display: 'block',
    ...style,
  }

  if (!src || broken) {
    return (
      <span
        aria-hidden
        style={{
          ...box,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          fontSize: Math.max(14, Math.round(size * 0.4)),
          color,
        }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    )
  }

  return <img src={src} alt="" loading="lazy" style={box} onError={() => setBroken(true)} />
}
