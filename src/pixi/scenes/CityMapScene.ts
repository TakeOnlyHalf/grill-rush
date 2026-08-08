import {
  Application,
  Container,
  Graphics,
  Text,
  Rectangle,
  type Ticker,
} from 'pixi.js'

/* ── Map palette (Cozy Pastel) ────────────────────────── */
const C = {
  bg: 0xf0e6d8,
  road: 0xe2d6c6,
  roadLine: 0xd8ccb8,

  zOffice: 0xc8ddf0,
  zCampus: 0xf0dcc8,
  zPark: 0xc5e8d0,
  zMarket: 0xf0e4cc,
  zFestival: 0xf0d0d0,

  bldBlue: 0x8ab8d0,
  bldBlueDark: 0x7aadcc,
  bldWarm: 0xd0a070,
  bldWarmLight: 0xd8b080,
  roofWarm: 0xc09060,
  tree: 0x78b888,
  trunk: 0xa08060,
  stall: 0xc09060,
  stallRoof: 0xd0a070,
  lantern: 0xf0bc6a,
  tent: 0xe88880,
  tentStripe: 0xf0e0d0,

  selected: 0xef8a5a,
  locked: 0xd9cfc4,
  lockText: 0xa09080,
  hover: 0xf4b06a,

  text: 0x4a3728,
  textMuted: 0x8b735f,
  white: 0xfff4e6,
  truck: 0xe85d04,
  truckCab: 0xf48c06,
  truckWin: 0x87ceeb,
  wheel: 0x4a3728,

  grassPatch: 0xd0e8d0,
}

/* ── Zone definitions ─────────────────────────────────── */
interface ZoneDef {
  id: string
  name: string
  cx: number
  cy: number
  w: number
  h: number
  color: number
  unlockDay: number
  drawDecor: (g: Graphics, x: number, y: number) => void
}

const ZONES: ZoneDef[] = [
  {
    id: 'office',
    name: '오피스 거리',
    cx: 140,
    cy: 100,
    w: 135,
    h: 75,
    color: C.zOffice,
    unlockDay: 1,
    drawDecor(g, x, y) {
      g.rect(x + 14, y + 10, 14, 30)
      g.fill(C.bldBlue)
      g.rect(x + 34, y + 6, 16, 34)
      g.fill(C.bldBlueDark)
      g.rect(x + 56, y + 14, 12, 26)
      g.fill(C.bldBlue)
      for (let i = 0; i < 3; i++) {
        g.rect(x + 37, y + 10 + i * 10, 4, 4)
        g.fill(C.white)
      }
    },
  },
  {
    id: 'campus',
    name: '대학가',
    cx: 500,
    cy: 100,
    w: 135,
    h: 75,
    color: C.zCampus,
    unlockDay: 1,
    drawDecor(g, x, y) {
      g.rect(x + 15, y + 16, 40, 24)
      g.fill(C.bldWarm)
      g.moveTo(x + 15, y + 16)
      g.lineTo(x + 35, y + 4)
      g.lineTo(x + 55, y + 16)
      g.closePath()
      g.fill(C.roofWarm)
      g.rect(x + 62, y + 22, 20, 18)
      g.fill(C.bldWarmLight)
    },
  },
  {
    id: 'park',
    name: '공원 앞',
    cx: 140,
    cy: 285,
    w: 135,
    h: 75,
    color: C.zPark,
    unlockDay: 5,
    drawDecor(g, x, y) {
      const drawTree = (tx: number, ty: number, r: number) => {
        g.rect(tx - 2, ty, 4, 12)
        g.fill(C.trunk)
        g.circle(tx, ty - 2, r)
        g.fill(C.tree)
      }
      drawTree(x + 25, y + 26, 10)
      drawTree(x + 50, y + 22, 12)
      drawTree(x + 72, y + 28, 9)
    },
  },
  {
    id: 'night_market',
    name: '야시장 입구',
    cx: 500,
    cy: 285,
    w: 135,
    h: 75,
    color: C.zMarket,
    unlockDay: 10,
    drawDecor(g, x, y) {
      g.rect(x + 12, y + 20, 24, 16)
      g.fill(C.stall)
      g.rect(x + 10, y + 12, 28, 5)
      g.fill(C.stallRoof)
      g.rect(x + 50, y + 20, 24, 16)
      g.fill(C.stall)
      g.rect(x + 48, y + 12, 28, 5)
      g.fill(C.stallRoof)
      g.circle(x + 24, y + 8, 4)
      g.fill(C.lantern)
      g.circle(x + 62, y + 8, 4)
      g.fill(C.lantern)
    },
  },
  {
    id: 'festival',
    name: '축제 광장',
    cx: 320,
    cy: 192,
    w: 145,
    h: 80,
    color: C.zFestival,
    unlockDay: 99,
    drawDecor(g, x, y) {
      g.moveTo(x + 25, y + 36)
      g.lineTo(x + 45, y + 8)
      g.lineTo(x + 65, y + 36)
      g.closePath()
      g.fill(C.tent)
      g.moveTo(x + 35, y + 22)
      g.lineTo(x + 45, y + 8)
      g.lineTo(x + 55, y + 22)
      g.closePath()
      g.fill(C.tentStripe)
      g.rect(x + 44, y + 4, 2, 10)
      g.fill(C.text)
      g.moveTo(x + 46, y + 4)
      g.lineTo(x + 55, y + 8)
      g.lineTo(x + 46, y + 12)
      g.closePath()
      g.fill(C.tent)
    },
  },
]

