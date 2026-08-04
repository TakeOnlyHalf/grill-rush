import { Howl } from 'howler'
import { publicUrl } from '../utils/assets'
import { loadSettings } from '../utils/settings'

let perfectTimingHowl: Howl | null = null

export function shouldPlaySfx(
  enabled: boolean,
  visibilityState: DocumentVisibilityState | undefined,
): boolean {
  return enabled && (visibilityState === undefined || visibilityState === 'visible')
}

function getPerfectTimingHowl(): Howl {
  if (!perfectTimingHowl) {
    perfectTimingHowl = new Howl({
      src: [publicUrl('audio/sfx/perfect-timing.wav')],
      preload: true,
      volume: 0.65,
    })
  }
  return perfectTimingHowl
}

/** 자동 재생 정책이나 디코딩 실패가 게임 진행을 막지 않도록 재생 실패를 삼킨다. */
export function playPerfectTimingAlarm(): boolean {
  const visibilityState = typeof document === 'undefined' ? undefined : document.visibilityState
  if (!shouldPlaySfx(loadSettings().sfx, visibilityState)) return false

  try {
    getPerfectTimingHowl().play()
    return true
  } catch {
    return false
  }
}
