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

export const GRILL_DESIGN_WIDTH = 1200
export const GRILL_DESIGN_HEIGHT = 420

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
  number: Text
  food: Text
  state: Text
  ingredient: Text
  timer: Text
  gauge: Graphics
  steam: Text
}

interface TrayView {
  root: Container
  surface: Graphics
  icon: Text
  name: Text
  detail: Text
  count: Text
}

const FRAME_PADDING = 20
const SLOT_GAP = 16
const SLOT_TOP = 58
const SLOT_HEIGHT = 218
const TRAY_TOP = 292
const TRAY_HEIGHT = 110
const SLOT_WIDTH =
  (GRILL_DESIGN_WIDTH - FRAME_PADDING * 2 - SLOT_GAP * 2) / 3

const resultLabels: Record<CookResult, string> = {
  raw: 'RAW · 덜 익음',
  good: 'GOOD · 조리 중',
  perfect: 'PERFECT · 지금 회수',
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
  const world = new Container()
  const chrome = new Graphics()
  const title = createText('GRILL STATION', 19, colors.cream.value, '700')
  const subtitle = createText('재료 선택 → 빈 슬롯 → 판정 구간에서 회수', 13, colors.chalk.value, '600')
  const capacity = createText('', 13, colors.cream.value, '700')
  const trayTitle = createText('재료 트레이', 17, colors.text.value, '700')
  const trayHint = createText('', 12, colors.muted.value, '600')
  const emptyTray = createText('구매한 조리 재료가 없습니다', 14, colors.muted.value, '600')
  const feedbackRoot = new Container()
  const feedbackPanel = new Graphics()
  const feedbackTitle = createText('', 31, colors.cream.value, '700')
  const feedbackStars = createText('', 20, colors.gold.value, '700')
  const feedbackDetail = createText('', 14, colors.cream.value, '600')
  let slots = cloneSlots(options.slots)
  let inventory = { ...options.inventory }
  let selectedIngredientId: string | null = null
  const now = options.now ?? Date.now
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let feedbackStartedAt: number | null = null

  app.stage.addChild(world)
  world.addChild(chrome, title, subtitle, capacity, trayTitle, trayHint, emptyTray, feedbackRoot)
  drawChrome(chrome)

  title.x = 30
  title.y = 16
  subtitle.x = 208
  subtitle.y = 20
  capacity.anchor.set(1, 0)
  capacity.x = GRILL_DESIGN_WIDTH - 28
  capacity.y = 20
  trayTitle.x = 30
  trayTitle.y = TRAY_TOP + 13
  trayHint.anchor.set(1, 0)
  trayHint.x = GRILL_DESIGN_WIDTH - 30
  trayHint.y = TRAY_TOP + 16
  emptyTray.x = 30
  emptyTray.y = TRAY_TOP + 58

  feedbackRoot.eventMode = 'none'
  feedbackRoot.visible = false
  feedbackRoot.x = GRILL_DESIGN_WIDTH / 2
  feedbackRoot.y = 178
  feedbackTitle.anchor.set(0.5)
  feedbackStars.anchor.set(0.5)
  feedbackDetail.anchor.set(0.5)
  feedbackRoot.addChild(feedbackPanel, feedbackTitle, feedbackStars, feedbackDetail)

  const slotViews: SlotView[] = slots.map((_slot, index) => {
    const slotRoot = new Container()
    const view: SlotView = {
      root: slotRoot,
      surface: new Graphics(),
      number: createText(String(index + 1).padStart(2, '0'), 13, colors.cream.value, '700'),
      food: createText('', 56, colors.text.value),
      state: createText('', 15, colors.text.value, '700'),
      ingredient: createText('', 13, colors.muted.value, '600'),
      timer: createText('', 13, colors.text.value, '700'),
      gauge: new Graphics(),
      steam: createText('♨  ♨', 18, colors.cream.value, '700'),
    }
    slotRoot.x = FRAME_PADDING + index * (SLOT_WIDTH + SLOT_GAP)
    slotRoot.y = SLOT_TOP
    slotRoot.hitArea = new Rectangle(0, 0, SLOT_WIDTH, SLOT_HEIGHT)
    slotRoot.eventMode = 'static'
    slotRoot.on('pointertap', () => handleSlotTap(index))
    view.number.x = 15
    view.number.y = 12
    view.food.anchor.set(0.5)
    view.food.x = SLOT_WIDTH / 2
    view.food.y = 86
    view.steam.anchor.set(0.5)
    view.steam.x = SLOT_WIDTH / 2
    view.state.x = 18
    view.state.y = 145
    view.ingredient.x = 18
    view.ingredient.y = 169
    view.timer.anchor.set(1, 0)
    view.timer.x = SLOT_WIDTH - 18
    view.timer.y = 169
    slotRoot.addChild(
      view.surface,
      view.number,
      view.food,
      view.steam,
      view.state,
      view.ingredient,
      view.timer,
      view.gauge,
    )
    world.addChild(slotRoot)
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
      icon: createText(ingredient.icon, 33, colors.text.value),
      name: createText(ingredient.name, 13, colors.text.value, '700'),
      detail: createText(`${ingredient.cookDurationMs / 1_000}초 조리`, 11, colors.muted.value, '600'),
      count: createText('', 16, colors.text.value, '700'),
    }
    trayRoot.eventMode = 'static'
    trayRoot.on('pointertap', () => handleTrayTap(ingredient.id))
    trayRoot.addChild(view.surface, view.icon, view.name, view.detail, view.count)
    world.addChild(trayRoot)
    return view
  })
  world.addChild(feedbackRoot)
  layoutTray()
  const textNodes: Text[] = [
    title,
    subtitle,
    capacity,
    trayTitle,
    trayHint,
    emptyTray,
    feedbackTitle,
    feedbackStars,
    feedbackDetail,
    ...slotViews.flatMap((view) => [
      view.number,
      view.food,
      view.state,
      view.ingredient,
      view.timer,
      view.steam,
    ]),
    ...trayViews.flatMap((view) => [view.icon, view.name, view.detail, view.count]),
  ]

  function layoutToScreen() {
    const scale = Math.min(
      app.screen.width / GRILL_DESIGN_WIDTH,
      app.screen.height / GRILL_DESIGN_HEIGHT,
    )
    world.scale.set(scale)
    world.x = (app.screen.width - GRILL_DESIGN_WIDTH * scale) / 2
    world.y = (app.screen.height - GRILL_DESIGN_HEIGHT * scale) / 2
    const textResolution = Math.min(
      4,
      Math.max(2, (window.devicePixelRatio || 1) * scale),
    )
    textNodes.forEach((text) => {
      text.resolution = textResolution
    })
  }

  function layoutTray() {
    const count = trayViews.length
    if (count === 0) return
    const gap = 10
    const availableWidth = GRILL_DESIGN_WIDTH - 48
    const cardWidth = (availableWidth - gap * (count - 1)) / count
    trayViews.forEach((view, index) => {
      view.root.x = 24 + index * (cardWidth + gap)
      view.root.y = TRAY_TOP + 39
      view.root.hitArea = new Rectangle(0, 0, cardWidth, 60)
      view.icon.x = 12
      view.icon.y = 10
      view.name.x = 58
      view.name.y = 10
      view.detail.x = 58
      view.detail.y = 31
      view.count.anchor.set(1, 0.5)
      view.count.x = cardWidth - 14
      view.count.y = 29
    })
  }

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
    feedbackPanel.roundRect(-176, -72, 352, 144, 20)
    feedbackPanel.fill({ color: darkPanel ? colors.text.value : colors.bgPanel.value, alpha: 0.98 })
    feedbackPanel.stroke({ color: accent, width: result === 'perfect' ? 5 : 3 })
    feedbackTitle.y = feedback.stars > 0 ? -32 : -19
    feedbackStars.y = 5
    feedbackDetail.y = feedback.stars > 0 ? 40 : 25
    feedbackRoot.visible = true
    feedbackRoot.alpha = 1
  }

  function isGrillFull() {
    return slots.every((slot) => slot.status !== 'idle')
  }

  function ingredientFor(slot: GrillSlot) {
    return options.ingredients.find((ingredient) => ingredient.id === slot.ingredientId)
  }

  function renderSlot(index: number, time: number) {
    const slot = slots[index]
    const view = slotViews[index]
    const ingredient = ingredientFor(slot)
    const progress = getCookProgress(slot, time)
    const result = slot.status === 'burnt' ? 'burnt' : getCookResult(progress)
    const stateColor = slot.status === 'idle' ? colors.border.value : resultColors[result]
    const pulse = reduceMotion ? 0.5 : (Math.sin(time / 90) + 1) / 2

    view.surface.clear()
    view.surface.roundRect(0, 0, SLOT_WIDTH, SLOT_HEIGHT, 15)
    view.surface.fill(colors.text.value)
    view.surface.stroke({ color: stateColor, width: result === 'perfect' ? 5 : 3 })
    view.surface.roundRect(6, 6, SLOT_WIDTH - 12, SLOT_HEIGHT - 12, 11)
    view.surface.fill(colors.bgPanel.value)
    view.surface.roundRect(14, 40, SLOT_WIDTH - 28, 93, 10)
    view.surface.fill({ color: colors.woodDeep.value, alpha: 0.42 })
    for (let x = 28; x < SLOT_WIDTH - 18; x += 22) {
      view.surface.roundRect(x, 49, 4, 72, 2)
      view.surface.fill({ color: colors.text.value, alpha: 0.27 })
    }

    view.number.style.fill = slot.status === 'idle' ? colors.muted.value : colors.cream.value
    view.food.text = ingredient?.icon ?? '＋'
    view.food.style.fill = slot.status === 'idle' ? colors.muted.value : colors.text.value
    const emphasisScale = result === 'perfect'
      ? 1.04 + pulse * 0.05
      : result === 'danger'
        ? 1 + pulse * 0.08
        : result === 'good'
          ? 1.03
          : 1
    view.food.scale.set(emphasisScale)
    view.food.alpha = slot.status === 'idle' ? 0.26 : result === 'burnt' ? 0.38 : 1
    view.surface.alpha = result === 'danger' ? 0.72 + pulse * 0.28 : 1
    view.steam.y = 48 - pulse * 7
    view.steam.visible = slot.status === 'cooking' && progress >= 0.3
    view.steam.alpha = reduceMotion ? 0.62 : 0.34 + pulse * 0.46
    view.state.text = slot.status === 'idle' ? '빈 슬롯 · 재료를 올려주세요' : resultLabels[result]
    view.state.style.fill = slot.status === 'idle' ? colors.muted.value : colors.text.value
    view.ingredient.text = ingredient?.name ?? '대기 중'
    view.timer.text = slot.status === 'idle'
      ? ''
      : `${Math.max(0, Math.ceil((slot.cookDurationMs * (1 - progress)) / 1_000))}s`
    view.root.cursor = slot.status === 'idle' && !selectedIngredientId ? 'default' : 'pointer'

    drawGauge(view.gauge, progress, slot.status !== 'idle', stateColor)
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
      feedbackRoot.y = 178
      feedbackRoot.alpha = elapsed < 700 ? 1 : (COOK_FEEDBACK_DURATION_MS - elapsed) / 100
      return
    }
    const progress = elapsed / COOK_FEEDBACK_DURATION_MS
    const entry = Math.min(1, progress / 0.22)
    const rebound = 1 + Math.sin(entry * Math.PI) * 0.1
    feedbackRoot.scale.set((0.72 + entry * 0.28) * rebound)
    feedbackRoot.y = 178 - progress * 18
    feedbackRoot.alpha = progress < 0.72 ? 1 : (1 - progress) / 0.28
  }

  function renderTray() {
    const full = isGrillFull()
    const activeSlots = slots.filter((slot) => slot.status !== 'idle').length
    capacity.text = `사용 중 ${activeSlots} / ${slots.length}`
    trayHint.text = full
      ? '그릴이 가득 찼습니다'
      : selectedIngredientId
        ? '빈 슬롯을 선택하세요'
        : '재료를 선택하세요'
    emptyTray.visible = trayViews.length === 0
    const gap = 10
    const cardWidth = trayViews.length
      ? (GRILL_DESIGN_WIDTH - 48 - gap * (trayViews.length - 1)) / trayViews.length
      : 0

    trayViews.forEach((view, index) => {
      const ingredient = trayIngredients[index]
      const count = inventory[ingredient.id] ?? 0
      const selected = selectedIngredientId === ingredient.id
      const disabled = count <= 0 || full
      view.surface.clear()
      view.surface.roundRect(0, 0, cardWidth, 60, 11)
      view.surface.fill(selected ? colors.accent2.value : colors.bgPanel2.value)
      view.surface.stroke({
        color: selected ? colors.accent.value : colors.border.value,
        width: selected ? 4 : 2,
      })
      view.count.text = String(count)
      view.count.style.fill = count <= 0 ? colors.muted.value : colors.text.value
      view.root.alpha = disabled ? 0.46 : 1
      view.root.cursor = disabled ? 'not-allowed' : 'pointer'
    })
  }

  const onResize = () => layoutToScreen()
  app.renderer.on('resize', onResize)

  const onTick = (_ticker: Ticker) => {
    const time = now()
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

  layoutToScreen()
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
      app.renderer.off('resize', onResize)
      app.ticker.remove(onTick)
      slotViews.forEach((view) => view.root.removeAllListeners())
      trayViews.forEach((view) => view.root.removeAllListeners())
      selectedIngredientId = null
      feedbackStartedAt = null
      slots = []
      inventory = {}
      world.destroy({ children: true })
    },
  }
}

