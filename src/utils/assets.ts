/** 퍼블릭 에셋 경로 헬퍼 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${path.replace(/^\//, '')}`
}

/** 오프닝/주간 거리 배경 */
export const DAY_STREET_BG = publicUrl('images/day_street.png')

/** 타이틀 화면 아트 (주간) */
export const TITLE_DAY_ART = publicUrl('images/title_day.png')

/** 준비 맵·거리용 푸드트럭 스프라이트 */
export const FOOD_TRUCK_ART = publicUrl('images/ready_phase/foodtruck.png')
