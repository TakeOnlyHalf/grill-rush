/** 퍼블릭 에셋 경로 헬퍼 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${path.replace(/^\//, '')}`
}

/** 오프닝/주간 거리 배경 */
export const DAY_STREET_BG = publicUrl('images/day_street.webp')

/** 타이틀 화면 아트 (주간) */
export const TITLE_DAY_ART = publicUrl('images/title_day.webp')

/** 준비 맵·거리용 푸드트럭 스프라이트 */
export const FOOD_TRUCK_ART = publicUrl('images/ready_phase/foodtruck.webp')

/** 준비 페이즈 장소 선택 배경 */
export const READY_PHASE_BG = publicUrl('images/ready_phase/ready_background.webp')

/** 메뉴 선택 — 나무 메뉴판 */
export const MENU_BOARD_ART = publicUrl('images/ready_phase/menu_board.webp')

/** 앱 부트 시 미리 받아둘 핵심 이미지 (탭 전환 시 깜빡임 방지) */
export const CRITICAL_IMAGE_URLS = [
  TITLE_DAY_ART,
  READY_PHASE_BG,
  FOOD_TRUCK_ART,
  MENU_BOARD_ART,
  DAY_STREET_BG,
] as const

/**
 * 브라우저 캐시에 이미지를 미리 적재한다.
 * Pixi Assets.load 전에 호출해도 이후 동일 URL은 네트워크를 다시 타지 않는다.
 */
export function preloadImages(urls: readonly string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = url
        }),
    ),
  )
}

/** 타이틀·준비 페이즈에서 쓰는 이미지를 앱 시작과 동시에 프리로드 */
export function preloadCriticalAssets(): Promise<void[]> {
  return preloadImages(CRITICAL_IMAGE_URLS)
}
