import { useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  forceUnlockBgm,
  getBgmVolume,
  isBgmEnabled,
  setBgmEnabled,
  setBgmVolume,
  subscribeBgmEnabled,
  subscribeBgmVolume,
} from '../audio/bgm'
import { loadSettings, saveSettings } from '../utils/settings'

interface BgmMuteToggleProps {
  /** floating: 좌하단 / hud: 로비 HUD 슬롯용 (볼륨 UI·로직은 동일) */
  variant?: 'floating' | 'hud'
}

export default function BgmMuteToggle({ variant = 'floating' }: BgmMuteToggleProps) {
  const [on, setOn] = useState(() => isBgmEnabled())
  const [vol, setVol] = useState(() => getBgmVolume())
  const [open, setOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragging = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => subscribeBgmEnabled(setOn), [])
  useEffect(() => subscribeBgmVolume(setVol), [])

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
    },
    [],
  )

  const clearLeave = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
  }

  const showPanel = () => {
    clearLeave()
    setOpen(true)
  }

  const hidePanelSoon = () => {
    if (dragging.current) return
    clearLeave()
    leaveTimer.current = setTimeout(() => {
      if (dragging.current) return
      setOpen(false)
    }, 80)
  }

  const persistVolume = (nextVol: number, bgmOn: boolean) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveSettings({ ...loadSettings(), bgm: bgmOn, bgmVolume: nextVol })
    }, 120)
  }

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    // 클릭 포커스가 남아 패널이 고착되지 않게
    e.currentTarget.blur()
    const next = !on
    setOn(next)
    setBgmEnabled(next)
    saveSettings({ ...loadSettings(), bgm: next })
    if (next) forceUnlockBgm()
  }

  const onVolumeInput = (raw: number) => {
    const next = Math.min(1, Math.max(0, raw))
    setVol(next)
    setBgmVolume(next)

    if (!on && next > 0) {
      setOn(true)
      setBgmEnabled(true)
      persistVolume(next, true)
      forceUnlockBgm()
      return
    }
    persistVolume(next, on)
  }

  const endDrag = () => {
    if (!dragging.current) return
    dragging.current = false
    const root = rootRef.current
    if (root && !root.matches(':hover')) hidePanelSoon()
  }

  const showMuted = !on || vol <= 0.001

  return (
    <div
      ref={rootRef}
      className={`bgm-mute-control bgm-mute-control--${variant}${
        showMuted ? ' bgm-mute-control--muted' : ''
      }${open ? ' is-open' : ''}`}
      onPointerEnter={showPanel}
      onPointerLeave={hidePanelSoon}
    >
      <div className="bgm-mute-control__popover" onPointerEnter={showPanel}>
        <input
          type="range"
          className="bgm-mute-control__slider"
          min={0}
          max={100}
          step={1}
          value={Math.round(vol * 100)}
          aria-label="BGM·효과음 볼륨"
          tabIndex={open ? 0 : -1}
          onChange={(e) => onVolumeInput(Number(e.target.value) / 100)}
          onPointerDown={(e) => {
            e.stopPropagation()
            dragging.current = true
            showPanel()
            const onUp = () => {
              window.removeEventListener('pointerup', onUp)
              window.removeEventListener('pointercancel', onUp)
              endDrag()
            }
            window.addEventListener('pointerup', onUp)
            window.addEventListener('pointercancel', onUp)
          }}
        />
      </div>
      <button
        type="button"
        className={`bgm-mute-toggle${showMuted ? ' bgm-mute-toggle--muted' : ''}`}
        onClick={toggle}
        onMouseDown={(e) => {
          // 마우스 클릭으로 포커스 잡히지 않게 (키보드 Tab은 유지)
          e.preventDefault()
        }}
        aria-label={showMuted ? 'BGM 켜기' : 'BGM 음소거'}
        aria-pressed={showMuted}
        title={showMuted ? 'BGM 켜기' : 'BGM 끄기'}
      >
        {showMuted ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="bgm-mute-toggle__icon">
            <path
              fill="currentColor"
              d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v4h3l4 4v-5.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"
            />
          </svg>
        ) : vol < 0.35 ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="bgm-mute-toggle__icon">
            <path
              fill="currentColor"
              d="M3 10v4h3l4 4V6L6 10H3zm10 2c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.74 2.5-2.26 2.5-4.02z"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="bgm-mute-toggle__icon">
            <path
              fill="currentColor"
              d="M3 10v4h3l4 4V6L6 10H3zm13.5 2c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.74 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
