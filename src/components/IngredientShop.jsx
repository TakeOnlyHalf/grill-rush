import ingredients from '../data/ingredients.json'
import { useGame } from '../state/GameContext.jsx'
import { ActionTypes } from '../state/actions.js'

/** 재료 매입 — TODO: 마트/도매시장 분기, 판매 예측 힌트 */
export default function IngredientShop() {
  const { state, dispatch } = useGame()

  return (
    <div className="panel">
      <h3>재료 매입</h3>
      <p className="muted">일반 마트 (도매시장은 이후 구현)</p>
      <ul className="picker-list shop-list">
        {ingredients.slice(0, 8).map((ing) => {
          const owned = state.ingredients[ing.id] ?? 0
          return (
            <li key={ing.id} className="shop-row">
              <span>
                {ing.icon} {ing.name}{' '}
                <small>×{owned}</small>
              </span>
              <button
                type="button"
                className="btn btn-small"
                disabled={state.cash < ing.unitCost}
                onClick={() =>
                  dispatch({
                    type: ActionTypes.BUY_INGREDIENT,
                    payload: {
                      ingredientId: ing.id,
                      qty: 1,
                      unitCost: ing.unitCost,
                    },
                  })
                }
              >
                +1 ({ing.unitCost.toLocaleString('ko-KR')})
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
