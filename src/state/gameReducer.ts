import locations from '../data/locations.json'
import ingredientsData from '../data/ingredients.json'
import {
  ActionTypes,
  DAILY_TRUCK_COST,
  MAX_ACTIVE_MENUS,
  OPEN_DURATION_SEC,
} from './actions'
import { createInitialState } from './initialState'
import {
  calcDailyProfit,
  calcSatisfaction,
  getMenuById,
  getRequiredIngredientIds,
  resolveEnding,
} from './formulas'
import { rollWeather } from '../utils/weather'
import { spawnCustomer, getSpawnIntervalSec, type SpawnContext } from '../utils/customerSpawner'
import { satisfactionToStars } from '../utils/reviewGenerator'
import type { GameAction, GameState, GrillQuality, Order } from '../types/game'

const MAX_QUEUE = 8

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
      const alreadyPaid = state.dailyCosts.rent ?? 0
      const nextCash = state.cash + alreadyPaid - rent
      if (nextCash < 0) return state
      return {
        ...state,
        cash: nextCash,
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
      const { ingredientId, qty, unitCost } = action.payload
      const allowed = getRequiredIngredientIds(state.activeMenus)
      if (!allowed.includes(ingredientId)) return state
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

    case ActionTypes.COLLECT_INGREDIENT: {
      if (state.phase !== 'open') return state
      const { ingredientId, result } = action.payload

      // raw/danger/burnt — 서빙 불가, 재료만 날림 (낭비 비용에 반영)
      if (result !== 'good' && result !== 'perfect') {
        const ingredient = ingredientsData.find((i) => i.id === ingredientId)
        const wasteCost = ingredient?.unitCost ?? 0
        if (wasteCost <= 0) return state
        return {
          ...state,
          dailyCosts: { ...state.dailyCosts, waste: state.dailyCosts.waste + wasteCost },
        }
      }

      const pool: Record<string, GrillQuality[]> = {}
      for (const key of Object.keys(state.collectedIngredients)) {
        pool[key] = [...state.collectedIngredients[key]]
      }
      pool[ingredientId] = [...(pool[ingredientId] ?? []), result]

      // 가장 오래된 주문부터 재료가 다 모였는지 확인해 자동 서빙 (FIFO)
      let dailySales = state.dailySales
      let dailyTips = state.dailyTips
      let dailyServed = state.dailyServed
      let dailyReviews = state.dailyReviews
      let lastServe = state.lastServe
      const removedCustomerIds = new Set<string>()
      const remainingOrders: Order[] = []

      for (const order of state.orders) {
        const menu = getMenuById(order.menuId)
        const customer = state.customers.find((c) => c.id === order.customerId)
        if (!menu || !customer) continue

        const canComplete = menu.ingredients.every((ing) => (pool[ing]?.length ?? 0) >= 1)
        if (!canComplete) {
          remainingOrders.push(order)
          continue
        }

        const qualities: GrillQuality[] = menu.ingredients.map((ing) => pool[ing].shift()!)
        const price = state.menuPrices[menu.id] ?? menu.basePrice
        const patienceRatio = customer.patience / customer.maxPatience
        const satisfaction = calcSatisfaction({ price, cost: menu.cost, patienceRatio, qualities })
        const stars = satisfactionToStars(satisfaction)
        const tip = Math.random() < customer.tipChance ? Math.round(price * 0.1) : 0

        dailySales += price
        dailyTips += tip
        dailyServed += 1
        dailyReviews = [...dailyReviews, stars]
        lastServe = { id: order.id, menuName: menu.name, stars, tip, price }
        removedCustomerIds.add(customer.id)
      }

      return {
        ...state,
        collectedIngredients: pool,
        customers: removedCustomerIds.size
          ? state.customers.filter((c) => !removedCustomerIds.has(c.id))
          : state.customers,
        orders: remainingOrders,
        dailySales,
        dailyTips,
        dailyServed,
        dailyReviews,
        lastServe,
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
        collectedIngredients: {},
        lastServe: null,
        dailySales: 0,
        dailyTips: 0,
        dailyServed: 0,
        dailyLeft: 0,
        dailyReviews: [],
        dailyCosts: {
          ...state.dailyCosts,
          // 자릿세는 CONFIRM_LOCATION에서 이미 차감·기록
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

      // patience 소진 → 이탈 처리 (해당 주문도 함께 제거)
      let dailyLeft = state.dailyLeft
      const leftCustomerIds = new Set<string>()
      const customers = state.customers
        .map((c) => ({ ...c, patience: c.patience - dt }))
        .filter((c) => {
          if (c.patience > 0) return true
          dailyLeft += 1
          leftCustomerIds.add(c.id)
          return false
        })
      const orders = leftCustomerIds.size
        ? state.orders.filter((o) => !leftCustomerIds.has(o.customerId))
        : state.orders

      // 스폰 주기마다 새 손님 + 주문 추가 (최대 대기 인원 제한)
      const spawnCtx: SpawnContext = {
        locationId: state.location,
        weather: state.weather,
        activeMenus: state.activeMenus,
        fame: state.fame,
        day: state.day,
        time: state.time,
      }
      const interval = getSpawnIntervalSec(spawnCtx)
      const crossedInterval =
        Math.floor(state.time / interval) !== Math.floor(nextTime / interval)

      let nextOrders = orders
      if (crossedInterval && customers.length < MAX_QUEUE) {
        const spawned = spawnCustomer(spawnCtx)
        if (spawned) {
          customers.push(spawned)
          nextOrders = [
            ...orders,
            { id: `o_${spawned.id}`, customerId: spawned.id, menuId: spawned.orderMenuId, status: 'queued' },
          ]
        }
      }

      return { ...state, time: nextTime, customers, orders: nextOrders, dailyLeft }
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
      // 재료·자릿세는 prep에서 이미 현금 차감됨
      const openDayDelta =
        state.dailySales +
        state.dailyTips -
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
        collectedIngredients: {},
        lastServe: null,
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
    dailyCosts: {
      ...state.dailyCosts,
      waste,
    },
  }
}
