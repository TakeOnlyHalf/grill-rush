import { Howl, Howler } from 'howler'
import { publicUrl } from '../utils/assets'
import { loadSettings } from '../utils/settings'

export type SfxId =
  | 'business_open'
  | 'button_primary'
  | 'button_secondary'
  | 'cash_register'
  | 'cooking_done'
  | 'grill_sound'
  | 'menu_select'
  | 'serve_dish'
  | 'perfect_timing'

const VOLUME: Partial<Record<SfxId, number>> & { default: number } = {
  default: 0.72,
  perfect_timing: 0.65,
}

const FILE: Record<SfxId, string> = {
  business_open: 'business_open.webm',
  button_primary: 'button_primary.webm',
  button_secondary: 'button_secondary.webm',
  cash_register: 'cash_register.webm',
  cooking_done: 'cooking_done.webm',
  grill_sound: 'grill_sound.webm',
  menu_select: 'menu_select.webm',
  serve_dish: 'serve_dish.webm',
  perfect_timing: 'perfect-timing.wav',
}

const howls = new Map<SfxId, Howl>()

export function shouldPlaySfx(
  enabled: boolean,
  visibilityState: DocumentVisibilityState | undefined,
): boolean {
  return enabled && (visibilityState === undefined || visibilityState === 'visible')
}

function resumeContext() {
  const ctx = Howler.ctx
  if (ctx && ctx.state !== 'running') {
    void ctx.resume().catch(() => {})
  }
}

function getHowl(id: SfxId): Howl {
  let howl = howls.get(id)
  if (howl) return howl
  howl = new Howl({
    src: [publicUrl(`audio/sfx/${FILE[id]}`)],
    preload: true,
    volume: VOLUME[id] ?? VOLUME.default,
    html5: false,
  })
  howls.set(id, howl)
  return howl
}

function canPlayNow(): boolean {
  const visibilityState =
    typeof document === 'undefined' ? undefined : document.visibilityState
  return shouldPlaySfx(loadSettings().sfx, visibilityState)
}

/** 짧은 효과음 재생 (겹침 허용). 실패해도 게임 진행을 막지 않는다. */
export function playSfx(id: SfxId): boolean {
  if (!canPlayNow()) return false
  resumeContext()
  try {
    getHowl(id).play()
    return true
  } catch {
    return false
  }
}

/** 공통 버튼용 primary / secondary 클릭음 */
export function playButtonSfx(
  variant: 'primary' | 'secondary' | 'default' = 'primary',
): boolean {
  return playSfx(variant === 'secondary' ? 'button_secondary' : 'button_primary')
}

/** 그릴 완벽 타이밍 알람 */
export function playPerfectTimingAlarm(): boolean {
  return playSfx('perfect_timing')
}
