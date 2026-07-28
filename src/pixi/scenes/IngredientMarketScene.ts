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

/* ================================================================
   DESIGN
   ================================================================ */

export const MARKET_W = 920
export const MARKET_H = 560

const M = {
  bgTop: 0x3d6e4a,
  bgBot: 0x2a4f36,
  wood: 0x8b5a2b,
  woodDark: 0x6b4220,
  woodLight: 0xb8793c,
  shelf: 0xa06a35,
  card: 0xfff4e2,
  cardEdge: 0xe8d0b0,
  cardHover: 0xfffaf0,
  accent: 0xe85d04,
  accent2: 0xf48c06,
  buy: 0x2f9e44,
  buyDark: 0x237a34,
  buyDisabled: 0x9a8f84,
  text: 0x3a2a1c,
  muted: 0x7a6550,
  white: 0xffffff,
  cashBg: 0x1a1410,
  sign: 0xc45c26,
  chalk: 0xf5efe4,
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
  /** 오늘 메뉴에 필요한 재료만 구매 가능 */
  allowedIds: string[]
}

export interface IngredientMarketHandle {
  update: (next: Partial<IngredientMarketState>) => void
  destroy: () => void
}

interface SlotView {
  id: string
  root: Container
  cardBg: Graphics
  ownedText: Text
  buyBg: Graphics
  buyLabel: Text
  lockOverlay: Container
  cost: number
  hover: boolean
}

