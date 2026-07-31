import type { Texture } from 'pixi.js'
import { publicUrl } from '../../utils/assets'
import { loadGridSpriteSheet } from '../spriteSheet'

const SHEET_URL = publicUrl('sprite-sheet/characters_sprite_sheet.webp')
const GRID = { rows: 3, cols: 3 } as const

/** 3x3 캐릭터 시트의 각 칸(왼쪽→오른쪽, 위→아래) — 흰 배경 위 완성 일러스트라 크로마키 불필요 */
export const CHARACTER_KEYS = [
  'wolfChef',
  'otterJogger',
  'bearHiker',
  'catHoodie',
  'deerPolice',
  'retrieverDress',
  'foxCardigan',
  'rabbitSuit',
  'raccoonCoat',
] as const

export type CharacterKey = (typeof CHARACTER_KEYS)[number]

let cached: Promise<Record<CharacterKey, Texture>> | null = null

/** characters_sprite_sheet.webp를 로드해 캐릭터별 Texture 맵으로 캐싱해 반환한다. */
export function loadCharacterPortraits(): Promise<Record<CharacterKey, Texture>> {
  if (!cached) {
    cached = loadGridSpriteSheet(SHEET_URL, { ...GRID, chromaKey: false }).then((grid) => {
      const portraits = {} as Record<CharacterKey, Texture>
      CHARACTER_KEYS.forEach((key, i) => {
        const row = Math.floor(i / GRID.cols)
        const col = i % GRID.cols
        portraits[key] = grid[row][col]
      })
      return portraits
    })
  }
  return cached
}
