import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import { C } from '../../theme'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Extra inline style merged over the base primitive style. */
  style?: CSSProperties
}

/**
 * Primary call-to-action — the white pill button from the design.
 * Lifts on hover (matches the design's `translateY(-2px)`).
 */
export function Button({ style, onMouseEnter, onMouseLeave, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        fontFamily: C.sansFont,
        cursor: 'pointer',
        border: 'none',
        background: C.text,
        color: C.bg,
        fontSize: 17,
        fontWeight: 600,
        padding: '15px 38px',
        borderRadius: 14,
        transition: 'transform .15s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        onMouseLeave?.(e)
      }}
    />
  )
}
