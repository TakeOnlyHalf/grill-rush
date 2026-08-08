import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  type Ticker,
} from 'pixi.js'
import ingredientsData from '../../data/ingredients.json'
import { MART_BACKGROUND_ART } from '../../utils/assets'
import { layoutPrepUiWorld } from '../layoutPrepUi'

export const MARKET_W = 920
export const MARKET_H = 560

const M = {
  card: 0xfff4e2,
  cardEdge: 0xe8d0b0,
  cardHover: 0xfffaf0,
  accent: 0xe85d04,
  accent2: 0xf48c06,
  buy: 0x2f9e44,
  buyDark: 0x237a34,
  buyDisabled: 0x8d867e,
  text: 0x3a2a1c,
  muted: 0x7a6550,
  white: 0xffffff,
  cashBg: 0x1a1410,
  chalk: 0xf5efe4,
  woodLight: 0xb8793c,
}

interface IngredientDef {
  id: string
  name: string
  category: string
  unitCost: number
  icon: string
}

const ITEMS = ingredientsData as IngredientDef[]

export interface IngredientMarketState {
  cash: number
  owned: Record<string, number>
  dailyPurchases: Record<string, number>
  allowedIds: string[]
  purchaseLimit: number
}

export interface IngredientMarketHandle {
  update: (next: Partial<IngredientMarketState>) => void
  destroy: () => void
}

interface SlotView {
  item: IngredientDef
  root: Container
  baseX: number
  baseY: number
  cardBg: Graphics
  ownedText: Text
  dailyText: Text
  buyBg: Graphics
  buyLabel: Text
  lockOverlay: Container
  hover: boolean
}

function formatWon(value: number): string {
  return `₩${value.toLocaleString('ko-KR')}`
}

function drawRoundRect(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: number,
  alpha = 1,
) {
  graphics.roundRect(x, y, width, height, radius)
  graphics.fill({ color, alpha })
}

