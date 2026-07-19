import { useGameState } from '../state/GameContext.jsx'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather.js'
import { OPEN_DURATION_SEC } from '../state/actions.js'

/**
 * 상단 HUD
 * @param {{ variant?: 'default' | 'open' }} props
 */
export default function Hud({ variant = 'default' }) {
  const state = useGameState()

  return (
    <div className="hud">
      <span>Day {state.day}/{state.maxDays}</span>
      <span>₩{state.cash.toLocaleString('ko-KR')}</span>
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
        <span className="hud-time">
          {Math.max(0, OPEN_DURATION_SEC - Math.floor(state.time))}s
        </span>
      )}
    </div>
  )
}
