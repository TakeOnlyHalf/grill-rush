/**
 * 밸런스·공식 모음
 * TODO: 실제 수치 조정은 여기서 중앙 관리
 */

import locations from '../data/locations.json'
import menus from '../data/menus.json'
import { DAILY_TRUCK_COST } from './actions.js'

/** 가격 대비 만족도 배율 */
export function getPriceFactor(price, cost) {
  if (price <= cost * 1.5) return 1.3
  if (price <= cost * 2.0) return 1.0
  if (price <= cost * 2.5) return 0.8
  return 0.5
}

/** 날씨별 유동인구 배율 */
export function getWeatherTrafficFactor(weather) {
  const map = {
    sunny: 1.0,
    cloudy: 0.9,
    rain: 0.7,
    snow: 0.6,
    clear: 1.2,
  }
  return map[weather] ?? 1.0
}

/** 예상 손님 수 힌트 (준비 페이즈용) */
export function estimateCustomers(locationId, weather, fame) {
  const loc = locations.find((l) => l.id === locationId)
  if (!loc) return 0
  const fameBonus = 1 + fame / 200
  return Math.round(loc.baseTraffic * getWeatherTrafficFactor(weather) * fameBonus)
}

/** 정산: 순이익 계산 */
export function calcDailyProfit({ sales, tips, costs }) {
  const totalCost =
    (costs.ingredients ?? 0) +
    (costs.rent ?? 0) +
    (costs.waste ?? 0) +
    (costs.truck ?? DAILY_TRUCK_COST)
  return sales + tips - totalCost
}

/** 엔딩 분기 (7일 압축 기준 — TODO: 밸런스 재조정) */
export function resolveEnding({ cash, fame }) {
  if (fame >= 80 && cash >= 500_000) return 'legend'
  if (fame >= 60 && cash >= 300_000) return 'popular'
  if (fame >= 40 && cash >= 100_000) return 'local'
  if (cash > 0) return 'survive'
  return 'closed'
}

export function getMenuById(id) {
  return menus.find((m) => m.id === id)
}

export function getLocationById(id) {
  return locations.find((l) => l.id === id)
}
