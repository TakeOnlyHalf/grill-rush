import { describe, expect, it } from 'vitest'
import { getGrillSlotCount } from '../grill/grillUpgrades'
import { createInitialState } from './initialState'
import { gameReducer, type GameState } from './gameReducer'
import { getIngredientCapacity } from '../utils/ingredientStorage'

function nightState(cash = 1_000_000) {
  return {
    ...createInitialState(),
    phase: 'night' as const,
    cash,
  }
}

describe('BUY_UPGRADE', () => {
  it('charges 50,000 for heat boost and blocks duplicate purchases', () => {
    const initial = nightState(100_000)
    const purchased = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'heat_boost' },
    })

    expect(purchased.cash).toBe(50_000)
    expect(purchased.upgrades).toEqual(['heat_boost'])
    expect(
      gameReducer(purchased, {
        type: 'BUY_UPGRADE',
        payload: { upgradeId: 'heat_boost' },
      }),
    ).toBe(purchased)
  })

  it('charges the JSON cost and blocks duplicate purchases', () => {
    const initial = nightState(200_000)
    const purchased = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand' },
    })

    expect(purchased.cash).toBe(70_000)
    expect(purchased.upgrades).toEqual(['grill_expand'])
    expect(
      gameReducer(purchased, {
        type: 'BUY_UPGRADE',
        payload: { upgradeId: 'grill_expand' },
      }),
    ).toBe(purchased)
  })

  it('requires each previous expansion to be actually owned', () => {
    const initial = nightState()
    const blockedLevelTwo = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_2' },
    })
    const blockedLevelThree = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_3' },
    })

    expect(blockedLevelTwo).toBe(initial)
    expect(blockedLevelThree).toBe(initial)
  })

  it('purchases all levels in order for 130k, 140k, and 150k', () => {
    const initial = nightState()
    const levelOne = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand' },
    })
    const levelTwo = gameReducer(levelOne, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_2' },
    })
    const levelThree = gameReducer(levelTwo, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_3' },
    })

    expect(initial.cash - levelOne.cash).toBe(130_000)
    expect(levelOne.cash - levelTwo.cash).toBe(140_000)
    expect(levelTwo.cash - levelThree.cash).toBe(150_000)
    expect(getGrillSlotCount(levelThree.upgrades)).toBe(6)
  })

  it('requires and charges each auto assist level in order', () => {
    const initial = { ...nightState(), upgrades: ['grill_expand'] }
    expect(gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'auto_assist_2' },
    })).toBe(initial)

    const levelOne = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'auto_assist' },
    })
    const levelTwo = gameReducer(levelOne, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'auto_assist_2' },
    })
    const levelThree = gameReducer(levelTwo, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'auto_assist_3' },
    })

    expect(initial.cash - levelOne.cash).toBe(120_000)
    expect(levelOne.cash - levelTwo.cash).toBe(130_000)
    expect(levelTwo.cash - levelThree.cash).toBe(140_000)
    expect(levelThree.upgrades).toEqual([
      'grill_expand',
      'auto_assist',
      'auto_assist_2',
      'auto_assist_3',
    ])
  })
})

function prepState(
  ingredients: Record<string, number> = {},
  upgrades: string[] = [],
  activeMenus: string[] = ['egg_bacon'],
  cash = 1_000_000,
  dailyIngredientPurchases: Record<string, number> = {},
): GameState {
  return {
    ...createInitialState(),
    phase: 'prep' as const,
    cash,
    activeMenus,
    ingredients,
    dailyIngredientPurchases,
    upgrades,
  }
}

function buyIngredient(state: GameState, ingredientId = 'egg') {
  return gameReducer(state, {
    type: 'BUY_INGREDIENT',
    payload: { ingredientId },
  })
}