/* ── Road segments ────────────────────────────────────── */
const ROAD_W = 18

interface Road {
  x1: number
  y1: number
  x2: number
  y2: number
}

const ROADS: Road[] = [
  { x1: 140, y1: 100, x2: 500, y2: 100 },
  { x1: 140, y1: 285, x2: 500, y2: 285 },
  { x1: 140, y1: 100, x2: 140, y2: 285 },
  { x1: 500, y1: 100, x2: 500, y2: 285 },
  { x1: 320, y1: 100, x2: 320, y2: 285 },
]

/* ── Public API ───────────────────────────────────────── */

export interface CityMapState {
  selectedLocation: string
  unlockedLocations: string[]
  day: number
}

export interface CityMapHandle {
  update: (next: Partial<CityMapState>) => void
  destroy: () => void
}

export function createCityMapScene(
  app: Application,
  initial: CityMapState,
  onSelect: (locationId: string) => void,
): CityMapHandle {
  const root = new Container()
  app.stage.addChild(root)

  const state = { ...initial }
  let elapsed = 0

  const zoneBorders = new Map<string, Graphics>()
  const zoneOverlays = new Map<string, Container>()
  const truckMarker = new Container()

  /* ── Background ─────────────────────────────── */
  const bgRect = new Graphics()
  bgRect.rect(0, 0, app.screen.width, app.screen.height)
  bgRect.fill(C.bg)
  root.addChild(bgRect)

  /* ── Roads ──────────────────────────────────── */
  const roadG = new Graphics()
  for (const r of ROADS) {
    if (r.y1 === r.y2) {
      roadG.rect(
        Math.min(r.x1, r.x2),
        r.y1 - ROAD_W / 2,
        Math.abs(r.x2 - r.x1),
        ROAD_W,
      )
    } else {
      roadG.rect(
        r.x1 - ROAD_W / 2,
        Math.min(r.y1, r.y2),
        ROAD_W,
        Math.abs(r.y2 - r.y1),
      )
    }
  }
  roadG.fill(C.road)

  for (const r of ROADS) {
    roadG.moveTo(r.x1, r.y1)
    roadG.lineTo(r.x2, r.y2)
    roadG.stroke({ width: 1, color: C.roadLine })
  }
  root.addChild(roadG)

  /* ── Green patches ──────────────────────────── */
  const patches = new Graphics()
  patches.circle(230, 155, 14)
  patches.fill(C.grassPatch)
  patches.circle(415, 155, 11)
  patches.fill(C.grassPatch)
  patches.circle(228, 230, 10)
  patches.fill(C.grassPatch)
  patches.circle(418, 235, 13)
  patches.fill(C.grassPatch)
  root.addChild(patches)

  /* ── Zones ──────────────────────────────────── */
  for (const zone of ZONES) {
    const x = zone.cx - zone.w / 2
    const y = zone.cy - zone.h / 2

    const container = new Container()

    const fill = new Graphics()
    fill.roundRect(x, y, zone.w, zone.h, 10)
    fill.fill(zone.color)
    container.addChild(fill)

    const border = new Graphics()
    container.addChild(border)
    zoneBorders.set(zone.id, border)

    const decor = new Graphics()
    zone.drawDecor(decor, x, y)
    container.addChild(decor)

    const label = new Text({
      text: zone.name,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: C.text,
      },
    })
    label.anchor.set(0.5, 1)
    label.x = zone.cx
    label.y = y + zone.h - 6
    container.addChild(label)

    /* locked overlay */
    const overlay = new Container()
    const lockBg = new Graphics()
    lockBg.roundRect(x, y, zone.w, zone.h, 10)
    lockBg.fill({ color: C.locked, alpha: 0.65 })
    overlay.addChild(lockBg)

    const lockDayLabel = new Text({
      text: `Day ${zone.unlockDay}`,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: C.lockText,
      },
    })
    lockDayLabel.anchor.set(0.5, 0.5)
    lockDayLabel.x = zone.cx
    lockDayLabel.y = zone.cy - 5
    overlay.addChild(lockDayLabel)

    const lockBody = new Graphics()
    lockBody.roundRect(zone.cx - 8, zone.cy + 12, 16, 12, 2)
    lockBody.fill(C.lockText)

    // 고리는 별도 Graphics — 같은 객체에서 fill 후 stroke 하면
    // roundRect 끝점이 arc와 이어져 좌상단으로 선이 남는 문제 방지
    const lockShackle = new Graphics()
    lockShackle.arc(zone.cx, zone.cy + 12, 6, Math.PI, 0)
    lockShackle.stroke({ width: 2.5, color: C.lockText })

    overlay.addChild(lockBody, lockShackle)

    container.addChild(overlay)
    zoneOverlays.set(zone.id, overlay)

    /* interaction */
    container.hitArea = new Rectangle(x, y, zone.w, zone.h)
    container.eventMode = 'static'
    container.cursor = 'pointer'

    container.on('pointerdown', () => {
      if (state.unlockedLocations.includes(zone.id)) {
        onSelect(zone.id)
      }
    })

    container.on('pointerover', () => {
      if (
        state.unlockedLocations.includes(zone.id) &&
        state.selectedLocation !== zone.id
      ) {
        drawBorder(border, x, y, zone.w, zone.h, C.hover, 2.5)
      }
    })

    container.on('pointerout', () => {
      if (state.selectedLocation !== zone.id) {
        border.clear()
      }
    })

    root.addChild(container)
  }

  /* ── Truck marker ───────────────────────────── */
  root.addChild(truckMarker)

  /* ── Helpers ────────────────────────────────── */

  function drawBorder(
    g: Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    width: number,
  ) {
    g.clear()
    g.roundRect(x - 2, y - 2, w + 4, h + 4, 12)
    g.stroke({ width, color })
  }

  function drawTruck(cx: number, cy: number) {
    truckMarker.removeChildren()
    const g = new Graphics()
    g.roundRect(-16, -8, 28, 14, 3)
    g.fill(C.truck)
    g.roundRect(8, -11, 10, 11, 2)
    g.fill(C.truckCab)
    g.roundRect(10, -8, 5, 5, 1)
    g.fill(C.truckWin)
    g.circle(-8, 7, 3.5)
    g.fill(C.wheel)
    g.circle(10, 7, 3.5)
    g.fill(C.wheel)
    truckMarker.addChild(g)
    truckMarker.x = cx
    truckMarker.y = cy
  }

  function refreshStates() {
    for (const zone of ZONES) {
      const border = zoneBorders.get(zone.id)!
      const overlay = zoneOverlays.get(zone.id)!
      const unlocked = state.unlockedLocations.includes(zone.id)
      const selected = state.selectedLocation === zone.id

      overlay.visible = !unlocked

      if (selected) {
        const x = zone.cx - zone.w / 2
        const y = zone.cy - zone.h / 2
        drawBorder(border, x, y, zone.w, zone.h, C.selected, 3)
        drawTruck(zone.cx + zone.w / 2 - 22, zone.cy - zone.h / 2 - 14)
      } else {
        border.clear()
      }
    }
  }

  /* ── Ticker ─────────────────────────────────── */
  const onTick = (ticker: Ticker) => {
    elapsed += ticker.deltaMS / 1000

    const border = zoneBorders.get(state.selectedLocation)
    if (border) {
      border.alpha = 0.7 + Math.sin(elapsed * 3) * 0.3
    }

    const zone = ZONES.find((z) => z.id === state.selectedLocation)
    if (zone && truckMarker.children.length > 0) {
      truckMarker.y =
        zone.cy - zone.h / 2 - 14 + Math.sin(elapsed * 2.5) * 2
    }
  }

  refreshStates()
  app.ticker.add(onTick)

  /* ── Handle ─────────────────────────────────── */
  return {
    update(next) {
      let changed = false
      if (
        next.selectedLocation !== undefined &&
        next.selectedLocation !== state.selectedLocation
      ) {
        state.selectedLocation = next.selectedLocation
        changed = true
      }
      if (next.unlockedLocations !== undefined) {
        state.unlockedLocations = next.unlockedLocations
        changed = true
      }
      if (next.day !== undefined) {
        state.day = next.day
        changed = true
      }
      if (changed) refreshStates()
    },
    destroy() {
      app.ticker.remove(onTick)
      root.destroy({ children: true })
    },
  }
}
