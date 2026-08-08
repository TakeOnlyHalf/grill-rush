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
import { OPEN_TRUCK_INTERIOR_ART, STREET_BG_BY_LOCATION } from '../../utils/assets'
import { createCustomerSprite } from '../sprites/customerSprite'
import { loadCharacterPortraits, type CharacterKey } from '../sprites/characterPortraits'
import { pickStablePortrait } from '../../utils/portraitSprite'

export interface StreetSceneCustomer {
  /** 손님 고유 id — 리사이즈 등으로 다시 그릴 때도 같은 손님이 같은 캐릭터로 유지되도록 하는 키 */
  id: string
  /** 손님 타입(data/customers.json의 id) */
  type: string
}

export interface StreetSceneState {
  /** 대기열 손님 목록, 대기 순서대로(맨 앞이 가장 오래 기다린 손님) */
  customers?: StreetSceneCustomer[]
  locationLabel?: string
  /** locations.json의 장소 id — STREET_BG_BY_LOCATION에 등록된 배경을 창밖에 그린다 */
  locationId?: string
}

export interface StreetSceneHandle {
  update: (next?: StreetSceneState) => void
  destroy: () => void
}

const MAX_CROWD = 9

/**
 * characters_sprite_sheet.webp 각 칸(정사각형)은 인물 주변에 여백이 커서, 칸 크기 그대로
 * 폭을 맞추면 실제 인물이 훨씬 작아 보인다. 실측한 인물 bbox 비율(칸 세로 대비 89%, 인물 가로/세로 41%)로
 * "보이는 인물 폭" 기준 크기를 역산한다.
 */
const CHAR_VISIBLE_HEIGHT_RATIO = 0.89
const CHAR_VISIBLE_WIDTH_RATIO = 0.41
/** 칸 위쪽에서 인물(정수리)까지의 여백 비율 — 맨 앞 손님을 창 위쪽에 안 잘리게 앉힐 때 쓴다 */
const CHAR_TOP_INSET_RATIO = 0.057

/** foodtruck_interior_transparent.webp 원본 크기 — 창문(알파 투명) 영역 좌표 계산 기준 */
const FRAME_W = 2075
const FRAME_H = 758
/** 프레임 안 창문(알파 투명) bbox — 이 영역 안에만 바깥 풍경/손님을 그린다 */
const WINDOW = { x: 190, y: 72, w: 1696, h: 546 }
const WINDOW_CORNER_RADIUS = 55


