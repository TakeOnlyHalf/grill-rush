const GOOD = [
  '완전 맛있어요!',
  '또 오고 싶어요.',
  '버거가 완벽!',
  '가성비 최고!',
]

const OK = [
  '괜찮았어요.',
  '좀 기다렸지만 맛있어요.',
  '무난한 한 끼.',
]

const BAD = [
  '너무 오래 기다렸어요.',
  '가격 대비 아쉽네요.',
  '다음엔 패스할 듯…',
]

/** 리뷰 텍스트 생성 (스텁) */
export function generateReviewText({
  stars,
  menuName,
}: {
  stars: number
  menuName?: string
}): string {
  const pool = stars >= 4 ? GOOD : stars <= 2 ? BAD : OK
  const text = pool[Math.floor(Math.random() * pool.length)]
  if (menuName && stars >= 4) {
    return `${menuName} — ${text}`
  }
  return text
}

/** 만족도(0~1) → 별점 1~5 */
export function satisfactionToStars(satisfaction: number): number {
  if (satisfaction >= 0.9) return 5
  if (satisfaction >= 0.75) return 4
  if (satisfaction >= 0.55) return 3
  if (satisfaction >= 0.35) return 2
  return 1
}
