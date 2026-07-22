import {
  Application,
  Container,
  Graphics,
  Text,
  Rectangle,
  type Ticker,
} from 'pixi.js'

/* ================================================================
   PALETTE
   ================================================================ */

const P = {
  skyTop: 0x4890d0,
  skyMid: 0x78b8e8,
  skyLow: 0xb0d8f0,
  skyHorizon: 0xf0d8b0,
  cloud: 0xffffff,
  cloudShade: 0xe0e8f0,

  mtFar: 0xb0c8d8,
  mtNear: 0x98b8c8,
  mtAccent: 0xa0c0d0,

  grass: 0x7cb868,
  grassLight: 0x90d078,
  grassDark: 0x5ca048,
  road: 0xa8a098,
  roadDark: 0x908880,
  roadLine: 0xe8e0d0,
  sidewalk: 0xd0c8b8,

  treeTrunk: 0x886848,
  leaf1: 0x58a848,
  leaf2: 0x70b860,
  leaf3: 0x48a038,
  leafPine: 0x408838,

  parkPond: 0x70b8d0,
  parkPondLight: 0x98d0e0,
  gazeboRoof: 0xc89070,
  gazeboPillar: 0xe8d8c0,
  bench: 0x907858,
  flower1: 0xf090a8,
  flower2: 0xf0d060,
  pathDirt: 0xd0c098,

  offGlass1: 0x80b8d8,
  offGlass2: 0x6aa8c8,
  offGlass3: 0x90c0e0,
  offFrame: 0x607080,
  offWin: 0xc8e0f8,
  offWinLit: 0xf8f0d0,
  offDoor: 0x506068,
  offPlaza: 0xc8c0b0,

  tentRed: 0xe06060,
  tentCream: 0xf8f0e0,
  tentPole: 0x886848,
  bannerYel: 0xf8d040,
  bannerBlu: 0x60a0d0,
  stageBrn: 0xb89870,
  fountain: 0x90c8d8,
  lightStr: 0xf8e080,

  campBrick: 0xb88068,
  campWall: 0xe0d0b8,
  campRoof: 0x806050,
  campCol: 0xd8d0c0,
  clockBody: 0xa08868,
  clockFace: 0xf0e8d8,

  stallWood: 0xc09060,
  awnRed: 0xd85040,
  awnGold: 0xe8a040,
  awnGreen: 0x60a860,
  lantern: 0xf8d060,
  lanternGlow: 0xfff0a0,
  gateRed: 0xc84040,
  steam: 0xf0f0f0,

  sel: 0xef8a5a,
  selGlow: 0xfcb888,
  hover: 0xf4b06a,
  locked: 0x808888,
  labelBg: 0x000000,
  labelTxt: 0xffffff,

  truck: 0xe85d04,
  truckCab: 0xf48c06,
  truckWin: 0x87ceeb,
  wheel: 0x3a3028,
}

/* ================================================================
   DRAWING HELPERS
   ================================================================ */

function lerp(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  )
}

function vGrad(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  top: number,
  bot: number,
  steps = 20,
) {
  const s = h / steps
  for (let i = 0; i < steps; i++) {
    g.rect(x, y + i * s, w, s + 1)
    g.fill(lerp(top, bot, i / (steps - 1)))
  }
}

function drawCloud(g: Graphics, cx: number, cy: number, s: number) {
  const r = (rx: number, ry: number, rad: number, c: number) => {
    g.ellipse(cx + rx * s, cy + ry * s, rad * s, rad * s * 0.6)
    g.fill(c)
  }
  r(-12, 4, 14, P.cloudShade)
  r(10, 4, 16, P.cloudShade)
  r(-15, 0, 14, P.cloud)
  r(0, -4, 18, P.cloud)
  r(15, 0, 14, P.cloud)
  r(-5, 2, 16, P.cloud)
  r(8, 2, 14, P.cloud)
}

function drawMountain(
  g: Graphics,
  cx: number,
  baseY: number,
  w: number,
  h: number,
  color: number,
) {
  g.moveTo(cx - w / 2, baseY)
  g.lineTo(cx - w * 0.1, baseY - h)
  g.lineTo(cx + w * 0.05, baseY - h * 0.85)
  g.lineTo(cx + w * 0.15, baseY - h * 0.95)
  g.lineTo(cx + w / 2, baseY)
  g.closePath()
  g.fill(color)
}

