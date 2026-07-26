import { Container, Graphics, Rectangle, Text, type Application, type Ticker } from 'pixi.js'
import { colors, cookColors, typography } from '../../ui/tokens'
import {
  clearGrillSlot,
  getCookProgress,
  getCookResult,
  placeIngredient,
  resolveGrillSlot,
  type CollectedGrillItem,
  type CookResult,
  type GrillIngredient,
  type GrillSlot,
} from '../../grill/grillSlots'
import { COOK_FEEDBACK_DURATION_MS, cookFeedback } from '../../grill/grillFeedback'

export interface GrillBoardSceneOptions {
  slots: GrillSlot[]
  ingredients: GrillIngredient[]
  inventory: Record<string, number>
  onUseIngredient?: (ingredientId: string) => void
  onCollect?: (item: CollectedGrillItem) => void
  onSlotsChange?: (slots: GrillSlot[]) => void
  now?: () => number
  initialFeedback?: CookResult
}

export interface GrillBoardSceneHandle {
  destroy: () => void
  updateInventory: (inventory: Record<string, number>) => void
  showFeedback: (result: CookResult) => void
}

interface SlotView {
  root: Container
  surface: Graphics
  food: Text
  state: Text
  ingredient: Text
  gauge: Graphics
  steam: Text
}

interface TrayView {
  root: Container
  surface: Graphics
  icon: Text
  name: Text
  detail: Text
}

const resultLabels: Record<CookResult, string> = {
  raw: 'RAW · 덜 익음',
  good: 'GOOD',
  perfect: 'PERFECT',
  danger: 'DANGER · 타기 직전',
  burnt: 'BURNT · 클릭해 제거',
}

const resultColors: Record<CookResult, string> = {
  raw: cookColors.idle.value,
  good: cookColors.cooking.value,
  perfect: cookColors.done.value,
  danger: colors.danger.value,
  burnt: cookColors.burnt.value,
}

const cloneSlots = (slots: GrillSlot[]) => slots.map((slot) => ({ ...slot }))

