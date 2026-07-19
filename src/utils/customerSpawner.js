import customerTypes from '../data/customers.json'
import menus from '../data/menus.json'

/**
 * 손님 스폰 로직 (스텁)
 * TODO: 위치·날씨·피크타임·명성 반영한 스폰 간격/유형 결정
 *
 * @param {{ locationId: string, weather: string, activeMenus: string[], fame: number }} ctx
 * @returns {{ type: string, orderMenuId: string, patience: number } | null}
 */
export function spawnCustomer(ctx) {
  if (!ctx.activeMenus?.length) return null

  const type = customerTypes[Math.floor(Math.random() * customerTypes.length)]
  const menuId = ctx.activeMenus[Math.floor(Math.random() * ctx.activeMenus.length)]
  const menu = menus.find((m) => m.id === menuId)

  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: type.id,
    typeName: type.name,
    icon: type.icon,
    orderMenuId: menuId,
    orderName: menu?.name ?? menuId,
    patience: type.patience,
    maxPatience: type.patience,
    tipChance: type.tipChance,
  }
}

/**
 * TODO: OpenPhase 루프에서 호출 — 스폰 주기(초) 계산
 */
export function getSpawnIntervalSec(_ctx) {
  return 4
}
