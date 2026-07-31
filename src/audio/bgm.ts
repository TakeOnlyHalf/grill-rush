import { Howl, Howler } from 'howler'
import { publicUrl } from '../utils/assets'
import { loadSettings } from '../utils/settings'

export type BgmId = 'title' | 'lobby' | 'store' | 'cooking' | 'none'

const VOLUME = 0.42
const FADE_MS = 350

function sources(baseName: string): string[] {
  return [
    publicUrl(`audio/bgm/${baseName}.webm`),
    publicUrl(`audio/bgm/${baseName}.mp3`),
  ]
}

const FILE: Record<
  Exclude<BgmId, 'none' | 'cooking'> | 'cooking1' | 'cooking2',
  string
> = {
  title: 'title_music',
  lobby: 'loby_music',
  store: 'store_music',
  cooking1: 'cooking_music1',
  cooking2: 'cooking_music2',
}

type TrackKey = keyof typeof FILE

const howls = new Map<TrackKey, Howl>()
/** 트랙별 재생 위치(초) — 같은 Day 안에서는 전환 시 이어서 재생 */
const seekPos = new Map<TrackKey, number>()

/**
 * Web Audio(html5:false) 사용.
 * 한 번 AudioContext가 running이면 화면 전환 시 클릭 없이 재생 가능.
 */
function getHowl(key: TrackKey): Howl {
  let howl = howls.get(key)
  if (howl) return howl
  howl = new Howl({
    src: sources(FILE[key]),
    loop: true,
    volume: VOLUME,
    html5: false,
    preload: true,
  })
  howls.set(key, howl)
  return howl
}

let enabled = loadSettings().bgm
let desired: BgmId = 'none'
let activeKey: TrackKey | null = null
let cookingPick: 'cooking1' | 'cooking2' | null = null
let applyToken = 0
const stopTimers = new Map<TrackKey, ReturnType<typeof setTimeout>>()

function clearStopTimer(key: TrackKey) {
  const t = stopTimers.get(key)
  if (t != null) {
    clearTimeout(t)
    stopTimers.delete(key)
  }
}

function resolveKey(id: BgmId): TrackKey | null {
  if (id === 'none') return null
  if (id === 'cooking') {
    if (!cookingPick) {
      cookingPick = Math.random() < 0.5 ? 'cooking1' : 'cooking2'
    }
    return cookingPick
  }
  return id
}

function readSeek(howl: Howl): number {
  try {
    const s = howl.seek()
    return typeof s === 'number' && Number.isFinite(s) ? Math.max(0, s) : 0
  } catch {
    return 0
  }
}

function captureSeek(key: TrackKey) {
  const howl = howls.get(key)
  if (!howl) return
  seekPos.set(key, readSeek(howl))
}

function applySavedSeek(howl: Howl, key: TrackKey) {
  const saved = seekPos.get(key) ?? 0
  if (saved <= 0) return
  const dur = howl.duration()
  const t = dur > 0 ? Math.min(saved, Math.max(0, dur - 0.05)) : saved
  try {
    howl.seek(t)
  } catch {
    // ignore
  }
}

async function resumeContext(): Promise<boolean> {
  const ctx = Howler.ctx
  if (!ctx) return true
  if (ctx.state === 'running') return true
  try {
    await ctx.resume()
  } catch {
    // ignore
  }
  return Howler.ctx?.state === 'running'
}

/** 위치 저장 후 pause (stop 하면 seek가 초기화되므로 pause 사용) */
function pauseHowl(key: TrackKey, fade: boolean) {
  clearStopTimer(key)
  const howl = howls.get(key)
  if (!howl) return

  captureSeek(key)

  if (!howl.playing()) {
    howl.pause()
    howl.volume(VOLUME)
    return
  }

  if (!fade) {
    howl.pause()
    howl.volume(VOLUME)
    return
  }

  howl.fade(howl.volume(), 0, FADE_MS)
  stopTimers.set(
    key,
    setTimeout(() => {
      stopTimers.delete(key)
      captureSeek(key)
      howl.pause()
      howl.volume(VOLUME)
    }, FADE_MS),
  )
}

