export interface GameSettings {
  bgm: boolean
  sfx: boolean
  /** BGM 볼륨 0~1 */
  bgmVolume: number
}

const SETTINGS_KEY = 'grill-rush:settings:v1'

const DEFAULT_SETTINGS: GameSettings = {
  bgm: true,
  sfx: true,
  bgmVolume: 0.42,
}

function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return DEFAULT_SETTINGS.bgmVolume
  return Math.min(1, Math.max(0, v))
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    return {
      bgm: typeof parsed.bgm === 'boolean' ? parsed.bgm : DEFAULT_SETTINGS.bgm,
      sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : DEFAULT_SETTINGS.sfx,
      bgmVolume:
        typeof parsed.bgmVolume === 'number'
          ? clampVolume(parsed.bgmVolume)
          : DEFAULT_SETTINGS.bgmVolume,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        ...settings,
        bgmVolume: clampVolume(settings.bgmVolume),
      }),
    )
  } catch {
    // ignore
  }
}
