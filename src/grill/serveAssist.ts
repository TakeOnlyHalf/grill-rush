import type { GameState } from '../types/game'
import { getOrderFulfillment } from '../state/orderFulfillment'

export interface ServeAssistTimerState {
  readyAt: number | null
}

export interface ServeableOrderTarget {
  orderId: string
  customerId: string
  menuId: string
}

export function createServeAssistReadyState(
  intervalMs: number | null,
  now: number,
): ServeAssistTimerState {
  return {
    readyAt: intervalMs === null ? null : now,
  }
}

export function startServeAssistCooldown(
  intervalMs: number | null,
  now: number,
): ServeAssistTimerState {
  return {
    readyAt: intervalMs === null ? null : now + intervalMs,
  }
}

/** 대기열 앞쪽 손님부터, 서빙 가능한 첫 주문을 고른다. */
export function findNextServeableOrder(state: GameState): ServeableOrderTarget | null {
  for (const customer of state.customers) {
    const orders = state.orders.filter(
      (order) => order.customerId === customer.id && order.status === 'queued',
    )
    for (const order of orders) {
      if (!getOrderFulfillment(state, order.id).canServe) continue
      return {
        orderId: order.id,
        customerId: customer.id,
        menuId: order.menuId,
      }
    }
  }
  return null
}

export function runServeAssistTick(
  state: GameState,
  now: number,
  intervalMs: number | null,
  timer: ServeAssistTimerState,
  active: boolean,
): { timer: ServeAssistTimerState; target: ServeableOrderTarget | null } {
  if (intervalMs === null) {
    return { timer: { readyAt: null }, target: null }
  }

  const initializedTimer =
    timer.readyAt === null ? createServeAssistReadyState(intervalMs, now) : timer
  if (!active || now < (initializedTimer.readyAt ?? Number.POSITIVE_INFINITY)) {
    return { timer: initializedTimer, target: null }
  }

  const target = findNextServeableOrder(state)
  if (!target) {
    return { timer: initializedTimer, target: null }
  }

  return {
    timer: startServeAssistCooldown(intervalMs, now),
    target,
  }
}
