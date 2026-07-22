/** 비주얼 노벨 대사 라인 */
export type CharacterSide = 'left' | 'right' | 'none'

export interface StoryLine {
  id: string
  /** 화자 이름 — 없으면 나레이션 */
  speaker?: string
  /** 표시할 대사 */
  text: string
  /** 강조할 캐릭터 슬롯 (이미지는 이후 삽입) */
  side?: CharacterSide
  /** left 슬롯에 표시할 캐릭터 키 (이미지 매핑용) */
  leftCharacter?: string | null
  /** right 슬롯에 표시할 캐릭터 키 */
  rightCharacter?: string | null
}

export interface DialogueBoxProps {
  speaker?: string
  text: string
  /** 타이핑 진행 중이면 true — 클릭 힌트 숨김 등 */
  typing?: boolean
  /** 전체 텍스트 표시 완료 */
  complete?: boolean
  onClick?: () => void
  className?: string
}

export interface CharacterSlotProps {
  side: 'left' | 'right'
  /** 캐릭터 키 — 이미지 src 매핑 전엔 placeholder */
  characterKey?: string | null
  /** 현재 화자 쪽이면 강조 */
  active?: boolean
  /** 이후 public/images/characters/{key}.png 등 */
  imageSrc?: string | null
  className?: string
}
