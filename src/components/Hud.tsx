import { useGameState } from '../state/GameContext'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather'
import { OPEN_DURATION_SEC } from '../state/actions'
import { isRushHour } from '../state/formulas'

export interface HudProps {
  variant?: 'default' | 'open'
}

/** 상단 HUD */
export default function Hud({ variant = 'default' }: HudProps) {
  const state = useGameState()
  const rush = variant === 'open' && isRushHour(state.location, state.time)

  return (
    <div className="hud">
      <span>
        Day {state.day}/{state.maxDays}
      </span>
      <span className="hud-cash">₩{state.cash.toLocaleString('ko-KR')}</span>
      <span>명성 {state.fame}</span>
      <span>
        {getWeatherEmoji(state.weather)} {getWeatherLabel(state.weather)}
      </span>
      {variant === 'open' && (
        <span>
          재료 {Object.values(state.ingredients).reduce((a, b) => a + b, 0)}
        </span>
      )}
      {variant === 'open' && (
        <span className="hud-cash">매출 ₩{state.dailySales.toLocaleString('ko-KR')}</span>
      )}
      {variant === 'open' && <span>대기 {state.customers.length}명</span>}
      {rush && <span className="hud-rush">🔥 러시아워</span>}
      {variant === 'open' && (
        <span className="hud-time">
          {Math.max(0, OPEN_DURATION_SEC - Math.floor(state.time))}s
        </span>
      )}
    </div>
  )
}
