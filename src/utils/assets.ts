/** 퍼블릭 에셋 경로 헬퍼 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${path.replace(/^\//, '')}`
}

/** 오프닝/주간 거리 배경 */
export const DAY_STREET_BG = publicUrl('images/day_street.png')
