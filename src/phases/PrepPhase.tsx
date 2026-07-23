import { useEffect, useState } from 'react'
import CityMap from '../components/CityMap'
import MenuSelector from '../components/MenuSelector'
import IngredientShop from '../components/IngredientShop'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { estimateCustomers, getLocationById } from '../state/formulas'
import { getWeatherLabel } from '../utils/weather'

type PrepStep = 'location' | 'supply'

function PrepHud() {
  const { state } = useGame()
  return (
    <header className="prep-hud-bar">
      <span className="prep-hud-chip">Day {state.day}/{state.maxDays}</span>
      <span className="prep-hud-chip">₩{state.cash.toLocaleString('ko-KR')}</span>
      <span className="prep-hud-chip">명성 {state.fame}</span>
      <span className="prep-hud-chip">{getWeatherLabel(state.weather)}</span>
    </header>
  )
}

function PrepSteps({ step }: { step: PrepStep }) {
  return (
    <nav className="prep-steps" aria-label="준비 단계">
      <span className={`prep-step${step === 'location' ? ' is-active' : ' is-done'}`}>
        1. 장소
      </span>
      <span className="prep-step-sep" aria-hidden>
        →
      </span>
      <span className={`prep-step${step === 'supply' ? ' is-active' : ''}`}>
        2. 메뉴 · 재료
      </span>
    </nav>
  )
}

export default function PrepPhase() {
  const { state, dispatch } = useGame()
  const loc = getLocationById(state.location)
  const estimated = estimateCustomers(state.location, state.weather, state.fame)
  const canStart = state.activeMenus.length > 0
  const [step, setStep] = useState<PrepStep>('location')
  const [locationPicked, setLocationPicked] = useState(false)

  useEffect(() => {
    setStep('location')
    setLocationPicked(false)
  }, [state.day])

  return (
    <section
      className={`phase ${step === 'location' ? 'phase-prep-full' : 'phase-prep-supply'}`}
    >
      {/* 맵은 언마운트하지 않고 숨김 → 선택/트럭 위치 유지 */}
      <div
        className={`prep-map-layer${step === 'supply' ? ' prep-map-layer--hidden' : ''}`}
        aria-hidden={step === 'supply'}
      >
        <CityMap onLocationPick={() => setLocationPicked(true)} />
      </div>

      {step === 'location' ? (
        <div className="prep-overlay">
          <PrepHud />
          <PrepSteps step="location" />

          {locationPicked && loc ? (
            <div className="prep-loc-card glass-panel">
              <h3>
                {loc.icon} {loc.name}
              </h3>
              <p className="prep-loc-desc">{loc.description}</p>
              <div className="prep-loc-stats">
                <span>피크 {loc.peakHours}</span>
                <span>예상 손님 {estimated}명</span>
                <span>자릿세 {loc.rentCost.toLocaleString('ko-KR')}원</span>
              </div>
            </div>
          ) : (
            <div className="prep-loc-card glass-panel prep-loc-card--hint">
              <h3>영업 장소를 선택하세요</h3>
              <p className="prep-loc-desc">맵에서 구역을 클릭하면 트럭이 이동합니다.</p>
            </div>
          )}

          <footer className="prep-bottom-bar">
            <button
              type="button"
              className="prep-btn prep-btn--start"
              disabled={!locationPicked}
              onClick={() => setStep('supply')}
            >
              다음: 메뉴 · 재료 →
            </button>
          </footer>
        </div>
      ) : (
        <>
          <PrepHud />
          <PrepSteps step="supply" />

          <div className="prep-supply-screen">
            <header className="prep-supply-header">
              <div>
                <p className="prep-supply-kicker">오늘의 준비</p>
                <h2>메뉴 · 재료</h2>
              </div>
              {loc && (
                <div className="prep-supply-badge">
                  <span className="prep-supply-badge-icon">{loc.icon}</span>
                  <div>
                    <strong>{loc.name}</strong>
                    <small>
                      예상 {estimated}명 · 자릿세 {loc.rentCost.toLocaleString('ko-KR')}원
                    </small>
                  </div>
                </div>
              )}
            </header>

            <div className="prep-supply-grid">
              <div className="prep-supply-card glass-panel">
                <MenuSelector />
              </div>
              <div className="prep-supply-card glass-panel">
                <IngredientShop />
              </div>
            </div>
          </div>

          <footer className="prep-bottom-bar">
            <button
              type="button"
              className="prep-btn prep-btn--menu"
              onClick={() => setStep('location')}
            >
              ← 장소 다시 선택
            </button>
            <button
              type="button"
              className="prep-btn prep-btn--start"
              disabled={!canStart}
              onClick={() => dispatch({ type: ActionTypes.START_OPEN })}
            >
              ▶ 영업 시작
            </button>
          </footer>
        </>
      )}
    </section>
  )
}
