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

function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.min(1, Math.max(0, v))
}

/** BGM과 동일한 마스터 볼륨(0~1). 개별 SFX 기본 볼륨에 곱한다. */
let masterVolume = clampVolume(loadSettings().bgmVolume)

function baseVolume(id: SfxId): number {
  return VOLUME[id] ?? VOLUME.default
}

function effectiveVolume(id: SfxId): number {
  return baseVolume(id) * masterVolume
}

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
    volume: effectiveVolume(id),
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

/** 마스터 볼륨(BGM 슬라이더와 공유)을 효과음에 반영한다. */
export function setSfxMasterVolume(v: number): void {
  masterVolume = clampVolume(v)
  for (const [id, howl] of howls) {
    howl.volume(effectiveVolume(id))
  }
}

export function getSfxMasterVolume(): number {
  return masterVolume
}

/** 짧은 효과음 재생 (겹침 허용). 실패해도 게임 진행을 막지 않는다. */
export function playSfx(id: SfxId): boolean {
  if (!canPlayNow()) return false
  if (masterVolume <= 0.001) return false
  resumeContext()
  try {
    const howl = getHowl(id)
    howl.volume(effectiveVolume(id))
    howl.play()
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
