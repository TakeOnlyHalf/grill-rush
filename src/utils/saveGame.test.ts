import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameReducer, type GameState } from '../state/gameReducer'
import { createInitialState } from '../state/initialState'
import { loadGame, saveGame } from './saveGame'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

describe('ingredient purchase save and load', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('restores cash, purchased quantity, and the same-day counter', () => {
    const initial = {
      ...createInitialState(),
      phase: 'prep' as const,
      cash: 10_000,
      activeMenus: ['egg_bacon'],
    }
    const purchased = gameReducer(initial, {
      type: 'BUY_INGREDIENT',
      payload: { ingredientId: 'egg' },
    })

    saveGame(purchased)
    const loaded = loadGame()

    expect(loaded?.cash).toBe(9_600)
    expect(loaded?.ingredients).toEqual({ egg: 1 })
    expect(loaded?.dailyIngredientPurchases).toEqual({ egg: 1 })
    expect(loaded?.dailyCosts.ingredients).toBe(400)
  })

  it('loads an existing save without purchase counters as an empty record', () => {
    const legacySave: Partial<GameState> = {
      ...createInitialState(),
      phase: 'prep',
      ingredients: { egg: 3 },
    }
    delete legacySave.dailyIngredientPurchases
    localStorage.setItem('grill-rush:save:v1', JSON.stringify(legacySave))

    const loaded = loadGame()

    expect(loaded?.ingredients).toEqual({ egg: 3 })
    expect(loaded?.dailyIngredientPurchases).toEqual({})
  })

  it('does not restore the previous day inventory after day 2 is saved', () => {
    const night = {
      ...createInitialState(),
      day: 1,
      phase: 'night' as const,
      activeMenus: ['egg_bacon'],
      ingredients: { egg: 6, bacon: 4 },
      dailyIngredientPurchases: { egg: 10, bacon: 10 },
      dailyCosts: {
        ingredients: 12_000,
        rent: 10_000,
        waste: 0,
        truck: 5_000,
      },
    }
    const nextDay = gameReducer(night, { type: 'NEXT_DAY' })

    saveGame(nextDay)
    const loaded = loadGame()

    expect(loaded?.day).toBe(2)
    expect(loaded?.phase).toBe('prep')
    expect(loaded?.ingredients).toEqual({})
    expect(loaded?.dailyIngredientPurchases).toEqual({})
    expect(loaded?.dailyCosts.ingredients).toBe(0)
  })
})
