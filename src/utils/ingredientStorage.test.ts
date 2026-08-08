import { describe, expect, it } from 'vitest'
import {
  BASE_INGREDIENT_CAPACITY,
  canPurchaseIngredient,
  getIngredientCapacity,
  getIngredientCount,
} from './ingredientStorage'

describe('ingredient storage', () => {
  it('uses 40 by default and applies the storage upgrade once', () => {
    expect(BASE_INGREDIENT_CAPACITY).toBe(40)
    expect(getIngredientCapacity([])).toBe(40)
    expect(getIngredientCapacity(['ingredient_storage'])).toBe(80)
    expect(
      getIngredientCapacity(['ingredient_storage', 'ingredient_storage']),
    ).toBe(80)
  })

  it('ignores unknown upgrades and upgrades without a valid capacity bonus', () => {
    expect(getIngredientCapacity(['unknown', 'heat_boost'])).toBe(40)
  })

  it('sums every valid ingredient quantity without mutating the inventory', () => {
    const ingredients = { egg: 10, bacon: 12, sausage: 18 }
    const snapshot = { ...ingredients }

    expect(getIngredientCount(ingredients)).toBe(40)
    expect(ingredients).toEqual(snapshot)
  })

  it('treats empty and invalid quantities safely', () => {
    expect(getIngredientCount({})).toBe(0)
    expect(
      getIngredientCount({ egg: 2, bacon: 0, sausage: -1, corn: 1.5 }),
    ).toBe(2)
    expect(canPurchaseIngredient({ egg: Number.NaN }, [], 1)).toBe(false)
    expect(canPurchaseIngredient({ egg: Number.POSITIVE_INFINITY }, [], 1)).toBe(false)
    expect(canPurchaseIngredient({ egg: 1.5 }, [], 1)).toBe(false)
  })

  it('allows purchases through the limit and rejects requests that exceed it', () => {
    expect(canPurchaseIngredient({ egg: 20, bacon: 19 }, [], 1)).toBe(true)
    expect(canPurchaseIngredient({ egg: 20, bacon: 20 }, [], 1)).toBe(false)
    expect(canPurchaseIngredient({ egg: 39 }, [], 2)).toBe(false)
    expect(canPurchaseIngredient({ egg: 79 }, ['ingredient_storage'], 1)).toBe(true)
    expect(canPurchaseIngredient({ egg: 80 }, ['ingredient_storage'], 1)).toBe(false)
  })

  it('rejects non-positive, fractional, and non-finite purchase quantities', () => {
    expect(canPurchaseIngredient({}, [], 0)).toBe(false)
    expect(canPurchaseIngredient({}, [], -1)).toBe(false)
    expect(canPurchaseIngredient({}, [], 1.5)).toBe(false)
    expect(canPurchaseIngredient({}, [], Number.NaN)).toBe(false)
    expect(canPurchaseIngredient({}, [], Number.POSITIVE_INFINITY)).toBe(false)
  })
})
