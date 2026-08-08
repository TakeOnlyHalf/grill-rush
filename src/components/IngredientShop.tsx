import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Application } from 'pixi.js'
import { PixiStage } from '../pixi'
import {
  createIngredientMarketScene,
  type IngredientMarketHandle,
} from '../pixi/scenes/IngredientMarketScene'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { getRequiredIngredientIds } from '../state/formulas'
import {
  getIngredientCapacity,
  getIngredientCount,
} from '../utils/ingredientStorage'

/** 선택한 메뉴에 필요한 재료만 개별 구매하는 PixiJS 일반 마트 UI */
export default function IngredientShop() {
  const { state, dispatch } = useGame()
  const allowedIds = useMemo(
    () => getRequiredIngredientIds(state.activeMenus),
    [state.activeMenus],
  )
  const capacity = getIngredientCapacity(state.upgrades)
  const currentIngredientCount = getIngredientCount(state.ingredients)

  const sceneRef = useRef<IngredientMarketHandle | null>(null)
  const stateRef = useRef({
    cash: state.cash,
    owned: state.ingredients,
    dailyPurchases: state.dailyIngredientPurchases,
    allowedIds,
    capacity,
    currentIngredientCount,
  })
  stateRef.current = {
    cash: state.cash,
    owned: state.ingredients,
    dailyPurchases: state.dailyIngredientPurchases,
    allowedIds,
    capacity,
    currentIngredientCount,
  }

  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  useEffect(() => {
    sceneRef.current?.update({
      cash: state.cash,
      owned: state.ingredients,
      dailyPurchases: state.dailyIngredientPurchases,
      allowedIds,
      capacity,
      currentIngredientCount,
    })
  }, [
    state.cash,
    state.ingredients,
    state.dailyIngredientPurchases,
    allowedIds,
    capacity,
    currentIngredientCount,
  ])

  const setup = useCallback((app: Application) => {
    const scene = createIngredientMarketScene(
      app,
      stateRef.current,
      (ingredientId: string) => {
        dispatchRef.current({
          type: ActionTypes.BUY_INGREDIENT,
          payload: { ingredientId },
        })
      },
    )
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  return (
    <PixiStage
      className="prep-ingredient-pixi"
      fillParent
      background="transparent"
      setup={setup}
    />
  )
}
