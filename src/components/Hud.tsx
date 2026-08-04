import { useState } from 'react'
import { useGame } from '../state/GameContext'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather'
import { ActionTypes, OPEN_DURATION_SEC } from '../state/actions'
import { isRushHour } from '../state/formulas'
import { forceUnlockBgm } from '../audio/bgm'
import { playSfx } from '../audio/sfx'
import OptionsModal from './OptionsModal'

export interface HudProps {
  variant?: 'default' | 'open'
}

/** 상단 HUD */
export default function Hud({ variant = 'default' }: HudProps) {
  const { state, dispatch } = useGame()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const rush = variant === 'open' && isRushHour(state.location, state.time)
  const timeLeft = Math.max(0, OPEN_DURATION_SEC - Math.floor(state.time))

  return (
    <div className={`hud${variant === 'open' ? ' hud--open' : ''}`}>
      <div className="hud-chips">
        <span className="hud-chip">
          <span className="hud-chip-icon" aria-hidden>📅</span>
          Day {state.day}/{state.maxDays}
        </span>
        <span className="hud-chip hud-chip--gold">
          <span className="hud-chip-icon" aria-hidden>🪙</span>
          ₩{state.cash.toLocaleString('ko-KR')}
        </span>
        <span className="hud-chip">
          <span className="hud-chip-icon" aria-hidden>⭐</span>
          명성 {state.fame}
        </span>
        <span className="hud-chip">
          <span className="hud-chip-icon" aria-hidden>{getWeatherEmoji(state.weather)}</span>
          {getWeatherLabel(state.weather)}
        </span>
        {variant === 'open' && (
          <span className="hud-chip hud-chip--gold">
            <span className="hud-chip-icon" aria-hidden>💰</span>
            매출 ₩{state.dailySales.toLocaleString('ko-KR')}
          </span>
        )}
        {variant === 'open' && (
          <span className="hud-chip">
            <span className="hud-chip-icon" aria-hidden>👥</span>
            대기 {state.customers.length}명
          </span>
        )}
        {rush && (
          <span className="hud-chip hud-chip--rush">
            <span className="hud-chip-icon" aria-hidden>🔥</span>
            러시아워
          </span>
        )}
        {variant === 'open' && (
          <span className="hud-chip hud-chip--time">
            <span className="hud-chip-icon" aria-hidden>⏱</span>
            {timeLeft}s
          </span>
        )}
      </div>

      <div className="hud-actions">
        <button
          type="button"
          className="hud-icon-btn"
          aria-label="설정"
          onClick={() => {
            playSfx('button_secondary')
            setOptionsOpen(true)
          }}
        >
          ⚙️
        </button>
        {variant === 'open' && (
          <button
            type="button"
            className="hud-end-btn"
            onClick={() => {
              playSfx('button_primary')
              forceUnlockBgm('store')
              dispatch({ type: ActionTypes.END_OPEN })
            }}
          >
            영업 종료
          </button>
        )}
      </div>

      <OptionsModal open={optionsOpen} onClose={() => setOptionsOpen(false)} />
    </div>
  )
}
