import { useMemo } from 'react'
import { useGame } from '../state/GameContext'
import { createIdleGrillSlots } from '../grill/grillSlots'
import { grillIngredients } from '../grill/grillIngredients'
import GrillBoard from './GrillBoard'
import { ActionTypes } from '../state/actions'

/**
 * 조리 미니게임 컨테이너
 * TODO: 주문에 따라 타입 선택, 그릴 슬롯 게이지 시스템으로 교체 가능
 */
export default function CookingMinigame() {
  const { state, dispatch } = useGame()
  const initialSlots = useMemo(createIdleGrillSlots, [])

  return (
    <div className="panel cooking-area">
      <h3>그릴</h3>
      <p className="muted">재료를 선택해 올리고 적절한 판정 구간에서 회수하세요.</p>
      <GrillBoard
        initialSlots={initialSlots}
        ingredients={grillIngredients}
        inventory={state.ingredients}
        onUseIngredient={(ingredientId) => {
          dispatch({
            type: ActionTypes.USE_INGREDIENT,
            payload: { ingredientId },
          })
        }}
        onCollect={(item) => {
          dispatch({
            type: ActionTypes.COLLECT_INGREDIENT,
            payload: { ingredientId: item.ingredientId, result: item.result },
          })
        }}
      />
    </div>
  )
}
