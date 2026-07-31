import { useEffect, useRef, useState } from 'react'
import CityMap, { type CityMapHandle } from '../components/CityMap'
import LocationSelectStrip from '../components/LocationSelectStrip'
import MenuSelector from '../components/MenuSelector'
import IngredientShop from '../components/IngredientShop'
import PrepLobby, {
  type PrepLobbyDestination,
} from '../components/PrepLobby'
import NightPhase from './NightPhase'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import {
  estimateCustomers,
  getLocationById,
  getRequiredIngredientIds,
} from '../state/formulas'
import { getWeatherLabel } from '../utils/weather'
import type { LocationAnchors } from '../pixi/scenes/PrepLocationScene'
import { READY_PHASE_BG, preloadCriticalAssets } from '../utils/assets'
import { requestBgm, forceUnlockBgm, resetBgmDayProgress } from '../audio/bgm'

type PrepStep = 'lobby' | 'location' | 'menu' | 'market' | 'upgrade'

function PrepHud() {
  const { state } = useGame()
  return (
    <header className="prep-hud-bar prep-hud-bar--ref">
      <div className="prep-hud-pill">
        <span className="prep-hud-chip">📅 Day {state.day}/{state.maxDays}</span>
        <span className="prep-hud-chip">🪙 ₩{state.cash.toLocaleString('ko-KR')}</span>
        <span className="prep-hud-chip">⭐ 명성 {state.fame}</span>
        <span className="prep-hud-chip">{getWeatherLabel(state.weather)}</span>
      </div>
    </header>
  )
}

function PrepSteps({ step }: { step: PrepStep }) {
  const order: PrepStep[] = ['location', 'menu', 'market']
  const idx = order.indexOf(step)
  return (
    <nav className="prep-steps prep-steps--ref" aria-label="준비 단계">
      {(
        [
          ['location', '1. 장소'],
          ['menu', '2. 메뉴'],
          ['market', '3. 마트'],
        ] as const
      ).map(([id, label], i) => (
        <span key={id} className="prep-step-wrap">
          {i > 0 && (
            <span className="prep-step-sep" aria-hidden>
              ›
            </span>
          )}
          <span
            className={`prep-step${
              step === id ? ' is-active' : i < idx ? ' is-done' : ''
            }`}
          >
            {label}
          </span>
        </span>
      ))}
    </nav>
  )
}

