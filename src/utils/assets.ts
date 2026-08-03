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

/** 메뉴 선택 배경 */
export const MENU_BACKGROUND_ART = publicUrl('images/ready_phase/menu_background.webp')

/** 재료 마트 배경 */
export const MART_BACKGROUND_ART = publicUrl('images/ready_phase/mart_background.webp')

/** 정산(오늘의 결산) 보드 배경 */
export const TODAY_CALC_BG = publicUrl('images/ready_phase/today_calc.webp')

/** 정산 — 순손익 아이콘 */
export const NET_LOSS_ICON = publicUrl('images/ready_phase/net-loss.webp')
export const NET_NEUTRAL_ICON = publicUrl('images/ready_phase/net-neutral.webp')
export const NET_PROFIT_ICON = publicUrl('images/ready_phase/net-profit.webp')

/** 야간 성장 — 트럭 관리실 보드 */
export const TRUCK_UPGRADE_NIGHT_BG = publicUrl(
  'images/ready_phase/truck_upgrade_night.webp',
)
/** 준비(주간) — 트럭 관리실 보드 */
export const TRUCK_UPGRADE_DAY_BG = publicUrl(
  'images/ready_phase/truck_upgrade_day.webp',
)

/** 게임 로고 (로비 HUD 등) */
export const GAME_LOGO = publicUrl('images/logo.webp')

/** Day 2+ 자유 준비 로비 */
export const PREP_LOBBY_BG = publicUrl('images/ready_phase/loby_background.webp')
export const PREP_LOBBY_MENU = publicUrl(
  'images/ready_phase/select_learnmenu.webp',
)
export const PREP_LOBBY_LOCATION = publicUrl(
  'images/ready_phase/select_location.webp',
)
export const PREP_LOBBY_MART = publicUrl('images/ready_phase/select_mart.webp')
export const PREP_LOBBY_UPGRADE = publicUrl(
  'images/ready_phase/select_truckupgrade.webp',
)
/** 영업 페이즈 — 트럭 창문 안쪽에서 바라본 인테리어 프레임 (창문 부분은 알파 투명) */
export const OPEN_TRUCK_INTERIOR_ART = publicUrl('images/open_phase/foodtruck_interior_transparent.webp')

/** 앱 부트 시 미리 받아둘 핵심 이미지 (탭 전환 시 깜빡임 방지) */
export const CRITICAL_IMAGE_URLS = [
  TITLE_DAY_ART,
  READY_PHASE_BG,
  FOOD_TRUCK_ART,
  MENU_BACKGROUND_ART,
  MART_BACKGROUND_ART,
  TODAY_CALC_BG,
  NET_LOSS_ICON,
  NET_NEUTRAL_ICON,
  NET_PROFIT_ICON,
  TRUCK_UPGRADE_NIGHT_BG,
  TRUCK_UPGRADE_DAY_BG,
  GAME_LOGO,
  PREP_LOBBY_BG,
  PREP_LOBBY_MENU,
  PREP_LOBBY_LOCATION,
  PREP_LOBBY_MART,
  PREP_LOBBY_UPGRADE,
  DAY_STREET_BG,
  OPEN_TRUCK_INTERIOR_ART,
] as const

/**
 * HTTP 캐시에만 이미지를 미리 받아 둔다.
 * Pixi Assets.load 는 Application.init 이후에 씬에서 호출해야 GPU 텍스처가 정상이다.
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
