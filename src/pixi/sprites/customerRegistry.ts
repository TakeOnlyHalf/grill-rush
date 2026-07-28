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
 * 배리에이션이 2개 이상이면 직전 손님(previousGuest)과 같은 캐릭터는 제외해
 * 같은 얼굴이 연달아 나오는 걸 막는다.
 * 등록되지 않은 타입은 undefined를 반환하며, 씬에서 플레이스홀더로 대체된다.
 */
export function pickRandomGuestCharacter(
  type: string,
  previousGuest?: CharacterKey,
): CharacterKey | undefined {
  const options = CUSTOMER_CHARACTERS[type]
  if (!options?.length) return undefined

  const candidates =
    options.length > 1 && previousGuest ? options.filter((key) => key !== previousGuest) : options

  return candidates[Math.floor(Math.random() * candidates.length)]
}
