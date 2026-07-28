import ingredientData from '../data/ingredients.json'
import menus from '../data/menus.json'
import type {
  GameState,
  IngredientId,
  CookResult,
  PreparedCookResult,
  PreparedIngredient,
} from '../types/game'

const assemblyIngredientIds = new Set(
  ingredientData.filter((ingredient) => ingredient.grillSec === 0).map((ingredient) => ingredient.id),
)

export interface CollectedIngredientInput {
  ingredientId: IngredientId
  cookResult: CookResult
  quality: number
}

/**
 * 유효한 조리 결과만 준비대에 넣는다. 서빙은 별도의 SERVE_ORDER 액션으로만 수행한다.
 */
export function collectPreparedIngredient(
  state: GameState,
  collected: CollectedIngredientInput,
): GameState {
  if (!isServableResult(collected.cookResult)) return state

  const prepared: PreparedIngredient = {
    id: `prepared-${state.nextPreparedIngredientId}`,
    ingredientId: collected.ingredientId,
    cookResult: collected.cookResult,
    quality: collected.quality,
  }

  return {
    ...state,
    preparedIngredients: [...state.preparedIngredients, prepared],
    nextPreparedIngredientId: state.nextPreparedIngredientId + 1,
  }
}

function isServableResult(result: CookResult): result is PreparedCookResult {
  return result === 'good' || result === 'perfect' || result === 'danger'
}

export interface OrderIngredientProgress {
  ingredientId: IngredientId
  name: string
  icon: string
  required: number
  prepared: number
  assembly: boolean
}

export interface OrderFulfillment {
  canServe: boolean
  ingredients: OrderIngredientProgress[]
}

export function getOrderFulfillment(state: GameState, orderId: string): OrderFulfillment {
  const order = state.orders.find((candidate) => candidate.id === orderId)
  const menu = order ? menus.find((candidate) => candidate.id === order.menuId) : undefined
  if (!order || !menu || order.status !== 'queued') return { canServe: false, ingredients: [] }

  const required = countIngredients(menu.ingredients)
  const prepared = countIngredients(state.preparedIngredients.map((item) => item.ingredientId))
  const rows = [...required].map(([ingredientId, count]) => {
    const ingredient = ingredientData.find((candidate) => candidate.id === ingredientId)
    const assembly = assemblyIngredientIds.has(ingredientId)
    return {
      ingredientId,
      name: ingredient?.name ?? ingredientId,
      icon: ingredient?.icon ?? '🍽️',
      required: count,
      prepared: assembly
        ? Math.min(count, state.ingredients[ingredientId] ?? 0)
        : Math.min(count, prepared.get(ingredientId) ?? 0),
      assembly,
    }
  })
  return { canServe: rows.every((row) => row.prepared >= row.required), ingredients: rows }
}

/** 클릭된 주문 하나만 재검증하고 원자적으로 서빙한다. */
export function serveOrder(state: GameState, orderId: string, customerId: string): GameState {
  const order = state.orders.find(
    (candidate) => candidate.id === orderId && candidate.customerId === customerId,
  )
  const customer = state.customers.find((candidate) => candidate.id === customerId)
  const menu = order ? menus.find((candidate) => candidate.id === order.menuId) : undefined
  if (state.phase !== 'open' || !order || !customer || !menu || order.status !== 'queued') return state

  const grilledCounts = countIngredients(
    menu.ingredients.filter((ingredientId) => !assemblyIngredientIds.has(ingredientId)),
  )
  const assemblyCounts = countIngredients(
    menu.ingredients.filter((ingredientId) => assemblyIngredientIds.has(ingredientId)),
  )
  if (!hasPreparedIngredients(state.preparedIngredients, grilledCounts)) return state
  if (!hasInventory(state.ingredients, assemblyCounts)) return state

  const preparedIngredients = consumePrepared(state.preparedIngredients, grilledCounts)
  const ingredients = { ...state.ingredients }

  // 조립 재료만 이 시점에 차감한다. 그릴 재료는 올릴 때 이미 USE_INGREDIENT로 차감됐다.
  for (const [ingredientId, count] of assemblyCounts) {
    ingredients[ingredientId] = (ingredients[ingredientId] ?? 0) - count
  }

  const amount = state.menuPrices[menu.id] ?? 0
  return {
    ...state,
    ingredients,
    preparedIngredients,
    customers: state.customers.filter((candidate) => candidate.id !== customerId),
    orders: state.orders.filter((candidate) => candidate.id !== orderId),
    dailySales: state.dailySales + amount,
    dailyServed: state.dailyServed + 1,
    lastServeFeedback: {
      id: (state.lastServeFeedback?.id ?? 0) + 1,
      menuId: menu.id,
      menuName: menu.name,
      amount,
    },
  }
}

function countIngredients(ingredientIds: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const ingredientId of ingredientIds) {
    counts.set(ingredientId, (counts.get(ingredientId) ?? 0) + 1)
  }
  return counts
}

function hasPreparedIngredients(
  preparedIngredients: PreparedIngredient[],
  required: Map<string, number>,
): boolean {
  const available = countIngredients(preparedIngredients.map((item) => item.ingredientId))
  return [...required].every(
    ([ingredientId, count]) => (available.get(ingredientId) ?? 0) >= count,
  )
}

function hasInventory(
  inventory: Record<IngredientId, number>,
  required: Map<string, number>,
): boolean {
  return [...required].every(
    ([ingredientId, count]) => (inventory[ingredientId] ?? 0) >= count,
  )
}

function consumePrepared(
  preparedIngredients: PreparedIngredient[],
  required: Map<string, number>,
): PreparedIngredient[] {
  const remainingCounts = new Map(required)
  return preparedIngredients.filter((item) => {
    const remaining = remainingCounts.get(item.ingredientId) ?? 0
    if (remaining <= 0) return true
    remainingCounts.set(item.ingredientId, remaining - 1)
    return false
  })
}
