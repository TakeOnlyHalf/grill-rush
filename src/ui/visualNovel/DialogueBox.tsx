import type { DialogueBoxProps } from '../../types/story'

/**
 * 비주얼 노벨 하단 대사창
 */
export default function DialogueBox({
  speaker,
  text,
  typing = false,
  complete = true,
  onClick,
  className = '',
}: DialogueBoxProps) {
  return (
    <button
      type="button"
      className={['vn-dialogue', className].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-live="polite"
    >
      {speaker ? <div className="vn-dialogue__name">{speaker}</div> : null}
      <p className="vn-dialogue__text">{text || '\u00a0'}</p>
      <span className="vn-dialogue__hint" aria-hidden>
        {typing ? '…' : complete ? '▼' : ''}
      </span>
    </button>
  )
}