function drawBuilding(
  g: Graphics,
  x: number,
  baseY: number,
  w: number,
  h: number,
  wall: number,
  roof: number,
  win: number,
  winRows: number,
  winCols: number,
) {
  g.rect(x + 2, baseY - 4, w - 4, 6)
  g.fill({ color: 0x000000, alpha: 0.08 })

  g.rect(x, baseY - h, w, h)
  g.fill(wall)

  g.rect(x - 2, baseY - h - 4, w + 4, 6)
  g.fill(roof)

  const ww = Math.max(3, (w - 10) / (winCols * 2))
  const wh = Math.max(3, (h - 20) / (winRows * 2))
  const gapX = (w - winCols * ww) / (winCols + 1)
  const gapY = (h - 16 - winRows * wh) / (winRows + 1)
  for (let r = 0; r < winRows; r++) {
    for (let c = 0; c < winCols; c++) {
      const wx = x + gapX * (c + 1) + ww * c
      const wy = baseY - h + 10 + gapY * (r + 1) + wh * r
      g.rect(wx, wy, ww, wh)
      g.fill(win)
    }
  }
}

function drawRoundTree(
  g: Graphics,
  cx: number,
  baseY: number,
  h: number,
  r: number,
) {
  g.rect(cx - 3, baseY - h * 0.45, 6, h * 0.45)
  g.fill(P.treeTrunk)
  g.circle(cx - r * 0.3, baseY - h * 0.55, r * 0.75)
  g.fill(P.leaf3)
  g.circle(cx + r * 0.35, baseY - h * 0.5, r * 0.7)
  g.fill(P.leaf1)
  g.circle(cx, baseY - h * 0.65, r * 0.85)
  g.fill(P.leaf2)
}

function drawPineTree(g: Graphics, cx: number, baseY: number, h: number) {
  g.rect(cx - 3, baseY - h * 0.3, 6, h * 0.3)
  g.fill(P.treeTrunk)
  for (let i = 0; i < 3; i++) {
    const ty = baseY - h * 0.3 - (h * 0.22) * i
    const tw = 14 + (2 - i) * 8
    g.moveTo(cx - tw, ty)
    g.lineTo(cx, ty - h * 0.25)
    g.lineTo(cx + tw, ty)
    g.closePath()
    g.fill(i === 1 ? P.leaf1 : P.leafPine)
  }
}

function drawSmallTree(g: Graphics, cx: number, baseY: number) {
  g.rect(cx - 2, baseY - 16, 4, 16)
  g.fill(P.treeTrunk)
  g.circle(cx, baseY - 22, 10)
  g.fill(P.leaf2)
  g.circle(cx - 4, baseY - 18, 7)
  g.fill(P.leaf1)
}

function drawStall(
  g: Graphics,
  x: number,
  baseY: number,
  w: number,
  awnColor: number,
) {
  g.rect(x, baseY - 34, w, 34)
  g.fill(P.stallWood)

  g.rect(x - 4, baseY - 42, w + 8, 12)
  g.fill(awnColor)

  const stripes = Math.floor(w / 8)
  for (let i = 0; i < stripes; i += 2) {
    g.rect(x - 4 + i * ((w + 8) / stripes), baseY - 42, (w + 8) / stripes, 12)
    g.fill({ color: 0xffffff, alpha: 0.2 })
  }

  g.rect(x + 3, baseY - 28, w - 6, 4)
  g.fill({ color: 0x000000, alpha: 0.15 })
}

function drawLantern(g: Graphics, cx: number, cy: number) {
  g.rect(cx - 1, cy - 10, 2, 6)
  g.fill(P.tentPole)
  g.ellipse(cx, cy, 6, 8)
  g.fill(P.lantern)
  g.ellipse(cx, cy, 9, 11)
  g.fill({ color: P.lanternGlow, alpha: 0.15 })
}

