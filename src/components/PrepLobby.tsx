import { useState } from 'react'
import { useGame } from '../state/GameContext'
import { getLocationById } from '../state/formulas'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather'
import {
  FOOD_TRUCK_ART,
  GAME_LOGO,
  PREP_LOBBY_BG,
  PREP_LOBBY_HUD,
  PREP_LOBBY_LOCATION,
  PREP_LOBBY_MART,
  PREP_LOBBY_MENU,
  PREP_LOBBY_NAV,
  PREP_LOBBY_PANEL,
  PREP_LOBBY_UPGRADE,
} from '../utils/assets'
import BgmMuteToggle from './BgmMuteToggle'
import OptionsModal from './OptionsModal'

export type PrepLobbyDestination = 'menu' | 'location' | 'market' | 'upgrade'

interface PrepLobbyProps {
  locationConfirmed: boolean
  ingredientsReady: boolean
  canStart: boolean
  onOpen: (destination: PrepLobbyDestination) => void
  onStart: () => void
}

const NAV_BUTTONS: {
  id: 'weather' | 'wholesale' | 'branch2'
  label: string
}[] = [
  { id: 'weather', label: '날씨 예보' },
  { id: 'wholesale', label: '도매시장' },
  { id: 'branch2', label: '2호점 관리' },
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
  const [optionsOpen, setOptionsOpen] = useState(false)
  const loc = getLocationById(state.location)
  const menuReady = state.activeMenus.length > 0
  const ingredientCount = Object.values(state.ingredients).reduce(
    (a, b) => a + b,
    0,
  )

  return (
    <section className="prep-lobby" aria-label="마을 준비 로비">
      <img className="prep-lobby__bg" src={PREP_LOBBY_BG} alt="" draggable={false} />

      <header className="prep-lobby-hud">
        <img
          className="prep-lobby-hud__frame"
          src={PREP_LOBBY_HUD}
          alt=""
          draggable={false}
        />
        <div className="prep-lobby-hud__plaque">
          <img src={GAME_LOGO} alt="Grill Rush" draggable={false} />
          <strong>마을 준비</strong>
        </div>
        <div className="prep-lobby-hud__stats">
          <span>📅 Day {state.day}</span>
          <span>🪙 ₩{state.cash.toLocaleString('ko-KR')}</span>
          <span>⭐ 명성 {state.fame}</span>
          <span>
            {getWeatherEmoji(state.weather)} {getWeatherLabel(state.weather)}
          </span>
          <span>⌛ 준비 시간</span>
        </div>
        <div className="prep-lobby-hud__utils">
          <button
            type="button"
            className="prep-lobby-hud__util prep-lobby-hud__util--options"
            onClick={() => setOptionsOpen((open) => !open)}
            aria-label={optionsOpen ? '옵션 닫기' : '옵션 열기'}
            aria-pressed={optionsOpen}
            title="옵션"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="prep-lobby-hud__util-icon">
              <path
                fill="currentColor"
                d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.2 7.2 0 0 0-1.62-.94l-.36-2.54A.48.48 0 0 0 14 2h-4a.48.48 0 0 0-.48.41l-.36 2.54c-.58.23-1.12.54-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.65 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.77 14.52a.49.49 0 0 0-.12.61l1.92 3.32c.13.22.4.31.63.22l2.39-.96c.5.4 1.04.72 1.62.94l.36 2.54c.05.24.24.41.48.41h4c.24 0 .44-.17.48-.41l.36-2.54c.58-.22 1.12-.54 1.62-.94l2.39.96c.23.09.5 0 .63-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
              />
            </svg>
          </button>
          <BgmMuteToggle variant="hud" />
        </div>
      </header>

      <button
        type="button"
        className={`prep-lobby-building prep-lobby-building--mart${
          ingredientsReady ? '' : ' is-pending'
        }`}
        onClick={() => onOpen('market')}
        aria-label="재료 마트 열기"
      >
        <img src={PREP_LOBBY_MART} alt="" draggable={false} />
        <span className="prep-lobby-building__label">
          <strong>재료 마트</strong>
          <small>보유 재료 {ingredientCount}개</small>
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
        className={`prep-lobby-building prep-lobby-building--menu${
          menuReady ? '' : ' is-pending'
        }`}
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
        className={`prep-lobby-building prep-lobby-building--location${
          locationConfirmed ? '' : ' is-pending'
        }`}
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
        <img
          className="prep-lobby-checklist__frame"
          src={PREP_LOBBY_PANEL}
          alt=""
          draggable={false}
        />
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
        <button
          type="button"
          className={`prep-lobby-checklist__start${canStart ? ' is-ready' : ' is-locked'}`}
          disabled={!canStart}
          onClick={onStart}
        >
          {canStart ? '영업 시작 →' : '영업 불가'}
        </button>
        {!canStart && (
          <p className="prep-lobby-checklist__hint">
            필수 준비를 먼저 완료하세요.
          </p>
        )}
      </aside>

      <nav className="prep-lobby-nav" aria-label="준비 메뉴 바로가기">
        <img
          className="prep-lobby-nav__frame"
          src={PREP_LOBBY_NAV}
          alt=""
          draggable={false}
        />
        <div className="prep-lobby-nav__buttons">
          {NAV_BUTTONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`prep-lobby-nav__btn prep-lobby-nav__btn--${item.id} is-locked`}
              disabled
              title="업그레이드로 해금됩니다"
              aria-label={`${item.label} (잠김)`}
            >
              <span className="prep-lobby-nav__lock" aria-hidden>
                🔒
              </span>
              <span className="prep-lobby-nav__btn-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <OptionsModal open={optionsOpen} onClose={() => setOptionsOpen(false)} />
    </section>
  )
}
