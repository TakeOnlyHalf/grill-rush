import { useCallback, useEffect, useRef } from 'react'
import type { Application } from 'pixi.js'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { PixiStage } from '../pixi'
import {
  createIngredientMarketScene,
  type IngredientMarketHandle,
} from '../pixi/scenes/IngredientMarketScene'
import ingredients from '../data/ingredients.json'

/** 재료 매입 — PixiJS 마트 UI */
export default function IngredientShop() {
  const { state, dispatch } = useGame()
  const sceneRef = useRef<IngredientMarketHandle | null>(null)
  const stateRef = useRef({
    cash: state.cash,
    owned: state.ingredients,
  })
  stateRef.current = {
    cash: state.cash,
    owned: state.ingredients,
  }

  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  useEffect(() => {
    sceneRef.current?.update({
      cash: state.cash,
      owned: state.ingredients,
    })
  }, [state.cash, state.ingredients])

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
      background="#2a4f36"
      setup={setup}
    />
  )
}