/** 영업 페이즈 거리 뷰 씬 — 트럭 창문 안쪽에서 바라본 시점 (인테리어 프레임 + 창 밖 손님 대기열) */
export function createStreetScene(
  app: Application,
  initial: StreetSceneState = {},
): StreetSceneHandle {
  const root = new Container()
  app.stage.addChild(root)

  // 창 밖 풍경(장소별 배경 이미지, 없으면 플랫 컬러 하늘/바닥) + 대기 손님 — 창문 모양으로 마스킹된다
  const windowLayer = new Container()
  const bg = new Sprite()
  bg.visible = false
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
  windowLayer.addChild(sky, bg, crowdLayer, labelBg, label)

  const windowMask = new Graphics()
  windowLayer.mask = windowMask

  // 트럭 인테리어 프레임 — 창문 부분은 알파 투명이라 windowLayer가 그대로 비쳐 보인다
  const frame = new Sprite()

  // windowMask는 마스크 전용으로만 쓰고 화면에는 그리지 않는다 (자식으로 추가하지 않음)
  root.addChild(windowLayer, frame)

  let customers = initial.customers ?? []
  let locationLabel = initial.locationLabel ?? ''
  let locationId = initial.locationId ?? ''
  let destroyed = false

  // 캐릭터 시트는 한 장뿐이라 씬당 한 번만 로드해 재사용한다.
  let portraits: Record<CharacterKey, Texture> | null = null
  // 손님 id별로 캐릭터를 한 번만 뽑아 고정한다 — 리사이즈 등으로 재배치돼도
  // 같은 손님이 계속 같은 얼굴을 유지하고, 대기열에서 빠지면 항목도 같이 정리된다.
  const guestByCustomerId = new Map<string, CharacterKey>()

  // 장소별 배경 텍스처 캐시 — 같은 장소로 돌아왔을 때 다시 로드하지 않는다.
  const bgTextureCache = new Map<string, Texture>()
  let bgLoadToken = 0

  /** locationId에 맞는 배경을 적용한다. 등록된 이미지가 없으면 플랫 컬러(sky)로 대체. */
  function applyLocationBg() {
    const url = STREET_BG_BY_LOCATION[locationId]
    if (!url) {
      bg.visible = false
      sky.visible = true
      layout()
      return
    }

    const cached = bgTextureCache.get(locationId)
    if (cached) {
      bg.texture = cached
      bg.visible = true
      sky.visible = true
      layout()
      return
    }

    const token = ++bgLoadToken
    Assets.load(url).then((tex: Texture) => {
      if (destroyed || token !== bgLoadToken) return
      tex.source.scaleMode = 'linear'
      bgTextureCache.set(locationId, tex)
      bg.texture = tex
      bg.visible = true
      sky.visible = true
      layout()
    })
  }

  applyLocationBg()

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

    if (bg.visible && bg.texture.width > 0) {
      const texW = bg.texture.width
      const texH = bg.texture.height
      // 비율 유지 cover. 하단 위주이되 위쪽도 조금 보이게 한다.
      const scale = Math.max(win.w / texW, win.h / texH)
      bg.width = texW * scale
      bg.height = texH * scale
      bg.x = (win.w - bg.width) / 2
      const overflowY = bg.height - win.h
      if (overflowY > 0) {
        // 완전 하단 정렬(0)과 중앙(0.5) 사이 — 위쪽을 약간만 더 노출
        bg.y = win.h - bg.height + overflowY * 0.3
      } else {
        bg.y = win.h - bg.height
      }
    } else {
      bg.x = 0
      bg.y = 0
    }

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
    const visible = customers.slice(0, MAX_CROWD)
    if (visible.length === 0 || win.w <= 0 || win.h <= 0) {
      pruneGuestAssignments()
      return
    }

    const margin = win.w * 0.05
    // 인원수와 무관하게 슬롯 폭(step)을 고정한다 — 슬롯 = 캐릭터 자리(보이는 인물 폭) + 오른쪽 여백.
    // 번호 배지는 그 오른쪽 여백 아래에 붙고, 여백 폭이 곧 손님들 사이 간격이 된다.
    const usable = win.w - margin * 2
    const gapFrac = 0.22
    // 맨 앞(0번) 손님은 카운터 바로 앞에 서 있는 것처럼 다른 손님보다 크게 — 그만큼 커지는 폭을
    // 전체 폭 계산에 미리 반영해서, 9명이 항상 usable 안에 다 들어오도록 한다.
    const FRONT_SCALE = 1.4
    const step = usable / (MAX_CROWD + (1 - gapFrac) * (FRONT_SCALE - 1))
    const rightGap = step * gapFrac
    const contentWidth = step - rightGap
    const backBaseY = win.h * 0.97
    const badgeR = Math.min(12, rightGap * 0.4)
    const badgeBaseY = win.h * 0.96

    const frontContentWidth = contentWidth * FRONT_SCALE
    const frontExtra = frontContentWidth - contentWidth

    function slotGeometry(i: number) {
      const isFront = i === 0
      const slotLeft = margin + step * i + (isFront ? 0 : frontExtra)
      const width = isFront ? frontContentWidth : contentWidth
      return { isFront, slotLeft, width }
    }

    // 손님별로 캐릭터를 손님 id 기반으로 안정적으로 고른다 — 대기 카드(CustomerQueue)와
    // 동일한 pickStablePortrait를 써서 같은 손님이 거리뷰·대기 카드에서 같은 얼굴로 보이게 한다.
    const slots: Container[] = []

    visible.forEach((customer, i) => {
      const { isFront, slotLeft, width } = slotGeometry(i)

      let guestKey = guestByCustomerId.get(customer.id)
      if (!guestKey && portraits) {
        guestKey = pickStablePortrait(customer.type, customer.id)
        if (guestKey) guestByCustomerId.set(customer.id, guestKey)
      }
      const guestTexture = guestKey && portraits ? portraits[guestKey] : undefined

      // 칸 안에서 실제로 보이는 인물 폭이 width가 되도록 텍스처 전체 크기를 역산해서 키운다.
      const cellHeight = width / CHAR_VISIBLE_WIDTH_RATIO / CHAR_VISIBLE_HEIGHT_RATIO

      const slot = new Container()
      slot.x = slotLeft + width / 2
      // 맨 앞 손님은 정수리가 창 위쪽 끝에 딱 맞도록 앉혀서, 남는 만큼(발밑)만 창 아래로 잘리게 한다.
      slot.y = isFront ? cellHeight * (1 - CHAR_TOP_INSET_RATIO) : backBaseY

      if (guestTexture) {
        const aspect = guestTexture.width / guestTexture.height
        const sprite = createCustomerSprite(guestTexture)
        sprite.height = cellHeight
        sprite.width = cellHeight * aspect
        slot.addChild(sprite)
      } else {
        // 캐릭터가 아직 로드 전이거나 등록되지 않은 타입은 플레이스홀더 도형으로 대체
        const guestHeight = win.h * (isFront ? 1.05 : 0.86)
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

    // 번호 배지는 캐릭터 자리 오른쪽 여백 한가운데, 발 높이에 고정 배치한다.
    visible.forEach((_, i) => {
      const { slotLeft, width } = slotGeometry(i)
      const bx = slotLeft + width + rightGap / 2
      const badge = new Graphics()
      badge.circle(bx, badgeBaseY, badgeR)
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
      badgeText.position.set(bx, badgeBaseY)
      crowdLayer.addChild(badge, badgeText)
    })

    pruneGuestAssignments()
  }

  /** 대기열에서 빠진 손님의 캐릭터 배정을 지운다 (메모리 누수 방지 + id 재사용 대비) */
  function pruneGuestAssignments() {
    if (guestByCustomerId.size === 0) return
    const activeIds = new Set(customers.map((c) => c.id))
    for (const id of guestByCustomerId.keys()) {
      if (!activeIds.has(id)) guestByCustomerId.delete(id)
    }
  }

  function update(next: StreetSceneState = {}) {
    if (Array.isArray(next.customers)) {
      customers = next.customers
    }
    if (typeof next.locationLabel === 'string') {
      locationLabel = next.locationLabel
    }
    if (typeof next.locationId === 'string' && next.locationId !== locationId) {
      locationId = next.locationId
      applyLocationBg()
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