function drawTruck(container: Container, _cx: number, _cy: number) {
  const g = new Graphics()
  g.roundRect(-20, -10, 34, 18, 3)
  g.fill(P.truck)
  g.roundRect(10, -14, 12, 14, 2)
  g.fill(P.truckCab)
  g.roundRect(12, -10, 6, 6, 1)
  g.fill(P.truckWin)
  g.circle(-10, 9, 4.5)
  g.fill(P.wheel)
  g.circle(14, 9, 4.5)
  g.fill(P.wheel)
  container.addChild(g)
}

function drawGlow(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  layers = 8,
) {
  for (let i = layers; i > 0; i--) {
    g.roundRect(x - i * 2, y - i * 2, w + i * 4, h + i * 4, 8 + i)
    g.fill({ color, alpha: 0.03 * (layers - i + 1) })
  }
}

/* ================================================================
   DISTRICTS
   ================================================================ */

interface DistrictDef {
  id: string
  name: string
  icon: string
  left: number
  right: number
  unlockDay: number
  draw: (g: Graphics, ground: number) => void
}

const GROUND_Y = 530

/** 좌측 스테이징(빈 공간) — 트럭이 처음 대기하는 구역 */
export const STAGE_LEFT = 280
/** 구역 콘텐츠 폭 (기존 맵 스케일 유지) */
export const CONTENT_W = 1280
export const DESIGN_W = STAGE_LEFT + CONTENT_W
export const DESIGN_H = 720

