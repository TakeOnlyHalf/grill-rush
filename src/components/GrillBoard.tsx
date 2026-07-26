import { useCallback, useEffect, useRef, useState } from 'react'
import type { Application } from 'pixi.js'
import { PixiStage, createGrillBoardScene } from '../pixi'
import type {
  CollectedGrillItem,
  GrillIngredient,
  GrillSlot,
  CookResult,
} from '../grill/grillSlots'
import type { GrillBoardSceneHandle } from '../pixi/scenes/GrillBoardScene'
import { colors } from '../ui/tokens'
import { COOK_FEEDBACK_DURATION_MS, getCookFeedbackAnnouncement } from '../grill/grillFeedback'

export interface GrillBoardProps {
  initialSlots: GrillSlot[]
  ingredients: GrillIngredient[]
  inventory: Record<string, number>
  onUseIngredient?: (ingredientId: string) => void
  onCollect?: (item: CollectedGrillItem) => void
  onSlotsChange?: (slots: GrillSlot[]) => void
  height?: number
  initialFeedback?: CookResult
}

export default function GrillBoard({
  initialSlots,
  ingredients,
  inventory,
  onUseIngredient,
  onCollect,
  onSlotsChange,
  height = 350,
  initialFeedback,
}: GrillBoardProps) {
  const sceneRef = useRef<GrillBoardSceneHandle | null>(null)
  const initialRef = useRef({ initialSlots, ingredients, inventory, initialFeedback })
  const announcementTimerRef = useRef<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const callbacksRef = useRef({ onUseIngredient, onCollect, onSlotsChange })
  callbacksRef.current = { onUseIngredient, onCollect, onSlotsChange }

  useEffect(() => {
    sceneRef.current?.updateInventory(inventory)
  }, [inventory])

  useEffect(() => {
    if (initialFeedback) sceneRef.current?.showFeedback(initialFeedback)
  }, [initialFeedback])

  useEffect(() => () => {
    if (announcementTimerRef.current !== null) {
      window.clearTimeout(announcementTimerRef.current)
    }
  }, [])

  const announceResult = useCallback((item: CollectedGrillItem) => {
    if (announcementTimerRef.current !== null) {
      window.clearTimeout(announcementTimerRef.current)
    }
    setAnnouncement(getCookFeedbackAnnouncement(item.result))
    announcementTimerRef.current = window.setTimeout(() => {
      setAnnouncement('')
      announcementTimerRef.current = null
    }, COOK_FEEDBACK_DURATION_MS)
    callbacksRef.current.onCollect?.(item)
  }, [])

  const setup = useCallback((app: Application) => {
    const initial = initialRef.current
    const scene = createGrillBoardScene(app, {
      slots: initial.initialSlots,
      ingredients: initial.ingredients,
      inventory: initial.inventory,
      initialFeedback: initial.initialFeedback,
      onUseIngredient: (ingredientId) =>
        callbacksRef.current.onUseIngredient?.(ingredientId),
      onCollect: announceResult,
      onSlotsChange: (slots) => callbacksRef.current.onSlotsChange?.(slots),
    })
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [announceResult])

  return (
    <div className="grill-board-wrap">
      <PixiStage
        className="grill-board-pixi"
        height={height}
        background={colors.bg.value}
        setup={setup}
      />
      <div className="visually-hidden" role="status" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
    </div>
  )
}
