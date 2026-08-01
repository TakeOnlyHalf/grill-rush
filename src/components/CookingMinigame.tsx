import { useMemo } from 'react'
import { useGame } from '../state/GameContext'
import { createIdleGrillSlots } from '../grill/grillSlots'
import { grillIngredients } from '../grill/grillIngredients'
import GrillBoard from './GrillBoard'
import { ActionTypes } from '../state/actions'
import ingredientData from '../data/ingredients.json'
import menus from '../data/menus.json'

const ingredientById = new Map(ingredientData.map((ingredient) => [ingredient.id, ingredient]))
const resultLabels = { good: '좋음', perfect: '완벽', danger: '아슬아슬' } as const

/**
 * 조리 미니게임 컨테이너
 * TODO: 주문에 따라 타입 선택, 그릴 슬롯 게이지 시스템으로 교체 가능
 */
export default function CookingMinigame() {
  const { state, dispatch } = useGame()
  const initialSlots = useMemo(createIdleGrillSlots, [])
  const neededIngredientIds = useMemo(() => {
    const needed = new Set<string>()
    for (const order of state.orders) {
      menus.find((menu) => menu.id === order.menuId)?.ingredients.forEach((id) => needed.add(id))
    }
    return [...needed]
  }, [state.orders])

  return (
    <div className="panel cooking-area">
      <h3>그릴</h3>
      <p className="muted">재료를 선택해 올리고 적절한 판정 구간에서 회수하세요.</p>
      <GrillBoard
        fillHeight
        initialSlots={initialSlots}
        ingredients={grillIngredients}
        inventory={state.ingredients}
        neededIngredientIds={neededIngredientIds}
        onUseIngredient={(ingredientId) => {
          dispatch({
            type: ActionTypes.USE_INGREDIENT,
            payload: { ingredientId },
          })
        }}
        onCollect={(item) => {
          dispatch({
            type: ActionTypes.COLLECT_COOKED_INGREDIENT,
            payload: {
              ingredientId: item.ingredientId,
              cookResult: item.result,
            },
          })
        }}
      />
      <section className="prepared-counter" aria-label="준비대">
        <strong>준비대</strong>
        {state.preparedIngredients.length === 0 ? (
          <span className="muted">완성된 재료가 없습니다.</span>
        ) : (
          <ul>
            {state.preparedIngredients.map((item) => {
              const ingredient = ingredientById.get(item.ingredientId)
              return (
                <li key={item.id} className={`prepared-item prepared-item--${item.result}`}>
                  <span aria-hidden="true">{ingredient?.icon ?? '🍽️'}</span>
                  <span>{ingredient?.name ?? item.ingredientId}</span>
                  <small>{resultLabels[item.result]}</small>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {state.lastServeFeedback ? (
        <div
          key={state.lastServeFeedback.id}
          className="serve-feedback"
          role="status"
          aria-live="polite"
        >
          <strong>주문 완료</strong>
          <span>{state.lastServeFeedback.menuName}</span>
          <b>+₩{state.lastServeFeedback.amount.toLocaleString('ko-KR')}</b>
        </div>
      ) : null}
    </div>
  )
}
