import upgrades from '../data/upgrades.json'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'

/** Storybook / 간단 목록용. 실제 야간 UI는 NightPhase. */
export default function UpgradeShop() {
  const { state, dispatch } = useGame()

  return (
    <div className="panel">
      <h3>업그레이드</h3>
      <ul className="picker-list">
        {upgrades.map((up) => {
          const owned = state.upgrades.includes(up.id)
          const canBuy = !owned && state.cash >= up.cost
          return (
            <li key={up.id}>
              <button
                type="button"
                className={`picker-item${owned ? ' selected' : ''}`}
                disabled={!canBuy && !owned}
                onClick={() => {
                  if (owned) return
                  dispatch({
                    type: ActionTypes.BUY_UPGRADE,
                    payload: { upgradeId: up.id, cost: up.cost },
                  })
                }}
              >
                <span>
                  {up.name}
                  {owned ? ' ✓' : ''}
                </span>
                <small>
                  {owned
                    ? up.description
                    : `${up.cost.toLocaleString('ko-KR')}원 · ${up.description}`}
                </small>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
