import { publicUrl } from '../../utils/assets'
import type { CustomerSpriteConfig } from './customerSprite'

/** 직장인(office) — worker fox */
const OFFICE_WORKER_FOX: CustomerSpriteConfig = {
  type: 'office',
  sheetUrl: publicUrl('sprite-sheet/worker_fox_sprite_sheet.jpg'),
  rows: 4,
  cols: 6,
  animationRows: { idle: 0, walk: 1, happy: 2, sad: 3 },
}

/**
 * 손님 타입(id) → 스프라이트 설정.
 * data/customers.json에 정의된 손님 타입에 맞춰 항목을 추가하면 된다.
 * 설정이 없는 타입은 StreetScene에서 플레이스홀더 도형으로 대체된다.
 */
export const CUSTOMER_SPRITES: Record<string, CustomerSpriteConfig> = {
  office: OFFICE_WORKER_FOX,
}

export function getCustomerSpriteConfig(type: string): CustomerSpriteConfig | undefined {
  return CUSTOMER_SPRITES[type]
}
