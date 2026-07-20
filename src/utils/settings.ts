export interface GameSettings {
  bgm: boolean
  sfx: boolean
}

const SETTINGS_KEY = 'grill-rush:settings:v1'

const DEFAULT_SETTINGS: GameSettings = {
  bgm: true,
  sfx: true,
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    return {
      bgm: typeof parsed.bgm === 'boolean' ? parsed.bgm : DEFAULT_SETTINGS.bgm,
      sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : DEFAULT_SETTINGS.sfx,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}