export default function PrepPhase() {
  const { state, dispatch } = useGame()
  const loc = getLocationById(state.location)
  const estimated = estimateCustomers(state.location, state.weather, state.fame)
  const menuReady = state.activeMenus.length > 0
  const requiredIngredients = getRequiredIngredientIds(state.activeMenus)
  const ingredientsReady =
    requiredIngredients.length > 0 &&
    requiredIngredients.every((id) => (state.ingredients[id] ?? 0) > 0)
  const isFreePrep = state.day >= 2
  const [step, setStep] = useState<PrepStep>(
    isFreePrep ? 'lobby' : 'location',
  )
  const [locationPicked, setLocationPicked] = useState(false)
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [locAnchors, setLocAnchors] = useState<LocationAnchors | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [posterDimmed, setPosterDimmed] = useState(false)
  const mapRef = useRef<CityMapHandle | null>(null)

  useEffect(() => {
    resetBgmDayProgress()
    setStep(state.day >= 2 ? 'lobby' : 'location')
    setLocationPicked(false)
    setLocationConfirmed(false)
    setMapReady(false)
    setPosterDimmed(false)
    setLocAnchors(null)
  }, [state.day])

  useEffect(() => {
    void preloadCriticalAssets()
  }, [])

  useEffect(() => {
    // Day 1: 장소→메뉴→마트 전 구간 store (같은 곡 유지)
    // Day 2+: 로비만 lobby, 마을에서 들어간 모든 장소는 store
    if (!isFreePrep) {
      requestBgm('store')
      return
    }
    if (step === 'lobby') requestBgm('lobby')
    else requestBgm('store')
  }, [step, isFreePrep, state.day])

  useEffect(() => {
    if (!mapReady) return undefined
    // transitionend 누락(reduced-motion 등) 대비 — 페이드 후 포스터 제거
    const id = window.setTimeout(() => setPosterDimmed(true), 620)
    return () => window.clearTimeout(id)
  }, [mapReady])

  const showMap = step === 'location'
  const showPixiStep = step === 'menu' || step === 'market'
  const selectedLocId = locationPicked ? state.location : null

  const handlePickLocation = (id: string) => {
    mapRef.current?.pickLocation(id)
    setLocationPicked(true)
  }

  const rentCost = loc?.rentCost ?? 0
  const rentAlreadyPaid = state.dailyCosts.rent ?? 0
  const canAffordRent = state.cash + rentAlreadyPaid >= rentCost

  const handleConfirmLocation = () => {
    if (!locationPicked || !canAffordRent) return
    dispatch({ type: ActionTypes.CONFIRM_LOCATION })
    setLocationConfirmed(true)
    if (isFreePrep) {
      forceUnlockBgm('lobby')
      setStep('lobby')
    } else {
      // Day1: 이미 store — 재시작하지 않음
      forceUnlockBgm('store')
      setStep('menu')
    }
  }

  const handleOpenLobbyDestination = (destination: PrepLobbyDestination) => {
    if (destination === 'location') {
      setLocationPicked(locationConfirmed)
    }
    // 마을에서 들어가는 모든 장소 → store
    forceUnlockBgm('store')
    setStep(destination)
  }

  const canStart = isFreePrep
    ? menuReady && ingredientsReady && locationConfirmed
    : menuReady

  if (step === 'lobby') {
    return (
      <PrepLobby
        locationConfirmed={locationConfirmed}
        ingredientsReady={ingredientsReady}
        canStart={canStart}
        onOpen={handleOpenLobbyDestination}
        onStart={() => {
          forceUnlockBgm('cooking')
          dispatch({ type: ActionTypes.START_OPEN })
        }}
      />
    )
  }

  if (step === 'upgrade') {
    return (
      <NightPhase
        mode="prep"
        onBack={() => {
          forceUnlockBgm('lobby')
          setStep('lobby')
        }}
      />
    )
  }

  return (
    <section
      className={`phase ${showMap ? 'phase-prep-full' : 'phase-prep-supply'}`}
    >
      <div
        className={`prep-map-layer${showMap ? '' : ' prep-map-layer--hidden'}`}
        aria-hidden={!showMap}
      >
        {/* 캐시 배경을 먼저 깔고, Pixi가 준비되면 위에 페이드인한 뒤 포스터를 걷는다 */}
        <img
          className={`prep-map-poster${posterDimmed ? ' is-dimmed' : ''}`}
          src={READY_PHASE_BG}
          alt=""
          aria-hidden
          draggable={false}
        />
        <CityMap
          ref={mapRef}
          reveal={mapReady}
          onLocationPick={() => setLocationPicked(true)}
          onAnchorsChange={setLocAnchors}
          onSceneReady={() => setMapReady(true)}
          onRevealSettled={() => setPosterDimmed(true)}
        />
      </div>

      {step === 'location' && (
        <div className="prep-overlay prep-overlay--location">
          <PrepHud />
          <PrepSteps step="location" />

          <aside className="prep-hint-board" aria-label="장소 선택 안내">
            <div className="prep-hint-board__title-row">
              <span className="prep-hint-board__pin" aria-hidden="true">
                <svg viewBox="0 0 24 32" width="22" height="28" fill="none">
                  <path
                    d="M12 0C5.4 0 0 5.2 0 11.6c0 8.2 10.2 18.8 10.6 19.2a1.9 1.9 0 0 0 2.8 0C13.8 30.4 24 19.8 24 11.6 24 5.2 18.6 0 12 0Z"
                    fill="#e85a4a"
                  />
                  <circle cx="12" cy="11.5" r="4.2" fill="#fff6ee" />
                </svg>
              </span>
              <h3>영업 장소를 선택하세요</h3>
            </div>
            <p>맵에서 구역을 클릭하면 트럭이 이동합니다.</p>
            {locationPicked && loc && (
              <div className="prep-hint-stats">
                <span>{loc.description}</span>
                <span>예상 손님 {estimated}명</span>
                <span>자릿세 {loc.rentCost.toLocaleString('ko-KR')}원</span>
              </div>
            )}
            <span className="prep-hint-board__paw" aria-hidden="true">
              <svg viewBox="0 0 40 36" width="28" height="25" fill="none">
                <ellipse cx="11" cy="9" rx="4.2" ry="5.2" fill="#c4a07a" transform="rotate(-18 11 9)" />
                <ellipse cx="20" cy="5.5" rx="4" ry="5" fill="#c4a07a" />
                <ellipse cx="29" cy="9" rx="4.2" ry="5.2" fill="#c4a07a" transform="rotate(18 29 9)" />
                <ellipse cx="6.5" cy="16.5" rx="3.6" ry="4.4" fill="#c4a07a" transform="rotate(-32 6.5 16.5)" />
                <path
                  d="M20 14c-7.2 0-12.5 5.2-12.5 11.2 0 4.6 3.6 7.6 8.2 7.6 1.8 0 3.4-.6 4.3-1.6.9 1 2.5 1.6 4.3 1.6 4.6 0 8.2-3 8.2-7.6C32.5 19.2 27.2 14 20 14Z"
                  fill="#c4a07a"
                />
              </svg>
            </span>
          </aside>

          <div className="prep-loc-strip-wrap">
            <LocationSelectStrip
              selectedId={selectedLocId}
              onSelect={handlePickLocation}
              anchors={locAnchors}
            />
          </div>

          <footer className="prep-bottom-bar">
            <button
              type="button"
              className="prep-btn prep-btn--start prep-btn--cta"
              disabled={!locationPicked || !canAffordRent}
              onClick={handleConfirmLocation}
            >
              다음: 메뉴 선택 →
            </button>
          </footer>
        </div>
      )}

      {showPixiStep && (
        <>
          <div className="prep-supply-stage" aria-hidden={false}>
            {step === 'menu' ? <MenuSelector /> : <IngredientShop />}
          </div>

          <div className="prep-overlay prep-overlay--supply">
            <PrepHud />
            <PrepSteps step={step} />

            {step === 'menu' && (
              <header className="prep-supply-header prep-supply-header--overlay">
                <div>
                  <p className="prep-supply-kicker">오늘의 준비</p>
                  <h2>메뉴 선택</h2>
                </div>
                {loc && (
                  <div className="prep-supply-badge">
                    <span className="prep-supply-badge-icon">{loc.icon}</span>
                    <div>
                      <strong>{loc.name}</strong>
                      <small>판매 메뉴 {state.activeMenus.length}종</small>
                    </div>
                  </div>
                )}
              </header>
            )}

            <footer className="prep-bottom-bar">
              {step === 'menu' ? (
                <>
                  <button
                    type="button"
                    className="prep-btn prep-btn--menu"
                    onClick={() => {
                      forceUnlockBgm(isFreePrep ? 'lobby' : 'store')
                      setStep(isFreePrep ? 'lobby' : 'location')
                    }}
                  >
                    {isFreePrep ? '← 준비 로비' : '← 장소'}
                  </button>
                  <button
                    type="button"
                    className="prep-btn prep-btn--start"
                    disabled={!menuReady}
                    onClick={() => {
                      forceUnlockBgm(isFreePrep ? 'lobby' : 'store')
                      setStep(isFreePrep ? 'lobby' : 'market')
                    }}
                  >
                    {isFreePrep ? '선택 완료 →' : '다음: 마트 →'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="prep-btn prep-btn--menu"
                    onClick={() => {
                      forceUnlockBgm(isFreePrep ? 'lobby' : 'store')
                      setStep(isFreePrep ? 'lobby' : 'menu')
                    }}
                  >
                    {isFreePrep ? '← 준비 로비' : '← 메뉴'}
                  </button>
                  <button
                    type="button"
                    className="prep-btn prep-btn--start"
                    disabled={!menuReady}
                    onClick={() => {
                      if (isFreePrep) {
                        forceUnlockBgm('lobby')
                        setStep('lobby')
                        return
                      }
                      forceUnlockBgm('cooking')
                      dispatch({ type: ActionTypes.START_OPEN })
                    }}
                  >
                    {isFreePrep ? '구매 완료 →' : '▶ 영업 시작'}
                  </button>
                </>
              )}
            </footer>
          </div>
        </>
      )}
    </section>
  )
}