export function createGrillBoardScene(
  app: Application,
  options: GrillBoardSceneOptions,
): GrillBoardSceneHandle {
  const root = new Container()
  const board = new Graphics()
  const grillTitle = createText('GRILL · 슬롯을 클릭해 회수', 14, colors.cream.value, '700')
  const trayTitle = createText('재료 트레이', 13, colors.text.value, '700')
  const trayHint = createText('', 10, colors.muted.value)
  const emptyTray = createText('구매한 조리 재료가 없습니다', 12, colors.muted.value, '600')
  const feedbackRoot = new Container()
  const feedbackPanel = new Graphics()
  const feedbackTitle = createText('', 28, colors.cream.value, '700')
  const feedbackStars = createText('', 18, colors.gold.value, '700')
  const feedbackDetail = createText('', 12, colors.cream.value, '600')
  let slots = cloneSlots(options.slots)
  let inventory = { ...options.inventory }
  let selectedIngredientId: string | null = null
  const now = options.now ?? Date.now
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let feedbackStartedAt: number | null = null

  app.stage.addChild(root)
  root.addChild(board, grillTitle, trayTitle, trayHint, emptyTray, feedbackRoot)
  feedbackRoot.eventMode = 'none'
  feedbackRoot.visible = false
  feedbackTitle.anchor.set(0.5)
  feedbackStars.anchor.set(0.5)
  feedbackDetail.anchor.set(0.5)
  feedbackRoot.addChild(feedbackPanel, feedbackTitle, feedbackStars, feedbackDetail)

  const slotViews: SlotView[] = slots.map((_slot, index) => {
    const slotRoot = new Container()
    const view: SlotView = {
      root: slotRoot,
      surface: new Graphics(),
      food: createText('', 34, colors.text.value),
      state: createText('', 11, colors.text.value, '700'),
      ingredient: createText('', 10, colors.muted.value),
      gauge: new Graphics(),
      steam: createText('〰 〰 〰', 13, colors.cream.value, '700'),
    }
    slotRoot.eventMode = 'static'
    slotRoot.on('pointertap', () => handleSlotTap(index))
    view.steam.anchor.set(0.5)
    slotRoot.addChild(view.surface, view.food, view.steam, view.state, view.ingredient, view.gauge)
    root.addChild(slotRoot)
    return view
  })

  const trayIngredients = options.ingredients.filter((ingredient) =>
    Object.prototype.hasOwnProperty.call(inventory, ingredient.id),
  )
  const trayViews: TrayView[] = trayIngredients.map((ingredient) => {
    const trayRoot = new Container()
    const view: TrayView = {
      root: trayRoot,
      surface: new Graphics(),
      icon: createText(ingredient.icon, 24, colors.text.value),
      name: createText(ingredient.name, 10, colors.text.value, '700'),
      detail: createText('', 9, colors.muted.value),
    }
    trayRoot.eventMode = 'static'
    trayRoot.on('pointertap', () => handleTrayTap(ingredient.id))
    trayRoot.addChild(view.surface, view.icon, view.name, view.detail)
    root.addChild(trayRoot)
    return view
  })
  root.addChild(feedbackRoot)

  function handleTrayTap(ingredientId: string) {
    if ((inventory[ingredientId] ?? 0) <= 0 || isGrillFull()) return
    selectedIngredientId = selectedIngredientId === ingredientId ? null : ingredientId
    renderTray()
  }

  function handleSlotTap(index: number) {
    const slot = slots[index]
    const time = now()
    if (slot.status === 'idle') {
      if (!selectedIngredientId || isGrillFull()) return
      const ingredient = options.ingredients.find((item) => item.id === selectedIngredientId)
      if (!ingredient || (inventory[ingredient.id] ?? 0) <= 0) return
      slots[index] = placeIngredient(slot, ingredient, time)
      inventory[ingredient.id] = Math.max(0, (inventory[ingredient.id] ?? 0) - 1)
      options.onUseIngredient?.(ingredient.id)
      if (inventory[ingredient.id] === 0) selectedIngredientId = null
      emitSlots()
      renderTray()
      renderSlot(index, time)
      return
    }

    if (slot.status === 'burnt') {
      slots[index] = clearGrillSlot(slot)
      emitSlots()
      renderTray()
      renderSlot(index, time)
      return
    }

    if (!slot.ingredientId) return
    const progress = getCookProgress(slot, time)
    const result = getCookResult(progress)
    reportResult({
      slotId: slot.id,
      ingredientId: slot.ingredientId,
      result,
      progress,
    })
    slots[index] = clearGrillSlot(slot)
    emitSlots()
    renderTray()
    renderSlot(index, time)
  }

  function emitSlots() {
    options.onSlotsChange?.(cloneSlots(slots))
  }

  function reportResult(item: CollectedGrillItem) {
    showFeedback(item.result)
    options.onCollect?.(item)
  }

  function showFeedback(result: CookResult) {
    const feedback = cookFeedback[result]
    const accent = resultColors[result]
    const darkPanel = result === 'burnt'
    feedbackStartedAt = now()
    feedbackTitle.text = feedback.title
    feedbackTitle.style.fill = darkPanel ? colors.cream.value : colors.text.value
    feedbackStars.text = feedback.stars > 0 ? '★'.repeat(feedback.stars) : ''
    feedbackDetail.text = feedback.detail
    feedbackDetail.style.fill = darkPanel ? colors.cream.value : colors.text.value
    feedbackPanel.clear()
    feedbackPanel.roundRect(-150, -60, 300, 120, 18)
    feedbackPanel.fill({ color: darkPanel ? colors.text.value : colors.bgPanel.value, alpha: 0.97 })
    feedbackPanel.stroke({ color: result === 'burnt' ? colors.danger.value : accent, width: result === 'perfect' ? 4 : 3 })
    feedbackTitle.y = feedback.stars > 0 ? -27 : -18
    feedbackStars.y = 4
    feedbackDetail.y = feedback.stars > 0 ? 34 : 22
    feedbackRoot.visible = true
    feedbackRoot.alpha = 1
  }

  function isGrillFull() {
    return slots.every((slot) => slot.status !== 'idle')
  }

  function ingredientFor(slot: GrillSlot) {
    return options.ingredients.find((ingredient) => ingredient.id === slot.ingredientId)
  }

  function dimensions() {
    const width = app.screen.width
    const padding = 18
    const gap = 12
    const slotTop = 38
    const slotHeight = 170
    const trayTop = 238
    return {
      padding,
      gap,
      slotTop,
      slotHeight,
      trayTop,
      slotWidth: (width - padding * 2 - gap * 2) / 3,
    }
  }

  function layout() {
    const { padding, gap, slotTop, slotHeight, trayTop, slotWidth } = dimensions()
    board.clear()
    board.roundRect(8, 8, app.screen.width - 16, 212, 14)
    board.fill(colors.text.value)
    board.roundRect(12, 12, app.screen.width - 24, 204, 11)
    board.fill(colors.woodDeep.value)
    board.roundRect(8, 228, app.screen.width - 16, app.screen.height - 236, 14)
    board.fill(colors.bgPanel.value)
    grillTitle.x = 18
    grillTitle.y = 14
    trayTitle.x = 18
    trayTitle.y = 235
    trayHint.x = app.screen.width - trayHint.width - 18
    trayHint.y = 237
    feedbackRoot.x = app.screen.width / 2
    feedbackRoot.y = 144

    slotViews.forEach((view, index) => {
      view.root.x = padding + index * (slotWidth + gap)
      view.root.y = slotTop
      view.root.hitArea = new Rectangle(0, 0, slotWidth, slotHeight)
      view.food.x = slotWidth / 2
      view.food.y = 48
      view.food.anchor.set(0.5)
      view.state.x = 10
      view.state.y = 112
      view.ingredient.x = 10
      view.ingredient.y = 132
    })

    const trayGap = 8
    const trayWidth = trayViews.length
      ? (app.screen.width - padding * 2 - trayGap * Math.max(0, trayViews.length - 1)) /
        trayViews.length
      : 0
    trayViews.forEach((view, index) => {
      view.root.x = padding + index * (trayWidth + trayGap)
      view.root.y = trayTop + 22
      view.root.hitArea = new Rectangle(0, 0, trayWidth, 78)
      view.icon.x = 10
      view.icon.y = 8
      view.name.x = 43
      view.name.y = 10
      view.detail.x = 43
      view.detail.y = 31
    })
    emptyTray.x = 18
    emptyTray.y = trayTop + 52
  }

  function renderSlot(index: number, time: number) {
    const slot = slots[index]
    const view = slotViews[index]
    const { slotWidth, slotHeight } = dimensions()
    const ingredient = ingredientFor(slot)
    const progress = getCookProgress(slot, time)
    const result = slot.status === 'burnt' ? 'burnt' : getCookResult(progress)
    const stateColor = slot.status === 'idle' ? cookColors.idle.value : resultColors[result]

    view.surface.clear()
    view.surface.roundRect(0, 0, slotWidth, slotHeight, 10)
    view.surface.fill(stateColor)
    view.surface.roundRect(5, 5, slotWidth - 10, slotHeight - 10, 7)
    view.surface.fill(colors.bgPanel.value)
    for (let x = 14; x < slotWidth - 8; x += 14) {
      view.surface.rect(x, 10, 3, 94)
      view.surface.fill({ color: colors.text.value, alpha: 0.24 })
    }

    view.food.text = ingredient?.icon ?? ''
    const pulse = reduceMotion ? 0.5 : (Math.sin(time / 90) + 1) / 2
    const emphasisScale = result === 'perfect'
      ? 1.04 + pulse * 0.05
      : result === 'danger'
        ? 1 + pulse * 0.08
        : result === 'good'
          ? 1.03
          : 1
    view.food.scale.set(emphasisScale)
    view.food.alpha = result === 'burnt' ? 0.38 : 1
    view.surface.alpha = result === 'danger' ? 0.68 + pulse * 0.32 : 1
    view.steam.x = slotWidth / 2
    view.steam.y = 23 - pulse * 5
    view.steam.visible = slot.status === 'cooking' && progress >= 0.3
    view.steam.alpha = reduceMotion ? 0.62 : 0.35 + pulse * 0.4
    view.state.text = slot.status === 'idle' ? '비어 있음 · 선택 재료 투입' : resultLabels[result]
    view.ingredient.text = ingredient?.name ?? '빈 슬롯'
    view.root.cursor = slot.status === 'idle' && !selectedIngredientId ? 'default' : 'pointer'

    view.gauge.clear()
    view.gauge.roundRect(10, slotHeight - 12, slotWidth - 20, 6, 3)
    view.gauge.fill(colors.border.value)
    if (slot.status !== 'idle') {
      const gaugeWidth = (slotWidth - 20) * Math.min(1, progress)
      view.gauge.roundRect(10, slotHeight - 12, gaugeWidth, 6, 3)
      view.gauge.fill(stateColor)
      for (const mark of [0.4, 0.7, 0.9]) {
        view.gauge.rect(10 + (slotWidth - 20) * mark, slotHeight - 13, 1, 8)
        view.gauge.fill(colors.text.value)
      }
    }
  }

  function renderFeedback(time: number) {
    if (feedbackStartedAt === null) return
    const elapsed = time - feedbackStartedAt
    if (elapsed >= COOK_FEEDBACK_DURATION_MS) {
      feedbackStartedAt = null
      feedbackRoot.visible = false
      return
    }
    if (reduceMotion) {
      feedbackRoot.scale.set(1)
      feedbackRoot.y = 144
      feedbackRoot.alpha = elapsed < 700 ? 1 : (COOK_FEEDBACK_DURATION_MS - elapsed) / 100
      return
    }
    const progress = elapsed / COOK_FEEDBACK_DURATION_MS
    const entry = Math.min(1, progress / 0.22)
    const rebound = 1 + Math.sin(entry * Math.PI) * 0.1
    feedbackRoot.scale.set((0.72 + entry * 0.28) * rebound)
    feedbackRoot.y = 144 - progress * 18
    feedbackRoot.alpha = progress < 0.72 ? 1 : (1 - progress) / 0.28
  }

  function renderTray() {
    const full = isGrillFull()
    trayHint.text = full ? '그릴이 가득 찼습니다' : selectedIngredientId ? '빈 슬롯을 선택하세요' : '재료를 선택하세요'
    trayHint.x = app.screen.width - trayHint.width - 18
    emptyTray.visible = trayViews.length === 0
    const trayGap = 8
    const trayWidth = trayViews.length
      ? (app.screen.width - 36 - trayGap * Math.max(0, trayViews.length - 1)) / trayViews.length
      : 0

    trayViews.forEach((view, index) => {
      const ingredient = trayIngredients[index]
      const count = inventory[ingredient.id] ?? 0
      const selected = selectedIngredientId === ingredient.id
      const disabled = count <= 0 || full
      view.surface.clear()
      view.surface.roundRect(0, 0, trayWidth, 78, 9)
      view.surface.fill(selected ? cookColors.cooking.value : colors.bgPanel2.value)
      view.surface.stroke({
        color: selected ? colors.accent.value : colors.border.value,
        width: selected ? 3 : 1,
      })
      view.detail.text = count <= 0
        ? '품절'
        : `${count}개 · ${ingredient.cookDurationMs / 1_000}초`
      view.root.alpha = disabled ? 0.48 : 1
      view.root.cursor = disabled ? 'not-allowed' : 'pointer'
    })
  }

  let lastWidth = 0
  let lastHeight = 0
  const onTick = (_ticker: Ticker) => {
    const time = now()
    if (lastWidth !== app.screen.width || lastHeight !== app.screen.height) {
      lastWidth = app.screen.width
      lastHeight = app.screen.height
      layout()
      renderTray()
    }
    let changed = false
    for (let index = 0; index < slots.length; index += 1) {
      const previous = slots[index]
      const resolved = resolveGrillSlot(previous, time)
      if (resolved !== previous) {
        slots[index] = resolved
        changed = true
        if (resolved.ingredientId) {
          reportResult({
            slotId: resolved.id,
            ingredientId: resolved.ingredientId,
            result: 'burnt',
            progress: getCookProgress(resolved, time),
          })
        }
      }
      renderSlot(index, time)
    }
    renderFeedback(time)
    if (changed) {
      emitSlots()
      renderTray()
    }
  }

  layout()
  renderTray()
  onTick(app.ticker)
  if (options.initialFeedback) showFeedback(options.initialFeedback)
  app.ticker.add(onTick)

  return {
    updateInventory(nextInventory) {
      inventory = { ...nextInventory }
      if (selectedIngredientId && (inventory[selectedIngredientId] ?? 0) <= 0) {
        selectedIngredientId = null
      }
      renderTray()
    },
    showFeedback,
    destroy() {
      app.ticker.remove(onTick)
      slotViews.forEach((view) => view.root.removeAllListeners())
      trayViews.forEach((view) => view.root.removeAllListeners())
      selectedIngredientId = null
      feedbackStartedAt = null
      slots = []
      inventory = {}
      root.destroy({ children: true })
    },
  }
}

function createText(
  text: string,
  fontSize: number,
  fill: string,
  fontWeight: '400' | '600' | '700' = '400',
) {
  return new Text({
    text,
    style: {
      fontFamily: typography.font.value,
      fontSize,
      fill,
      fontWeight,
    },
  })
}
