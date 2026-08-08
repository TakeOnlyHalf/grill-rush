import type { CookResult } from '../types/game'

export type { CookResult }
export type GrillSlotStatus = 'idle' | 'cooking' | 'burnt'

export interface GrillIngredient {
  id: string
  name: string
  icon: string
  cookDurationMs: number
}

export interface GrillSlot {
  id: string
  status: GrillSlotStatus
  ingredientId: string | null
  startedAt: number | null
  cookDurationMs: number
}

export interface CollectedGrillItem {
  slotId: string
  ingredientId: string
  result: CookResult
  progress: number
}

export const GRILL_SLOT_COUNT = 3
export const PERFECT_WINDOW_START = 0.7
export const PERFECT_WINDOW_END = 0.9

export function createIdleGrillSlots(slotCount = GRILL_SLOT_COUNT): GrillSlot[] {
  if (!Number.isSafeInteger(slotCount) || slotCount < 1) {
    throw new RangeError('Grill slot count must be a positive integer')
  }

  return Array.from({ length: slotCount }, (_, index) => ({
    id: `grill-${index + 1}`,
    status: 'idle',
    ingredientId: null,
    startedAt: null,
    cookDurationMs: 0,
  }))
}

export function getCookProgress(slot: GrillSlot, now: number): number {
  if (slot.status === 'idle' || slot.startedAt === null || slot.cookDurationMs <= 0) return 0
  return Math.max(0, (now - slot.startedAt) / slot.cookDurationMs)
}

export function getCookResult(progress: number): CookResult {
  if (progress > 1) return 'burnt'
  if (progress >= PERFECT_WINDOW_END) return 'danger'
  if (progress >= PERFECT_WINDOW_START) return 'perfect'
  if (progress >= 0.4) return 'good'
  return 'raw'
}

/** 한 갱신 사이에 완벽 구간에 처음 진입했으며 아직 구간을 지나치지 않았는지 확인한다. */
export function didEnterPerfectWindow(previousProgress: number, currentProgress: number): boolean {
  return (
    previousProgress < PERFECT_WINDOW_START &&
    currentProgress >= PERFECT_WINDOW_START &&
    currentProgress < PERFECT_WINDOW_END
  )
}

export function resolveGrillSlot(slot: GrillSlot, now: number): GrillSlot {
  if (slot.status !== 'cooking') return slot
  return getCookResult(getCookProgress(slot, now)) === 'burnt'
    ? { ...slot, status: 'burnt' }
    : slot
}

export function placeIngredient(
  slot: GrillSlot,
  ingredient: GrillIngredient,
  now: number,
): GrillSlot {
  if (slot.status !== 'idle') return slot
  return {
    ...slot,
    status: 'cooking',
    ingredientId: ingredient.id,
    startedAt: now,
    cookDurationMs: ingredient.cookDurationMs,
  }
}

export function clearGrillSlot(slot: GrillSlot): GrillSlot {
  return {
    ...slot,
    status: 'idle',
    ingredientId: null,
    startedAt: null,
    cookDurationMs: 0,
  }
}

export function getAutoCollectCandidate(
  slots: readonly GrillSlot[],
  now: number,
): GrillSlot | null {
  return slots
    .filter((slot) =>
      slot.status === 'cooking' &&
      slot.ingredientId !== null &&
      slot.startedAt !== null &&
      Number.isFinite(slot.startedAt) &&
      Number.isFinite(slot.cookDurationMs) &&
      slot.cookDurationMs > 0 &&
      getCookResult(getCookProgress(slot, now)) === 'perfect'
    )
    .sort((left, right) => {
      const leftRemainingMs =
        (PERFECT_WINDOW_END - getCookProgress(left, now)) * left.cookDurationMs
      const rightRemainingMs =
        (PERFECT_WINDOW_END - getCookProgress(right, now)) * right.cookDurationMs
      return leftRemainingMs - rightRemainingMs ||
        (left.startedAt ?? 0) - (right.startedAt ?? 0) ||
        left.id.localeCompare(right.id)
    })[0] ?? null
}

export interface CollectGrillSlotResult {
  slots: GrillSlot[]
  collected: CollectedGrillItem | null
}

export type GrillSlotIdentity = Pick<GrillSlot, 'id' | 'ingredientId' | 'startedAt'>

export function collectGrillSlot(
  slots: readonly GrillSlot[],
  target: GrillSlotIdentity,
  now: number,
  requiredResult?: CookResult,
): CollectGrillSlotResult {
  const slot = slots.find((candidate) => candidate.id === target.id)
  if (
    !slot ||
    slot.status === 'idle' ||
    slot.ingredientId === null ||
    slot.startedAt === null ||
    slot.cookDurationMs <= 0 ||
    slot.ingredientId !== target.ingredientId ||
    slot.startedAt !== target.startedAt
  ) {
    return { slots: [...slots], collected: null }
  }

  const progress = getCookProgress(slot, now)
  const result = slot.status === 'burnt' ? 'burnt' : getCookResult(progress)
  if (requiredResult !== undefined && result !== requiredResult) {
    return { slots: [...slots], collected: null }
  }

  return {
    slots: slots.map((candidate) =>
      candidate.id === target.id ? clearGrillSlot(candidate) : candidate
    ),
    collected: {
      slotId: target.id,
      ingredientId: slot.ingredientId,
      result,
      progress,
    },
  }
}
