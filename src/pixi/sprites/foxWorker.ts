import { AnimatedSprite, type Texture } from 'pixi.js'
import { publicUrl } from '../../utils/assets'
import { loadGridSpriteSheet } from '../spriteSheet'

const SHEET_URL = publicUrl('sprite-sheet/worker_fox_sprite_sheet.jpg')
const COLS = 6
const ROWS = 4

export type FoxWorkerAnimation = 'idle' | 'walk' | 'happy' | 'sad'

/** 시트의 각 행이 어떤 애니메이션인지 매핑 */
const ROW_BY_ANIMATION: Record<FoxWorkerAnimation, number> = {
  idle: 0,
  walk: 1,
  happy: 2,
  sad: 3,
}

export type FoxWorkerFrames = Record<FoxWorkerAnimation, Texture[]>

let framesPromise: Promise<FoxWorkerFrames> | null = null

/** 워커 폭스 시트를 로드/크로마키 처리해 애니메이션별 프레임으로 캐싱해 반환한다. */
export function loadFoxWorkerFrames(): Promise<FoxWorkerFrames> {
  if (!framesPromise) {
    framesPromise = loadGridSpriteSheet(SHEET_URL, { rows: ROWS, cols: COLS }).then((grid) => {
      const frames = {} as FoxWorkerFrames
      for (const name of Object.keys(ROW_BY_ANIMATION) as FoxWorkerAnimation[]) {
        frames[name] = grid[ROW_BY_ANIMATION[name]]
      }
      return frames
    })
  }
  return framesPromise
}

export interface FoxWorkerSprite {
  sprite: AnimatedSprite
  setAnimation: (name: FoxWorkerAnimation) => void
}

/** 로드된 프레임으로 애니메이션 전환이 가능한 AnimatedSprite를 만든다. */
export function createFoxWorkerSprite(
  frames: FoxWorkerFrames,
  initial: FoxWorkerAnimation = 'idle',
): FoxWorkerSprite {
  const sprite = new AnimatedSprite({
    textures: frames[initial],
    animationSpeed: 0.15,
    loop: true,
    autoPlay: true,
  })
  sprite.anchor.set(0.5, 1)

  let current = initial
  function setAnimation(name: FoxWorkerAnimation) {
    if (name === current) return
    current = name
    sprite.textures = frames[name]
    sprite.play()
  }

  return { sprite, setAnimation }
}
