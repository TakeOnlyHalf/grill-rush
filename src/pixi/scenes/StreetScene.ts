import { Container, Graphics, Text, type Application, type Texture, type Ticker } from 'pixi.js'
import { PIXI_COLORS } from '../colors'
import { createCustomerSprite } from '../sprites/customerSprite'
import { loadCharacterPortraits, type CharacterKey } from '../sprites/characterPortraits'
import { pickRandomGuestCharacter } from '../sprites/customerRegistry'

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

  // 캐릭터 시트는 한 장뿐이라 씬당 한 번만 로드해 재사용한다.
  let portraits: Record<CharacterKey, Texture> | null = null
  // 대기열 슬롯(인덱스)별 직전 손님 캐릭터 — 리빌드 때 같은 얼굴이 연달아 나오는 걸 막는 데 쓴다.
  const lastGuestByIndex = new Map<number, CharacterKey>()

  loadCharacterPortraits().then((loaded) => {
    if (destroyed) return
    portraits = loaded
    rebuildCrowd(app.screen.width, app.screen.height)
  })

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
      const previousGuest = lastGuestByIndex.get(i)
      const guestKey = portraits ? pickRandomGuestCharacter(type, previousGuest) : undefined
      const guestTexture = guestKey && portraits ? portraits[guestKey] : undefined

      if (guestKey) {
        lastGuestByIndex.set(i, guestKey)
      }

      if (guestTexture) {
        const sprite = createCustomerSprite(guestTexture)
        sprite.height = 40
        sprite.width = 40 * (guestTexture.width / guestTexture.height)
        sprite.x = 28 + i * 36
        sprite.y = baseY
        crowdLayer.addChild(sprite)
      } else {
        // 캐릭터가 아직 로드 전이거나 등록되지 않은 타입은 플레이스홀더 도형으로 대체
        const person = new Graphics()
        const shade = i % 2 === 0 ? PIXI_COLORS.crowd : PIXI_COLORS.muted
        person.circle(0, -18, 7)
        person.fill(shade)
        person.roundRect(-6, -10, 12, 22, 3)
        person.fill(shade)
        person.x = 28 + i * 36
        person.y = baseY
        crowdLayer.addChild(person)
      }
    })
  }

  function update(next: StreetSceneState = {}) {
    if (Array.isArray(next.customerTypes)) {
      customerTypes = next.customerTypes
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
    // 손님은 정적 일러스트라 살짝 흔들어 대기 중인 느낌을 준다.
    const baseY = app.screen.height * 0.62 - 8
    crowdLayer.children.forEach((child, i) => {
      child.y = baseY + Math.sin(elapsed * 3 + i * 0.7) * 2
    })
  }

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
