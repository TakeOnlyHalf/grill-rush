import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  type Ticker,
} from 'pixi.js'
import { FOOD_TRUCK_ART, READY_PHASE_BG } from '../../utils/assets'
import { LOC_X_RATIO, ROAD_Y_RATIO } from '../../data/locationLayout'

export interface PrepLocationState {
  selectedLocation: string
  unlockedLocations: string[]
  day: number
}

export interface PrepLocationHandle {
  update: (next: Partial<PrepLocationState>) => void
  pickLocation: (id: string) => void
  destroy: () => void
}

export type LocationAnchors = Record<string, { xPct: number; yPct: number }>

/** 화면 픽셀 기준 트럭 높이 (월드 스케일과 분리) */
const TRUCK_SCREEN_H = 260
/** 선택 이펙트는 그대로, 트럭만 살짝 아래 (월드 좌표) */
const TRUCK_Y_NUDGE = 26
/** 화면 픽셀 보빙 진폭 — 스케일 밖에서 적용해 계단 현상 방지 */
const TRUCK_BOB_AMP_PX = 2.2
const TRUCK_BOB_SPEED = 2.6

const LOC_IDS = Object.keys(LOC_X_RATIO)
const GLOW = {
  sel: 0xf0a84a,
  selSoft: 0xffd27a,
  ring: 0xffe8b0,
}

/**
 * 장소 선택 배경 씬
 * 배경은 월드 스케일, 트럭은 스크린 좌표로 분리해 보빙 계단 현상을 막는다.
 */
