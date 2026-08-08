import ingredientData from '../data/ingredients.json'
import menus from '../data/menus.json'
import type {
  GameState,
  IngredientId,
  CookResult,
  PreparedCookResult,
  PreparedIngredient,
  PreparedQuality,
} from '../types/game'
import { calcSatisfaction } from './formulas'
import { satisfactionToStars } from '../utils/reviewGenerator'

const assemblyIngredientIds = new Set(
  ingredientData.filter((ingredient) => ingredient.grillSec === 0).map((ingredient) => ingredient.id),
)

export interface CollectedIngredientInput {
  ingredientId: IngredientId
  cookResult: CookResult
}

export const qualityByResult: Record<PreparedCookResult, PreparedQuality> = {
  danger: 1,
  good: 2,
  perfect: 3,
}

/** 완성 트레이 최대 표시 칸 수 */
export const MAX_PLATED_ITEMS = 10

export function getPlatedDisplayCount(preparedIngredients: PreparedIngredient[]): number {
  return groupPlatedIngredients(preparedIngredients).length
}

export function isPlatedTrayFull(preparedIngredients: PreparedIngredient[]): boolean {
  return getPlatedDisplayCount(preparedIngredients) >= MAX_PLATED_ITEMS
}

/**
 * 유효한 조리 결과만 준비대에 넣는다. 서빙은 별도의 SERVE_ORDER 액션으로만 수행한다.
 */
