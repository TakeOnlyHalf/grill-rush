import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type TitleMenuButtonVariant = 'wood' | 'chalk'

export interface TitleMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  /** wood: 나무 이정표 / chalk: 칠판·양피지 보조 */
  variant?: TitleMenuButtonVariant
}

/**
 * 타이틀 화면용 메뉴 버튼
 * title.png의 나무 간판·칠판 톤에 맞춘 스토리북 UI
 */
export default function TitleMenuButton({
  children,
  variant = 'wood',
  type = 'button',
  className = '',
  ...rest
}: TitleMenuButtonProps) {
  return (
    <button
      type={type}
      className={[
        'title-menu-btn',
        `title-menu-btn--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span className="title-menu-btn__edge" aria-hidden />
      <span className="title-menu-btn__label">{children}</span>
    </button>
  )
}
