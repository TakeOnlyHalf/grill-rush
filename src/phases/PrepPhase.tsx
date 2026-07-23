import { useEffect, useMemo, useState } from 'react'
import CityMap from '../components/CityMap'
import MenuSelector from '../components/MenuSelector'
import IngredientShop from '../components/IngredientShop'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import {
  estimateCustomers,
  getLocationById,
  getRequiredIngredientIds,
} from '../state/formulas'
import { getWeatherLabel } from '../utils/weather'
import ingredients from '../data/ingredients.json'

type PrepStep = 'location' | 'menu' | 'market'

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
  const order: PrepStep[] = ['location', 'menu', 'market']
  const idx = order.indexOf(step)
  return (
    <nav className="prep-steps" aria-label="준비 단계">
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
              →
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
  const canStart = state.activeMenus.length > 0
  const [step, setStep] = useState<PrepStep>('location')
  const [locationPicked, setLocationPicked] = useState(false)

  const needed = useMemo(
    () => getRequiredIngredientIds(state.activeMenus),
    [state.activeMenus],
  )
  const neededLabels = needed
    .map((id) => {
      const ing = ingredients.find((i) => i.id === id)
      return ing ? `${ing.icon}${ing.name}` : id
    })
    .join(' · ')

  useEffect(() => {
    setStep('location')
    setLocationPicked(false)
  }, [state.day])

  const showMap = step === 'location'
  const showPixiStep = step === 'menu' || step === 'market'

  return (
    <section
      className={`phase ${showMap ? 'phase-prep-full' : 'phase-prep-supply'}`}
    >
      <div
        className={`prep-map-layer${showMap ? '' : ' prep-map-layer--hidden'}`}
        aria-hidden={!showMap}
      >
        <CityMap onLocationPick={() => setLocationPicked(true)} />
      </div>

      {step === 'location' && (
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
              onClick={() => setStep('menu')}
            >
              다음: 메뉴 선택 →
            </button>
          </footer>
        </div>
      )}

      {showPixiStep && (
        <>
          <PrepHud />
          <PrepSteps step={step} />

          <div className="prep-supply-screen prep-supply-screen--solo">
            <header className="prep-supply-header">
              <div>
                <p className="prep-supply-kicker">오늘의 준비</p>
                <h2>{step === 'menu' ? '메뉴 선택' : '재료 마트'}</h2>
              </div>
              {loc && (
                <div className="prep-supply-badge">
                  <span className="prep-supply-badge-icon">{loc.icon}</span>
                  <div>
                    <strong>{loc.name}</strong>
                    <small>
                      {step === 'menu'
                        ? `판매 메뉴 ${state.activeMenus.length}종`
                        : needed.length > 0
                          ? `필요 재료 ${neededLabels}`
                          : '먼저 메뉴를 선택하세요'}
                    </small>
                  </div>
                </div>
              )}
            </header>

            <div className="prep-pixi-stage-wrap">
              {step === 'menu' ? <MenuSelector /> : <IngredientShop />}
            </div>
          </div>

          <footer className="prep-bottom-bar">
            {step === 'menu' ? (
              <>
                <button
                  type="button"
                  className="prep-btn prep-btn--menu"
                  onClick={() => setStep('location')}
                >
                  ← 장소
                </button>
                <button
                  type="button"
                  className="prep-btn prep-btn--start"
                  disabled={!canStart}
                  onClick={() => setStep('market')}
                >
                  다음: 마트 →
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="prep-btn prep-btn--menu"
                  onClick={() => setStep('menu')}
                >
                  ← 메뉴
                </button>
                <button
                  type="button"
                  className="prep-btn prep-btn--start"
                  disabled={!canStart}
                  onClick={() => dispatch({ type: ActionTypes.START_OPEN })}
                >
                  ▶ 영업 시작
                </button>
              </>
            )}
          </footer>
        </>
      )}
    </section>
  )
}