describe('BUY_INGREDIENT', () => {
  it('buys only the clicked ingredient at its unit price', () => {
    const initial = prepState()
    const purchased = buyIngredient(initial, 'egg')

    expect(purchased.ingredients).toEqual({ egg: 1 })
    expect(purchased.cash).toBe(initial.cash - 400)
    expect(purchased.dailyIngredientPurchases).toEqual({ egg: 1 })
    expect(purchased.dailyCosts.ingredients).toBe(400)
  })

  it('tracks egg and bacon purchases independently', () => {
    const initial = prepState()
    const egg = buyIngredient(initial, 'egg')
    const bacon = buyIngredient(egg, 'bacon')

    expect(bacon.ingredients).toEqual({ egg: 1, bacon: 1 })
    expect(bacon.dailyIngredientPurchases).toEqual({ egg: 1, bacon: 1 })
    expect(bacon.cash).toBe(initial.cash - 1_200)
  })

  it('buys one ingredient for a single-ingredient menu', () => {
    const initial = prepState({}, [], ['grilled_sausage'])
    const purchased = buyIngredient(initial, 'sausage')

    expect(purchased.ingredients).toEqual({ sausage: 1 })
    expect(purchased.cash).toBe(initial.cash - 700)
  })

  it('does not count existing inventory toward the daily purchase limit', () => {
    const initial = prepState({ egg: 5 })
    const purchased = buyIngredient(initial)

    expect(purchased.ingredients.egg).toBe(6)
    expect(purchased.dailyIngredientPurchases.egg).toBe(1)
  })

  it('allows 20 purchases and rejects the 21st without changing state', () => {
    const initial = prepState()
    let purchased = initial
    for (let count = 0; count < 20; count += 1) {
      purchased = buyIngredient(purchased)
    }

    expect(purchased.ingredients.egg).toBe(20)
    expect(purchased.dailyIngredientPurchases.egg).toBe(20)
    expect(purchased.cash).toBe(initial.cash - 8_000)
    expect(buyIngredient(purchased)).toBe(purchased)
  })

  it('allows another ingredient after one ingredient reaches its limit', () => {
    const initial = prepState({}, [], ['egg_bacon'], 1_000_000, { egg: 20 })
    const purchased = buyIngredient(initial, 'bacon')

    expect(purchased.dailyIngredientPurchases).toEqual({ egg: 20, bacon: 1 })
    expect(purchased.ingredients).toEqual({ bacon: 1 })
  })

  it('does not change cash, inventory, counters, or costs when cash is short', () => {
    const initial = prepState({}, [], ['egg_bacon'], 399)
    const snapshot = structuredClone(initial)

    expect(buyIngredient(initial)).toBe(initial)
    expect(initial).toEqual(snapshot)
  })

  it('allows a purchase that lands exactly on the base capacity', () => {
    const initial = prepState({ sausage: 39 })
    const purchased = buyIngredient(initial)

    expect(purchased.ingredients).toEqual({ sausage: 39, egg: 1 })
    expect(getIngredientCapacity(purchased.upgrades)).toBe(40)
  })

  it('rejects a purchase when base storage is full', () => {
    const initial = prepState({ sausage: 40 })
    const snapshot = structuredClone(initial)

    expect(buyIngredient(initial)).toBe(initial)
    expect(initial).toEqual(snapshot)
  })

  it('buys only the clicked ingredient when several menus are active', () => {
    const initial = prepState({}, [], ['egg_bacon', 'grilled_corn'])
    const purchased = buyIngredient(initial, 'corn')

    expect(purchased.ingredients).toEqual({ corn: 1 })
    expect(purchased.cash).toBe(initial.cash - 400)
  })

  it('rejects ingredients not required by an active menu', () => {
    const initial = prepState()

    expect(buyIngredient(initial, 'corn')).toBe(initial)
  })

  it('supports exact capacity and rejection at the upgraded storage boundary', () => {
    const at79 = prepState({ sausage: 79 }, ['ingredient_storage'])
    const at80 = buyIngredient(at79)

    expect(getIngredientCapacity(at80.upgrades)).toBe(80)
    expect(at80.ingredients).toEqual({ sausage: 79, egg: 1 })

    expect(buyIngredient(at80)).toBe(at80)
  })

  it('rejects malformed persisted daily counters', () => {
    const malformed = prepState({}, [], ['egg_bacon'], 1_000_000, { egg: -1 })

    expect(buyIngredient(malformed)).toBe(malformed)
  })

  it('discards inventory and resets daily counters on the next day', () => {
    const initial = {
      ...nightState(),
      ingredients: { egg: 5, bacon: 3 },
      dailyIngredientPurchases: { egg: 5, bacon: 3 },
    }
    const nextDay = gameReducer(initial, { type: 'NEXT_DAY' })

    expect(nextDay.ingredients).toEqual({})
    expect(nextDay.dailyIngredientPurchases).toEqual({})
  })

  it('keeps a daily counter when its menu is deselected and selected again', () => {
    const initial = prepState({ egg: 5 }, [], ['egg_bacon'], 1_000_000, { egg: 5 })
    const deselected = gameReducer(initial, {
      type: 'TOGGLE_MENU',
      payload: 'egg_bacon',
    })
    const reselected = gameReducer(deselected, {
      type: 'TOGGLE_MENU',
      payload: 'egg_bacon',
    })

    expect(deselected.dailyIngredientPurchases).toEqual({ egg: 5 })
    expect(reselected.dailyIngredientPurchases).toEqual({ egg: 5 })
  })

  it('does not delete over-capacity inventory from an existing save', () => {
    const initial = prepState({ egg: 41 })
    expect(buyIngredient(initial)).toBe(initial)
    expect(initial.ingredients).toEqual({ egg: 41 })
  })
})

