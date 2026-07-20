import { Container, Graphics, Text, type Application, type Ticker } from 'pixi.js'
import { PIXI_COLORS } from '../colors'

export interface StreetSceneState {
  customerCount?: number
  locationLabel?: string
}

export interface StreetSceneHandle {
  update: (next?: StreetSceneState) => void
  destroy: () => void
}

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

  let customerCount = initial.customerCount ?? 0
  let locationLabel = initial.locationLabel ?? ''
  let elapsed = 0

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
    const n = Math.min(8, Math.max(0, customerCount))
    const baseY = h * 0.62 - 8
    for (let i = 0; i < n; i += 1) {
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
  }

  function update(next: StreetSceneState = {}) {
    if (typeof next.customerCount === 'number') {
      customerCount = next.customerCount
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
    crowdLayer.children.forEach((child, i) => {
      child.y = app.screen.height * 0.62 - 8 + Math.sin(elapsed * 3 + i * 0.7) * 2
    })
  }

  layout()
  app.ticker.add(onTick)

  return {
    update,
    destroy() {
      app.ticker.remove(onTick)
      root.destroy({ children: true })
    },
  }
}
