import type { CollectedGrillItem, GrillSlot } from './grillSlots'
import { collectGrillSlot, getAutoCollectCandidate } from './grillSlots'

export interface AutoAssistTimerState {
  readyAt: number | null
}

export interface AutoAssistTickResult {
  slots: GrillSlot[]
  timer: AutoAssistTimerState
  collected: CollectedGrillItem | null
}

export function createAutoAssistReadyState(
  intervalMs: number | null,
  now: number,
): AutoAssistTimerState {
  return {
    readyAt: intervalMs === null ? null : now,
  }
}

export function startAutoAssistCooldown(
  intervalMs: number | null,
  now: number,
): AutoAssistTimerState {
  return {
    readyAt: intervalMs === null ? null : now + intervalMs,
  }
}

export function runAutoAssistTick(
  slots: readonly GrillSlot[],
  now: number,
  intervalMs: number | null,
  timer: AutoAssistTimerState,
  active: boolean,
): AutoAssistTickResult {
  if (intervalMs === null) {
    return { slots: [...slots], timer: { readyAt: null }, collected: null }
  }

  const initializedTimer = timer.readyAt === null
    ? createAutoAssistReadyState(intervalMs, now)
    : timer
  if (!active || now < (initializedTimer.readyAt ?? Number.POSITIVE_INFINITY)) {
    return { slots: [...slots], timer: initializedTimer, collected: null }
  }

  const candidate = getAutoCollectCandidate(slots, now)
  if (!candidate) {
    return { slots: [...slots], timer: initializedTimer, collected: null }
  }

  const collection = collectGrillSlot(slots, candidate, now, 'perfect')
  if (!collection.collected) {
    return { slots: [...slots], timer: initializedTimer, collected: null }
  }

  return {
    slots: collection.slots,
    timer: startAutoAssistCooldown(intervalMs, now),
    collected: collection.collected,
  }
}
