import locations from '../data/locations.json'
import ingredientData from '../data/ingredients.json'
import upgradesData from '../data/upgrades.json'
import {
  ActionTypes,
  DAILY_INGREDIENT_PURCHASE_LIMIT,
  DAILY_TRUCK_COST,
  MAX_ACTIVE_MENUS,
  OPEN_DURATION_SEC,
} from './actions'
import { createInitialState } from './initialState'
import {
  calcDailyProfit,
  getRequiredIngredientIds,
  resolveEnding,
} from './formulas'
import { rollWeather } from '../utils/weather'
import { spawnCustomer, getSpawnIntervalSec, type SpawnContext } from '../utils/customerSpawner'
import type { GameAction, GameState } from '../types/game'
import { collectPreparedIngredient, serveOrder } from './orderFulfillment'
import { canPurchaseIngredient } from '../utils/ingredientStorage'

const MAX_QUEUE = 9

export type { GameState, GameAction }

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case ActionTypes.START_GAME: {
      const weather = rollWeather()
      return {
        ...createInitialState(),
        phase: 'prep',
        weather,
      }
    }

    case ActionTypes.FINISH_STORY: {
      if (state.phase !== 'story') return state
      return {
        ...state,
        phase: 'prep',
      }
    }

    case ActionTypes.LOAD_GAME:
      return action.payload

    case ActionTypes.SET_LOCATION: {
      if (state.phase !== 'prep') return state
      if (!state.unlockedLocations.includes(action.payload)) return state
      return { ...state, location: action.payload }
    }

    case ActionTypes.CONFIRM_LOCATION: {
      if (state.phase !== 'prep') return state
      if (!state.unlockedLocations.includes(state.location)) return state
      const loc = locations.find((l) => l.id === state.location)
      const rent = loc?.rentCost ?? 0
      // 자릿세는 선택 시 기록만 하고, 현금 차감은 정산(CONFIRM_SETTLE)에서 처리
      return {
        ...state,
        dailyCosts: {
          ...state.dailyCosts,
          rent,
        },
      }
    }

    case ActionTypes.TOGGLE_MENU: {
      if (state.phase !== 'prep') return state
      const id = action.payload
      if (!state.unlockedMenus.includes(id)) return state

      const has = state.activeMenus.includes(id)
      if (has) {
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
      if (state.phase !== 'prep') return state
      const { ingredientId } = action.payload
      const ingredient = ingredientData.find((candidate) => candidate.id === ingredientId)
      if (!ingredient || !Number.isSafeInteger(ingredient.unitCost) || ingredient.unitCost < 0) {
        return state
      }
      if (!getRequiredIngredientIds(state.activeMenus).includes(ingredientId)) return state

      const purchasedToday = state.dailyIngredientPurchases[ingredientId] ?? 0
      if (!Number.isSafeInteger(purchasedToday) || purchasedToday < 0) return state
      if (purchasedToday >= DAILY_INGREDIENT_PURCHASE_LIMIT) return state
      if (state.cash < ingredient.unitCost) return state
      if (!canPurchaseIngredient(state.ingredients, state.upgrades, 1)) return state

      const nextOwnedQuantity = (state.ingredients[ingredientId] ?? 0) + 1
      if (!Number.isSafeInteger(nextOwnedQuantity)) return state
      const nextPurchasedToday = purchasedToday + 1
      if (!Number.isSafeInteger(nextPurchasedToday)) return state
      const nextIngredientCost = state.dailyCosts.ingredients + ingredient.unitCost
      if (!Number.isSafeInteger(nextIngredientCost)) return state

      return {
        ...state,
        cash: state.cash - ingredient.unitCost,
        ingredients: {
          ...state.ingredients,
          [ingredientId]: nextOwnedQuantity,
        },
        dailyIngredientPurchases: {
          ...state.dailyIngredientPurchases,
          [ingredientId]: nextPurchasedToday,
        },
        dailyCosts: {
          ...state.dailyCosts,
          ingredients: nextIngredientCost,
        },
      }
    }

    case ActionTypes.USE_INGREDIENT: {
      if (state.phase !== 'open') return state
      const ingredientId = action.payload.ingredientId
      const current = state.ingredients[ingredientId] ?? 0
      if (current <= 0) return state
      return {
        ...state,
        ingredients: {
          ...state.ingredients,
          [ingredientId]: current - 1,
        },
      }
    }

    case ActionTypes.COLLECT_COOKED_INGREDIENT: {
      if (state.phase !== 'open') return state
      return collectPreparedIngredient(state, action.payload)
    }

    case ActionTypes.DISCARD_PREPARED_INGREDIENT: {
      if (state.phase !== 'open') return state
      const target = state.preparedIngredients.find((item) => item.id === action.payload.preparedId)
      if (!target) return state
      const wasteCost = ingredientData.find((ingredient) => ingredient.id === target.ingredientId)?.unitCost ?? 0
      return {
        ...state,
        preparedIngredients: state.preparedIngredients.filter(
          (item) => item.id !== action.payload.preparedId,
        ),
        dailyCosts: {
          ...state.dailyCosts,
          waste: state.dailyCosts.waste + wasteCost,
        },
      }
    }

    case ActionTypes.SERVE_ORDER:
      return serveOrder(state, action.payload.orderId, action.payload.customerId)

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
          ...state.dailyCosts,
          // 자릿세는 CONFIRM_LOCATION에서 기록, 현금 차감은 정산에서
          rent: state.dailyCosts.rent || (loc?.rentCost ?? 0),
          truck: DAILY_TRUCK_COST,
          waste: 0,
        },
      }
    }

    case ActionTypes.TICK_OPEN: {
      if (state.phase !== 'open') return state
      const dt = action.payload?.dt ?? 1
      const nextTime = state.time + dt
      if (nextTime >= OPEN_DURATION_SEC) {
        return endOpenDay(state, nextTime)
      }

      // patience 소진 → 이탈 처리
      let dailyLeft = state.dailyLeft
      const expiredCustomers = state.customers.filter((customer) => customer.patience - dt <= 0)
      const customers = state.customers
        .map((c) => ({ ...c, patience: c.patience - dt }))
        .filter((c) => {
          if (c.patience > 0) return true
          dailyLeft += 1
          return false
        })

      // 스폰 주기마다 새 손님 추가 (최대 대기 인원 제한)
      const spawnCtx: SpawnContext = {
        locationId: state.location,
        weather: state.weather,
        activeMenus: state.activeMenus,
        unlockedMenus: state.unlockedMenus,
        fame: state.fame,
        day: state.day,
        time: state.time,
      }
      const interval = getSpawnIntervalSec(spawnCtx)
      const crossedInterval =
        Math.floor(state.time / interval) !== Math.floor(nextTime / interval)
      if (crossedInterval && customers.length < MAX_QUEUE) {
        const lastType = customers[customers.length - 1]?.type
        const spawned = spawnCustomer(spawnCtx, lastType)
        if (spawned) customers.push(spawned)
      }
      const customerIds = new Set(customers.map((customer) => customer.id))
      const orders = state.orders.filter((order) => customerIds.has(order.customerId))
      for (const customer of customers) {
        if (orders.some((order) => order.customerId === customer.id)) continue
        customer.orderedMenuIds.forEach((menuId, index) => {
          orders.push({
            id: `order-${customer.id}-${index}`,
            customerId: customer.id,
            menuId,
            status: 'queued',
          })
        })
      }

      return {
        ...state,
        time: nextTime,
        customers,
        orders,
        dailyLeft,
        lastCustomerLeaveFeedback: expiredCustomers.length > 0
          ? {
              id: (state.lastCustomerLeaveFeedback?.id ?? 0) + 1,
              customerName: expiredCustomers[0].typeName,
            }
          : state.lastCustomerLeaveFeedback,
      }
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
      // 재료비는 prep에서 이미 현금 차감. 자릿세·폐기·트럭 유지비는 여기서 반영.
      const openDayDelta =
        state.dailySales +
        state.dailyTips -
        (state.dailyCosts.rent ?? 0) -
        (state.dailyCosts.waste ?? 0) -
        (state.dailyCosts.truck ?? 0)

      const reviewAvg = avgReviews(state.dailyReviews)
      const fameDelta = state.dailyReviews.length ? Math.round((reviewAvg - 3) * 4) : 0

      return {
        ...state,
        cash: state.cash + openDayDelta,
        fame: Math.max(0, state.fame + fameDelta),
        reviewAvg: state.dailyReviews.length ? reviewAvg : state.reviewAvg,
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
            reviewAvg,
            weather: state.weather,
            location: state.location,
          },
        ],
      }
    }

    case ActionTypes.BUY_UPGRADE: {
      if (state.phase !== 'night' && state.phase !== 'prep') return state
      const { upgradeId } = action.payload
      const upgrade = upgradesData.find((item) => item.id === upgradeId)
      if (!upgrade) return state
      if (state.upgrades.includes(upgradeId)) return state
      const requiredUpgradeId =
        'requires' in upgrade && typeof upgrade.requires === 'string'
          ? upgrade.requires
          : null
      if (requiredUpgradeId && !state.upgrades.includes(requiredUpgradeId)) return state
      if (!Number.isSafeInteger(upgrade.cost) || upgrade.cost < 0) return state
      if (state.cash < upgrade.cost) return state
      return {
        ...state,
        cash: state.cash - upgrade.cost,
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
        dailyIngredientPurchases: {},
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

function avgReviews(reviews: number[]): number {
  if (!reviews.length) return 0
  return reviews.reduce((a, b) => a + b, 0) / reviews.length
}

function endOpenDay(state: GameState, time: number): GameState {
  const waste = state.dailyCosts.waste
  return {
    ...state,
    phase: 'settle',
    time,
    customers: [],
    orders: [],
    preparedIngredients: [],
    nextPreparedIngredientId: 1,
    dailyCosts: {
      ...state.dailyCosts,
      waste,
    },
  }
}
