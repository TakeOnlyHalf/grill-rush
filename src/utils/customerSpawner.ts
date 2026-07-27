import customerTypes from '../data/customers.json'
import menus from '../data/menus.json'
import { getDayDifficulty, getLocationById, getWeatherTrafficFactor, isRushHour } from '../state/formulas'
import type { Customer, LocationId, MenuId, WeatherId } from '../types/game'

export interface SpawnContext {
  locationId: LocationId
  weather: WeatherId | string
  activeMenus: MenuId[]
  fame: number
  day: number
  time: number
}

/** 손님 생성 — 위치가 선호하는 손님 유형 중에서 랜덤 선택, 날짜 난이도에 따라 인내심 보정 */
export function spawnCustomer(ctx: SpawnContext): Customer | null {
  if (!ctx.activeMenus?.length) return null

  const loc = getLocationById(ctx.locationId)
  const pool = loc?.customers?.length
    ? customerTypes.filter((t) => loc.customers.includes(t.id))
    : customerTypes
  const candidates = pool.length ? pool : customerTypes

  const type = candidates[Math.floor(Math.random() * candidates.length)]
  const menuId = ctx.activeMenus[Math.floor(Math.random() * ctx.activeMenus.length)]
  const menu = menus.find((m) => m.id === menuId)

  const { patienceMultiplier } = getDayDifficulty(ctx.day)
  const patience = Math.max(5, Math.round(type.patience * patienceMultiplier))

  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: type.id,
    typeName: type.name,
    icon: type.icon,
    orderMenuId: menuId,
    orderName: menu?.name ?? menuId,
    patience,
    maxPatience: patience,
    tipChance: type.tipChance,
  }
}

/** 스폰 주기(초) — 위치 유동인구·날씨·명성·날짜 난이도·러시아워가 반영됨 */
export function getSpawnIntervalSec(ctx: SpawnContext): number {
  const loc = getLocationById(ctx.locationId)
  const baseTraffic = loc?.baseTraffic ?? 60
  const weatherFactor = getWeatherTrafficFactor(ctx.weather)
  const fameBonus = 1 + ctx.fame / 200
  const { spawnRateMultiplier } = getDayDifficulty(ctx.day)
  const rushBonus = isRushHour(ctx.locationId, ctx.time) ? (loc?.peakMultiplier ?? 1) : 1

  const effectiveTraffic =
    baseTraffic * weatherFactor * fameBonus * spawnRateMultiplier * rushBonus
  return Math.min(9, Math.max(2, 300 / effectiveTraffic))
}
