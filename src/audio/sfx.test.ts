import { describe, expect, it } from 'vitest'
import { shouldPlaySfx } from './sfx'

describe('shouldPlaySfx', () => {
  it('follows the SFX setting without affecting visual alarm state', () => {
    expect(shouldPlaySfx(true, 'visible')).toBe(true)
    expect(shouldPlaySfx(false, 'visible')).toBe(false)
  })

  it('does not play while the document is hidden', () => {
    expect(shouldPlaySfx(true, 'hidden')).toBe(false)
  })
})
