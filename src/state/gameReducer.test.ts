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
  ingredients: Record<string, number>,
  upgrades: string[] = [],
): GameState {
  return {
    ...createInitialState(),
    phase: 'prep' as const,
    cash: 1_000_000,
    activeMenus: ['egg_bacon'],
    ingredients,
    upgrades,
  }
}

function buyEgg(state: GameState, qty = 1) {
  return gameReducer(state, {
    type: 'BUY_INGREDIENT',
    payload: { ingredientId: 'egg', qty, unitCost: 400 },
  })
}

describe('BUY_INGREDIENT capacity', () => {
  it('allows the 40th ingredient without the storage upgrade', () => {
    const initial = prepState({ egg: 20, bacon: 19 })
    const purchased = buyEgg(initial)

    expect(purchased.ingredients).toEqual({ egg: 21, bacon: 19 })
    expect(purchased.cash).toBe(initial.cash - 400)
    expect(purchased.dailyCosts.ingredients).toBe(400)
  })

  it('blocks all of a request that would exceed the base capacity', () => {
    const full = prepState({ egg: 20, bacon: 20 })
    const oneOver = prepState({ egg: 20, bacon: 19 })

    expect(buyEgg(full)).toBe(full)
    expect(buyEgg(oneOver, 2)).toBe(oneOver)
  })

  it('allows 80 ingredients with the storage upgrade and blocks the 81st', () => {
    const at79 = prepState(
      { egg: 40, bacon: 39 },
      ['ingredient_storage'],
    )
    const at80 = buyEgg(at79)

    expect(at80.ingredients).toEqual({ egg: 41, bacon: 39 })
    expect(buyEgg(at80)).toBe(at80)
  })

  it('uses the total across different ingredient types', () => {
    const full = prepState({ egg: 10, bacon: 12, sausage: 18 })
    expect(buyEgg(full)).toBe(full)
  })

  it('does not mutate cash, ingredients, or costs when capacity blocks a purchase', () => {
    const initial = prepState({ egg: 40 })
    const snapshot = structuredClone(initial)

    expect(buyEgg(initial)).toBe(initial)
    expect(initial).toEqual(snapshot)
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid quantity %s',
    (qty) => {
      const initial = prepState({})
      expect(buyEgg(initial, qty)).toBe(initial)
    },
  )

  it('keeps menu and cash validation intact', () => {
    const noMenu = { ...prepState({}), activeMenus: [] }
    const noCash = { ...prepState({}), cash: 399 }

    expect(buyEgg(noMenu)).toBe(noMenu)
    expect(buyEgg(noCash)).toBe(noCash)
  })

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

  it('does not delete over-capacity inventory from an existing save', () => {
    const initial = prepState({ egg: 41 })
    expect(buyEgg(initial)).toBe(initial)
    expect(initial.ingredients).toEqual({ egg: 41 })
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
    expect(nextDay.upgrades).toEqual(['ingredient_storage'])
    expect(getIngredientCapacity(nextDay.upgrades)).toBe(80)
  })

  it('starts a new game with the base capacity', () => {
    const started = gameReducer(
      { ...createInitialState(), upgrades: ['ingredient_storage'] },
      { type: 'START_GAME' },
    )

    expect(started.upgrades).toEqual([])
    expect(getIngredientCapacity(started.upgrades)).toBe(40)
  })
})
