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

export function createIdleGrillSlots(): GrillSlot[] {
  return Array.from({ length: GRILL_SLOT_COUNT }, (_, index) => ({
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
  if (progress >= 0.9) return 'danger'
  if (progress >= 0.7) return 'perfect'
  if (progress >= 0.4) return 'good'
  return 'raw'
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
