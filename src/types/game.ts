/** 공유 게임 도메인 타입 */

export type Phase = 'title' | 'story' | 'prep' | 'open' | 'settle' | 'night' | 'ending'

export type WeatherId = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'clear'

export type EndingId = 'legend' | 'popular' | 'local' | 'survive' | 'closed'

export type MenuId = string
export type LocationId = string
export type IngredientId = string
export type UpgradeId = string

export interface DailyCosts {
  ingredients: number
  rent: number
  waste: number
  truck: number
}

export interface Customer {
  id: string
  type: string
  typeName: string
  icon: string
  orderMenuId: MenuId
  orderName: string
  patience: number
  maxPatience: number
  tipChance: number
}

/** 주문 처리용 — 이후 미니게임 연동 시 확장 */
export interface Order {
  id: string
  customerId: string
  menuId: MenuId
  status: 'queued' | 'cooking' | 'done' | 'failed'
}

export type CookResult = 'raw' | 'good' | 'perfect' | 'danger' | 'burnt'
export type PreparedCookResult = Exclude<CookResult, 'raw' | 'burnt'>
export type PreparedQuality = 1 | 2 | 3

export interface PreparedIngredient {
  id: string
  ingredientId: IngredientId
  result: PreparedCookResult
  quality: PreparedQuality
}

export interface ServeFeedback {
  id: number
  menuId: MenuId
  menuName: string
  amount: number
}

export interface CustomerLeaveFeedback {
  id: number
  customerName: string
}

export interface DaySummary {
  day: number
  sales: number
  tips: number
  costs: DailyCosts
  profit: number
  served: number
  left: number
  reviewAvg: number
  weather: WeatherId
  location: LocationId
}

export interface GameState {
  day: number
  phase: Phase
  time: number
  maxDays: number
  weather: WeatherId
  cash: number
  fame: number
  reviewAvg: number
  location: LocationId
  activeMenus: MenuId[]
  menuPrices: Record<MenuId, number>
  ingredients: Record<IngredientId, number>
  customers: Customer[]
  orders: Order[]
  preparedIngredients: PreparedIngredient[]
  nextPreparedIngredientId: number
  lastServeFeedback: ServeFeedback | null
  lastCustomerLeaveFeedback: CustomerLeaveFeedback | null
  dailySales: number
  dailyTips: number
  dailyServed: number
  dailyLeft: number
  dailyReviews: number[]
  dailyCosts: DailyCosts
  upgrades: UpgradeId[]
  unlockedMenus: MenuId[]
  unlockedLocations: LocationId[]
  history: DaySummary[]
  endingId: EndingId | null
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'FINISH_STORY' }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'SET_LOCATION'; payload: LocationId }
  | { type: 'CONFIRM_LOCATION' }
  | { type: 'TOGGLE_MENU'; payload: MenuId }
  | { type: 'SET_MENU_PRICE'; payload: { menuId: MenuId; price: number } }
  | { type: 'BUY_INGREDIENT'; payload: { ingredientId: IngredientId; qty: number; unitCost: number } }
  | { type: 'USE_INGREDIENT'; payload: { ingredientId: IngredientId } }
  | {
      type: 'COLLECT_COOKED_INGREDIENT'
      payload: { ingredientId: IngredientId; cookResult: CookResult }
    }
  | { type: 'SERVE_ORDER'; payload: { orderId: string; customerId: string } }
  | { type: 'START_OPEN' }
  | { type: 'TICK_OPEN'; payload?: { dt?: number } }
  | { type: 'END_OPEN' }
  | { type: 'CONFIRM_SETTLE' }
  | { type: 'BUY_UPGRADE'; payload: { upgradeId: UpgradeId; cost: number } }
  | { type: 'NEXT_DAY' }
  | { type: 'SHOW_ENDING'; payload?: EndingId }
  | { type: 'RESTART' }