describe('ingredient storage upgrade persistence', () => {

  it('charges exactly 60,000 and prevents duplicate storage upgrades', () => {
    const initial = nightState(100_000)
    const purchased = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'ingredient_storage' },
    })

    expect(purchased.cash).toBe(40_000)
    expect(purchased.upgrades).toEqual(['ingredient_storage'])
    expect(
      gameReducer(purchased, {
        type: 'BUY_UPGRADE',
        payload: { upgradeId: 'ingredient_storage' },
      }),
    ).toBe(purchased)
  })

  it('derives capacity from persisted upgrades across load and day changes', () => {
    const saved = {
      ...nightState(),
      ingredients: { egg: 80 },
      upgrades: ['ingredient_storage'],
    }
    const loaded = gameReducer(createInitialState(), {
      type: 'LOAD_GAME',
      payload: saved,
    })
    const nextDay = gameReducer(loaded, { type: 'NEXT_DAY' })

    expect(getIngredientCapacity(loaded.upgrades)).toBe(80)
    expect(loaded.ingredients).toEqual({ egg: 80 })
    expect(nextDay.ingredients).toEqual({})
    expect(nextDay.dailyIngredientPurchases).toEqual({})
    expect(nextDay.upgrades).toEqual(['ingredient_storage'])
    expect(getIngredientCapacity(nextDay.upgrades)).toBe(80)
  })

  it('starts a new game with the base capacity', () => {
    const started = gameReducer(
      { ...createInitialState(), upgrades: ['ingredient_storage'] },
      { type: 'START_GAME' },
    )

    expect(started.upgrades).toEqual([])
    expect(started.dailyIngredientPurchases).toEqual({})
    expect(getIngredientCapacity(started.upgrades)).toBe(40)
  })
})

describe('daily ingredient lifecycle', () => {
  it('starts business with selected menus even when every ingredient quantity is zero', () => {
    const initial = prepState()

    const opened = gameReducer(initial, { type: 'START_OPEN' })

    expect(opened.phase).toBe('open')
    expect(opened.ingredients).toEqual({})
  })

  it('charges all purchases exactly once, then discards leftovers for day 2', () => {
    const initial = prepState({}, [], ['egg_bacon'], 100_000)
    let purchased = initial
    for (let count = 0; count < 10; count += 1) {
      purchased = buyIngredient(purchased, 'egg')
      purchased = buyIngredient(purchased, 'bacon')
    }

    expect(purchased.cash).toBe(88_000)
    expect(purchased.dailyCosts.ingredients).toBe(12_000)

    let opened = gameReducer(purchased, { type: 'START_OPEN' })
    for (let count = 0; count < 4; count += 1) {
      opened = gameReducer(opened, {
        type: 'USE_INGREDIENT',
        payload: { ingredientId: 'egg' },
      })
    }
    for (let count = 0; count < 6; count += 1) {
      opened = gameReducer(opened, {
        type: 'USE_INGREDIENT',
        payload: { ingredientId: 'bacon' },
      })
    }
    expect(opened.ingredients).toEqual({ egg: 6, bacon: 4 })

    const settled = gameReducer(opened, { type: 'END_OPEN' })
    const confirmed = gameReducer(settled, { type: 'CONFIRM_SETTLE' })
    const expectedOperatingCosts =
      settled.dailyCosts.rent + settled.dailyCosts.waste + settled.dailyCosts.truck

    expect(confirmed.cash).toBe(88_000 - expectedOperatingCosts)
    expect(confirmed.history[0].costs.ingredients).toBe(12_000)
    expect(confirmed.history[0].profit).toBe(-12_000 - expectedOperatingCosts)

    const nextDay = gameReducer(confirmed, { type: 'NEXT_DAY' })
    expect(nextDay.day).toBe(2)
    expect(nextDay.phase).toBe('prep')
    expect(nextDay.ingredients).toEqual({})
    expect(nextDay.dailyIngredientPurchases).toEqual({})
    expect(nextDay.dailyCosts.ingredients).toBe(0)
    expect(confirmed.history[0].costs.ingredients).toBe(12_000)
  })

  it('settles a no-purchase day and reaches the ending after the final day', () => {
    const opened = gameReducer(prepState(), { type: 'START_OPEN' })
    const settled = gameReducer(opened, { type: 'END_OPEN' })
    const night = gameReducer(settled, { type: 'CONFIRM_SETTLE' })
    const finalNight = { ...night, day: night.maxDays }

    expect(night.phase).toBe('night')
    expect(night.history[0].costs.ingredients).toBe(0)
    expect(gameReducer(finalNight, { type: 'NEXT_DAY' }).phase).toBe('ending')
  })
})
