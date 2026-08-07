import type { CSSProperties } from 'react'
import { OPEN_ACTION_BUTTONS_ART } from '../utils/assets'

/** buttons.webp(1536x1024) 2x2 — 서빙 활성/비활성, 폐기 활성/비활성 크롭 좌표 */
const ACTION_BUTTON_STYLE: Record<'serve' | 'discard', CSSProperties> = {
  serve: {
    backgroundImage: `url(${OPEN_ACTION_BUTTONS_ART})`,
    backgroundSize: '290.36% 497.09%',
    '--btn-pos-active': '19.96% 30.32%',
    '--btn-pos-inactive': '80.04% 30.32%',
  } as CSSProperties,
  discard: {
    backgroundImage: `url(${OPEN_ACTION_BUTTONS_ART})`,
    backgroundSize: '290.36% 492.31%',
    '--btn-pos-active': '19.96% 68.87%',
    '--btn-pos-inactive': '80.04% 68.87%',
  } as CSSProperties,
}

const LABEL = { serve: '서빙', discard: '폐기' } as const

export interface PlatedActionButtonProps {
  variant: 'serve' | 'discard'
  disabled: boolean
  onClick: () => void
  title?: string
}

/** 완성 트레이의 서빙/폐기 버튼 — disabled 여부에 따라 버튼 스프라이트를 활성/비활성으로 전환한다. */
export default function PlatedActionButton({ variant, disabled, onClick, title }: PlatedActionButtonProps) {
  return (
    <button
      type="button"
      className={`plated-action-btn plated-action-btn--${variant}`}
      style={ACTION_BUTTON_STYLE[variant]}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <span className="visually-hidden">{LABEL[variant]}</span>
    </button>
  )
}