/** 저장된 시점부터 이어서 재생 */
function playHowlResume(key: TrackKey): boolean {
  clearStopTimer(key)
  const howl = getHowl(key)
  howl.mute(false)

  if (howl.playing()) {
    if (howl.volume() < VOLUME * 0.8) howl.volume(VOLUME)
    return true
  }

  howl.volume(0)
  const id = howl.play()
  if (id == null) return false

  const seekNow = () => applySavedSeek(howl, key)
  if (howl.state() === 'loaded' && howl.duration() > 0) {
    seekNow()
  } else {
    howl.once('load', seekNow)
  }
  // play 직후에도 한 번 더 보정
  howl.once('play', seekNow)

  howl.fade(0, VOLUME, FADE_MS)
  return true
}

function ensurePlaying(key: TrackKey): boolean {
  clearStopTimer(key)
  const howl = getHowl(key)
  howl.mute(false)
  if (howl.playing()) {
    if (howl.volume() < VOLUME * 0.8) howl.volume(VOLUME)
    return true
  }
  return playHowlResume(key)
}

async function applyDesired(): Promise<void> {
  const token = ++applyToken
  if (desired === 'none') cookingPick = null
  const nextKey = resolveKey(desired)

  if (!enabled) {
    if (activeKey) pauseHowl(activeKey, true)
    return
  }

  await resumeContext()
  if (token !== applyToken) return

  if (!nextKey) {
    if (activeKey) pauseHowl(activeKey, true)
    activeKey = null
    return
  }

  // 같은 곡이면 이어서 (재시작 금지)
  if (activeKey === nextKey) {
    ensurePlaying(nextKey)
    return
  }

  if (activeKey) pauseHowl(activeKey, true)
  activeKey = nextKey
  playHowlResume(nextKey)
}

function scheduleApply() {
  void applyDesired()
}

function onUserGesture() {
  void resumeContext().then(() => {
    scheduleApply()
  })
}

function ensureHooks() {
  if (typeof window === 'undefined') return
  window.addEventListener('pointerdown', onUserGesture, { passive: true })
  window.addEventListener('keydown', onUserGesture)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleApply()
  })
}

ensureHooks()

/** 페이즈/화면 진입 시 호출 — 클릭 없이 재생 시도 */
export function requestBgm(id: BgmId): void {
  if (desired === 'cooking' && id !== 'cooking') cookingPick = null

  if (desired === id) {
    const key = resolveKey(id)
    if (key && activeKey === key) {
      const howl = howls.get(key)
      if (howl?.playing()) return
    }
  }

  desired = id
  scheduleApply()
}

export function setBgmEnabled(on: boolean): void {
  enabled = on
  if (!on) {
    if (activeKey) pauseHowl(activeKey, true)
    return
  }
  scheduleApply()
}

export function isBgmEnabled(): boolean {
  return enabled
}

/**
 * 버튼 클릭 핸들러용.
 * AudioContext resume + 트랙 전환. 같은 곡이면 재시작하지 않음.
 */
export function forceUnlockBgm(next?: BgmId): void {
  if (next) {
    if (desired === 'cooking' && next !== 'cooking') cookingPick = null
    desired = next
  }
  void resumeContext().then(() => {
    scheduleApply()
  })
}

/** 현재 원하는 BGM을 즉시 다시 맞춤 (화면 마운트 시) */
export function syncBgm(): void {
  scheduleApply()
}

/**
 * Day가 바뀔 때 호출 — 트랙 진행 위치·요리 랜덤 픽을 초기화.
 */
export function resetBgmDayProgress(): void {
  if (activeKey) {
    captureSeek(activeKey)
    const howl = howls.get(activeKey)
    howl?.pause()
  }
  seekPos.clear()
  cookingPick = null
  activeKey = null
}
