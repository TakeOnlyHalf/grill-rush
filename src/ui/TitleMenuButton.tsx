import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type TitleMenuButtonVariant = 'wood' | 'chalk'

export interface TitleMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  /** wood: 나무 이정표 / chalk: 밝은 양피지 배너(보조) */
  variant?: TitleMenuButtonVariant
}

/**
 * 타이틀 화면용 메뉴 버튼
 * title_day.png 나무 이정표·양피지 배너 톤
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
