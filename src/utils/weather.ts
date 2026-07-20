import type { WeatherId } from '../types/game'

/** 날씨 생성 — 기획서 확률 테이블 */

const WEATHER_TABLE: { id: WeatherId; label: string; weight: number }[] = [
  { id: 'sunny', label: '맑음', weight: 40 },
  { id: 'cloudy', label: '흐림', weight: 25 },
  { id: 'rain', label: '비', weight: 20 },
  { id: 'snow', label: '눈', weight: 10 },
  { id: 'clear', label: '쾌청', weight: 5 },
]

export function rollWeather(rng: () => number = Math.random): WeatherId {
  const total = WEATHER_TABLE.reduce((s, w) => s + w.weight, 0)
  let roll = rng() * total
  for (const w of WEATHER_TABLE) {
    roll -= w.weight
    if (roll <= 0) return w.id
  }
  return 'sunny'
}

export function getWeatherLabel(id: string): string {
  return WEATHER_TABLE.find((w) => w.id === id)?.label ?? id
}

export function getWeatherEmoji(id: string): string {
  const map: Record<string, string> = {
    sunny: '☀️',
    cloudy: '⛅',
    rain: '🌧️',
    snow: '❄️',
    clear: '🌤️',
  }
  return map[id] ?? '☀️'
}
