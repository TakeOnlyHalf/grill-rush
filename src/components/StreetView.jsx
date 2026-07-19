import { useGameState } from '../state/GameContext.jsx'
import { getLocationById } from '../state/formulas.js'

/** 거리 뷰 (트럭+손님) — TODO: Canvas/스프라이트 연출 */
export default function StreetView() {
  const state = useGameState()
  const loc = getLocationById(state.location)

  return (
    <div className="street-view panel">
      <div className="street-scene">
        <span className="street-crowd">🚶 🚶‍♀️ 🚶</span>
        <span className="street-truck">🚚</span>
        <span className="street-happy">😋</span>
      </div>
      <p>
        {loc?.icon} {loc?.name ?? '—'} · 대기 {state.customers.length}명
      </p>
      <p className="todo-note">TODO: StreetView 애니메이션 / 배경</p>
    </div>
  )
}
