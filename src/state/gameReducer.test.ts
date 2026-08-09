import { describe, expect, it } from 'vitest'
import { getGrillSlotCount } from '../grill/grillUpgrades'
import { createInitialState } from './initialState'
import { gameReducer, type GameState } from './gameReducer'
import { getIngredientPurchaseLimit } from '../utils/ingredientStorage'

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

  it('requires and charges each heat control level in order', () => {
    const initial = nightState()
    expect(gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'heat_control_2' },
    })).toBe(initial)

    const levelOne = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'heat_control' },
    })
    const levelTwo = gameReducer(levelOne, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'heat_control_2' },
    })

    expect(initial.cash - levelOne.cash).toBe(80_000)
    expect(levelOne.cash - levelTwo.cash).toBe(100_000)
    expect(levelTwo.upgrades).toEqual(['heat_control', 'heat_control_2'])
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

function buyIngredient(state: GameState, ingredientId = 'egg', quantity = 1) {
  return gameReducer(state, {
    type: 'BUY_INGREDIENT',
    payload: { ingredientId, quantity },
  })
}

describe('BUY_INGREDIENT', () => {
  it('buys ten at once when quantity is requested', () => {
    const initial = prepState()
    const purchased = buyIngredient(initial, 'egg', 10)

    expect(purchased.ingredients).toEqual({ egg: 10 })
    expect(purchased.dailyIngredientPurchases).toEqual({ egg: 10 })
    expect(purchased.cash).toBe(initial.cash - 4_000)
    expect(purchased.dailyCosts.ingredients).toBe(4_000)
  })

  it('buys only the remaining daily limit when requesting ten', () => {
    const initial = prepState({}, [], ['egg_bacon'], 1_000_000, { egg: 17 })
    const purchased = buyIngredient(initial, 'egg', 10)

    expect(purchased.ingredients.egg).toBe(3)
    expect(purchased.dailyIngredientPurchases.egg).toBe(20)
    expect(purchased.cash).toBe(initial.cash - 1_200)
  })

  it('buys only as many as cash allows when requesting ten', () => {
    const initial = prepState({}, [], ['egg_bacon'], 1_500)
    const purchased = buyIngredient(initial, 'egg', 10)

    expect(purchased.ingredients.egg).toBe(3)
    expect(purchased.dailyIngredientPurchases.egg).toBe(3)
    expect(purchased.cash).toBe(300)
  })

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

  it('allows buying past the old total capacity when per-ingredient room remains', () => {
    const initial = prepState({ sausage: 40 })
    const purchased = buyIngredient(initial)

    expect(purchased.ingredients).toEqual({ sausage: 40, egg: 1 })
    expect(getIngredientPurchaseLimit(purchased.upgrades)).toBe(20)
  })

  it('rejects a purchase when the per-ingredient daily limit is full', () => {
    const initial = prepState({}, [], ['egg_bacon'], 1_000_000, { egg: 20 })
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

  it('allows 40 purchases of one ingredient after the storage upgrade', () => {
    const initial = prepState({}, ['ingredient_storage'], ['egg_bacon'], 1_000_000)
    let purchased = initial
    for (let count = 0; count < 40; count += 1) {
      purchased = buyIngredient(purchased)
    }

    expect(getIngredientPurchaseLimit(purchased.upgrades)).toBe(40)
    expect(purchased.ingredients.egg).toBe(40)
    expect(purchased.dailyIngredientPurchases.egg).toBe(40)
    expect(buyIngredient(purchased)).toBe(purchased)
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

  it('does not delete over-limit inventory from an existing save', () => {
    const initial = prepState({ egg: 41 }, [], ['egg_bacon'], 1_000_000, { egg: 20 })
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

  it('derives purchase limit from persisted upgrades across load and day changes', () => {
    const saved = {
      ...nightState(),
      ingredients: { egg: 40 },
      upgrades: ['ingredient_storage'],
    }
    const loaded = gameReducer(createInitialState(), {
      type: 'LOAD_GAME',
      payload: saved,
    })
    const nextDay = gameReducer(loaded, { type: 'NEXT_DAY' })

    expect(getIngredientPurchaseLimit(loaded.upgrades)).toBe(40)
    expect(loaded.ingredients).toEqual({ egg: 40 })
    expect(nextDay.ingredients).toEqual({})
    expect(nextDay.dailyIngredientPurchases).toEqual({})
    expect(nextDay.upgrades).toEqual(['ingredient_storage'])
    expect(getIngredientPurchaseLimit(nextDay.upgrades)).toBe(40)
  })

  it('starts a new game with the base purchase limit', () => {
    const started = gameReducer(
      { ...createInitialState(), upgrades: ['ingredient_storage'] },
      { type: 'START_GAME' },
    )

    expect(started.upgrades).toEqual([])
    expect(started.dailyIngredientPurchases).toEqual({})
    expect(getIngredientPurchaseLimit(started.upgrades)).toBe(20)
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
    const finalNight = { ...night, day: night.maxDays, cash: 500_000 }
    const ended = gameReducer(finalNight, { type: 'NEXT_DAY' })

    expect(night.phase).toBe('night')
    expect(night.history[0].costs.ingredients).toBe(0)
    expect(ended.phase).toBe('ending')
    expect(ended.endingId).toBe('normal')
  })

  it('goes to the bad ending immediately when settlement cash goes negative', () => {
    const settleState = {
      ...createInitialState(),
      phase: 'settle' as const,
      day: 3,
      cash: 1_000,
      dailySales: 0,
      dailyTips: 0,
      dailyCosts: {
        ingredients: 0,
        rent: 5_000,
        waste: 0,
        truck: 5_000,
      },
    }
    const ended = gameReducer(settleState, { type: 'CONFIRM_SETTLE' })
    expect(ended.phase).toBe('ending')
    expect(ended.endingId).toBe('bad')
    expect(ended.cash).toBeLessThan(0)
  })
})