function drawChrome(graphics: Graphics) {
  graphics.roundRect(0, 0, GRILL_DESIGN_WIDTH, GRILL_DESIGN_HEIGHT, 18)
  graphics.fill(colors.bg.value)
  graphics.roundRect(8, 8, GRILL_DESIGN_WIDTH - 16, GRILL_DESIGN_HEIGHT - 16, 14)
  graphics.stroke({ color: colors.border.value, width: 2 })
  graphics.roundRect(16, 12, GRILL_DESIGN_WIDTH - 32, 38, 10)
  graphics.fill(colors.text.value)
  graphics.roundRect(14, SLOT_TOP - 8, GRILL_DESIGN_WIDTH - 28, SLOT_HEIGHT + 16, 16)
  graphics.fill(colors.woodDeep.value)
  graphics.roundRect(18, SLOT_TOP - 4, GRILL_DESIGN_WIDTH - 36, SLOT_HEIGHT + 8, 13)
  graphics.fill({ color: colors.text.value, alpha: 0.86 })
  graphics.roundRect(14, TRAY_TOP, GRILL_DESIGN_WIDTH - 28, TRAY_HEIGHT, 16)
  graphics.fill(colors.bgPanel.value)
  graphics.stroke({ color: colors.border.value, width: 2 })
}

function drawGauge(graphics: Graphics, progress: number, active: boolean, color: string) {
  const x = 18
  const y = SLOT_HEIGHT - 20
  const width = SLOT_WIDTH - 36
  graphics.clear()
  graphics.roundRect(x, y, width, 9, 5)
  graphics.fill(colors.border.value)
  if (!active) return
  graphics.roundRect(x, y, width * Math.min(1, progress), 9, 5)
  graphics.fill(color)
  for (const mark of [0.4, 0.7, 0.9]) {
    graphics.rect(x + width * mark, y - 2, 2, 13)
    graphics.fill(colors.text.value)
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
