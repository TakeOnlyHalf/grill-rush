import type { CharacterSlotProps } from '../../types/story'

/**
 * 좌·우 캐릭터 슬롯
 * imageSrc가 없으면 빈 플레이스홀더만 표시 (이미지 교체 예정)
 */
export default function CharacterSlot({
  side,
  characterKey = null,
  active = false,
  imageSrc = null,
  className = '',
}: CharacterSlotProps) {
  const visible = Boolean(characterKey || imageSrc)

  return (
    <div
      className={[
        'vn-slot',
        `vn-slot--${side}`,
        active ? 'vn-slot--active' : '',
        visible ? 'vn-slot--visible' : 'vn-slot--empty',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-character={characterKey ?? undefined}
      aria-hidden={!visible}
    >
      {imageSrc ? (
        <img className="vn-slot__img" src={imageSrc} alt="" draggable={false} />
      ) : (
        <div className="vn-slot__placeholder">
          <span className="vn-slot__placeholder-label">
            {characterKey ? characterKey : side === 'left' ? 'LEFT' : 'RIGHT'}
          </span>
        </div>
      )}
    </div>
  )
}
