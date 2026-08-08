import customerTypes from '../data/customers.json'
import menus from '../data/menus.json'
import {
  MAX_CUSTOMER_ORDER_ITEMS,
  MIN_CUSTOMER_ORDER_ITEMS,
  MULTI_ORDER_CHANCE,
  MULTI_ORDER_PATIENCE_BONUS_SEC,
} from '../state/actions'
import { getDayDifficulty, getLocationById, getWeatherTrafficFactor, isRushHour } from '../state/formulas'
import type { Customer, LocationId, MenuId, WeatherId } from '../types/game'

export interface SpawnContext {
  locationId: LocationId
  weather: WeatherId | string
  activeMenus: MenuId[]
  unlockedMenus: MenuId[]
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

/** 선택·해금된 판매 메뉴 중에서 1~2개를 중복 없이 뽑는다. */
export function selectOrderMenuIds(
  activeMenus: MenuId[],
  unlockedMenus: MenuId[],
  random: () => number = Math.random,
): MenuId[] {
  const knownMenuIds = new Set(menus.map((menu) => menu.id))
  const unlockedMenuIds = new Set(unlockedMenus)
  const candidates = [...new Set(activeMenus)].filter(
    (menuId) => unlockedMenuIds.has(menuId) && knownMenuIds.has(menuId),
  )
  if (candidates.length === 0) return []

  const requestedCount = random() < MULTI_ORDER_CHANCE
    ? MAX_CUSTOMER_ORDER_ITEMS
    : MIN_CUSTOMER_ORDER_ITEMS
  const orderCount = Math.min(requestedCount, candidates.length)
  const selected: MenuId[] = []

  while (selected.length < orderCount) {
    const index = Math.floor(random() * candidates.length)
    selected.push(candidates.splice(index, 1)[0])
  }
  return selected
}

/**
 * 손님 생성 — 모든 손님 유형이 어느 장소에서나 나올 수 있되, 장소별 가중치대로 비율만 다르게 뽑는다.
 * excludeType(바로 직전에 스폰된 타입)은 캐릭터 이미지 종류가 적어 연속 등장이 눈에 띄기 쉬우므로 제외한다.
 */
export function spawnCustomer(ctx: SpawnContext, excludeType?: string): Customer | null {
  const orderedMenuIds = selectOrderMenuIds(ctx.activeMenus, ctx.unlockedMenus)
  if (orderedMenuIds.length === 0) return null

  const loc = getLocationById(ctx.locationId)
  // customerWeights에 없는 타입은 기본 가중치 1 — 주력 손님이 자주, 나머지도 가끔 섞여 나온다.
  const customerWeights = loc?.customerWeights as Record<string, number> | undefined
  const weights = customerTypes.map((t) => (t.id === excludeType ? 0 : customerWeights?.[t.id] ?? 1))
  const type = pickWeighted(customerTypes, weights)
  const orderedMenuNames = orderedMenuIds.map(
    (menuId) => menus.find((menu) => menu.id === menuId)?.name ?? menuId,
  )

  const { patienceMultiplier } = getDayDifficulty(ctx.day)
  const basePatience = Math.max(5, Math.round(type.patience * patienceMultiplier))
  const patience = basePatience + (
    orderedMenuIds.length > MIN_CUSTOMER_ORDER_ITEMS
      ? MULTI_ORDER_PATIENCE_BONUS_SEC
      : 0
  )

  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: type.id,
    typeName: type.name,
    icon: type.icon,
    orderedMenuIds,
    orderedMenuNames,
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
