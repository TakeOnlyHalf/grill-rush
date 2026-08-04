import { describe, expect, it } from 'vitest'
import {
  collectGrillSlot,
  createIdleGrillSlots,
  getAutoCollectCandidate,
  type GrillSlot,
} from './grillSlots'

function cookingSlot(
  id: string,
  startedAt: number,
  cookDurationMs: number,
  ingredientId = `ingredient-${id}`,
): GrillSlot {
  return { id, status: 'cooking', ingredientId, startedAt, cookDurationMs }
}

describe('auto collect candidate selection', () => {
  it('returns null without an eligible perfect slot', () => {
    const idle = createIdleGrillSlots(1)[0]
    const good = cookingSlot('good', 5_000, 10_000)
    const danger = cookingSlot('danger', 900, 10_000)
    const burnt = { ...cookingSlot('burnt', -100, 10_000), status: 'burnt' as const }
    expect(getAutoCollectCandidate([idle, good, danger, burnt], 10_000)).toBeNull()
  })

  it('selects the perfect slot with the least real time before danger', () => {
    const slower = cookingSlot('slower', -5_000, 20_000)
    const urgent = cookingSlot('urgent', 2_900, 10_000)
    expect(getAutoCollectCandidate([slower, urgent], 10_000)?.id).toBe('urgent')
  })

  it('uses startedAt and then slot ID as deterministic tie breakers', () => {
    const earlier = cookingSlot('z-slot', -6_000, 20_000)
    const later = cookingSlot('a-slot', 3_000, 10_000)
    expect(getAutoCollectCandidate([later, earlier], 10_000)?.id).toBe('z-slot')

    const b = cookingSlot('b-slot', 3_000, 10_000)
    const a = cookingSlot('a-slot', 3_000, 10_000)
    expect(getAutoCollectCandidate([b, a], 10_000)?.id).toBe('a-slot')
  })
})

describe('shared grill collection', () => {
  it('collects exactly one slot and does not mutate the source array', () => {
    const source = [cookingSlot('first', 2_000, 10_000), cookingSlot('second', 2_000, 10_000)]
    const snapshot = structuredClone(source)
    const result = collectGrillSlot(source, 'first', 10_000)

    expect(result.collected).toMatchObject({
      slotId: 'first',
      ingredientId: 'ingredient-first',
      result: 'perfect',
    })
    expect(result.slots[0].status).toBe('idle')
    expect(result.slots[1]).toEqual(source[1])
    expect(source).toEqual(snapshot)
  })

  it('cannot collect the same cooking instance twice', () => {
    const first = collectGrillSlot([cookingSlot('only', 2_000, 10_000)], 'only', 10_000)
    const second = collectGrillSlot(first.slots, 'only', 10_000)

    expect(first.collected?.result).toBe('perfect')
    expect(second.collected).toBeNull()
  })
})