const DISTRICTS: DistrictDef[] = [
  {
    id: 'park',
    name: '공원 앞',
    icon: '🌳',
    left: 20,
    right: 260,
    unlockDay: 3,
    draw(g, gy) {
      g.ellipse(80, gy + 16, 50, 8)
      g.fill(P.parkPondLight)
      g.ellipse(80, gy + 14, 44, 6)
      g.fill(P.parkPond)

      g.rect(170, gy - 40, 4, 40)
      g.fill(P.gazeboPillar)
      g.rect(200, gy - 40, 4, 40)
      g.fill(P.gazeboPillar)
      g.moveTo(155, gy - 38)
      g.lineTo(187, gy - 60)
      g.lineTo(215, gy - 38)
      g.closePath()
      g.fill(P.gazeboRoof)

      g.roundRect(140, gy - 8, 20, 6, 2)
      g.fill(P.bench)

      drawRoundTree(g, 40, gy, 70, 20)
      drawRoundTree(g, 120, gy, 85, 24)
      drawPineTree(g, 230, gy, 65)

      for (const [fx, fy, fc] of [
        [55, gy - 6, P.flower1],
        [65, gy - 4, P.flower2],
        [105, gy - 8, P.flower1],
        [145, gy - 2, P.flower2],
        [200, gy - 5, P.flower1],
      ] as const) {
        g.circle(fx, fy, 3)
        g.fill(fc)
      }

      g.moveTo(30, gy + 4)
      g.quadraticCurveTo(100, gy - 10, 170, gy + 2)
      g.quadraticCurveTo(220, gy + 10, 250, gy + 4)
      g.stroke({ width: 6, color: P.pathDirt })
    },
  },
  {
    id: 'office',
    name: '오피스 거리',
    icon: '🏢',
    left: 240,
    right: 510,
    unlockDay: 1,
    draw(g, gy) {
      drawBuilding(g, 250, gy, 55, 200, P.offGlass1, P.offFrame, P.offWin, 10, 3)
      drawBuilding(g, 315, gy, 50, 170, P.offGlass2, P.offFrame, P.offWinLit, 8, 3)
      drawBuilding(g, 375, gy, 60, 220, P.offGlass3, P.offFrame, P.offWin, 12, 3)
      drawBuilding(g, 445, gy, 45, 150, P.offGlass1, P.offFrame, P.offWinLit, 7, 2)

      g.rect(370, gy - 220 - 12, 6, 12)
      g.fill(P.offFrame)
      g.circle(373, gy - 232 - 3, 2)
      g.fill(0xf04040)

      g.rect(240, gy, 270, 10)
      g.fill(P.offPlaza)

      drawSmallTree(g, 310, gy)
      drawSmallTree(g, 440, gy)

      g.rect(280, gy - 20, 22, 20)
      g.fill(P.offDoor)
      g.rect(395, gy - 22, 24, 22)
      g.fill(P.offDoor)
    },
  },
  {
    id: 'festival',
    name: '축제 광장',
    icon: '🎪',
    left: 490,
    right: 790,
    unlockDay: 99,
    draw(g, gy) {
      g.rect(520, gy - 6, 240, 10)
      g.fill(P.stageBrn)

      g.moveTo(560, gy - 4)
      g.lineTo(600, gy - 80)
      g.lineTo(640, gy - 4)
      g.closePath()
      g.fill(P.tentRed)
      g.moveTo(575, gy - 30)
      g.lineTo(600, gy - 80)
      g.lineTo(625, gy - 30)
      g.closePath()
      g.fill(P.tentCream)

      g.moveTo(680, gy - 4)
      g.lineTo(710, gy - 60)
      g.lineTo(740, gy - 4)
      g.closePath()
      g.fill(P.bannerBlu)
      g.moveTo(690, gy - 22)
      g.lineTo(710, gy - 60)
      g.lineTo(730, gy - 22)
      g.closePath()
      g.fill(P.tentCream)

      g.rect(599, gy - 90, 2, 20)
      g.fill(P.tentPole)
      g.moveTo(601, gy - 90)
      g.lineTo(614, gy - 85)
      g.lineTo(601, gy - 80)
      g.closePath()
      g.fill(P.bannerYel)

      g.rect(709, gy - 68, 2, 16)
      g.fill(P.tentPole)
      g.moveTo(711, gy - 68)
      g.lineTo(722, gy - 64)
      g.lineTo(711, gy - 60)
      g.closePath()
      g.fill(P.tentRed)

      g.ellipse(640, gy + 20, 22, 6)
      g.fill(P.fountain)
      g.rect(636, gy + 4, 8, 16)
      g.fill(P.fountain)
      g.ellipse(640, gy + 4, 6, 3)
      g.fill(P.parkPondLight)

      const flagY = gy - 100
      for (let i = 0; i < 7; i++) {
        const fx = 540 + i * 32
        g.moveTo(fx, flagY)
        g.lineTo(fx + 10, flagY + 12)
        g.lineTo(fx + 20, flagY)
        g.closePath()
        g.fill(i % 3 === 0 ? P.tentRed : i % 3 === 1 ? P.bannerYel : P.bannerBlu)
      }
      g.moveTo(540, flagY)
      g.lineTo(760, flagY)
      g.stroke({ width: 1.5, color: P.tentPole })
    },
  },
  {
    id: 'campus',
    name: '대학가',
    icon: '🎓',
    left: 770,
    right: 1030,
    unlockDay: 1,
    draw(g, gy) {
      drawBuilding(g, 790, gy, 80, 110, P.campWall, P.campRoof, P.offWin, 4, 4)

      g.rect(790, gy - 110, 80, 6)
      g.fill(P.campRoof)
      for (let i = 0; i < 4; i++) {
        g.rect(796 + i * 18, gy - 26, 5, 26)
        g.fill(P.campCol)
      }
      g.rect(818, gy - 24, 18, 24)
      g.fill(P.offDoor)

      drawBuilding(g, 885, gy, 60, 90, P.campBrick, P.campRoof, P.offWinLit, 3, 3)

      g.rect(960, gy, 30, -140)
      g.fill(P.clockBody)
      g.rect(954, gy - 140, 42, 8)
      g.fill(P.campRoof)
      g.moveTo(960, gy - 140)
      g.lineTo(975, gy - 165)
      g.lineTo(990, gy - 140)
      g.closePath()
      g.fill(P.campRoof)
      g.circle(975, gy - 120, 12)
      g.fill(P.clockFace)
      g.moveTo(975, gy - 120)
      g.lineTo(975, gy - 130)
      g.stroke({ width: 1.5, color: P.campRoof })
      g.moveTo(975, gy - 120)
      g.lineTo(981, gy - 118)
      g.stroke({ width: 1.5, color: P.campRoof })

      drawRoundTree(g, 880, gy, 55, 16)
      drawSmallTree(g, 950, gy)
      drawRoundTree(g, 1010, gy, 60, 18)

      g.moveTo(790, gy + 6)
      g.lineTo(1020, gy + 6)
      g.stroke({ width: 5, color: P.pathDirt })
    },
  },
  {
    id: 'night_market',
    name: '야시장 입구',
    icon: '🌙',
    left: 1010,
    right: 1260,
    unlockDay: 5,
    draw(g, gy) {
      g.rect(1030, gy - 70, 14, 70)
      g.fill(P.gateRed)
      g.rect(1106, gy - 70, 14, 70)
      g.fill(P.gateRed)
      g.rect(1026, gy - 78, 98, 12)
      g.fill(P.gateRed)
      g.rect(1030, gy - 84, 90, 8)
      g.fill(P.awnGold)

      drawStall(g, 1040, gy, 30, P.awnRed)
      drawStall(g, 1080, gy, 28, P.awnGold)
      drawStall(g, 1130, gy, 32, P.awnGreen)
      drawStall(g, 1172, gy, 28, P.awnRed)
      drawStall(g, 1210, gy, 30, P.awnGold)

      drawLantern(g, 1055, gy - 50)
      drawLantern(g, 1095, gy - 50)
      drawLantern(g, 1145, gy - 52)
      drawLantern(g, 1185, gy - 48)
      drawLantern(g, 1225, gy - 50)

      g.moveTo(1040, gy - 46)
      g.lineTo(1240, gy - 46)
      g.stroke({ width: 1, color: P.tentPole })

      drawBuilding(g, 1140, gy, 40, 100, 0xc8b8a0, P.campRoof, P.offWinLit, 4, 2)
      drawBuilding(g, 1200, gy, 50, 80, 0xb8a890, P.campRoof, P.offWin, 3, 3)
    },
  },
]