export function createPrepLocationScene(
  app: Application,
  initial: PrepLocationState,
  _onSelect: (id: string) => void,
  onAnchors?: (anchors: LocationAnchors) => void,
): PrepLocationHandle {
  const state = { ...initial }
  let locationConfirmed = false
  let elapsed = 0
  let truckWorldX = 0
  let truckTargetWorldX = 0
  let bgW = 1920
  let bgH = 1080

  const root = new Container()
  app.stage.addChild(root)

  const world = new Container()
  root.addChild(world)

  const bgSprite = new Sprite()
  world.addChild(bgSprite)

  const highlightLayer = new Container()
  world.addChild(highlightLayer)

  const markers = new Map<string, Container>()
  for (const id of LOC_IDS) {
    const marker = new Container()
    marker.visible = false
    const g = new Graphics()
    marker.addChild(g)
    markers.set(id, marker)
    highlightLayer.addChild(marker)
  }

  // 트럭은 world 밖(root) — 화면 픽셀 단위로 위치·보빙
  const truckLayer = new Container()
  root.addChild(truckLayer)
  let truckSprite: Sprite | null = null

  function stagingX(): number {
    return bgW * 0.1
  }

  function locationX(id: string): number {
    const r = LOC_X_RATIO[id]
    return r !== undefined ? bgW * r : stagingX()
  }

  function roadY(): number {
    return bgH * ROAD_Y_RATIO
  }

  function truckBaseWorldY(): number {
    return roadY() + TRUCK_Y_NUDGE
  }

  function syncTruckToScreen(bobPx = 0) {
    const s = world.scale.x || 1
    truckLayer.x = world.x + truckWorldX * s
    truckLayer.y = world.y + truckBaseWorldY() * s + bobPx
  }

  function drawMarker(g: Graphics, pulse: number) {
    g.clear()
    const a = 0.55 + pulse * 0.45

    for (let i = 8; i >= 1; i--) {
      g.ellipse(0, 0, 70 + i * 10, 16 + i * 3)
      g.fill({ color: GLOW.sel, alpha: 0.035 * (9 - i) * a })
    }

    g.ellipse(0, 0, 58, 14)
    g.fill({ color: GLOW.selSoft, alpha: 0.22 * a })
    g.ellipse(0, 0, 36, 9)
    g.fill({ color: GLOW.ring, alpha: 0.28 * a })

    g.ellipse(0, 0, 62, 15)
    g.stroke({ width: 2.5, color: GLOW.selSoft, alpha: 0.75 * a })
    g.ellipse(0, 0, 48, 11)
    g.stroke({ width: 1.5, color: GLOW.ring, alpha: 0.55 * a })

    for (let i = 6; i >= 1; i--) {
      const h = 40 + i * 28
      const w = 18 + i * 6
      g.moveTo(-w, 0)
      g.lineTo(-w * 0.35, -h)
      g.lineTo(w * 0.35, -h)
      g.lineTo(w, 0)
      g.closePath()
      g.fill({ color: GLOW.selSoft, alpha: 0.018 * (7 - i) * a })
    }
  }

  function refreshMarkers() {
    const ry = roadY()
    for (const id of LOC_IDS) {
      const marker = markers.get(id)!
      const selected = locationConfirmed && state.selectedLocation === id
      marker.visible = selected
      marker.x = locationX(id)
      marker.y = ry - 6
    }
  }

  function publishAnchors() {
    if (!onAnchors || app.screen.width <= 0 || app.screen.height <= 0) return
    const s = world.scale.x || 1
    const anchors: LocationAnchors = {}
    for (const id of LOC_IDS) {
      const sx = world.x + locationX(id) * s
      const sy = world.y + roadY() * s
      anchors[id] = {
        xPct: (sx / app.screen.width) * 100,
        yPct: (sy / app.screen.height) * 100,
      }
    }
    onAnchors(anchors)
  }

  function layout() {
    if (!bgSprite.texture || bgSprite.texture.width === 0) return
    bgW = bgSprite.texture.width
    bgH = bgSprite.texture.height

    const sx = app.screen.width / bgW
    const sy = app.screen.height / bgH
    const worldScale = Math.max(sx, sy)
    world.scale.set(worldScale)
    world.x = (app.screen.width - bgW * worldScale) / 2
    world.y = app.screen.height - bgH * worldScale

    if (truckSprite) {
      truckSprite.height = TRUCK_SCREEN_H
      truckSprite.scale.x = truckSprite.scale.y
    }

    if (!locationConfirmed) {
      truckWorldX = stagingX()
      truckTargetWorldX = truckWorldX
    } else {
      truckTargetWorldX = locationX(state.selectedLocation)
      // 레이아웃 직후 점프 방지: 타겟만 갱신, 현재 X는 유지하다 ticker가 따라감
      // 첫 레이아웃이면 맞춤
      if (truckWorldX === 0) truckWorldX = truckTargetWorldX
    }

    refreshMarkers()
    syncTruckToScreen(0)
    publishAnchors()
  }

  async function loadArt() {
    const [bgTex, truckTex] = await Promise.all([
      Assets.load(READY_PHASE_BG),
      Assets.load(FOOD_TRUCK_ART),
    ])
    bgTex.source.scaleMode = 'linear'
    truckTex.source.scaleMode = 'linear'
    if (truckTex.source.autoGenerateMipmaps !== undefined) {
      truckTex.source.autoGenerateMipmaps = true
    }

    bgSprite.texture = bgTex

    truckLayer.removeChildren()
    const truck = new Sprite(truckTex)
    truck.anchor.set(0.5, 1)
    truck.roundPixels = false
    truck.height = TRUCK_SCREEN_H
    truck.scale.x = truck.scale.y
    truckLayer.addChild(truck)
    truckSprite = truck

    truckWorldX = stagingX()
    truckTargetWorldX = truckWorldX

    // 첫 프레임에 screen 크기가 아직 0일 수 있어 다음 프레임에 한 번 더 맞춤
    layout()
    requestAnimationFrame(() => layout())
  }

  void loadArt().catch((err) => {
    console.error('Failed to load location backdrop', err)
  })

  const onResize = () => layout()
  app.renderer.on('resize', onResize)

  const onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000
    elapsed += dt

    const dx = truckTargetWorldX - truckWorldX
    if (Math.abs(dx) > 0.35) {
      truckWorldX += dx * 3.2 * dt
    } else {
      truckWorldX = truckTargetWorldX
    }

    // 보빙은 스크린 픽셀만 사용 (월드 스케일 미적용) → 계단 현상 제거
    const bobPx = Math.sin(elapsed * TRUCK_BOB_SPEED) * TRUCK_BOB_AMP_PX
    syncTruckToScreen(bobPx)

    const pulse = 0.5 + Math.sin(elapsed * 2.5) * 0.5
    if (locationConfirmed) {
      const marker = markers.get(state.selectedLocation)
      if (marker) {
        const g = marker.children[0] as Graphics
        drawMarker(g, pulse)
        marker.alpha = 0.7 + Math.sin(elapsed * 2.5) * 0.3
      }
    }
  }
  app.ticker.add(onTick)

  return {
    update(next) {
      if (next.day !== undefined && next.day !== state.day) {
        state.day = next.day
        locationConfirmed = false
        truckWorldX = stagingX()
        truckTargetWorldX = truckWorldX
        refreshMarkers()
        syncTruckToScreen(0)
      }
      if (next.selectedLocation !== undefined) {
        state.selectedLocation = next.selectedLocation
        if (locationConfirmed) {
          truckTargetWorldX = locationX(next.selectedLocation)
          refreshMarkers()
        }
      }
      if (next.unlockedLocations !== undefined) {
        state.unlockedLocations = next.unlockedLocations
      }
    },
    pickLocation(id: string) {
      if (!state.unlockedLocations.includes(id)) return
      locationConfirmed = true
      state.selectedLocation = id
      truckTargetWorldX = locationX(id)
      refreshMarkers()
    },
    destroy() {
      app.renderer.off('resize', onResize)
      app.ticker.remove(onTick)
      root.destroy({ children: true })
    },
  }
}
