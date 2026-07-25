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

export interface GrillBoardSceneOptions {
  slots: GrillSlot[]
  ingredients: GrillIngredient[]
  inventory: Record<string, number>
  onUseIngredient?: (ingredientId: string) => void
  onCollect?: (item: CollectedGrillItem) => void
  onSlotsChange?: (slots: GrillSlot[]) => void
  now?: () => number
}

export interface GrillBoardSceneHandle {
  destroy: () => void
  updateInventory: (inventory: Record<string, number>) => void
}

interface SlotView {
  root: Container
  surface: Graphics
  food: Text
  state: Text
  ingredient: Text
  gauge: Graphics
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
  danger: cookColors.warning.value,
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
  let slots = cloneSlots(options.slots)
  let inventory = { ...options.inventory }
  let selectedIngredientId: string | null = null
  const now = options.now ?? Date.now

  app.stage.addChild(root)
  root.addChild(board, grillTitle, trayTitle, trayHint, emptyTray)

  const slotViews: SlotView[] = slots.map((_slot, index) => {
    const slotRoot = new Container()
    const view: SlotView = {
      root: slotRoot,
      surface: new Graphics(),
      food: createText('', 34, colors.text.value),
      state: createText('', 11, colors.text.value, '700'),
      ingredient: createText('', 10, colors.muted.value),
      gauge: new Graphics(),
    }
    slotRoot.eventMode = 'static'
    slotRoot.on('pointertap', () => handleSlotTap(index))
    slotRoot.addChild(view.surface, view.food, view.state, view.ingredient, view.gauge)
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
    options.onCollect?.({
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
          options.onCollect?.({
            slotId: resolved.id,
            ingredientId: resolved.ingredientId,
            result: 'burnt',
            progress: getCookProgress(resolved, time),
          })
        }
      }
      renderSlot(index, time)
    }
    if (changed) {
      emitSlots()
      renderTray()
    }
  }

  layout()
  renderTray()
  onTick(app.ticker)
  app.ticker.add(onTick)

  return {
    updateInventory(nextInventory) {
      inventory = { ...nextInventory }
      if (selectedIngredientId && (inventory[selectedIngredientId] ?? 0) <= 0) {
        selectedIngredientId = null
      }
      renderTray()
    },
    destroy() {
      app.ticker.remove(onTick)
      slotViews.forEach((view) => view.root.removeAllListeners())
      trayViews.forEach((view) => view.root.removeAllListeners())
      selectedIngredientId = null
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