function formatWon(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`
}

function drawRoundRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: number,
  alpha = 1,
) {
  g.roundRect(x, y, w, h, r)
  g.fill({ color, alpha })
}

/** 재료 마트 씬 — mart_background.webp 선반 배경 + 매입 카드 UI */
export function createIngredientMarketScene(
  app: Application,
  initial: IngredientMarketState,
  onBuy: (ingredientId: string) => void,
): IngredientMarketHandle {
  const textRes = Math.min(window.devicePixelRatio || 1, 2) * 2
  const state: IngredientMarketState = {
    cash: initial.cash,
    owned: { ...initial.owned },
    allowedIds: [...initial.allowedIds],
  }

  const root = new Container()
  app.stage.addChild(root)

  /** 전체 화면을 채우는 배경 (UI world와 분리) */
  const bgSprite = new Sprite()
  root.addChild(bgSprite)

  const world = new Container()
  root.addChild(world)

  const floatTexts: { t: Text; life: number; vy: number }[] = []

  const onResize = () => layoutToScreen()
  app.renderer.on('resize', onResize)

  /* ── Cash (배경 이미지 우측 명패 위치) ───────── */
  /** mart_background.webp 기준 명패 중심 (정규화 좌표) */
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
    if (!bgSprite.texture || bgSprite.texture.width === 0) return
    if (bgSprite.width <= 0) return
    const scale = bgSprite.width / CASH_ART_W
    cashRoot.scale.set(scale)
    cashRoot.x = bgSprite.x + bgSprite.width * CASH_CX
    cashRoot.y = bgSprite.y + bgSprite.height * CASH_CY
  }

  function placeBgSprite() {
    if (!bgSprite.texture || bgSprite.texture.width === 0) return
    if (app.screen.width <= 0 || app.screen.height <= 0) return
    const tw = bgSprite.texture.width
    const th = bgSprite.texture.height
    const cover = Math.max(app.screen.width / tw, app.screen.height / th)
    bgSprite.width = tw * cover
    bgSprite.height = th * cover
    bgSprite.x = (app.screen.width - bgSprite.width) / 2
    bgSprite.y = (app.screen.height - bgSprite.height) / 2
    placeCash()
  }

  function layoutToScreen() {
    layoutPrepUiWorld(app, world, MARKET_W, MARKET_H)
    placeBgSprite()
  }

  /* ── Item grid ───────────────────────────────── */
  const GRID_COLS = 5
  const CARD_W = 152
  const CARD_H = 118
  const GAP_X = 14
  const GAP_Y = 18
  const gridW = GRID_COLS * CARD_W + (GRID_COLS - 1) * GAP_X
  const gridOriginX = (MARKET_W - gridW) / 2
  const gridOriginY = 188

  const slots: SlotView[] = []
  const displayItems = ITEMS.slice(0, 15)

  function redrawCard(slot: SlotView) {
    const owned = state.owned[slot.id] ?? 0
    const allowed = state.allowedIds.includes(slot.id)
    const canBuy = allowed && state.cash >= slot.cost
    slot.ownedText.text = allowed ? `보유 ×${owned}` : '메뉴 미선택'
    slot.lockOverlay.visible = !allowed
    slot.root.cursor = allowed ? 'pointer' : 'not-allowed'
    slot.root.alpha = allowed ? 1 : 0.92

    slot.cardBg.clear()
    drawRoundRect(
      slot.cardBg,
      0,
      0,
      CARD_W,
      CARD_H,
      12,
      slot.hover && allowed ? M.cardHover : M.card,
    )
    slot.cardBg.roundRect(0, 0, CARD_W, CARD_H, 12)
    slot.cardBg.stroke({
      width: slot.hover && allowed ? 2.5 : 1.5,
      color: slot.hover && allowed ? M.accent2 : M.cardEdge,
    })
    slot.cardBg.roundRect(0, 0, CARD_W, 8, 12)
    slot.cardBg.fill(M.woodLight)
    slot.cardBg.rect(0, 4, CARD_W, 6)
    slot.cardBg.fill(M.woodLight)

    slot.buyBg.clear()
    drawRoundRect(
      slot.buyBg,
      12,
      CARD_H - 34,
      CARD_W - 24,
      24,
      8,
      canBuy ? M.buy : M.buyDisabled,
    )
    if (canBuy) {
      slot.buyBg.roundRect(12, CARD_H - 34, CARD_W - 24, 24, 8)
      slot.buyBg.stroke({ width: 1.5, color: M.buyDark })
    }
    slot.buyLabel.text = allowed
      ? `+1  ${formatWon(slot.cost)}`
      : '잠김'
    slot.buyLabel.style.fill = M.white
    slot.buyLabel.alpha = canBuy ? 1 : 0.75
  }

  displayItems.forEach((item, i) => {
    const col = i % GRID_COLS
    const row = Math.floor(i / GRID_COLS)
    const slotRoot = new Container()
    slotRoot.x = gridOriginX + col * (CARD_W + GAP_X)
    slotRoot.y = gridOriginY + row * (CARD_H + GAP_Y)

    const cardBg = new Graphics()
    slotRoot.addChild(cardBg)

    const icon = new Text({
      text: item.icon,
      resolution: textRes,
      style: { fontSize: 34 },
    })
    icon.anchor.set(0.5, 0)
    icon.x = CARD_W / 2
    icon.y = 14
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
    name.y = 52
    slotRoot.addChild(name)

    const ownedText = new Text({
      text: '보유 ×0',
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 11,
        fill: M.muted,
      },
    })
    ownedText.anchor.set(0.5, 0)
    ownedText.x = CARD_W / 2
    ownedText.y = 70
    slotRoot.addChild(ownedText)

    const buyBg = new Graphics()
    slotRoot.addChild(buyBg)
    const buyLabel = new Text({
      text: `+1  ${formatWon(item.unitCost)}`,
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
    buyLabel.y = CARD_H - 22
    slotRoot.addChild(buyLabel)

    const lockOverlay = new Container()
    const lockBg = new Graphics()
    lockBg.roundRect(0, 0, CARD_W, CARD_H, 12)
    lockBg.fill({ color: 0x1a1410, alpha: 0.55 })
    lockOverlay.addChild(lockBg)
    const lockIcon = new Text({
      text: '🔒',
      resolution: textRes,
      style: { fontSize: 28 },
    })
    lockIcon.anchor.set(0.5)
    lockIcon.x = CARD_W / 2
    lockIcon.y = CARD_H / 2 - 6
    lockOverlay.addChild(lockIcon)
    slotRoot.addChild(lockOverlay)

    const slot: SlotView = {
      id: item.id,
      root: slotRoot,
      cardBg,
      ownedText,
      buyBg,
      buyLabel,
      lockOverlay,
      cost: item.unitCost,
      hover: false,
    }

    slotRoot.eventMode = 'static'
    slotRoot.cursor = 'pointer'
    slotRoot.hitArea = new Rectangle(0, 0, CARD_W, CARD_H)

    slotRoot.on('pointerover', () => {
      if (!state.allowedIds.includes(item.id)) return
      slot.hover = true
      slotRoot.scale.set(1.04)
      slotRoot.x = gridOriginX + col * (CARD_W + GAP_X) - CARD_W * 0.02
      slotRoot.y = gridOriginY + row * (CARD_H + GAP_Y) - CARD_H * 0.02
      redrawCard(slot)
    })
    slotRoot.on('pointerout', () => {
      slot.hover = false
      slotRoot.scale.set(1)
      slotRoot.x = gridOriginX + col * (CARD_W + GAP_X)
      slotRoot.y = gridOriginY + row * (CARD_H + GAP_Y)
      redrawCard(slot)
    })
    slotRoot.on('pointerdown', () => {
      if (!state.allowedIds.includes(item.id)) return
      if (state.cash < item.unitCost) {
        slotRoot.x = gridOriginX + col * (CARD_W + GAP_X) + 3
        setTimeout(() => {
          if (!slot.hover) {
            slotRoot.x = gridOriginX + col * (CARD_W + GAP_X)
          }
        }, 80)
        return
      }
      state.cash -= item.unitCost
      state.owned[item.id] = (state.owned[item.id] ?? 0) + 1
      cashText.text = formatWon(state.cash)
      slots.forEach(redrawCard)

      const fx = new Text({
        text: `+1 ${item.icon}`,
        resolution: textRes,
        style: {
          fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
          fontSize: 16,
          fontWeight: 'bold',
          fill: M.buy,
        },
      })
      fx.anchor.set(0.5)
      fx.x = slotRoot.x + CARD_W / 2
      fx.y = slotRoot.y + 20
      world.addChild(fx)
      floatTexts.push({ t: fx, life: 0.7, vy: -42 })

      onBuy(item.id)
    })

    redrawCard(slot)
    world.addChild(slotRoot)
    slots.push(slot)
  })

  /* ── Ambient dust ────────────────────────────── */
  const dustG = new Graphics()
  world.addChild(dustG)
  const dust = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 97) % MARKET_W,
    y: 90 + ((i * 53) % 360),
    r: 1 + (i % 3),
    sp: 8 + (i % 5) * 3,
  }))

  async function loadBg() {
    const tex = await Assets.load(MART_BACKGROUND_ART)
    tex.source.scaleMode = 'linear'
    bgSprite.texture = tex
    placeBgSprite()
    layoutToScreen()
  }

  void loadBg().catch((err) => {
    console.error('Failed to load mart background', err)
  })

  layoutToScreen()

  const onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000

    dustG.clear()
    for (const d of dust) {
      d.y += d.sp * dt * 0.15
      if (d.y > MARKET_H - 80) d.y = 90
      dustG.circle(d.x, d.y, d.r)
      dustG.fill({ color: M.white, alpha: 0.12 })
    }

    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const f = floatTexts[i]
      f.life -= dt
      f.t.y += f.vy * dt
      f.t.alpha = Math.max(0, f.life / 0.7)
      if (f.life <= 0) {
        f.t.destroy()
        floatTexts.splice(i, 1)
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
      if (next.owned !== undefined) {
        state.owned = { ...next.owned }
      }
      if (next.allowedIds !== undefined) {
        state.allowedIds = [...next.allowedIds]
      }
      slots.forEach(redrawCard)
    },
    destroy() {
      app.renderer.off('resize', onResize)
      app.ticker.remove(onTick)
      for (const f of floatTexts) f.t.destroy()
      root.destroy({ children: true })
    },
  }
}