/* ================================================================
   SCENE FACTORY
   ================================================================ */

export interface PrepCityState {
  selectedLocation: string
  unlockedLocations: string[]
  day: number
}

export interface PrepCityHandle {
  update: (next: Partial<PrepCityState>) => void
  destroy: () => void
}

export function createPrepCityScene(
  app: Application,
  initial: PrepCityState,
  onSelect: (id: string) => void,
): PrepCityHandle {
  const W = DESIGN_W
  const H = DESIGN_H
  const textRes = Math.min(window.devicePixelRatio || 1, 2) * 2

  const root = new Container()
  app.stage.addChild(root)

  const state = { ...initial }
  let elapsed = 0
  const districtLabels: Text[] = []

  function layoutToScreen() {
    // 콘텐츠 비율 유지(contain). CSS로 버퍼를 늘리지 않고 렌더러 해상도로 맞춤 → 라벨 선명
    const s = Math.min(
      app.screen.width / DESIGN_W,
      app.screen.height / DESIGN_H,
    )
    root.scale.set(s)
    root.x = 0
    root.y = (app.screen.height - DESIGN_H * s) / 2
    const res = Math.max(2, (window.devicePixelRatio || 1) * s)
    for (const t of districtLabels) {
      t.resolution = res
    }
  }
  const onResize = () => layoutToScreen()
  app.renderer.on('resize', onResize)

  /* ── Sky ─────────────────────────────────────── */
  const skyG = new Graphics()
  vGrad(skyG, 0, 0, W, H * 0.25, P.skyTop, P.skyMid, 16)
  vGrad(skyG, 0, H * 0.25, W, H * 0.15, P.skyMid, P.skyLow, 10)
  vGrad(skyG, 0, H * 0.4, W, H * 0.05, P.skyLow, P.skyHorizon, 6)
  root.addChild(skyG)

  const sunG = new Graphics()
  sunG.circle(STAGE_LEFT + CONTENT_W * 0.82, H * 0.32, 50)
  sunG.fill({ color: 0xfff8e0, alpha: 0.3 })
  sunG.circle(STAGE_LEFT + CONTENT_W * 0.82, H * 0.32, 30)
  sunG.fill({ color: 0xfff0c0, alpha: 0.4 })
  sunG.circle(STAGE_LEFT + CONTENT_W * 0.82, H * 0.32, 14)
  sunG.fill({ color: 0xfffff0, alpha: 0.8 })
  root.addChild(sunG)

  /* ── Clouds ──────────────────────────────────── */
  interface CloudData {
    x: number
    y: number
    s: number
    speed: number
  }
  const clouds: CloudData[] = [
    { x: 80, y: H * 0.12, s: 1.1, speed: 5 },
    { x: STAGE_LEFT + 120, y: H * 0.1, s: 1.4, speed: 6 },
    { x: STAGE_LEFT + 400, y: H * 0.06, s: 1.0, speed: 4 },
    { x: STAGE_LEFT + 700, y: H * 0.14, s: 1.2, speed: 5 },
    { x: STAGE_LEFT + 950, y: H * 0.08, s: 0.9, speed: 7 },
    { x: STAGE_LEFT + 1180, y: H * 0.12, s: 1.1, speed: 3 },
  ]
  const cloudContainer = new Container()
  const cloudG = new Graphics()
  function redrawClouds() {
    cloudG.clear()
    for (const c of clouds) {
      drawCloud(cloudG, c.x, c.y, c.s)
    }
  }
  redrawClouds()
  cloudContainer.addChild(cloudG)
  root.addChild(cloudContainer)

  /* ── Mountains ───────────────────────────────── */
  const mtG = new Graphics()
  drawMountain(mtG, 100, H * 0.42, 220, 40, P.mtAccent)
  drawMountain(mtG, STAGE_LEFT + 150, H * 0.42, 300, 60, P.mtFar)
  drawMountain(mtG, STAGE_LEFT + 450, H * 0.42, 250, 45, P.mtAccent)
  drawMountain(mtG, STAGE_LEFT + 700, H * 0.42, 350, 70, P.mtFar)
  drawMountain(mtG, STAGE_LEFT + 1000, H * 0.42, 280, 55, P.mtNear)
  drawMountain(mtG, STAGE_LEFT + 1200, H * 0.42, 200, 40, P.mtAccent)
  root.addChild(mtG)

  /* ── Ground base ─────────────────────────────── */
  const groundG = new Graphics()
  vGrad(groundG, 0, H * 0.42, W, H * 0.58, P.grassLight, P.grassDark, 8)

  groundG.rect(0, GROUND_Y + 6, W, 50)
  groundG.fill(P.road)
  groundG.moveTo(0, GROUND_Y + 30)
  groundG.lineTo(W, GROUND_Y + 30)
  groundG.stroke({ width: 2, color: P.roadLine })

  groundG.rect(0, GROUND_Y + 56, W, 4)
  groundG.fill(P.sidewalk)
  groundG.rect(0, GROUND_Y + 2, W, 4)
  groundG.fill(P.sidewalk)

  root.addChild(groundG)

  /* ── Staging area (left empty bay) ───────────── */
  const stageG = new Graphics()
  drawRoundTree(stageG, 55, GROUND_Y, 70, 18)
  drawPineTree(stageG, 130, GROUND_Y, 55)
  drawSmallTree(stageG, 200, GROUND_Y)
  // 주차/대기 표시
  stageG.roundRect(STAGE_LEFT * 0.5 - 28, GROUND_Y + 14, 56, 28, 4)
  stageG.stroke({ width: 2, color: P.roadLine, alpha: 0.7 })
  root.addChild(stageG)

  /* ── Far background buildings (atmospheric) ──── */
  const farG = new Graphics()
  const farBuildings = [
    { x: STAGE_LEFT + 60, w: 25, h: 50 },
    { x: STAGE_LEFT + 120, w: 30, h: 70 },
    { x: STAGE_LEFT + 200, w: 20, h: 45 },
    { x: STAGE_LEFT + 340, w: 35, h: 90 },
    { x: STAGE_LEFT + 400, w: 25, h: 65 },
    { x: STAGE_LEFT + 500, w: 30, h: 55 },
    { x: STAGE_LEFT + 580, w: 40, h: 80 },
    { x: STAGE_LEFT + 650, w: 20, h: 60 },
    { x: STAGE_LEFT + 750, w: 35, h: 75 },
    { x: STAGE_LEFT + 840, w: 25, h: 50 },
    { x: STAGE_LEFT + 920, w: 30, h: 85 },
    { x: STAGE_LEFT + 1050, w: 25, h: 55 },
    { x: STAGE_LEFT + 1130, w: 35, h: 70 },
    { x: STAGE_LEFT + 1200, w: 20, h: 45 },
  ]
  for (const b of farBuildings) {
    const by = H * 0.42 + 30
    farG.rect(b.x, by - b.h, b.w, b.h)
    farG.fill({ color: P.mtNear, alpha: 0.4 })
  }
  root.addChild(farG)

  /* ── Districts (기존 좌표 스케일 유지, 좌측 오프셋) ─ */
  const cityLayer = new Container()
  cityLayer.x = STAGE_LEFT
  root.addChild(cityLayer)

  const districtContainers = new Map<string, Container>()
  const districtGlows = new Map<string, Graphics>()
  const districtOverlays = new Map<string, Container>()

  const stagingX = STAGE_LEFT * 0.5
  function getDistrictCenter(id: string): number {
    const d = DISTRICTS.find((dd) => dd.id === id)
    return d ? STAGE_LEFT + (d.left + d.right) / 2 : stagingX
  }
  let truckTargetX = stagingX

  for (const d of DISTRICTS) {
    const c = new Container()
    const dg = new Graphics()
    d.draw(dg, GROUND_Y)
    c.addChild(dg)

    const glow = new Graphics()
    c.addChild(glow)
    districtGlows.set(d.id, glow)

    const labelBg = new Graphics()
    const labelW = d.name.length * 16 + 36
    const labelX = (d.left + d.right) / 2 - labelW / 2
    const labelY = GROUND_Y + 64
    labelBg.roundRect(labelX, labelY, labelW, 28, 14)
    labelBg.fill({ color: P.labelBg, alpha: 0.55 })
    c.addChild(labelBg)

    const label = new Text({
      text: `${d.icon} ${d.name}`,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 15,
        fontWeight: 'bold',
        fill: P.labelTxt,
      },
    })
    label.anchor.set(0.5, 0.5)
    label.x = (d.left + d.right) / 2
    label.y = labelY + 14
    c.addChild(label)
    districtLabels.push(label)

    const overlay = new Container()
    const oBg = new Graphics()
    oBg.rect(d.left, GROUND_Y - 250, d.right - d.left, 310)
    oBg.fill({ color: P.locked, alpha: 0.45 })
    overlay.addChild(oBg)

    const lockTxt = new Text({
      text: `Day ${d.unlockDay} 해금`,
      resolution: textRes,
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: P.labelTxt,
      },
    })
    lockTxt.anchor.set(0.5, 0.5)
    lockTxt.x = (d.left + d.right) / 2
    lockTxt.y = GROUND_Y - 80
    overlay.addChild(lockTxt)
    districtLabels.push(lockTxt)

    const lcx = (d.left + d.right) / 2
    const lcy = GROUND_Y - 120

    const lockBody = new Graphics()
    lockBody.roundRect(lcx - 10, lcy, 20, 16, 4)
    lockBody.fill(P.labelTxt)

    // 고리는 별도 Graphics — fill 후 stroke 경로 이어짐 방지
    const lockShackle = new Graphics()
    lockShackle.arc(lcx, lcy, 9, Math.PI, 0)
    lockShackle.stroke({ width: 3, color: P.labelTxt })

    overlay.addChild(lockBody, lockShackle)

    c.addChild(overlay)
    districtOverlays.set(d.id, overlay)

    c.hitArea = new Rectangle(d.left, GROUND_Y - 250, d.right - d.left, 310)
    c.eventMode = 'static'
    c.cursor = 'pointer'

    c.on('pointerdown', () => {
      if (state.unlockedLocations.includes(d.id)) {
        truckTargetX = getDistrictCenter(d.id)
        onSelect(d.id)
      }
    })
    c.on('pointerover', () => {
      if (
        state.unlockedLocations.includes(d.id) &&
        state.selectedLocation !== d.id
      ) {
        const gl = districtGlows.get(d.id)!
        gl.clear()
        drawGlow(
          gl,
          d.left,
          GROUND_Y - 250,
          d.right - d.left,
          310,
          P.hover,
          6,
        )
      }
    })
    c.on('pointerout', () => {
      if (state.selectedLocation !== d.id) {
        districtGlows.get(d.id)!.clear()
      }
    })

    cityLayer.addChild(c)
    districtContainers.set(d.id, c)
  }

  /* ── Scattered trees between districts ───────── */
  const scatterG = new Graphics()
  drawSmallTree(scatterG, 235, GROUND_Y)
  drawSmallTree(scatterG, 475, GROUND_Y)
  drawPineTree(scatterG, 500, GROUND_Y, 50)
  drawSmallTree(scatterG, 760, GROUND_Y)
  drawSmallTree(scatterG, 1005, GROUND_Y)
  cityLayer.addChild(scatterG)

  /* ── Truck marker ────────────────────────────── */
  const truckContainer = new Container()
  drawTruck(truckContainer, 0, 0)
  truckContainer.y = GROUND_Y + 22
  truckContainer.x = stagingX
  root.addChild(truckContainer)

  /* ── Particles (floating leaves) ─────────────── */
  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    r: number
    color: number
  }
  const particles: Particle[] = []
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: (i / 12) * W + (i * 97) % 200,
      y: H * 0.2 + (i * 53) % (H * 0.5),
      vx: 8 + (i * 7) % 12,
      vy: 4 + (i * 3) % 8,
      r: 2 + (i % 3),
      color: i % 3 === 0 ? P.leaf2 : i % 3 === 1 ? P.flower1 : P.bannerYel,
    })
  }
  const particleG = new Graphics()
  root.addChild(particleG)

  /* ── State helpers ───────────────────────────── */

  function refreshStates() {
    for (const d of DISTRICTS) {
      const unlocked = state.unlockedLocations.includes(d.id)
      const selected = state.selectedLocation === d.id

      districtOverlays.get(d.id)!.visible = !unlocked

      const gl = districtGlows.get(d.id)!
      gl.clear()
      if (selected) {
        drawGlow(
          gl,
          d.left,
          GROUND_Y - 250,
          d.right - d.left,
          310,
          P.sel,
          10,
        )
      }
    }
  }

  layoutToScreen()

  /* ── Ticker ──────────────────────────────────── */
  const onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000
    elapsed += dt

    for (const c of clouds) {
      c.x += c.speed * dt
      if (c.x > W + 60) c.x = -60
    }
    redrawClouds()

    const selGlow = districtGlows.get(state.selectedLocation)
    if (selGlow) {
      selGlow.alpha = 0.7 + Math.sin(elapsed * 2.5) * 0.3
    }

    const dx = truckTargetX - truckContainer.x
    if (Math.abs(dx) > 1) {
      truckContainer.x += dx * 3 * dt
    } else {
      truckContainer.x = truckTargetX
    }
    truckContainer.y = GROUND_Y + 22 + Math.sin(elapsed * 3) * 1.5

    particleG.clear()
    for (const p of particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt + Math.sin(elapsed * 2 + p.x * 0.01) * 0.5
      if (p.x > W + 20) {
        p.x = -10
        p.y = H * 0.15 + (p.r * 97) % (H * 0.4)
      }
      if (p.y > H * 0.85) {
        p.y = H * 0.15
        p.x = (p.r * 137) % W
      }
      particleG.circle(p.x, p.y, p.r)
      particleG.fill({ color: p.color, alpha: 0.5 })
    }
  }

  refreshStates()
  app.ticker.add(onTick)

  /* ── Handle ──────────────────────────────────── */
  return {
    update(next) {
      let changed = false
      if (next.selectedLocation !== undefined && next.selectedLocation !== state.selectedLocation) {
        state.selectedLocation = next.selectedLocation
        truckTargetX = getDistrictCenter(next.selectedLocation)
        changed = true
      }
      if (next.unlockedLocations !== undefined) {
        state.unlockedLocations = next.unlockedLocations
        changed = true
      }
      if (next.day !== undefined) state.day = next.day
      if (changed) refreshStates()
    },
    destroy() {
      app.renderer.off('resize', onResize)
      app.ticker.remove(onTick)
      root.destroy({ children: true })
    },
  }
}
