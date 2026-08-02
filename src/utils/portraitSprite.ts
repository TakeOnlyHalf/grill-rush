import { publicUrl } from './assets'
import { loadChromaKeyedDataUrl } from '../pixi/spriteSheet'
import { CHARACTER_KEYS, type CharacterKey } from '../pixi/sprites/characterPortraits'
import { CUSTOMER_CHARACTERS } from '../pixi/sprites/customerRegistry'

/** 대기 카드용 아바타 시트 — 캐릭터 시트와 같은 9칸(3x3) 순서, 마젠타 배경을 크로마키로 제거해서 쓴다. */
const AVATAR_SHEET_URL = publicUrl('sprite-sheet/3x3_512x512px_avatar_icon_spritesheet.webp')
const AVATAR_GRID_COLS = 3
const AVATAR_CHROMA_KEY = { color: { r: 255, g: 0, b: 255 }, tolerance: 170 }

let avatarDataUrlPromise: Promise<string> | null = null

/** 마젠타 배경을 제거한 아바타 시트를 data URL로 반환한다 (최초 1회만 처리해 캐싱). */
export function loadAvatarSheetDataUrl(): Promise<string> {
  if (!avatarDataUrlPromise) {
    avatarDataUrlPromise = loadChromaKeyedDataUrl(AVATAR_SHEET_URL, AVATAR_CHROMA_KEY)
  }
  return avatarDataUrlPromise
}

export const AVATAR_BACKGROUND_SIZE = `${AVATAR_GRID_COLS * 100}% ${AVATAR_GRID_COLS * 100}%`

export function getAvatarBackgroundPosition(key: CharacterKey): string {
  const i = CHARACTER_KEYS.indexOf(key)
  const col = i % AVATAR_GRID_COLS
  const row = Math.floor(i / AVATAR_GRID_COLS)
  const x = (col / (AVATAR_GRID_COLS - 1)) * 100
  const y = (row / (AVATAR_GRID_COLS - 1)) * 100
  return `${x}% ${y}%`
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** 손님 id 기반으로 안정적인 캐릭터를 고른다 — 같은 손님은 리렌더링돼도 항상 같은 얼굴. */
export function pickStablePortrait(type: string, id: string): CharacterKey | undefined {
  const options = CUSTOMER_CHARACTERS[type]
  if (!options?.length) return undefined
  return options[hashString(id) % options.length]
}
