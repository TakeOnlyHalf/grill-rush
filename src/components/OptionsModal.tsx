import { useEffect, useId, useState } from 'react'
import TitleMenuButton from '../ui/TitleMenuButton'
import { setBgmEnabled } from '../audio/bgm'
import { loadSettings, saveSettings, type GameSettings } from '../utils/settings'

interface OptionsModalProps {
  open: boolean
  onClose: () => void
}

/** 타이틀/공통 옵션 모달 */
export default function OptionsModal({ open, onClose }: OptionsModalProps) {
  const titleId = useId()
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings())

  useEffect(() => {
    if (open) setSettings(loadSettings())
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const update = (patch: Partial<GameSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
    if (typeof patch.bgm === 'boolean') setBgmEnabled(patch.bgm)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>옵션</h2>
        <ul className="options-list">
          <li>
            <label className="options-toggle">
              <span>BGM</span>
              <input
                type="checkbox"
                checked={settings.bgm}
                onChange={(e) => update({ bgm: e.target.checked })}
              />
            </label>
          </li>
          <li>
            <label className="options-toggle">
              <span>효과음</span>
              <input
                type="checkbox"
                checked={settings.sfx}
                onChange={(e) => update({ sfx: e.target.checked })}
              />
            </label>
          </li>
        </ul>
        <p className="options-hint">
          BGM은 화면별로 자동 전환됩니다. (첫 클릭 이후 재생)
        </p>
        <div className="modal-actions">
          <TitleMenuButton variant="chalk" onClick={onClose}>
            닫기
          </TitleMenuButton>
        </div>
      </div>
    </div>
  )
}
