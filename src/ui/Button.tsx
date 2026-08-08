import type {
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react'
import { playButtonSfx } from '../audio/sfx'

export type ButtonVariant = 'primary' | 'secondary' | 'default'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  /** true면 클릭 효과음 생략 */
  muteSfx?: boolean
}

/** 공통 버튼 — game.css 의 .btn 계열을 단일 컴포넌트로 통일 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  muteSfx = false,
  onClick,
  disabled,
  ...rest
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
        ? 'btn-secondary'
        : ''
  const sizeClass = size === 'sm' ? 'btn-small' : ''

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !muteSfx) playButtonSfx(variant)
    onClick?.(e)
  }

  return (
    <button
      type={type}
      className={['btn', variantClass, sizeClass, className].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  )
}
