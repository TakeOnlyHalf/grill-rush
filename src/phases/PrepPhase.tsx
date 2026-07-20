import Hud from '../components/Hud'
import LocationPicker from '../components/LocationPicker'
import MenuSelector from '../components/MenuSelector'
import IngredientShop from '../components/IngredientShop'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { estimateCustomers } from '../state/formulas'

/**
 * 준비 페이즈
 * Day 1은 자동 세팅 튜토리얼 예정 — 현재는 UI 골격만
 */
export default function PrepPhase() {
  const { state, dispatch } = useGame()
  const estimated = estimateCustomers(state.location, state.weather, state.fame)
  const canStart = state.activeMenus.length > 0

  return (
    <section className="phase phase-prep">
      <Hud />
      <header className="phase-header">
        <h2>준비 페이즈</h2>
        <p>위치 · 메뉴 · 재료 · 가격을 정한 뒤 영업을 시작하세요.</p>
      </header>

      <div className="prep-grid">
        <LocationPicker />
        <div className="prep-center panel">
          <h3>오늘 요약</h3>
          <ul className="summary-list">
            <li>예상 손님 약 {estimated}명</li>
            <li>판매 메뉴 {state.activeMenus.length}종</li>
            <li>보유 재료 {Object.keys(state.ingredients).length}종류</li>
          </ul>
          <p className="todo-note">
            TODO: 도시 맵 시각화, Day1 튜토리얼 강제 진행
          </p>
        </div>
        <div className="prep-side">
          <MenuSelector />
          <IngredientShop />
        </div>
      </div>

      <footer className="phase-footer">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canStart}
          onClick={() => dispatch({ type: ActionTypes.START_OPEN })}
        >
          ▶ 영업 시작
        </button>
      </footer>
    </section>
  )
}
