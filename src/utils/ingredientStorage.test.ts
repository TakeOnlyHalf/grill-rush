import { describe, expect, it } from 'vitest'
import {
  BASE_INGREDIENT_PURCHASE_LIMIT,
  getIngredientPurchaseLimit,
} from './ingredientStorage'

describe('ingredient purchase limit', () => {
  it('uses 20 by default and raises to 40 with the storage upgrade', () => {
    expect(BASE_INGREDIENT_PURCHASE_LIMIT).toBe(20)
    expect(getIngredientPurchaseLimit([])).toBe(20)
    expect(getIngredientPurchaseLimit(['ingredient_storage'])).toBe(40)
    expect(
      getIngredientPurchaseLimit(['ingredient_storage', 'ingredient_storage']),
    ).toBe(40)
  })

  it('ignores unknown upgrades and upgrades without a purchase limit', () => {
    expect(getIngredientPurchaseLimit(['unknown', 'heat_boost'])).toBe(20)
  })
})
