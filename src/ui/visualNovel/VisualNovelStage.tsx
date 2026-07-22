import { useCallback, useEffect, useState } from 'react'
import type { StoryLine } from '../../types/story'
import CharacterSlot from './CharacterSlot'
import DialogueBox from './DialogueBox'

const CHAR_MS = 28

export interface VisualNovelStageProps {
  lines: StoryLine[]
  /** 캐릭터 키 → 이미지 URL (없으면 플레이스홀더) */
  characterImages?: Record<string, string>
  /** 모든 라인 종료 시 */
  onComplete?: () => void
  /** 배경 이미지 (선택) */
  backgroundSrc?: string | null
  className?: string
  /** 스토리북 등에서 외부 제어용 시작 인덱스 */
  initialIndex?: number
}

/**
 * 비주얼 노벨 스테이지 — 좌우 캐릭터 + 하단 자막
 * 클릭: 타이핑 중이면 즉시 완성, 완성 후면 다음 대사
 */
export default function VisualNovelStage({
  lines,
  characterImages = {},
  onComplete,
  backgroundSrc = null,
  className = '',
  initialIndex = 0,
}: VisualNovelStageProps) {
  const [index, setIndex] = useState(initialIndex)
  const [shown, setShown] = useState('')
  const [typing, setTyping] = useState(false)

  const line = lines[index] ?? null
  const done = index >= lines.length

  useEffect(() => {
    if (!line) return undefined
    setShown('')
    setTyping(true)
    let i = 0
    const full = line.text
    const id = window.setInterval(() => {
      i += 1
      setShown(full.slice(0, i))
      if (i >= full.length) {
        window.clearInterval(id)
        setTyping(false)
      }
    }, CHAR_MS)
    return () => window.clearInterval(id)
  }, [line])

  const advance = useCallback(() => {
    if (!line) return
    if (typing) {
      setShown(line.text)
      setTyping(false)
      return
    }
    const next = index + 1
    if (next >= lines.length) {
      onComplete?.()
      return
    }
    setIndex(next)
  }, [line, typing, index, lines.length, onComplete])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  if (done || !line) {
    return null
  }

  const leftKey = line.leftCharacter ?? null
  const rightKey = line.rightCharacter ?? null
  const leftSrc = leftKey ? characterImages[leftKey] ?? null : null
  const rightSrc = rightKey ? characterImages[rightKey] ?? null : null

  return (
    <div
      className={['vn-stage', className].filter(Boolean).join(' ')}
      role="presentation"
      onClick={advance}
    >
      {backgroundSrc ? (
        <img className="vn-stage__bg" src={backgroundSrc} alt="" />
      ) : (
        <div className="vn-stage__bg vn-stage__bg--empty" />
      )}

      <div className="vn-stage__characters" aria-hidden>
        <CharacterSlot
          side="left"
          characterKey={leftKey}
          imageSrc={leftSrc}
          active={line.side === 'left'}
        />
        <CharacterSlot
          side="right"
          characterKey={rightKey}
          imageSrc={rightSrc}
          active={line.side === 'right'}
        />
      </div>

      <div className="vn-stage__footer" onClick={(e) => e.stopPropagation()}>
        <DialogueBox
          speaker={line.speaker}
          text={shown}
          typing={typing}
          complete={!typing}
          onClick={advance}
        />
        <p className="vn-stage__skip-hint">클릭 / Space · Enter</p>
      </div>
    </div>
  )
}
