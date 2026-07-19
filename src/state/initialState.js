import menus from '../data/menus.json'
import locations from '../data/locations.json'
import { MAX_DAYS, STARTING_CASH } from './actions.js'

/** @returns {import('./gameReducer.js').GameState} */
export function createInitialState() {
  const starterMenus = menus.filter((m) => m.unlockedByDefault).map((m) => m.id)
  const defaultLocation = locations.find((l) => l.unlockedByDefault)?.id ?? locations[0].id

  const menuPrices = Object.fromEntries(
    menus.map((m) => [m.id, m.basePrice]),
  )

  return {
    // 진행
    day: 1,
    phase: /** @type {const} */ ('title'),
    time: 0,
    maxDays: MAX_DAYS,
    weather: 'sunny',

    // 자원
    cash: STARTING_CASH,
    fame: 0,
    reviewAvg: 0,

    // 오늘의 설정
    location: defaultLocation,
    activeMenus: starterMenus.slice(0, 2),
    menuPrices,
    ingredients: {},

    // 영업 중
    customers: [],
    orders: [],
    dailySales: 0,
    dailyTips: 0,
    dailyServed: 0,
    dailyLeft: 0,
    dailyReviews: [],
    dailyCosts: {
      ingredients: 0,
      rent: 0,
      waste: 0,
      truck: 0,
    },

    // 영구
    upgrades: [],
    unlockedMenus: starterMenus,
    unlockedLocations: locations.filter((l) => l.unlockedByDefault).map((l) => l.id),
    history: [],

    // 엔딩
    endingId: null,
  }
}
