import type { CharacterKey } from './characterPortraits'

/** 손님 타입(data/customers.json의 id) → 표시 가능한 캐릭터 배리에이션 목록 */
export const CUSTOMER_CHARACTERS: Record<string, CharacterKey[]> = {
  office: ['rabbitSuit', 'deerPolice'],
  student: ['catHoodie', 'otterJogger'],
  family: ['retrieverDress', 'foxCardigan'],
  tourist: ['bearHiker', 'raccoonCoat'],
  foodie: ['wolfChef'],
}

/**
 * 손님 타입에서 캐릭터를 랜덤으로 고른다.
 * excludePriority는 우선순위 순으로 적용된다 — 앞쪽 항목(예: 바로 옆 슬롯의 캐릭터)은
 * 배리에이션이 남아있는 한 반드시 제외하고, 뒤쪽 항목(예: 이 슬롯의 직전 캐릭터)은
 * 여유가 있을 때만 추가로 제외한다. 배리에이션이 1개뿐인 타입은 그대로 반환된다.
 * 등록되지 않은 타입은 undefined를 반환하며, 씬에서 플레이스홀더로 대체된다.
 */
export function pickRandomGuestCharacter(
  type: string,
  ...excludePriority: Array<CharacterKey | undefined>
): CharacterKey | undefined {
  const options = CUSTOMER_CHARACTERS[type]
  if (!options?.length) return undefined

  let candidates: CharacterKey[] = options
  for (const exclude of excludePriority) {
    if (exclude === undefined) continue
    const filtered = candidates.filter((key) => key !== exclude)
    if (filtered.length === 0) break
    candidates = filtered
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}
