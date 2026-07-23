import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Text,
  type Ticker,
} from 'pixi.js'
import ingredientsData from '../../data/ingredients.json'

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

/** 재료 마트 씬 — 선반·상자 UI로 매입 */
export function createIngredientMarketScene(
  app: Application,
  initial: IngredientMarketState,
  onBuy: (ingredientId: string) => void,
): IngredientMarketHandle {
  const textRes = Math.min(window.devicePixelRatio || 1, 2) * 2
  const state: IngredientMarketState = {
    cash: initial.cash,
    owned: { ...initial.owned },
  }

  const root = new Container()
  app.stage.addChild(root)

  const world = new Container()
  root.addChild(world)

  let elapsed = 0
  const floatTexts: { t: Text; life: number; vy: number }[] = []

  function layoutToScreen() {
    const s = Math.min(
      app.screen.width / MARKET_W,
      app.screen.height / MARKET_H,
    )
    world.scale.set(s)
    world.x = (app.screen.width - MARKET_W * s) / 2
    world.y = (app.screen.height - MARKET_H * s) / 2
  }
  const onResize = () => layoutToScreen()
  app.renderer.on('resize', onResize)

  /* ── Background ──────────────────────────────── */
  const bg = new Graphics()
  bg.rect(0, 0, MARKET_W, MARKET_H * 0.55)
  bg.fill(M.bgTop)
  bg.rect(0, MARKET_H * 0.55, MARKET_W, MARKET_H * 0.45)
  bg.fill(M.bgBot)
  // soft vignette bands
  bg.rect(0, 0, MARKET_W, 90)
  bg.fill({ color: 0x1a3020, alpha: 0.18 })
  world.addChild(bg)

  // decorative floor planks
  const floor = new Graphics()
  floor.rect(0, MARKET_H - 70, MARKET_W, 70)
  floor.fill(M.woodDark)
  for (let i = 0; i < 12; i++) {
    floor.rect(i * 80, MARKET_H - 70, 2, 70)
    floor.fill({ color: 0x000000, alpha: 0.12 })
  }
  world.addChild(floor)

  // back wall shelves
  const shelves = new Graphics()
  for (const y of [120, 270, 420]) {
    shelves.rect(40, y, MARKET_W - 80, 14)
    shelves.fill(M.shelf)
    shelves.rect(40, y + 14, MARKET_W - 80, 6)
    shelves.fill(M.woodDark)
  }
  world.addChild(shelves)

  /* ── Shop sign ───────────────────────────────── */
  const sign = new Container()
  sign.x = MARKET_W / 2
  sign.y = 42
  const signBoard = new Graphics()
  drawRoundRect(signBoard, -170, -28, 340, 56, 10, M.sign)
  drawRoundRect(signBoard, -160, -20, 320, 40, 8, M.wood)
  sign.addChild(signBoard)
  const signText = new Text({
    text: '🏪  일반 마트',
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 26,
      fontWeight: 'bold',
      fill: M.chalk,
    },
  })
  signText.anchor.set(0.5)
  sign.addChild(signText)
  world.addChild(sign)

  const subtitle = new Text({
    text: '당일 재료만 사용 · 과다 매입은 폐기 손해!',
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 13,
      fill: M.chalk,
    },
  })
  subtitle.anchor.set(0.5, 0)
  subtitle.x = MARKET_W / 2
  subtitle.y = 78
  world.addChild(subtitle)

  /* ── Cash badge ──────────────────────────────── */
  const cashBox = new Container()
  cashBox.x = MARKET_W - 28
  cashBox.y = 36
  const cashBg = new Graphics()
  drawRoundRect(cashBg, -168, -20, 168, 40, 12, M.cashBg, 0.82)
  cashBox.addChild(cashBg)
  const cashText = new Text({
    text: formatWon(state.cash),
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffe08a,
    },
  })
  cashText.anchor.set(1, 0.5)
  cashText.x = -14
  cashBox.addChild(cashText)
  world.addChild(cashBox)

  /* ── Item grid ───────────────────────────────── */
  const GRID_COLS = 5
  const CARD_W = 152
  const CARD_H = 118
  const GAP_X = 14
  const GAP_Y = 18
  const gridW = GRID_COLS * CARD_W + (GRID_COLS - 1) * GAP_X
  const gridOriginX = (MARKET_W - gridW) / 2
  const gridOriginY = 118

  const slots: SlotView[] = []
  const displayItems = ITEMS.slice(0, 15)

  function redrawCard(slot: SlotView) {
    const owned = state.owned[slot.id] ?? 0
    const canBuy = state.cash >= slot.cost
    slot.ownedText.text = `보유 ×${owned}`

    slot.cardBg.clear()
    drawRoundRect(
      slot.cardBg,
      0,
      0,
      CARD_W,
      CARD_H,
      12,
      slot.hover ? M.cardHover : M.card,
    )
    slot.cardBg.roundRect(0, 0, CARD_W, CARD_H, 12)
    slot.cardBg.stroke({
      width: slot.hover ? 2.5 : 1.5,
      color: slot.hover ? M.accent2 : M.cardEdge,
    })
    // top accent strip
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
    slot.buyLabel.style.fill = M.white
    slot.buyLabel.alpha = canBuy ? 1 : 0.7
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

    const slot: SlotView = {
      id: item.id,
      root: slotRoot,
      cardBg,
      ownedText,
      buyBg,
      buyLabel,
      cost: item.unitCost,
      hover: false,
    }

    slotRoot.eventMode = 'static'
    slotRoot.cursor = 'pointer'
    slotRoot.hitArea = new Rectangle(0, 0, CARD_W, CARD_H)

    slotRoot.on('pointerover', () => {
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
      if (state.cash < item.unitCost) {
        // shake
        slotRoot.x = gridOriginX + col * (CARD_W + GAP_X) + 3
        setTimeout(() => {
          if (!slot.hover) {
            slotRoot.x = gridOriginX + col * (CARD_W + GAP_X)
          }
        }, 80)
        return
      }
      // optimistic local preview (React state will sync via update)
      state.cash -= item.unitCost
      state.owned[item.id] = (state.owned[item.id] ?? 0) + 1
      cashText.text = formatWon(state.cash)
      redrawCard(slot)
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

  layoutToScreen()

  const onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000
    elapsed += dt

    sign.y = 42 + Math.sin(elapsed * 1.6) * 2

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
