import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'default'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}

/** 공통 버튼 — game.css 의 .btn 계열을 단일 컴포넌트로 통일 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...rest
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
        ? 'btn-secondary'
        : ''
  const sizeClass = size === 'sm' ? 'btn-small' : ''

  return (
    <button
      type={type}
      className={['btn', variantClass, sizeClass, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
