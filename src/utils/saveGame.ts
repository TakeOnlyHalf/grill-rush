import type { GameState, Phase } from '../types/game'
import { applyProgressUnlocks } from '../state/unlocks'

const SAVE_KEY = 'grill-rush:save:v1'

const PHASES: Phase[] = ['title', 'story', 'prep', 'open', 'settle', 'night', 'ending']

export function hasSave(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY))
  } catch {
    return false
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore quota / private mode
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

/** 세이브가 있으면 파싱·보정 후 반환, 없으면 null */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (!isValidSave(parsed)) {
      clearSave()
      return null
    }
    return sanitizeLoaded(parsed)
  } catch {
    clearSave()
    return null
  }
}

function isValidSave(value: Partial<GameState>): value is GameState {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.day === 'number' &&
    typeof value.cash === 'number' &&
    typeof value.phase === 'string' &&
    PHASES.includes(value.phase as Phase) &&
    Array.isArray(value.activeMenus) &&
    Array.isArray(value.history)
  )
}

/** 영업 중 세이브는 준비 페이즈로 되돌려 안전하게 재개 */
function sanitizeLoaded(state: GameState): GameState {
  const hydrated: GameState = {
    ...state,
    dailyIngredientPurchases: sanitizePurchaseCounts(state.dailyIngredientPurchases),
    // Open-phase state is not autosaved, so stale prepared ingredients must never cross sessions.
    preparedIngredients: [],
    nextPreparedIngredientId: 1,
    lastServeFeedback: state.lastServeFeedback ?? null,
    lastCustomerLeaveFeedback: state.lastCustomerLeaveFeedback ?? null,
  }
  if (state.phase === 'open') {
    return applyProgressUnlocks({
      ...hydrated,
      phase: 'prep',
      time: 0,
      customers: [],
      orders: [],
      preparedIngredients: [],
      nextPreparedIngredientId: 1,
      lastServeFeedback: null,
      lastCustomerLeaveFeedback: null,
    })
  }
  if (state.phase === 'title' || state.phase === 'ending' || state.phase === 'story') {
    return applyProgressUnlocks({
      ...hydrated,
      phase: 'prep',
      endingId: null,
    })
  }
  return applyProgressUnlocks(hydrated)
}

function sanitizePurchaseCounts(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) return {}
  const counts: Record<string, number> = {}
  for (const [ingredientId, count] of Object.entries(value)) {
    if (Number.isSafeInteger(count) && Number(count) >= 0) {
      counts[ingredientId] = Number(count)
    }
  }
  return counts
}

/** 자동 저장 대상 페이즈 */
export function shouldAutosave(phase: Phase): boolean {
  return phase === 'prep' || phase === 'settle' || phase === 'night'
}
