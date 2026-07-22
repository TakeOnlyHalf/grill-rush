import { Container, Graphics, Text, type Application, type Ticker } from 'pixi.js'
import { PIXI_COLORS } from '../colors'
import {
  createCustomerSprite,
  loadCustomerFrames,
  type CustomerSpriteFrames,
} from '../sprites/customerSprite'
import { getCustomerSpriteConfig } from '../sprites/customerRegistry'

export interface StreetSceneState {
  /** 대기열 손님 타입 목록 (data/customers.json의 id), 대기 순서대로 */
  customerTypes?: string[]
  locationLabel?: string
}

export interface StreetSceneHandle {
  update: (next?: StreetSceneState) => void
  destroy: () => void
}

const MAX_CROWD = 8

/** 영업 페이즈 거리 뷰 씬 (트럭 + 대기 손님 + 배경) */
export function createStreetScene(
  app: Application,
  initial: StreetSceneState = {},
): StreetSceneHandle {
  const root = new Container()
  app.stage.addChild(root)

  const bg = new Graphics()
  const crowdLayer = new Container()
  const truck = new Container()
  const label = new Text({
    text: '',
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 13,
      fill: PIXI_COLORS.text,
    },
  })
  label.x = 12
  label.y = 10

  root.addChild(bg, crowdLayer, truck, label)

  let customerTypes = initial.customerTypes ?? []
  let locationLabel = initial.locationLabel ?? ''
  let elapsed = 0
  let destroyed = false

  // 타입별로 로드된 프레임을 캐싱 — 손님 타입이 늘어나도 씬 로직은 그대로 재사용된다.
  const framesByType = new Map<string, CustomerSpriteFrames>()
  const loadingTypes = new Set<string>()

  function ensureFramesLoaded(types: string[]) {
    for (const type of types) {
      if (framesByType.has(type) || loadingTypes.has(type)) continue
      const config = getCustomerSpriteConfig(type)
      if (!config) continue
      loadingTypes.add(type)
      loadCustomerFrames(config).then((frames) => {
        loadingTypes.delete(type)
        if (destroyed) return
        framesByType.set(type, frames)
        rebuildCrowd(app.screen.width, app.screen.height)
      })
    }
  }

  function layout() {
    const w = app.screen.width
    const h = app.screen.height

    bg.clear()
    bg.rect(0, 0, w, h * 0.62)
    bg.fill(PIXI_COLORS.skyTop)
    bg.rect(0, h * 0.62, w, h * 0.38)
    bg.fill(PIXI_COLORS.ground)
    bg.moveTo(0, h * 0.62)
    bg.lineTo(w, h * 0.62)
    bg.stroke({ width: 2, color: PIXI_COLORS.groundLine })

    truck.removeChildren()
    const body = new Graphics()
    body.roundRect(0, 18, 96, 42, 6)
    body.fill(PIXI_COLORS.truckBody)
    body.roundRect(62, 4, 34, 28, 4)
    body.fill(PIXI_COLORS.truckCabin)
    body.roundRect(70, 10, 18, 14, 2)
    body.fill(PIXI_COLORS.truckWindow)
    body.circle(22, 62, 10)
    body.fill(PIXI_COLORS.truckWheel)
    body.circle(78, 62, 10)
    body.fill(PIXI_COLORS.truckWheel)
    truck.addChild(body)
    truck.x = w - 130
    truck.y = h * 0.62 - 48

    rebuildCrowd(w, h)
    label.text = locationLabel
  }

  function rebuildCrowd(_w: number, h: number) {
    crowdLayer.removeChildren()
    const types = customerTypes.slice(0, MAX_CROWD)
    const baseY = h * 0.62 - 8

    types.forEach((type, i) => {
      const frames = framesByType.get(type)
      if (frames) {
        const { sprite } = createCustomerSprite(frames, 'walk')
        sprite.height = 34
        sprite.width = 34 * (sprite.texture.width / sprite.texture.height)
        sprite.x = 28 + i * 36
        sprite.y = baseY
        crowdLayer.addChild(sprite)
      } else {
        // 스프라이트 설정이 아직 없는 손님 타입은 플레이스홀더 도형으로 대체
        const person = new Graphics()
        const shade = i % 2 === 0 ? PIXI_COLORS.crowd : PIXI_COLORS.muted
        person.circle(0, -18, 7)
        person.fill(shade)
        person.roundRect(-6, -10, 12, 22, 3)
        person.fill(shade)
        person.x = 28 + i * 36
        person.y = baseY
        person.pivot.y = 0
        crowdLayer.addChild(person)
      }
    })
  }

  function update(next: StreetSceneState = {}) {
    if (Array.isArray(next.customerTypes)) {
      customerTypes = next.customerTypes
      ensureFramesLoaded(customerTypes)
    }
    if (typeof next.locationLabel === 'string') {
      locationLabel = next.locationLabel
      label.text = locationLabel
    }
    rebuildCrowd(app.screen.width, app.screen.height)
  }

  const onTick = (ticker: Ticker) => {
    elapsed += ticker.deltaMS / 1000
    truck.y = app.screen.height * 0.62 - 48 + Math.sin(elapsed * 2.2) * 1.5
    // 손님 스프라이트는 걷기 프레임 자체로 움직임을 표현하므로, 플레이스홀더 도형에만 흔들림을 준다.
    crowdLayer.children.forEach((child, i) => {
      if (child instanceof Graphics) {
        child.y = app.screen.height * 0.62 - 8 + Math.sin(elapsed * 3 + i * 0.7) * 2
      }
    })
  }

  ensureFramesLoaded(customerTypes)
  layout()
  app.ticker.add(onTick)

  return {
    update,
    destroy() {
      destroyed = true
      app.ticker.remove(onTick)
      root.destroy({ children: true })
    },
  }
}
