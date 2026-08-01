import { useGame } from '../state/GameContext'
import { getLocationById } from '../state/formulas'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather'
import {
  FOOD_TRUCK_ART,
  GAME_LOGO,
  PREP_LOBBY_BG,
  PREP_LOBBY_LOCATION,
  PREP_LOBBY_MART,
  PREP_LOBBY_MENU,
  PREP_LOBBY_UPGRADE,
} from '../utils/assets'

export type PrepLobbyDestination = 'menu' | 'location' | 'market' | 'upgrade'

interface PrepLobbyProps {
  locationConfirmed: boolean
  ingredientsReady: boolean
  canStart: boolean
  onOpen: (destination: PrepLobbyDestination) => void
  onStart: () => void
}

const DESTINATIONS: {
  id: PrepLobbyDestination
  label: string
  icon: string
}[] = [
  { id: 'menu', label: '메뉴 연구소', icon: '📕' },
  { id: 'location', label: '장소 예약소', icon: '🗺️' },
  { id: 'market', label: '재료 마트', icon: '🧺' },
  { id: 'upgrade', label: '트럭 관리실', icon: '🔧' },
]

/**
 * Day 2+ 준비 허브. 각 건물을 자유로운 순서로 방문하고 준비가 끝나면 영업한다.
 */
export default function PrepLobby({
  locationConfirmed,
  ingredientsReady,
  canStart,
  onOpen,
  onStart,
}: PrepLobbyProps) {
  const { state } = useGame()
  const loc = getLocationById(state.location)
  const menuReady = state.activeMenus.length > 0

  return (
    <section className="prep-lobby" aria-label="마을 준비 로비">
      <img className="prep-lobby__bg" src={PREP_LOBBY_BG} alt="" draggable={false} />

      <header className="prep-lobby-hud">
        <strong className="prep-lobby-hud__brand">
          <img src={GAME_LOGO} alt="Grill Rush" draggable={false} />
        </strong>
        <strong className="prep-lobby-hud__title">마을 준비</strong>
        <span>📅 Day {state.day}</span>
        <span>🪙 ₩{state.cash.toLocaleString('ko-KR')}</span>
        <span>⭐ 명성 {state.fame}</span>
        <span>
          {getWeatherEmoji(state.weather)} {getWeatherLabel(state.weather)}
        </span>
        <span>⌛ 준비 시간</span>
      </header>

      <button
        type="button"
        className="prep-lobby-building prep-lobby-building--mart"
        onClick={() => onOpen('market')}
        aria-label="재료 마트 열기"
      >
        <img src={PREP_LOBBY_MART} alt="" draggable={false} />
        <span className="prep-lobby-building__label">
          <strong>재료 마트</strong>
          <small>보유 재료 {Object.values(state.ingredients).reduce((a, b) => a + b, 0)}개</small>
        </span>
      </button>

      <button
        type="button"
        className="prep-lobby-building prep-lobby-building--upgrade"
        onClick={() => onOpen('upgrade')}
        aria-label="트럭 관리실 열기"
      >
        <img src={PREP_LOBBY_UPGRADE} alt="" draggable={false} />
        <span className="prep-lobby-building__label">
          <strong>트럭 관리실</strong>
          <small>업그레이드 {state.upgrades.length}개 보유</small>
        </span>
      </button>

      <button
        type="button"
        className="prep-lobby-building prep-lobby-building--menu"
        onClick={() => onOpen('menu')}
        aria-label="메뉴 연구소 열기"
      >
        <img src={PREP_LOBBY_MENU} alt="" draggable={false} />
        <span className="prep-lobby-building__label">
          <strong>메뉴 연구소</strong>
          <small>선택 메뉴 {state.activeMenus.length} / 4</small>
        </span>
      </button>

      <button
        type="button"
        className="prep-lobby-building prep-lobby-building--location"
        onClick={() => onOpen('location')}
        aria-label="장소 예약소 열기"
      >
        <img src={PREP_LOBBY_LOCATION} alt="" draggable={false} />
        <span className="prep-lobby-building__label">
          <strong>장소 예약소</strong>
          <small>{locationConfirmed && loc ? loc.name : '장소 미예약'}</small>
        </span>
      </button>

      <div className="prep-lobby-truck" aria-label="내 푸드트럭">
        <img src={FOOD_TRUCK_ART} alt="" draggable={false} />
        <span>내 트럭</span>
      </div>

      <aside className="prep-lobby-checklist" aria-label="오늘의 준비">
        <h2>오늘의 준비</h2>
        <ul>
          <li className={menuReady ? 'is-done' : ''}>
            <span>{menuReady ? '✓' : '!'}</span>
            <strong>메뉴 선택</strong>
            <small>{state.activeMenus.length} / 4</small>
          </li>
          <li className={ingredientsReady ? 'is-done' : ''}>
            <span>{ingredientsReady ? '✓' : '!'}</span>
            <strong>재료 구매</strong>
            <small>{ingredientsReady ? '완료' : '미완료'}</small>
          </li>
          <li className={locationConfirmed ? 'is-done' : ''}>
            <span>{locationConfirmed ? '✓' : '!'}</span>
            <strong>장소 예약</strong>
            <small>{locationConfirmed ? '완료' : '미완료'}</small>
          </li>
          <li className="is-optional">
            <span>🔧</span>
            <strong>트럭 업그레이드</strong>
            <small>선택 사항</small>
          </li>
        </ul>

        <div className="prep-lobby-checklist__cost">
          <span>예상 고정비</span>
          <strong>₩{(loc?.rentCost ?? 0).toLocaleString('ko-KR')}</strong>
        </div>
        <button type="button" disabled={!canStart} onClick={onStart}>
          영업 시작 →
        </button>
        {!canStart && <p>필수 준비를 먼저 완료하세요.</p>}
      </aside>

      <nav className="prep-lobby-nav" aria-label="준비 메뉴 바로가기">
        {DESTINATIONS.map((item) => (
          <button key={item.id} type="button" onClick={() => onOpen(item.id)}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </section>
  )
}
