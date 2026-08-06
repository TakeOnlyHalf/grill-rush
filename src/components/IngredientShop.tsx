import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Application } from 'pixi.js'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { getRequiredIngredientIds } from '../state/formulas'
import { PixiStage } from '../pixi'
import {
  createIngredientMarketScene,
  type IngredientMarketHandle,
} from '../pixi/scenes/IngredientMarketScene'
import ingredients from '../data/ingredients.json'
import {
  getIngredientCapacity,
  getIngredientCount,
} from '../utils/ingredientStorage'

/** 재료 매입 — PixiJS 마트 UI (선택 메뉴 재료만 해금) */
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
    allowedIds,
    capacity,
    currentIngredientCount,
  })
  stateRef.current = {
    cash: state.cash,
    owned: state.ingredients,
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
      allowedIds,
      capacity,
      currentIngredientCount,
    })
  }, [
    state.cash,
    state.ingredients,
    allowedIds,
    capacity,
    currentIngredientCount,
  ])

  const setup = useCallback((app: Application) => {
    const scene = createIngredientMarketScene(
      app,
      stateRef.current,
      (ingredientId: string) => {
        const ing = ingredients.find((i) => i.id === ingredientId)
        if (!ing) return
        dispatchRef.current({
          type: ActionTypes.BUY_INGREDIENT,
          payload: {
            ingredientId: ing.id,
            qty: 1,
            unitCost: ing.unitCost,
          },
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
