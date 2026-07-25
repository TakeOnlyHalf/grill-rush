import { useCallback, useEffect, useRef } from 'react'
import type { Application } from 'pixi.js'
import { PixiStage, createGrillBoardScene } from '../pixi'
import type {
  CollectedGrillItem,
  GrillIngredient,
  GrillSlot,
} from '../grill/grillSlots'
import type { GrillBoardSceneHandle } from '../pixi/scenes/GrillBoardScene'
import { colors } from '../ui/tokens'

export interface GrillBoardProps {
  initialSlots: GrillSlot[]
  ingredients: GrillIngredient[]
  inventory: Record<string, number>
  onUseIngredient?: (ingredientId: string) => void
  onCollect?: (item: CollectedGrillItem) => void
  onSlotsChange?: (slots: GrillSlot[]) => void
  height?: number
}

export default function GrillBoard({
  initialSlots,
  ingredients,
  inventory,
  onUseIngredient,
  onCollect,
  onSlotsChange,
  height = 350,
}: GrillBoardProps) {
  const sceneRef = useRef<GrillBoardSceneHandle | null>(null)
  const initialRef = useRef({ initialSlots, ingredients, inventory })
  const callbacksRef = useRef({ onUseIngredient, onCollect, onSlotsChange })
  callbacksRef.current = { onUseIngredient, onCollect, onSlotsChange }

  useEffect(() => {
    sceneRef.current?.updateInventory(inventory)
  }, [inventory])

  const setup = useCallback((app: Application) => {
    const initial = initialRef.current
    const scene = createGrillBoardScene(app, {
      slots: initial.initialSlots,
      ingredients: initial.ingredients,
      inventory: initial.inventory,
      onUseIngredient: (ingredientId) =>
        callbacksRef.current.onUseIngredient?.(ingredientId),
      onCollect: (item) => callbacksRef.current.onCollect?.(item),
      onSlotsChange: (slots) => callbacksRef.current.onSlotsChange?.(slots),
    })
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  return (
    <PixiStage
      className="grill-board-pixi"
      height={height}
      background={colors.bg.value}
      setup={setup}
    />
  )
}
