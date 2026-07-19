import locations from '../data/locations.json'
import {
  ActionTypes,
  DAILY_TRUCK_COST,
  MAX_ACTIVE_MENUS,
  OPEN_DURATION_SEC,
} from './actions.js'
import { createInitialState } from './initialState.js'
import { calcDailyProfit, resolveEnding } from './formulas.js'
import { rollWeather } from '../utils/weather.js'

/**
 * @typedef {ReturnType<typeof createInitialState>} GameState
 */

/**
 * @param {GameState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {GameState}
 */
export function gameReducer(state, action) {
  switch (action.type) {
    case ActionTypes.START_GAME: {
      const weather = rollWeather()
      // Day 1: 위치·메뉴 자동 세팅 후 준비 페이즈 (튜토리얼은 이후 구현)
      return {
        ...createInitialState(),
        phase: 'prep',
        weather,
      }
    }

    case ActionTypes.SET_LOCATION: {
      if (state.phase !== 'prep') return state
      if (!state.unlockedLocations.includes(action.payload)) return state
      return { ...state, location: action.payload }
    }

    case ActionTypes.TOGGLE_MENU: {
      if (state.phase !== 'prep') return state
      const id = action.payload
      if (!state.unlockedMenus.includes(id)) return state

      const has = state.activeMenus.includes(id)
      if (has) {
        if (state.activeMenus.length <= 1) return state
        return {
          ...state,
          activeMenus: state.activeMenus.filter((m) => m !== id),
        }
      }
      if (state.activeMenus.length >= MAX_ACTIVE_MENUS) return state
      return { ...state, activeMenus: [...state.activeMenus, id] }
    }

    case ActionTypes.SET_MENU_PRICE: {
      if (state.phase !== 'prep') return state
      const { menuId, price } = action.payload
      return {
        ...state,
        menuPrices: { ...state.menuPrices, [menuId]: Math.max(0, price) },
      }
    }

    case ActionTypes.BUY_INGREDIENT: {
      // TODO: IngredientShop에서 실제 매입·재고 반영
      if (state.phase !== 'prep') return state
      const { ingredientId, qty, unitCost } = action.payload
      const total = unitCost * qty
      if (state.cash < total) return state
      return {
        ...state,
        cash: state.cash - total,
        ingredients: {
          ...state.ingredients,
          [ingredientId]: (state.ingredients[ingredientId] ?? 0) + qty,
        },
        dailyCosts: {
          ...state.dailyCosts,
          ingredients: state.dailyCosts.ingredients + total,
        },
      }
    }

    case ActionTypes.START_OPEN: {
      if (state.phase !== 'prep') return state
      if (state.activeMenus.length === 0) return state

      const loc = locations.find((l) => l.id === state.location)
      return {
        ...state,
        phase: 'open',
        time: 0,
        customers: [],
        orders: [],
        dailySales: 0,
        dailyTips: 0,
        dailyServed: 0,
        dailyLeft: 0,
        dailyReviews: [],
        dailyCosts: {
          ...state.dailyCosts,
          rent: loc?.rentCost ?? 0,
          truck: DAILY_TRUCK_COST,
          waste: 0,
        },
      }
    }

    case ActionTypes.TICK_OPEN: {
      // TODO: 손님 스폰·인내심·조리 틱은 OpenPhase / utils에서 처리 후 디스패치
      if (state.phase !== 'open') return state
      const nextTime = state.time + (action.payload?.dt ?? 1)
      if (nextTime >= OPEN_DURATION_SEC) {
        return endOpenDay(state, nextTime)
      }
      return { ...state, time: nextTime }
    }

    case ActionTypes.END_OPEN: {
      if (state.phase !== 'open') return state
      return endOpenDay(state, state.time)
    }

    case ActionTypes.CONFIRM_SETTLE: {
      if (state.phase !== 'settle') return state
      const profit = calcDailyProfit({
        sales: state.dailySales,
        tips: state.dailyTips,
        costs: state.dailyCosts,
      })
      // 재료비는 준비 페이즈에서 이미 차감됨 → 정산에서는 매출·팁·자릿세·폐기·유지비만 반영
      const openDayDelta =
        state.dailySales +
        state.dailyTips -
        (state.dailyCosts.rent ?? 0) -
        (state.dailyCosts.waste ?? 0) -
        (state.dailyCosts.truck ?? 0)

      return {
        ...state,
        cash: state.cash + openDayDelta,
        phase: 'night',
        history: [
          ...state.history,
          {
            day: state.day,
            sales: state.dailySales,
            tips: state.dailyTips,
            costs: { ...state.dailyCosts },
            profit,
            served: state.dailyServed,
            left: state.dailyLeft,
            reviewAvg: avgReviews(state.dailyReviews),
            weather: state.weather,
            location: state.location,
          },
        ],
      }
    }

    case ActionTypes.BUY_UPGRADE: {
      // TODO: UpgradeShop — 해금·중복 구매 방지·효과 적용
      if (state.phase !== 'night') return state
      const { upgradeId, cost } = action.payload
      if (state.upgrades.includes(upgradeId)) return state
      if (state.cash < cost) return state
      return {
        ...state,
        cash: state.cash - cost,
        upgrades: [...state.upgrades, upgradeId],
      }
    }

    case ActionTypes.NEXT_DAY: {
      if (state.phase !== 'night') return state

      if (state.day >= state.maxDays) {
        return {
          ...state,
          phase: 'ending',
          endingId: resolveEnding({ cash: state.cash, fame: state.fame }),
        }
      }

      return {
        ...state,
        day: state.day + 1,
        phase: 'prep',
        weather: rollWeather(),
        time: 0,
        ingredients: {},
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
      }
    }

    case ActionTypes.SHOW_ENDING: {
      return {
        ...state,
        phase: 'ending',
        endingId: action.payload ?? resolveEnding({ cash: state.cash, fame: state.fame }),
      }
    }

    case ActionTypes.RESTART:
      return createInitialState()

    default:
      return state
  }
}

function avgReviews(reviews) {
  if (!reviews.length) return 0
  return reviews.reduce((a, b) => a + b, 0) / reviews.length
}

/** 영업 종료 → 정산 (폐기 비용 등 TODO) */
function endOpenDay(state, time) {
  // TODO: 남은 재료 × 50% 폐기 비용
  const waste = 0
  return {
    ...state,
    phase: 'settle',
    time,
    dailyCosts: {
      ...state.dailyCosts,
      waste,
    },
  }
}
