import { describe, expect, it } from 'vitest'
import type { Customer, GameState, Order, PreparedIngredient } from '../types/game'
import { createInitialState } from '../state/initialState'
import {
  createServeAssistReadyState,
  findNextServeableOrder,
  runServeAssistTick,
  startServeAssistCooldown,
} from './serveAssist'

const customer: Customer = {
  id: 'customer-1',
  type: 'office',
  typeName: '직장인',
  icon: '🧑‍💼',
  orderedMenuIds: ['grilled_sausage'],
  orderedMenuNames: ['그릴 소시지'],
  patience: 30,
  maxPatience: 30,
  tipChance: 0,
}

const order: Order = {
  id: 'order-1',
  customerId: customer.id,
  menuId: 'grilled_sausage',
  status: 'queued',
}

function prepared(id: string, ingredientId: string): PreparedIngredient {
  return {
    id,
    ingredientId,
    result: 'perfect',
    quality: 3,
  }
}

function openState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: 'open',
    customers: [customer],
    orders: [order],
    preparedIngredients: [prepared('p1', 'sausage')],
    ...overrides,
  }
}

describe('serve assist', () => {
  it('finds the first queue order that can be served', () => {
    expect(findNextServeableOrder(openState())?.orderId).toBe(order.id)
    expect(
      findNextServeableOrder(openState({ preparedIngredients: [] })),
    ).toBeNull()
  })

  it('serves only when the cooldown is ready and starts a new cooldown after', () => {
    const ready = createServeAssistReadyState(9_000, 10_000)
    const waiting = runServeAssistTick(openState(), 10_500, 9_000, ready, true)
    expect(waiting.target?.orderId).toBe(order.id)
    expect(waiting.timer.readyAt).toBe(19_500)

    const cooling = runServeAssistTick(
      openState(),
      15_000,
      9_000,
      waiting.timer,
      true,
    )
    expect(cooling.target).toBeNull()
    expect(cooling.timer.readyAt).toBe(19_500)
  })

  it('stays idle while hidden or without the upgrade', () => {
    const ready = createServeAssistReadyState(9_000, 1_000)
    expect(runServeAssistTick(openState(), 2_000, 9_000, ready, false).target).toBeNull()
    expect(runServeAssistTick(openState(), 2_000, null, ready, true).target).toBeNull()
    expect(startServeAssistCooldown(null, 1_000).readyAt).toBeNull()
  })
})
