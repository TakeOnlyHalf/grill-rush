import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Text,
  type Ticker,
} from 'pixi.js'
import menusData from '../../data/menus.json'
import ingredientsData from '../../data/ingredients.json'
import { MAX_ACTIVE_MENUS } from '../../state/actions'

export const MENU_BOARD_W = 960
export const MENU_BOARD_H = 580

const C = {
  bgTop: 0x5c3d2e,
  bgBot: 0x3a241c,
  wood: 0x8b5a2b,
  woodLight: 0xc4894a,
  card: 0xfff6ea,
  cardSel: 0xffe4c4,
  cardEdge: 0xd9b896,
  lock: 0x2a221c,
  accent: 0xe85d04,
  accent2: 0xf48c06,
  text: 0x3a2a1c,
  muted: 0x7a6550,
  chalk: 0xf5efe4,
  white: 0xffffff,
  star: 0xf4c430,
  ok: 0x2f9e44,
}

interface MenuDef {
  id: string
  name: string
  icon: string
  category: string
  ingredients: string[]
  cost: number
  basePrice: number
  cookTime: number
  difficulty: number
  unlockedByDefault: boolean
  unlockCondition: string | null
}

interface IngDef {
  id: string
  name: string
  icon: string
}

const MENUS = menusData as MenuDef[]
const INGS = ingredientsData as IngDef[]

function ingIcon(id: string): string {
  return INGS.find((i) => i.id === id)?.icon ?? '📦'
}

function ingName(id: string): string {
  return INGS.find((i) => i.id === id)?.name ?? id
}

