import {
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  type Application,
  type Texture,
} from 'pixi.js'
import { PIXI_COLORS } from '../colors'
import { OPEN_TRUCK_INTERIOR_ART } from '../../utils/assets'
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

const MAX_CROWD = 9

/** foodtruck_interior_transparent.webp 원본 크기 — 창문(알파 투명) 영역 좌표 계산 기준 */
const FRAME_W = 2075
const FRAME_H = 758
/** 프레임 안 창문(알파 투명) bbox — 이 영역 안에만 바깥 풍경/손님을 그린다 */
const WINDOW = { x: 190, y: 72, w: 1696, h: 546 }
const WINDOW_CORNER_RADIUS = 55

/** 맨 앞(0번) 손님은 카운터에 붙어있는 것처럼 크게 확대하고, 하반신은 창 아래로 잘려 나가게 한다 */
const FRONT_VISIBLE_FRACTION = 0.58
const FRONT_TOP_MARGIN_RATIO = 0.02

/** 영업 페이즈 거리 뷰 씬 — 트럭 창문 안쪽에서 바라본 시점 (인테리어 프레임 + 창 밖 손님 대기열) */
export function createStreetScene(
  app: Application,
  initial: StreetSceneState = {},
): StreetSceneHandle {
  const root = new Container()
  app.stage.addChild(root)

  // 창 밖 풍경(하늘/바닥) + 대기 손님 — 창문 모양으로 마스킹된다
  const windowLayer = new Container()
  const sky = new Graphics()
  const crowdLayer = new Container()
  const label = new Text({
    text: '',
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 12,
      fill: PIXI_COLORS.text,
    },
  })
  const labelBg = new Graphics()
  windowLayer.addChild(sky, crowdLayer, labelBg, label)

  const windowMask = new Graphics()
  windowLayer.mask = windowMask

  // 트럭 인테리어 프레임 — 창문 부분은 알파 투명이라 windowLayer가 그대로 비쳐 보인다
  const frame = new Sprite()

  // windowMask는 마스크 전용으로만 쓰고 화면에는 그리지 않는다 (자식으로 추가하지 않음)
  root.addChild(windowLayer, frame)

  let customerTypes = initial.customerTypes ?? []
  let locationLabel = initial.locationLabel ?? ''
  let destroyed = false

  // 캐릭터 시트는 한 장뿐이라 씬당 한 번만 로드해 재사용한다.
  let portraits: Record<CharacterKey, Texture> | null = null
  // 대기열 슬롯(인덱스)별 직전 손님 캐릭터 — 리빌드 때 같은 얼굴이 연달아 나오는 걸 막는 데 쓴다.
  const lastGuestByIndex = new Map<number, CharacterKey>()

  loadCharacterPortraits().then((loaded) => {
    if (destroyed) return
    portraits = loaded
    rebuildCrowd()
  })

  Assets.load(OPEN_TRUCK_INTERIOR_ART).then((tex: Texture) => {
    if (destroyed) return
    frame.texture = tex
    layout()
  })

  /** 창문 bbox를 화면 좌표로 변환 (프레임이 화면에 꽉 차게 그려진다는 전제) */
  function windowRect() {
    const scaleX = app.screen.width / FRAME_W
    const scaleY = app.screen.height / FRAME_H
    return {
      x: WINDOW.x * scaleX,
      y: WINDOW.y * scaleY,
      w: WINDOW.w * scaleX,
      h: WINDOW.h * scaleY,
      radius: WINDOW_CORNER_RADIUS * scaleX,
    }
  }

  function layout() {
    const w = app.screen.width
    const h = app.screen.height
    if (w <= 0 || h <= 0) return

    if (frame.texture.width > 0) {
      frame.width = w
      frame.height = h
    }

    const win = windowRect()
    windowLayer.position.set(win.x, win.y)

    windowMask.clear()
    windowMask.roundRect(win.x, win.y, win.w, win.h, win.radius)
    windowMask.fill(0xffffff)

    sky.clear()
    sky.rect(0, 0, win.w, win.h * 0.68)
    sky.fill(PIXI_COLORS.skyTop)
    sky.rect(0, win.h * 0.68, win.w, win.h * 0.32)
    sky.fill(PIXI_COLORS.ground)
    sky.moveTo(0, win.h * 0.68)
    sky.lineTo(win.w, win.h * 0.68)
    sky.stroke({ width: 2, color: PIXI_COLORS.groundLine })

    labelBg.clear()
    if (locationLabel) {
      const padX = 8
      const textW = label.width + padX * 2
      labelBg.roundRect(6, 6, textW, label.height + 8, 6)
      labelBg.fill({ color: 0x000000, alpha: 0.35 })
    }
    label.position.set(6 + 8, 6 + 4)
    label.text = locationLabel

    rebuildCrowd()
  }

  function rebuildCrowd() {
    crowdLayer.removeChildren()
    const win = windowRect()
    const types = customerTypes.slice(0, MAX_CROWD)
    if (types.length === 0 || win.w <= 0 || win.h <= 0) return

    const margin = win.w * 0.05
    const usable = win.w - margin * 2
    // 인원수와 무관하게 간격을 고정해, 맨 앞 손님이 항상 왼쪽에 있고
    // 대기열이 늘어날수록 오른쪽으로 채워지도록 한다 (MAX_CROWD 기준으로 폭을 나눔).
    const step = usable / MAX_CROWD
    const backBaseY = win.h * 0.9
    const backGuestHeight = win.h * 0.68
    const badgeBaseY = win.h * 0.94
    const badgeR = Math.min(12, step * 0.28)

    // 바로 옆 슬롯과 같은 캐릭터가 나란히 나오는 걸 최우선으로 막고,
    // 여유가 있으면 이 슬롯의 직전 캐릭터도 피해 화면 전환마다 다양성을 준다.
    let leftNeighborKey: CharacterKey | undefined
    const slots: Container[] = []

    types.forEach((type, i) => {
      const cx = margin + step * (i + 0.5)
      const isFront = i === 0
      const previousGuest = lastGuestByIndex.get(i)

      const guestKey = portraits
        ? pickRandomGuestCharacter(type, leftNeighborKey, previousGuest)
        : undefined
      const guestTexture = guestKey && portraits ? portraits[guestKey] : undefined

      if (guestKey) {
        lastGuestByIndex.set(i, guestKey)
      }
      leftNeighborKey = guestKey

      const slot = new Container()
      slot.x = cx

      if (guestTexture) {
        const aspect = guestTexture.width / guestTexture.height
        const sprite = createCustomerSprite(guestTexture)
        if (isFront) {
          // 맨 앞 손님 — 카운터 바로 앞에 서 있는 것처럼 크게 확대하고, 하반신은 창 아래로 잘려 나가게 한다.
          const topMargin = win.h * FRONT_TOP_MARGIN_RATIO
          const frontHeight = (win.h - topMargin) / FRONT_VISIBLE_FRACTION
          sprite.height = frontHeight
          sprite.width = frontHeight * aspect
          slot.y = topMargin + frontHeight
        } else {
          sprite.height = backGuestHeight
          sprite.width = backGuestHeight * aspect
          slot.y = backBaseY
        }
        slot.addChild(sprite)
      } else {
        // 캐릭터가 아직 로드 전이거나 등록되지 않은 타입은 플레이스홀더 도형으로 대체
        const guestHeight = isFront ? win.h * 0.95 : backGuestHeight
        slot.y = isFront ? win.h * 0.98 : backBaseY
        const person = new Graphics()
        const shade = i % 2 === 0 ? PIXI_COLORS.crowd : PIXI_COLORS.muted
        person.circle(0, -guestHeight * 0.82, guestHeight * 0.14)
        person.fill(shade)
        person.roundRect(-guestHeight * 0.12, -guestHeight * 0.46, guestHeight * 0.24, guestHeight * 0.46, 4)
        person.fill(shade)
        slot.addChild(person)
      }

      slots.push(slot)
    })

    // 맨 앞(0번) 손님이 다른 손님들보다 위에 그려지도록 역순으로 추가한다.
    crowdLayer.addChild(...[...slots].reverse())

    // 번호 배지는 캐릭터 크기와 무관하게 항상 같은 높이에 고정 배치한다.
    types.forEach((_, i) => {
      const cx = margin + step * (i + 0.5)
      const badge = new Graphics()
      badge.circle(cx, badgeBaseY, badgeR)
      badge.fill({ color: 0x1a1410, alpha: 0.55 })
      const badgeText = new Text({
        text: String(i + 1),
        style: {
          fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
          fontSize: badgeR * 1.1,
          fill: 0xffffff,
          fontWeight: '700',
        },
      })
      badgeText.anchor.set(0.5)
      badgeText.position.set(cx, badgeBaseY)
      crowdLayer.addChild(badge, badgeText)
    })
  }

  function update(next: StreetSceneState = {}) {
    if (Array.isArray(next.customerTypes)) {
      customerTypes = next.customerTypes
    }
    if (typeof next.locationLabel === 'string') {
      locationLabel = next.locationLabel
    }
    layout()
  }

  const onResize = () => layout()
  app.renderer.on('resize', onResize)

  layout()

  return {
    update,
    destroy() {
      destroyed = true
      app.renderer.off('resize', onResize)
      root.destroy({ children: true })
    },
  }
}