export function collectPreparedIngredient(
  state: GameState,
  collected: CollectedIngredientInput,
): GameState {
  if (!isServableResult(collected.cookResult)) return state
  if (isPlatedTrayFull(state.preparedIngredients)) return state

  const prepared: PreparedIngredient = {
    id: `prepared-${state.nextPreparedIngredientId}`,
    ingredientId: collected.ingredientId,
    result: collected.cookResult,
    quality: qualityByResult[collected.cookResult],
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

interface ComboMenu {
  id: string
  /** 이 메뉴의 그릴 재료(조립 재료 제외) id 목록 — 전부 갖춰지면 한 접시로 합친다. */
  ingredients: IngredientId[]
}

/**
 * 그릴 재료 2종 이상으로 구성된 메뉴 — 완성 트레이에서 필요한 그릴 재료가 모두 준비되면 한 접시로 합쳐 보여준다.
 * 재료 수가 많은(더 구체적인) 메뉴를 먼저 매칭하도록 내림차순으로 정렬해둔다 — 예를 들어 베이컨을 공유하는
 * 에그&베이컨(2종)과 그릴 버거(3종)가 동시에 완성 가능할 때, 버거 쪽을 먼저 시도한다.
 */
const comboMenus: ComboMenu[] = menus
  .map((menu) => ({
    id: menu.id,
    ingredients: menu.ingredients.filter((ingredientId) => !assemblyIngredientIds.has(ingredientId)),
  }))
  .filter((menu) => menu.ingredients.length >= 2 && new Set(menu.ingredients).size === menu.ingredients.length)
  .sort((a, b) => b.ingredients.length - a.ingredients.length)

export type PlatedDisplayItem =
  | { kind: 'single'; item: PreparedIngredient }
  | { kind: 'combo'; menuId: string; items: PreparedIngredient[] }

/** comboMenu가 요구하는 그릴 재료를 트레이에서 하나씩 찾는다. 하나라도 없으면 undefined. */
function matchComboItems(
  comboMenu: ComboMenu,
  preparedIngredients: PreparedIngredient[],
  consumedIds: Set<string>,
): PreparedIngredient[] | undefined {
  const matched: PreparedIngredient[] = []
  for (const ingredientId of comboMenu.ingredients) {
    const found = preparedIngredients.find(
      (candidate) =>
        candidate.ingredientId === ingredientId &&
        !consumedIds.has(candidate.id) &&
        !matched.includes(candidate),
    )
    if (!found) return undefined
    matched.push(found)
  }
  return matched
}

/**
 * 완성 트레이 표시용 그룹핑 — comboMenus에 해당하는 그릴 재료가 모두 준비되면 하나의 완성 접시로 합치고,
 * 나머지는 그대로 개별 항목으로 둔다. preparedIngredients 자체는 건드리지 않는, 표시 전용 변환이다.
 *
 * comboMenus를 재료 수 내림차순으로 먼저 전부 훑어 합칠 수 있는 만큼 합친 뒤, 남은 재료만 개별 항목으로
 * 채운다 — 트레이에 담긴 순서와 무관하게 항상 더 구체적인(재료가 많은) 메뉴가 재료를 먼저 가져간다.
 */
export function groupPlatedIngredients(preparedIngredients: PreparedIngredient[]): PlatedDisplayItem[] {
  const consumedIds = new Set<string>()
  const displayItems: PlatedDisplayItem[] = []

  for (const menu of comboMenus) {
    let items = matchComboItems(menu, preparedIngredients, consumedIds)
    while (items) {
      items.forEach((item) => consumedIds.add(item.id))
      displayItems.push({ kind: 'combo', menuId: menu.id, items })
      items = matchComboItems(menu, preparedIngredients, consumedIds)
    }
  }

  for (const item of preparedIngredients) {
    if (!consumedIds.has(item.id)) {
      displayItems.push({ kind: 'single', item })
    }
  }

  return displayItems
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

/** 클릭된 메뉴 하나만 재검증하고 원자적으로 서빙한다. 마지막 메뉴에서 손님 주문을 완료한다. */
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

  const { remaining: preparedIngredients, consumed } = consumePrepared(
    state.preparedIngredients,
    grilledCounts,
  )
  const ingredients = { ...state.ingredients }

  // 조립 재료만 이 시점에 차감한다. 그릴 재료는 올릴 때 이미 USE_INGREDIENT로 차감됐다.
  for (const [ingredientId, count] of assemblyCounts) {
    ingredients[ingredientId] = (ingredients[ingredientId] ?? 0) - count
  }

  const amount = state.menuPrices[menu.id] ?? menu.basePrice
  const patienceRatio = customer.patience / customer.maxPatience
  const satisfaction = calcSatisfaction({
    price: amount,
    cost: menu.cost,
    patienceRatio,
    qualities: consumed.map((item) => item.quality),
  })
  const orders = state.orders.map((candidate) => candidate.id === orderId
    ? { ...candidate, status: 'done' as const, servedAmount: amount, satisfaction }
    : candidate)
  const customerOrders = orders.filter((candidate) => candidate.customerId === customerId)
  const hasRemainingOrder = customerOrders.some((candidate) => candidate.status !== 'done')

  if (hasRemainingOrder) {
    return {
      ...state,
      ingredients,
      preparedIngredients,
      orders,
      dailySales: state.dailySales + amount,
    }
  }

  const totalAmount = customerOrders.reduce(
    (sum, candidate) => sum + (candidate.servedAmount ?? 0),
    0,
  )
  const satisfactions = customerOrders
    .map((candidate) => candidate.satisfaction)
    .filter((value): value is number => typeof value === 'number')
  const combinedSatisfaction = satisfactions.length > 0
    ? satisfactions.reduce((sum, value) => sum + value, 0) / satisfactions.length
    : satisfaction
  const stars = satisfactionToStars(combinedSatisfaction)
  const tip = Math.random() < customer.tipChance ? Math.round(totalAmount * 0.1) : 0

  return {
    ...state,
    ingredients,
    preparedIngredients,
    customers: state.customers.filter((candidate) => candidate.id !== customerId),
    orders: orders.filter((candidate) => candidate.customerId !== customerId),
    dailySales: state.dailySales + amount,
    dailyTips: state.dailyTips + tip,
    dailyServed: state.dailyServed + 1,
    dailyReviews: [...state.dailyReviews, stars],
    lastServeFeedback: {
      id: (state.lastServeFeedback?.id ?? 0) + 1,
      menuId: menu.id,
      menuName: customer.orderedMenuNames.join(' + '),
      amount: totalAmount,
      stars,
      tip,
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
): { remaining: PreparedIngredient[]; consumed: PreparedIngredient[] } {
  const remainingCounts = new Map(required)
  const consumed: PreparedIngredient[] = []
  const remaining = preparedIngredients.filter((item) => {
    const left = remainingCounts.get(item.ingredientId) ?? 0
    if (left <= 0) return true
    remainingCounts.set(item.ingredientId, left - 1)
    consumed.push(item)
    return false
  })
  return { remaining, consumed }
}