function stars(n: number): string {
  return '★'.repeat(Math.max(1, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - n))
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

export interface MenuBoardState {
  unlockedMenus: string[]
  activeMenus: string[]
  menuPrices: Record<string, number>
}

export interface MenuBoardHandle {
  update: (next: Partial<MenuBoardState>) => void
  destroy: () => void
}

interface CardView {
  id: string
  root: Container
  bg: Graphics
  lockOverlay: Container
  statusText: Text
  recipeText: Text
  unlocked: boolean
  active: boolean
}

/** 메뉴 보드 씬 — 레시피·잠금·선택 */
export function createMenuBoardScene(
  app: Application,
  initial: MenuBoardState,
  onToggle: (menuId: string) => void,
): MenuBoardHandle {
  const textRes = Math.min(window.devicePixelRatio || 1, 2) * 2
  const state: MenuBoardState = {
    unlockedMenus: [...initial.unlockedMenus],
    activeMenus: [...initial.activeMenus],
    menuPrices: { ...initial.menuPrices },
  }

  const root = new Container()
  app.stage.addChild(root)
  const world = new Container()
  root.addChild(world)

  let elapsed = 0

  function layoutToScreen() {
    const s = Math.min(
      app.screen.width / MENU_BOARD_W,
      app.screen.height / MENU_BOARD_H,
    )
    world.scale.set(s)
    world.x = (app.screen.width - MENU_BOARD_W * s) / 2
    world.y = (app.screen.height - MENU_BOARD_H * s) / 2
  }
  const onResize = () => layoutToScreen()
  app.renderer.on('resize', onResize)

  const bg = new Graphics()
  bg.rect(0, 0, MENU_BOARD_W, MENU_BOARD_H * 0.5)
  bg.fill(C.bgTop)
  bg.rect(0, MENU_BOARD_H * 0.5, MENU_BOARD_W, MENU_BOARD_H * 0.5)
  bg.fill(C.bgBot)
  bg.rect(0, 0, MENU_BOARD_W, 100)
  bg.fill({ color: 0x000000, alpha: 0.18 })
  world.addChild(bg)

  // chalkboard header
  const board = new Graphics()
  drawRoundRect(board, MENU_BOARD_W / 2 - 220, 18, 440, 64, 12, 0x2b2b2b)
  drawRoundRect(board, MENU_BOARD_W / 2 - 210, 26, 420, 48, 8, 0x3a3a3a)
  world.addChild(board)

  const title = new Text({
    text: '📋  오늘의 메뉴판',
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 26,
      fontWeight: 'bold',
      fill: C.chalk,
    },
  })
  title.anchor.set(0.5)
  title.x = MENU_BOARD_W / 2
  title.y = 50
  world.addChild(title)

  const countText = new Text({
    text: `선택 0 / ${MAX_ACTIVE_MENUS}`,
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 14,
      fontWeight: 'bold',
      fill: C.chalk,
    },
  })
  countText.anchor.set(1, 0.5)
  countText.x = MENU_BOARD_W - 36
  countText.y = 50
  world.addChild(countText)

  const hint = new Text({
    text: '그릴 메뉴만 취급 · 쉬운 3종부터 해금 · 필요 재료는 다음 마트에서 구매',
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 13,
      fill: 0xe8d5c0,
    },
  })
  hint.anchor.set(0.5, 0)
  hint.x = MENU_BOARD_W / 2
  hint.y = 92
  world.addChild(hint)

  const COLS = 4
  const CARD_W = 210
  const CARD_H = 200
  const GAP = 16
  const gridW = COLS * CARD_W + (COLS - 1) * GAP
  const originX = (MENU_BOARD_W - gridW) / 2
  const originY = 122

  const cards: CardView[] = []

  function recipeLine(menu: MenuDef): string {
    return menu.ingredients.map((id) => `${ingIcon(id)}${ingName(id)}`).join(' · ')
  }

  function refreshCard(card: CardView) {
    const menu = MENUS.find((m) => m.id === card.id)!
    card.unlocked = state.unlockedMenus.includes(card.id)
    card.active = state.activeMenus.includes(card.id)

    card.bg.clear()
    const fill = card.active ? C.cardSel : C.card
    drawRoundRect(card.bg, 0, 0, CARD_W, CARD_H, 14, fill)
    card.bg.roundRect(0, 0, CARD_W, CARD_H, 14)
    card.bg.stroke({
      width: card.active ? 3 : 1.5,
      color: card.active ? C.accent : C.cardEdge,
    })
    drawRoundRect(card.bg, 0, 0, CARD_W, 10, 14, C.woodLight)
    card.bg.rect(0, 6, CARD_W, 6)
    card.bg.fill(C.woodLight)

    card.lockOverlay.visible = !card.unlocked
    card.root.alpha = card.unlocked ? 1 : 0.95
    card.root.cursor = card.unlocked ? 'pointer' : 'not-allowed'

    if (!card.unlocked) {
      card.statusText.text = menu.unlockCondition
        ? `🔒 ${menu.unlockCondition}`
        : '🔒 잠김'
      card.statusText.style.fill = 0xffd7a8
    } else if (card.active) {
      card.statusText.text = '✓ 판매 중'
      card.statusText.style.fill = C.ok
    } else {
      card.statusText.text = `판매가 ₩${(state.menuPrices[card.id] ?? menu.basePrice).toLocaleString('ko-KR')}`
      card.statusText.style.fill = C.muted
    }

    card.recipeText.text = card.unlocked
      ? `재료: ${recipeLine(menu)}`
      : '해금 후 레시피 확인'
  }

  MENUS.forEach((menu, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const cardRoot = new Container()
    cardRoot.x = originX + col * (CARD_W + GAP)
    cardRoot.y = originY + row * (CARD_H + GAP)

    const bg = new Graphics()
    cardRoot.addChild(bg)

    const icon = new Text({
      text: menu.icon,
      resolution: textRes,
      style: { fontSize: 42 },
    })
    icon.anchor.set(0.5, 0)
    icon.x = CARD_W / 2
    icon.y = 18
    cardRoot.addChild(icon)

    const name = new Text({
      text: menu.name,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: C.text,
      },
    })
    name.anchor.set(0.5, 0)
    name.x = CARD_W / 2
    name.y = 66
    cardRoot.addChild(name)

    const meta = new Text({
      text: `${menu.category} · ${menu.cookTime}초 · ${stars(menu.difficulty)}`,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 11,
        fill: C.muted,
      },
    })
    meta.anchor.set(0.5, 0)
    meta.x = CARD_W / 2
    meta.y = 88
    cardRoot.addChild(meta)

    const recipeText = new Text({
      text: '',
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 11,
        fill: C.text,
        wordWrap: true,
        wordWrapWidth: CARD_W - 20,
        align: 'center',
      },
    })
    recipeText.anchor.set(0.5, 0)
    recipeText.x = CARD_W / 2
    recipeText.y = 110
    cardRoot.addChild(recipeText)

    const statusText = new Text({
      text: '',
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: C.muted,
      },
    })
    statusText.anchor.set(0.5, 0)
    statusText.x = CARD_W / 2
    statusText.y = 168
    cardRoot.addChild(statusText)

    const lockOverlay = new Container()
    const lockBg = new Graphics()
    drawRoundRect(lockBg, 0, 0, CARD_W, CARD_H, 14, C.lock, 0.55)
    lockOverlay.addChild(lockBg)
    const lockIcon = new Text({
      text: '🔒',
      resolution: textRes,
      style: { fontSize: 36 },
    })
    lockIcon.anchor.set(0.5)
    lockIcon.x = CARD_W / 2
    lockIcon.y = CARD_H / 2 - 8
    lockOverlay.addChild(lockIcon)
    cardRoot.addChild(lockOverlay)

    const card: CardView = {
      id: menu.id,
      root: cardRoot,
      bg,
      lockOverlay,
      statusText,
      recipeText,
      unlocked: false,
      active: false,
    }

    cardRoot.eventMode = 'static'
    cardRoot.hitArea = new Rectangle(0, 0, CARD_W, CARD_H)
    cardRoot.on('pointerdown', () => {
      if (!state.unlockedMenus.includes(menu.id)) return
      onToggle(menu.id)
    })
    cardRoot.on('pointerover', () => {
      if (!state.unlockedMenus.includes(menu.id)) return
      cardRoot.scale.set(1.03)
      cardRoot.x = originX + col * (CARD_W + GAP) - CARD_W * 0.015
      cardRoot.y = originY + row * (CARD_H + GAP) - CARD_H * 0.015
    })
    cardRoot.on('pointerout', () => {
      cardRoot.scale.set(1)
      cardRoot.x = originX + col * (CARD_W + GAP)
      cardRoot.y = originY + row * (CARD_H + GAP)
    })

    refreshCard(card)
    world.addChild(cardRoot)
    cards.push(card)
  })

  function refreshAll() {
    countText.text = `선택 ${state.activeMenus.length} / ${MAX_ACTIVE_MENUS}`
    cards.forEach(refreshCard)
  }
  refreshAll()
  layoutToScreen()

  const onTick = (ticker: Ticker) => {
    elapsed += ticker.deltaMS / 1000
    title.y = 50 + Math.sin(elapsed * 1.4) * 1.5
  }
  app.ticker.add(onTick)

  return {
    update(next) {
      if (next.unlockedMenus) state.unlockedMenus = [...next.unlockedMenus]
      if (next.activeMenus) state.activeMenus = [...next.activeMenus]
      if (next.menuPrices) state.menuPrices = { ...next.menuPrices }
      refreshAll()
    },
    destroy() {
      app.renderer.off('resize', onResize)
      app.ticker.remove(onTick)
      root.destroy({ children: true })
    },
  }
}
