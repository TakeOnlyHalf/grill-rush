import locations from '../data/locations.json'
import menus from '../data/menus.json'
import { DAILY_TRUCK_COST, OPEN_DURATION_SEC } from './actions'
import type {
  DailyCosts,
  EndingId,
  IngredientId,
  LocationId,
  MenuId,
  PreparedQuality,
  WeatherId,
} from '../types/game'

/** 가격 대비 만족도 배율 — menus.json 기본가가 대체로 cost의 2~3.5배라 그 구간을 기준으로 잡음 */
export function getPriceFactor(price: number, cost: number): number {
  if (price <= cost * 2.2) return 1.3
  if (price <= cost * 2.9) return 1.1
  if (price <= cost * 3.6) return 0.9
  return 0.6
}

const QUALITY_FACTOR: Record<PreparedQuality, number> = { 1: 0.5, 2: 0.85, 3: 1 }

/** 서빙 만족도(0~1) — 가격 대비 · 대기 여유 · 그릴 품질 평균을 종합 */
export function calcSatisfaction({
  price,
  cost,
  patienceRatio,
  qualities,
}: {
  price: number
  cost: number
  patienceRatio: number
  qualities: PreparedQuality[]
}): number {
  const priceFactor = getPriceFactor(price, cost) / 1.3
  const avgQuality = qualities.length
    ? qualities.reduce((sum, q) => sum + QUALITY_FACTOR[q], 0) / qualities.length
    : 0.75
  const raw = priceFactor * 0.35 + patienceRatio * 0.3 + avgQuality * 0.35
  return Math.min(1, Math.max(0, raw))
}

/** 날짜별 난이도 계수 — Day가 오를수록 손님이 늘고 인내심이 줄어듦 (Day1→Day7 선형 보간) */
export function getDayDifficulty(day: number) {
  const t = Math.max(0, Math.min(1, (day - 1) / 6))
  return {
    /** 스폰 간격에 곱해서 나눔 — 값이 클수록 손님이 자주 옴 */
    spawnRateMultiplier: 1 + t * 0.6,
    /** 손님 초기 인내심에 곱함 — 값이 작을수록 빨리 이탈 */
    patienceMultiplier: 1 - t * 0.25,
  }
}

function parsePeakHours(peakHours: string): [number, number] | null {
  const m = peakHours.match(/(\d{1,2}):(\d{2})~(\d{1,2}):(\d{2})/)
  if (!m) return null
  return [Number(m[1]) + Number(m[2]) / 60, Number(m[3]) + Number(m[4]) / 60]
}

const DAY_START_HOUR = 9
const DAY_END_HOUR = 24

/** 현재 영업 시각이 해당 장소의 러시아워 구간(peakHours)에 들어가는지 */
export function isRushHour(locationId: LocationId, time: number): boolean {
  const loc = locations.find((l) => l.id === locationId)
  if (!loc) return false
  const range = parsePeakHours(loc.peakHours)
  if (!range) return false
  const ratio = Math.min(1, Math.max(0, time / OPEN_DURATION_SEC))
  const hour = DAY_START_HOUR + ratio * (DAY_END_HOUR - DAY_START_HOUR)
  return hour >= range[0] && hour < range[1]
}

/** 날씨별 유동인구 배율 */
export function getWeatherTrafficFactor(weather: WeatherId | string): number {
  const map: Record<string, number> = {
    sunny: 1.0,
    cloudy: 0.9,
    rain: 0.7,
    snow: 0.6,
    clear: 1.2,
  }
  return map[weather] ?? 1.0
}

/** 예상 손님 수 힌트 (준비 페이즈용) */
export function estimateCustomers(
  locationId: LocationId,
  weather: WeatherId | string,
  fame: number,
): number {
  const loc = locations.find((l) => l.id === locationId)
  if (!loc) return 0
  const fameBonus = 1 + fame / 200
  return Math.round(loc.baseTraffic * getWeatherTrafficFactor(weather) * fameBonus)
}

/** 오늘 판매 메뉴에 필요한 식재료 ID 집합 */
export function getRequiredIngredientIds(activeMenuIds: MenuId[]): string[] {
  const set = new Set<string>()
  for (const id of activeMenuIds) {
    const menu = menus.find((m) => m.id === id)
    if (!menu) continue
    for (const ing of menu.ingredients) set.add(ing)
  }
  return [...set]
}

/** 선택한 메뉴를 최소 한 번 조리할 필수 재료가 모두 준비됐는지 확인 */
export function hasRequiredIngredients(
  activeMenuIds: MenuId[],
  ingredients: Record<IngredientId, number>,
): boolean {
  const requiredIngredientIds = getRequiredIngredientIds(activeMenuIds)
  return (
    requiredIngredientIds.length > 0 &&
    requiredIngredientIds.every((ingredientId) => (ingredients[ingredientId] ?? 0) > 0)
  )
}

/** 정산: 순이익 계산 */
export function calcDailyProfit({
  sales,
  tips,
  costs,
}: {
  sales: number
  tips: number
  costs: Partial<DailyCosts>
}): number {
  const totalCost =
    (costs.ingredients ?? 0) +
    (costs.rent ?? 0) +
    (costs.waste ?? 0) +
    (costs.truck ?? DAILY_TRUCK_COST)
  return sales + tips - totalCost
}

/** 엔딩 분기 (7일 압축 기준 — TODO: 밸런스 재조정) */
export function resolveEnding({ cash, fame }: { cash: number; fame: number }): EndingId {
  if (fame >= 80 && cash >= 500_000) return 'legend'
  if (fame >= 60 && cash >= 300_000) return 'popular'
  if (fame >= 40 && cash >= 100_000) return 'local'
  if (cash > 0) return 'survive'
  return 'closed'
}

export function getMenuById(id: MenuId) {
  return menus.find((m) => m.id === id)
}

export function getLocationById(id: LocationId) {
  return locations.find((l) => l.id === id)
}
