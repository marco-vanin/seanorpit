import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

/**
 * Button primitive. `primary` is the design's white pill CTA; `ghost` is the
 * transparent bordered variant used for secondary actions (share / home /
 * back). Variants match the primitive's CURRENT looks exactly — `ghost` is the
 * former inline `{ background:'transparent', color: text, border: '1.5px solid
 * border-2' }` override. Hover lifts 2px (former `translateY(-2px)`).
 */
const button = cva(
  'cursor-pointer font-sans text-[17px] font-semibold rounded-[14px] transition-transform duration-150 ease-[ease] hover:-translate-y-0.5',
  {
    variants: {
      variant: {
        primary: 'border-none bg-text text-bg',
        ghost: 'bg-transparent text-text border-[1.5px] border-border-2',
      },
      size: {
        md: 'px-[38px] py-[15px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button {...props} className={cn(button({ variant, size }), className)} />
}
