import { useState } from 'react'
import CityMap from '../components/CityMap'
import MenuSelector from '../components/MenuSelector'
import IngredientShop from '../components/IngredientShop'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { estimateCustomers, getLocationById } from '../state/formulas'
import { getWeatherLabel } from '../utils/weather'

export default function PrepPhase() {
  const { state, dispatch } = useGame()
  const loc = getLocationById(state.location)
  const estimated = estimateCustomers(state.location, state.weather, state.fame)
  const canStart = state.activeMenus.length > 0
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <section className="phase phase-prep-full">
      <CityMap />

      <div className="prep-overlay">
        {/* HUD */}
        <header className="prep-hud-bar">
          <span className="prep-hud-chip">Day {state.day}/{state.maxDays}</span>
          <span className="prep-hud-chip">₩{state.cash.toLocaleString('ko-KR')}</span>
          <span className="prep-hud-chip">명성 {state.fame}</span>
          <span className="prep-hud-chip">{getWeatherLabel(state.weather)}</span>
        </header>

        {/* Location Info */}
        {loc && (
          <div className="prep-loc-card glass-panel">
            <h3>{loc.icon} {loc.name}</h3>
            <p className="prep-loc-desc">{loc.description}</p>
            <div className="prep-loc-stats">
              <span>피크 {loc.peakHours}</span>
              <span>예상 손님 {estimated}명</span>
              <span>자릿세 {loc.rentCost.toLocaleString('ko-KR')}원</span>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <footer className="prep-bottom-bar">
          <button
            type="button"
            className="prep-btn prep-btn--menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕ 닫기' : '🍽 메뉴 · 재료'}
          </button>
          <button
            type="button"
            className="prep-btn prep-btn--start"
            disabled={!canStart}
            onClick={() => dispatch({ type: ActionTypes.START_OPEN })}
          >
            ▶ 영업 시작
          </button>
        </footer>

        {/* Menu/Ingredient Panel */}
        {menuOpen && (
          <div className="prep-side-panel glass-panel">
            <div className="prep-side-scroll">
              <MenuSelector />
              <IngredientShop />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
