import { AnimatedSprite, type Texture } from 'pixi.js'
import { loadGridSpriteSheet } from '../spriteSheet'

/** 모든 손님 타입이 공유하는 애니메이션 상태 */
export type CustomerAnimationState = 'idle' | 'walk' | 'happy' | 'sad'

/** 손님 타입 하나를 정의하는 설정 — 새 손님을 추가할 땐 이 객체만 만들면 된다 */
export interface CustomerSpriteConfig {
  /** data/customers.json의 id와 매칭 */
  type: string
  /** 그린스크린 스프라이트시트 경로 */
  sheetUrl: string
  rows: number
  cols: number
  /** 시트의 각 행이 어떤 애니메이션인지 매핑 */
  animationRows: Record<CustomerAnimationState, number>
}

export type CustomerSpriteFrames = Record<CustomerAnimationState, Texture[]>

const framesCache = new Map<string, Promise<CustomerSpriteFrames>>()

/** 설정에 맞춰 시트를 로드/크로마키 처리해 애니메이션별 프레임으로 캐싱해 반환한다. */
export function loadCustomerFrames(config: CustomerSpriteConfig): Promise<CustomerSpriteFrames> {
  let cached = framesCache.get(config.type)
  if (!cached) {
    cached = loadGridSpriteSheet(config.sheetUrl, { rows: config.rows, cols: config.cols }).then(
      (grid) => {
        const frames = {} as CustomerSpriteFrames
        for (const name of Object.keys(config.animationRows) as CustomerAnimationState[]) {
          frames[name] = grid[config.animationRows[name]]
        }
        return frames
      },
    )
    framesCache.set(config.type, cached)
  }
  return cached
}

export interface CustomerSprite {
  sprite: AnimatedSprite
  /** 손님 상태관리 함수 — idle/walk/happy/sad 전환 */
  setAnimation: (state: CustomerAnimationState) => void
}

/** 로드된 프레임으로 애니메이션 전환이 가능한 손님 AnimatedSprite를 만든다. */
export function createCustomerSprite(
  frames: CustomerSpriteFrames,
  initial: CustomerAnimationState = 'idle',
): CustomerSprite {
  const sprite = new AnimatedSprite({
    textures: frames[initial],
    animationSpeed: 0.15,
    loop: true,
    autoPlay: true,
  })
  sprite.anchor.set(0.5, 1)

  let current = initial
  function setAnimation(state: CustomerAnimationState) {
    if (state === current) return
    current = state
    sprite.textures = frames[state]
    sprite.play()
  }

  return { sprite, setAnimation }
}
