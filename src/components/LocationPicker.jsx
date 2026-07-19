import locations from '../data/locations.json'
import { useGame } from '../state/GameContext.jsx'
import { ActionTypes } from '../state/actions.js'

/** 위치 선택 — TODO: 맵 클릭 UX, 해금 연출 */
export default function LocationPicker() {
  const { state, dispatch } = useGame()

  return (
    <div className="panel">
      <h3>위치 선택</h3>
      <ul className="picker-list">
        {locations.map((loc) => {
          const unlocked = state.unlockedLocations.includes(loc.id)
          const selected = state.location === loc.id
          return (
            <li key={loc.id}>
              <button
                type="button"
                className={`picker-item${selected ? ' selected' : ''}`}
                disabled={!unlocked}
                onClick={() =>
                  dispatch({ type: ActionTypes.SET_LOCATION, payload: loc.id })
                }
              >
                <span>
                  {loc.icon} {loc.name}
                </span>
                <small>
                  {unlocked
                    ? `자릿세 ${loc.rentCost.toLocaleString('ko-KR')}원`
                    : `Day ${loc.unlockDay} 해금`}
                </small>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