/** 선택한 메뉴의 재료를 한 개씩 구매하는 일반 마트 장면 */
export function createIngredientMarketScene(
  app: Application,
  initial: IngredientMarketState,
  onBuy: (ingredientId: string) => void,
): IngredientMarketHandle {
  const textRes = Math.min(window.devicePixelRatio || 1, 2) * 2
  const state: IngredientMarketState = {
    cash: initial.cash,
    owned: { ...initial.owned },
    dailyPurchases: { ...initial.dailyPurchases },
    allowedIds: [...initial.allowedIds],
    purchaseLimit: initial.purchaseLimit,
  }

  const root = new Container()
  app.stage.addChild(root)

  const bgSprite = new Sprite()
  root.addChild(bgSprite)

  const world = new Container()
  root.addChild(world)

  const floatTexts: { text: Text; life: number; velocityY: number }[] = []
  const onResize = () => layoutToScreen()
  app.renderer.on('resize', onResize)

  const CASH_CX = 0.762
  const CASH_CY = 0.2545
  const CASH_ART_W = 1400

  const cashRoot = new Container()
  root.addChild(cashRoot)
  const cashText = new Text({
    text: formatWon(state.cash),
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0xffe08a,
    },
  })
  cashText.anchor.set(0.5)
  cashRoot.addChild(cashText)

  function placeCash() {
    if (!bgSprite.texture || bgSprite.texture.width === 0 || bgSprite.width <= 0) return
    const scale = bgSprite.width / CASH_ART_W
    cashRoot.scale.set(scale)
    cashRoot.x = bgSprite.x + bgSprite.width * CASH_CX
    cashRoot.y = bgSprite.y + bgSprite.height * CASH_CY
  }

  function placeBgSprite() {
    if (!bgSprite.texture || bgSprite.texture.width === 0) return
    if (app.screen.width <= 0 || app.screen.height <= 0) return
    const textureWidth = bgSprite.texture.width
    const textureHeight = bgSprite.texture.height
    const cover = Math.max(
      app.screen.width / textureWidth,
      app.screen.height / textureHeight,
    )
    bgSprite.width = textureWidth * cover
    bgSprite.height = textureHeight * cover
    bgSprite.x = (app.screen.width - bgSprite.width) / 2
    bgSprite.y = (app.screen.height - bgSprite.height) / 2
    placeCash()
  }

  function layoutToScreen() {
    layoutPrepUiWorld(app, world, MARKET_W, MARKET_H)
    placeBgSprite()
  }

  const GRID_COLS = 5
  const CARD_W = 152
  const CARD_H = 118
  const GAP_X = 14
  const GAP_Y = 18
  const gridWidth = GRID_COLS * CARD_W + (GRID_COLS - 1) * GAP_X
  const gridOriginX = (MARKET_W - gridWidth) / 2
  const gridOriginY = 188

  const slots: SlotView[] = []

  function isAllowed(ingredientId: string): boolean {
    return state.allowedIds.includes(ingredientId)
  }

  function getPurchasedToday(ingredientId: string): number {
    return state.dailyPurchases[ingredientId] ?? 0
  }

  function showPurchaseFeedback(slot: SlotView, message: string, color: number) {
    const feedback = new Text({
      text: message,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: color,
      },
    })
    feedback.anchor.set(0.5)
    feedback.x = slot.root.x + CARD_W / 2
    feedback.y = slot.root.y + 20
    world.addChild(feedback)
    floatTexts.push({ text: feedback, life: 0.9, velocityY: -34 })
  }

  function redrawCard(slot: SlotView) {
    const { item } = slot
    const allowed = isAllowed(item.id)
    const purchasedToday = getPurchasedToday(item.id)
    const purchaseLimit = state.purchaseLimit
    const limitReached = purchasedToday >= purchaseLimit
    const hasCash = state.cash >= item.unitCost
    const canBuy = allowed && !limitReached && hasCash

    slot.ownedText.text = allowed
      ? `보유 ×${state.owned[item.id] ?? 0}`
      : '메뉴 미선택'
    slot.dailyText.text = allowed
      ? `오늘 구매 ${Math.min(purchasedToday, purchaseLimit)} / ${purchaseLimit}`
      : ''
    slot.dailyText.style.fill = purchasedToday > 0 ? M.accent2 : M.text
    slot.lockOverlay.visible = !allowed
    slot.root.cursor = canBuy ? 'pointer' : 'not-allowed'
    slot.root.alpha = allowed ? 1 : 0.92

    slot.cardBg.clear()
    drawRoundRect(
      slot.cardBg,
      0,
      0,
      CARD_W,
      CARD_H,
      12,
      slot.hover && canBuy ? M.cardHover : M.card,
    )
    slot.cardBg.roundRect(0, 0, CARD_W, CARD_H, 12)
    slot.cardBg.stroke({
      width: slot.hover && canBuy ? 2.5 : 1.5,
      color: slot.hover && canBuy ? M.accent2 : M.cardEdge,
    })
    slot.cardBg.roundRect(0, 0, CARD_W, 8, 12)
    slot.cardBg.fill(M.woodLight)
    slot.cardBg.rect(0, 4, CARD_W, 6)
    slot.cardBg.fill(M.woodLight)

    slot.buyBg.clear()
    drawRoundRect(
      slot.buyBg,
      12,
      CARD_H - 31,
      CARD_W - 24,
      22,
      8,
      canBuy ? M.buy : M.buyDisabled,
    )
    if (canBuy) {
      slot.buyBg.roundRect(12, CARD_H - 31, CARD_W - 24, 22, 8)
      slot.buyBg.stroke({ width: 1.5, color: M.buyDark })
    }
    slot.buyLabel.text = !allowed
      ? '잠김'
      : limitReached
        ? '구매 완료'
        : formatWon(item.unitCost)
    slot.buyLabel.alpha = canBuy || limitReached ? 1 : 0.75
  }

  ITEMS.slice(0, 15).forEach((item, index) => {
    const column = index % GRID_COLS
    const row = Math.floor(index / GRID_COLS)
    const baseX = gridOriginX + column * (CARD_W + GAP_X)
    const baseY = gridOriginY + row * (CARD_H + GAP_Y)
    const slotRoot = new Container()
    slotRoot.x = baseX
    slotRoot.y = baseY

    const cardBg = new Graphics()
    slotRoot.addChild(cardBg)

    const icon = new Text({
      text: item.icon,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
        fontSize: 25,
      },
    })
    icon.anchor.set(0.5, 0)
    icon.x = CARD_W / 2
    icon.y = 5
    slotRoot.addChild(icon)

    const name = new Text({
      text: item.name,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: M.text,
      },
    })
    name.anchor.set(0.5, 0)
    name.x = CARD_W / 2
    name.y = 35
    slotRoot.addChild(name)

    const ownedText = new Text({
      text: '보유 ×0',
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 10,
        fill: M.muted,
      },
    })
    ownedText.anchor.set(0.5, 0)
    ownedText.x = CARD_W / 2
    ownedText.y = 54
    slotRoot.addChild(ownedText)

    const dailyText = new Text({
      text: `오늘 구매 0 / ${state.purchaseLimit}`,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        fill: M.text,
      },
    })
    dailyText.anchor.set(0.5, 0)
    dailyText.x = CARD_W / 2
    dailyText.y = 69
    slotRoot.addChild(dailyText)

    const buyBg = new Graphics()
    slotRoot.addChild(buyBg)
    const buyLabel = new Text({
      text: formatWon(item.unitCost),
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: M.white,
      },
    })
    buyLabel.anchor.set(0.5)
    buyLabel.x = CARD_W / 2
    buyLabel.y = CARD_H - 20
    slotRoot.addChild(buyLabel)

    const lockOverlay = new Container()
    const lockBg = new Graphics()
    lockBg.roundRect(0, 0, CARD_W, CARD_H, 12)
    lockBg.fill({ color: 0x1a1410, alpha: 0.55 })
    lockOverlay.addChild(lockBg)
    const lockIcon = new Text({
      text: '🔒',
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
        fontSize: 18,
      },
    })
    lockIcon.anchor.set(0.5)
    lockIcon.x = CARD_W - 18
    lockIcon.y = 20
    lockOverlay.addChild(lockIcon)
    slotRoot.addChild(lockOverlay)

    const slot: SlotView = {
      item,
      root: slotRoot,
      baseX,
      baseY,
      cardBg,
      ownedText,
      dailyText,
      buyBg,
      buyLabel,
      lockOverlay,
      hover: false,
    }

    slotRoot.eventMode = 'static'
    slotRoot.hitArea = new Rectangle(0, 0, CARD_W, CARD_H)
    slotRoot.on('pointerover', () => {
      const canHover =
        isAllowed(item.id) &&
        getPurchasedToday(item.id) < state.purchaseLimit &&
        state.cash >= item.unitCost
      if (!canHover) return
      slot.hover = true
      slotRoot.scale.set(1.04)
      slotRoot.x = slot.baseX - CARD_W * 0.02
      slotRoot.y = slot.baseY - CARD_H * 0.02
      redrawCard(slot)
    })
    slotRoot.on('pointerout', () => {
      slot.hover = false
      slotRoot.scale.set(1)
      slotRoot.x = slot.baseX
      slotRoot.y = slot.baseY
      redrawCard(slot)
    })
    slotRoot.on('pointerdown', () => {
      if (!isAllowed(item.id)) return
      if (getPurchasedToday(item.id) >= state.purchaseLimit) return
      if (state.cash < item.unitCost) {
        showPurchaseFeedback(slot, '돈이 부족합니다', M.accent)
        return
      }

      state.cash -= item.unitCost
      state.owned[item.id] = (state.owned[item.id] ?? 0) + 1
      state.dailyPurchases[item.id] = getPurchasedToday(item.id) + 1
      cashText.text = formatWon(state.cash)
      slots.forEach(redrawCard)

      showPurchaseFeedback(slot, '구매 완료', M.buy)
      onBuy(item.id)
    })

    redrawCard(slot)
    world.addChild(slotRoot)
    slots.push(slot)
  })

  const dustGraphics = new Graphics()
  world.addChild(dustGraphics)
  const dust = Array.from({ length: 18 }, (_, index) => ({
    x: (index * 97) % MARKET_W,
    y: 90 + ((index * 53) % 360),
    radius: 1 + (index % 3),
    speed: 8 + (index % 5) * 3,
  }))

  async function loadBg() {
    const texture = await Assets.load(MART_BACKGROUND_ART)
    texture.source.scaleMode = 'linear'
    bgSprite.texture = texture
    placeBgSprite()
    layoutToScreen()
  }

  void loadBg().catch((error: unknown) => {
    console.error('Failed to load mart background', error)
  })

  layoutToScreen()

  const onTick = (ticker: Ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000

    dustGraphics.clear()
    for (const particle of dust) {
      particle.y += particle.speed * deltaSeconds * 0.15
      if (particle.y > MARKET_H - 80) particle.y = 90
      dustGraphics.circle(particle.x, particle.y, particle.radius)
      dustGraphics.fill({ color: M.white, alpha: 0.12 })
    }

    for (let index = floatTexts.length - 1; index >= 0; index -= 1) {
      const floating = floatTexts[index]
      floating.life -= deltaSeconds
      floating.text.y += floating.velocityY * deltaSeconds
      floating.text.alpha = Math.max(0, floating.life / 0.7)
      if (floating.life <= 0) {
        floating.text.destroy()
        floatTexts.splice(index, 1)
      }
    }
  }
  app.ticker.add(onTick)

  return {
    update(next) {
      if (next.cash !== undefined) {
        state.cash = next.cash
        cashText.text = formatWon(state.cash)
      }
      if (next.owned !== undefined) state.owned = { ...next.owned }
      if (next.dailyPurchases !== undefined) {
        state.dailyPurchases = { ...next.dailyPurchases }
      }
      if (next.allowedIds !== undefined) state.allowedIds = [...next.allowedIds]
      if (next.purchaseLimit !== undefined) state.purchaseLimit = next.purchaseLimit
      slots.forEach(redrawCard)
    },
    destroy() {
      app.renderer.off('resize', onResize)
      app.ticker.remove(onTick)
      for (const floating of floatTexts) floating.text.destroy()
      root.destroy({ children: true })
    },
  }
}
