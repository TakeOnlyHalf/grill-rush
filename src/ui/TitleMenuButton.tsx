import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type TitleMenuButtonVariant = 'wood' | 'chalk'
export type TitleMenuButtonTone = 'primary' | 'secondary' | 'tertiary'
export type TitleMenuButtonIcon = 'continue' | 'new' | 'options' | 'none'

export interface TitleMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  /**
   * @deprecated tone 사용 권장. wood→secondary, chalk→tertiary 로 매핑됩니다.
   */
  variant?: TitleMenuButtonVariant
  /** primary: 이어하기 / secondary: 처음부터 / tertiary: 옵션 */
  tone?: TitleMenuButtonTone
  /** 작은 장식 아이콘 */
  icon?: TitleMenuButtonIcon
}

function resolveTone(
  tone: TitleMenuButtonTone | undefined,
  variant: TitleMenuButtonVariant | undefined,
): TitleMenuButtonTone {
  if (tone) return tone
  if (variant === 'chalk') return 'tertiary'
  return 'secondary'
}

function MenuIcon({ name }: { name: TitleMenuButtonIcon }) {
  if (name === 'none') return null

  if (name === 'continue') {
    return (
      <svg className="title-menu-btn__icon" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.1-6.86a1.07 1.07 0 0 0 0-1.8L9.56 4.24A1.07 1.07 0 0 0 8 5.14Z"
        />
      </svg>
    )
  }

  if (name === 'new') {
    return (
      <svg className="title-menu-btn__icon" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M12 3.2 13.7 8h4.9l-4 3 1.5 4.9L12 13.7 7.9 16l1.5-4.9-4-3h4.9L12 3.2Z"
        />
      </svg>
    )
  }

  return (
    <svg className="title-menu-btn__icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19.1 12.6a7.4 7.4 0 0 0 .1-1.2 7.4 7.4 0 0 0-.1-1.2l2-1.6-1.9-3.3-2.4 1a7.6 7.6 0 0 0-2.1-1.2l-.4-2.6H9.9l-.4 2.6a7.6 7.6 0 0 0-2.1 1.2l-2.4-1-1.9 3.3 2 1.6a7.4 7.4 0 0 0-.1 1.2 7.4 7.4 0 0 0 .1 1.2l-2 1.6 1.9 3.3 2.4-1a7.6 7.6 0 0 0 2.1 1.2l.4 2.6h3.8l.4-2.6a7.6 7.6 0 0 0 2.1-1.2l2.4 1 1.9-3.3-2-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
      />
    </svg>
  )
}

/**
 * 타이틀 화면용 메뉴 버튼
 * 손그림 배경과 어울리는 종이/천 질감 + 중요도(tone) 계층
 */
export default function TitleMenuButton({
  children,
  variant,
  tone,
  icon = 'none',
  type = 'button',
  className = '',
  ...rest
}: TitleMenuButtonProps) {
  const resolved = resolveTone(tone, variant)

  return (
    <button
      type={type}
      className={[
        'title-menu-btn',
        `title-menu-btn--${resolved}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span className="title-menu-btn__edge" aria-hidden>
        <svg className="title-menu-btn__dash" viewBox="0 0 200 64" preserveAspectRatio="none">
          <rect
            x="2.5"
            y="2.5"
            width="195"
            height="59"
            rx="12"
            ry="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeDasharray="16 12"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
      <span className="title-menu-btn__content">
        <MenuIcon name={icon} />
        <span className="title-menu-btn__label">{children}</span>
      </span>
    </button>
  )
}
