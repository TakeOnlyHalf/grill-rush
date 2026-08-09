import { describe, expect, it } from 'vitest'
import { resolveEnding } from './formulas'

describe('resolveEnding', () => {
  it('returns bad for negative or low cash', () => {
    expect(resolveEnding({ cash: -1 })).toBe('bad')
    expect(resolveEnding({ cash: 0 })).toBe('bad')
    expect(resolveEnding({ cash: 200_000 })).toBe('bad')
  })

  it('returns normal between 200,001 and 999,999', () => {
    expect(resolveEnding({ cash: 200_001 })).toBe('normal')
    expect(resolveEnding({ cash: 500_000 })).toBe('normal')
    expect(resolveEnding({ cash: 999_999 })).toBe('normal')
  })

  it('returns great at 1,000,000 or more', () => {
    expect(resolveEnding({ cash: 1_000_000 })).toBe('great')
    expect(resolveEnding({ cash: 2_500_000 })).toBe('great')
  })
})
