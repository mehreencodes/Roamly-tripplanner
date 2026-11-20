import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary: 'bg-terracotta text-white hover:bg-terracotta/90',
  secondary: 'border border-forest text-forest hover:bg-forest hover:text-white',
  ghost: 'text-forest hover:bg-sand',
}

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-full px-6 py-3 font-medium transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${styles[variant]} ${className}`}
      {...props}
    />
  )
}