import menus from '../data/menus.json'
import locations from '../data/locations.json'
import { MAX_DAYS, STARTING_CASH } from './actions'
import type { GameState, MenuId, WeatherId } from '../types/game'

export function createInitialState(): GameState {
  const starterMenus = menus.filter((m) => m.unlockedByDefault).map((m) => m.id)
  const defaultLocation = locations.find((l) => l.unlockedByDefault)?.id ?? locations[0].id

  const menuPrices = Object.fromEntries(
    menus.map((m) => [m.id, m.basePrice]),
  ) as Record<MenuId, number>

  return {
    day: 1,
    phase: 'title',
    time: 0,
    maxDays: MAX_DAYS,
    weather: 'sunny' satisfies WeatherId,
    cash: STARTING_CASH,
    fame: 0,
    reviewAvg: 0,
    location: defaultLocation,
    activeMenus: [],
    menuPrices,
    ingredients: {},
    customers: [],
    orders: [],
    preparedIngredients: [],
    nextPreparedIngredientId: 1,
    lastServeFeedback: null,
    lastCustomerLeaveFeedback: null,
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
    upgrades: [],
    unlockedMenus: starterMenus,
    unlockedLocations: locations.filter((l) => l.unlockedByDefault).map((l) => l.id),
    history: [],
    endingId: null,
  }
}
