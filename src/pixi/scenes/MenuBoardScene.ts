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
import menusData from '../../data/menus.json'
import ingredientsData from '../../data/ingredients.json'
import { MAX_ACTIVE_MENUS } from '../../state/actions'
import { MENU_BOARD_ART } from '../../utils/assets'

export const MENU_BOARD_W = 1000
export const MENU_BOARD_H = 600

const C = {
  card: 0xfff8ef,
  cardSel: 0xfffdf8,
  cardEdge: 0xe5d2bc,
  cardEdgeSel: 0xf0c14a,
  lockDim: 0xb8a894,
  text: 0x3a2a1c,
  muted: 0x8a7360,
  chalk: 0xf0ebe3,
  ok: 0x3d9a5c,
  okBg: 0xe8f6ec,
  okEdge: 0x8fd4a4,
  plaque: 0xd8d0c4,
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
  const filled = Math.max(1, Math.min(5, n))
  return '★'.repeat(filled) + '☆'.repeat(Math.max(0, 5 - filled))
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
  baseX: number
  baseY: number
  bg: Graphics
  statusBg: Graphics
  statusText: Text
  recipeText: Text
  nameText: Text
  metaText: Text
  iconText: Text
  unlocked: boolean
  active: boolean
}

/** 메뉴 보드 씬 — menu_board.webp 배경 + 레퍼런스 카드 UI */
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

  const boardSprite = new Sprite()
  world.addChild(boardSprite)

  const title = new Text({
    text: '📋  오늘의 메뉴판',
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: C.chalk,
      letterSpacing: 0.5,
    },
  })
  title.anchor.set(0.5)
  title.x = MENU_BOARD_W / 2
  title.y = 48
  world.addChild(title)

  const countText = new Text({
    text: `선택 0 / ${MAX_ACTIVE_MENUS}`,
    resolution: textRes,
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 14,
      fontWeight: 'bold',
      fill: C.plaque,
    },
  })
  countText.anchor.set(1, 0.5)
  countText.x = MENU_BOARD_W - 52
  countText.y = 48
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
  hint.y = 78
  world.addChild(hint)

  const COLS = 4
  const CARD_W = 198
  const CARD_H = 188
  const GAP_X = 14
  const GAP_Y = 14
  const gridW = COLS * CARD_W + (COLS - 1) * GAP_X
  const originX = (MENU_BOARD_W - gridW) / 2
  const originY = 118
  const cards: CardView[] = []

  function recipeLine(menu: MenuDef): string {
    return menu.ingredients.map((id) => `${ingIcon(id)} ${ingName(id)}`).join(' · ')
  }

  function layoutToScreen() {
    const s = Math.min(
      app.screen.width / MENU_BOARD_W,
      app.screen.height / MENU_BOARD_H,
    )
    world.scale.set(s)
    world.x = (app.screen.width - MENU_BOARD_W * s) / 2
    world.y = (app.screen.height - MENU_BOARD_H * s) / 2
  }

  function placeBoardSprite() {
    if (!boardSprite.texture || boardSprite.texture.width === 0) return
    const tw = boardSprite.texture.width
    const th = boardSprite.texture.height
    const fit = Math.min(MENU_BOARD_W / tw, MENU_BOARD_H / th)
    boardSprite.width = tw * fit
    boardSprite.height = th * fit
    boardSprite.x = (MENU_BOARD_W - boardSprite.width) / 2
    boardSprite.y = (MENU_BOARD_H - boardSprite.height) / 2
  }

  function refreshCard(card: CardView) {
    const menu = MENUS.find((m) => m.id === card.id)!
    card.unlocked = state.unlockedMenus.includes(card.id)
    card.active = state.activeMenus.includes(card.id)

    card.bg.clear()
    card.statusBg.clear()

    const fill = !card.unlocked ? 0xf3ebe0 : card.active ? C.cardSel : C.card
    drawRoundRect(card.bg, 0, 0, CARD_W, CARD_H, 16, fill)
    card.bg.roundRect(0, 0, CARD_W, CARD_H, 16)
    card.bg.stroke({
      width: card.active ? 2.5 : 1.5,
      color: card.active ? C.cardEdgeSel : C.cardEdge,
      alpha: card.unlocked ? 1 : 0.55,
    })

    if (card.unlocked) {
      drawRoundRect(card.bg, 3, 3, CARD_W - 6, 28, 12, 0xffffff, 0.22)
    }

    const dim = card.unlocked ? 1 : 0.42
    card.iconText.alpha = dim
    card.nameText.alpha = card.unlocked ? 1 : 0.45
    card.metaText.alpha = card.unlocked ? 1 : 0.4
    card.recipeText.alpha = card.unlocked ? 1 : 0.4
    card.root.cursor = card.unlocked ? 'pointer' : 'not-allowed'
    card.nameText.style.fill = card.unlocked ? C.text : C.lockDim
    card.metaText.style.fill = card.unlocked ? C.muted : C.lockDim

    if (!card.unlocked) {
      card.recipeText.text = '해금 후 레시피 확인'
      card.recipeText.style.fill = C.lockDim
      card.statusText.text = `🔒  ${menu.unlockCondition ?? '잠김'}`
      card.statusText.style.fill = 0x9a8068
      card.statusBg.visible = false
    } else if (card.active) {
      card.recipeText.text = `재료: ${recipeLine(menu)}`
      card.recipeText.style.fill = C.text
      card.statusText.text = '✓  판매 중'
      card.statusText.style.fill = C.ok
      card.statusBg.visible = true
      drawRoundRect(card.statusBg, CARD_W / 2 - 48, CARD_H - 36, 96, 24, 12, C.okBg)
      card.statusBg.roundRect(CARD_W / 2 - 48, CARD_H - 36, 96, 24, 12)
      card.statusBg.stroke({ width: 1.2, color: C.okEdge })
    } else {
      card.recipeText.text = `재료: ${recipeLine(menu)}`
      card.recipeText.style.fill = C.text
      card.statusText.text = `판매가 ₩${(state.menuPrices[card.id] ?? menu.basePrice).toLocaleString('ko-KR')}`
      card.statusText.style.fill = C.muted
      card.statusBg.visible = false
    }
  }

  MENUS.forEach((menu, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const baseX = originX + col * (CARD_W + GAP_X)
    const baseY = originY + row * (CARD_H + GAP_Y)

    const cardRoot = new Container()
    cardRoot.x = baseX
    cardRoot.y = baseY

    const shadow = new Graphics()
    drawRoundRect(shadow, 3, 5, CARD_W, CARD_H, 16, 0x1a1008, 0.2)
    cardRoot.addChild(shadow)

    const bg = new Graphics()
    cardRoot.addChild(bg)

    const iconText = new Text({
      text: menu.icon,
      resolution: textRes,
      style: { fontSize: 40 },
    })
    iconText.anchor.set(0.5, 0)
    iconText.x = CARD_W / 2
    iconText.y = 14
    cardRoot.addChild(iconText)

    const nameText = new Text({
      text: menu.name,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 15,
        fontWeight: '800',
        fill: C.text,
      },
    })
    nameText.anchor.set(0.5, 0)
    nameText.x = CARD_W / 2
    nameText.y = 58
    cardRoot.addChild(nameText)

    const metaText = new Text({
      text: `${menu.category} · ${menu.cookTime}초 · ${stars(menu.difficulty)}`,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 11,
        fill: C.muted,
      },
    })
    metaText.anchor.set(0.5, 0)
    metaText.x = CARD_W / 2
    metaText.y = 80
    cardRoot.addChild(metaText)

    const recipeText = new Text({
      text: '',
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 11,
        fill: C.text,
        wordWrap: true,
        wordWrapWidth: CARD_W - 22,
        align: 'center',
        lineHeight: 16,
      },
    })
    recipeText.anchor.set(0.5, 0)
    recipeText.x = CARD_W / 2
    recipeText.y = 104
    cardRoot.addChild(recipeText)

    const statusBg = new Graphics()
    cardRoot.addChild(statusBg)

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
    statusText.anchor.set(0.5, 0.5)
    statusText.x = CARD_W / 2
    statusText.y = CARD_H - 24
    cardRoot.addChild(statusText)

    const card: CardView = {
      id: menu.id,
      root: cardRoot,
      baseX,
      baseY,
      bg,
      statusBg,
      statusText,
      recipeText,
      nameText,
      metaText,
      iconText,
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
      cardRoot.x = card.baseX - CARD_W * 0.015
      cardRoot.y = card.baseY - CARD_H * 0.015
    })
    cardRoot.on('pointerout', () => {
      cardRoot.scale.set(1)
      cardRoot.x = card.baseX
      cardRoot.y = card.baseY
    })

    refreshCard(card)
    world.addChild(cardRoot)
    cards.push(card)
  })

  function refreshAll() {
    countText.text = `선택 ${state.activeMenus.length} / ${MAX_ACTIVE_MENUS}`
    cards.forEach(refreshCard)
  }

  async function loadBoard() {
    const tex = await Assets.load(MENU_BOARD_ART)
    tex.source.scaleMode = 'linear'
    boardSprite.texture = tex
    placeBoardSprite()
    layoutToScreen()
  }

  void loadBoard().catch((err) => {
    console.error('Failed to load menu board', err)
  })

  const onResize = () => {
    placeBoardSprite()
    layoutToScreen()
  }
  app.renderer.on('resize', onResize)

  refreshAll()
  layoutToScreen()

  const onTick = (ticker: Ticker) => {
    elapsed += ticker.deltaMS / 1000
    title.y = 48 + Math.sin(elapsed * 1.2) * 1.2
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
