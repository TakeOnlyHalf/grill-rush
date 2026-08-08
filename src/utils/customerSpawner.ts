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

/** candidates를 weights 비율대로 뽑는다 (weights 합이 0 이하면 마지막 항목을 반환) */
function pickWeighted<T>(candidates: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return candidates[candidates.length - 1]

  let roll = Math.random() * total
  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i]
    if (roll < 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

/**
 * 손님 생성 — 모든 손님 유형이 어느 장소에서나 나올 수 있되, 장소별 가중치대로 비율만 다르게 뽑는다.
 * excludeType(바로 직전에 스폰된 타입)은 캐릭터 이미지 종류가 적어 연속 등장이 눈에 띄기 쉬우므로 제외한다.
 */
export function spawnCustomer(ctx: SpawnContext, excludeType?: string): Customer | null {
  if (!ctx.activeMenus?.length) return null

  const loc = getLocationById(ctx.locationId)
  // customerWeights에 없는 타입은 기본 가중치 1 — 주력 손님이 자주, 나머지도 가끔 섞여 나온다.
  const customerWeights = loc?.customerWeights as Record<string, number> | undefined
  const weights = customerTypes.map((t) => (t.id === excludeType ? 0 : customerWeights?.[t.id] ?? 1))
  const type = pickWeighted(customerTypes, weights)
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
