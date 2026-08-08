import { describe, expect, it } from 'vitest'
import type { Customer, GameState, Order, PreparedIngredient } from '../types/game'
import { createInitialState } from './initialState'
import { gameReducer } from './gameReducer'
import {
  collectPreparedIngredient,
  getOrderFulfillment,
  getUnlockedPlatedCapacity,
  isPlatedTrayFull,
  MAX_PLATED_ITEMS,
  serveOrder,
} from './orderFulfillment'

const customer: Customer = {
  id: 'customer-1',
  type: 'office',
  typeName: '직장인',
  icon: '🧑‍💼',
  orderedMenuIds: ['grilled_sausage', 'egg_bacon'],
  orderedMenuNames: ['그릴 소시지', '에그 & 베이컨'],
  patience: 30,
  maxPatience: 30,
  tipChance: 0,
}

const orders: Order[] = [
  {
    id: 'order-customer-1-0',
    customerId: customer.id,
    menuId: 'grilled_sausage',
    status: 'queued',
  },
  {
    id: 'order-customer-1-1',
    customerId: customer.id,
    menuId: 'egg_bacon',
    status: 'queued',
  },
]

function prepared(
  id: string,
  ingredientId: string,
  quality: 1 | 2 | 3 = 3,
): PreparedIngredient {
  return { id, ingredientId, result: quality === 1 ? 'danger' : quality === 2 ? 'good' : 'perfect', quality }
}

function openState(): GameState {
  return {
    ...createInitialState(),
    phase: 'open',
    customers: [customer],
    orders,
    preparedIngredients: [
      prepared('sausage', 'sausage'),
      prepared('egg', 'egg'),
      prepared('bacon', 'bacon'),
    ],
  }
}

describe('multi-item order fulfillment', () => {
  it('completes only one item and keeps the customer until all items are served', () => {
    const initial = openState()
    const partial = serveOrder(initial, orders[0].id, customer.id)

    expect(partial.customers).toEqual([customer])
    expect(partial.orders.find((order) => order.id === orders[0].id)?.status).toBe('done')
    expect(partial.orders.find((order) => order.id === orders[1].id)?.status).toBe('queued')
    expect(getOrderFulfillment(partial, orders[0].id).canServe).toBe(false)
    expect(getOrderFulfillment(partial, orders[1].id).canServe).toBe(true)
    expect(partial.dailySales).toBe(3_500)
    expect(partial.dailyServed).toBe(0)
    expect(partial.dailyReviews).toEqual([])
    expect(partial.dailyTips).toBe(0)
  })

  it('finishes, rates, and removes a two-item customer exactly once with summed sales', () => {
    const partial = serveOrder(openState(), orders[0].id, customer.id)
    const completed = serveOrder(partial, orders[1].id, customer.id)

    expect(completed.customers).toEqual([])
    expect(completed.orders).toEqual([])
    expect(completed.dailySales).toBe(3_500 + 4_500)
    expect(completed.dailyServed).toBe(1)
    expect(completed.dailyReviews).toHaveLength(1)
    expect(completed.lastServeFeedback).toMatchObject({
      menuName: '그릴 소시지 + 에그 & 베이컨',
      amount: 8_000,
    })

    expect(serveOrder(completed, orders[1].id, customer.id)).toBe(completed)
  })

  it('does not consume food or change sales for an unavailable or already served item', () => {
    const initial = { ...openState(), preparedIngredients: [prepared('sausage', 'sausage')] }
    expect(serveOrder(initial, orders[1].id, customer.id)).toBe(initial)

    const partial = serveOrder(initial, orders[0].id, customer.id)
    expect(serveOrder(partial, orders[0].id, customer.id)).toBe(partial)
    expect(partial.dailySales).toBe(3_500)
  })

  it('times out once after partial serving without duplicating sales, ratings, or departures', () => {
    const initial = {
      ...openState(),
      customers: [{ ...customer, patience: 0.25 }],
    }
    const partial = serveOrder(initial, orders[0].id, customer.id)
    const expired = gameReducer(partial, { type: 'TICK_OPEN', payload: { dt: 0.5 } })

    expect(expired.customers).toEqual([])
    expect(expired.orders).toEqual([])
    expect(expired.dailySales).toBe(3_500)
    expect(expired.dailyServed).toBe(0)
    expect(expired.dailyReviews).toEqual([])
    expect(expired.dailyLeft).toBe(1)

    const nextTick = gameReducer(expired, { type: 'TICK_OPEN', payload: { dt: 0.5 } })
    expect(nextTick.dailySales).toBe(3_500)
    expect(nextTick.dailyLeft).toBe(1)
  })

  it('preserves the next customer and queue order when the first customer leaves', () => {
    const nextCustomer: Customer = {
      ...customer,
      id: 'customer-2',
      orderedMenuIds: ['grilled_sausage'],
      orderedMenuNames: ['그릴 소시지'],
      patience: 10,
    }
    const nextOrder: Order = {
      id: 'order-customer-2-0',
      customerId: nextCustomer.id,
      menuId: 'grilled_sausage',
      status: 'queued',
    }
    const initial = {
      ...openState(),
      customers: [{ ...customer, patience: 0.25 }, nextCustomer],
      orders: [...orders, nextOrder],
    }

    const ticked = gameReducer(initial, { type: 'TICK_OPEN', payload: { dt: 0.5 } })

    expect(ticked.customers.map((candidate) => candidate.id)).toEqual([nextCustomer.id])
    expect(ticked.orders).toEqual([nextOrder])
    expect(ticked.dailyLeft).toBe(1)
  })
})

describe('plated tray capacity', () => {
  it(`rejects collecting when ${MAX_PLATED_ITEMS} plated items are already ready`, () => {
    const full = {
      ...openState(),
      preparedIngredients: Array.from({ length: MAX_PLATED_ITEMS }, (_, index) =>
        prepared(`ready-${index}`, 'sausage'),
      ),
      nextPreparedIngredientId: MAX_PLATED_ITEMS + 1,
    }

    expect(isPlatedTrayFull(full.preparedIngredients)).toBe(true)

    const next = collectPreparedIngredient(full, {
      ingredientId: 'sausage',
      cookResult: 'perfect',
    })

    expect(next).toBe(full)
    expect(next.preparedIngredients).toHaveLength(MAX_PLATED_ITEMS)
  })

  it('unlocks five more plated slots when plated_expand is owned', () => {
    const fullBase = {
      ...openState(),
      upgrades: ['plated_expand'],
      preparedIngredients: Array.from({ length: MAX_PLATED_ITEMS }, (_, index) =>
        prepared(`ready-${index}`, 'sausage'),
      ),
      nextPreparedIngredientId: MAX_PLATED_ITEMS + 1,
    }

    expect(getUnlockedPlatedCapacity(fullBase.upgrades)).toBe(MAX_PLATED_ITEMS + 5)
    expect(isPlatedTrayFull(fullBase.preparedIngredients, fullBase.upgrades)).toBe(false)

    const next = collectPreparedIngredient(fullBase, {
      ingredientId: 'sausage',
      cookResult: 'perfect',
    })

    expect(next.preparedIngredients).toHaveLength(MAX_PLATED_ITEMS + 1)
  })
})
