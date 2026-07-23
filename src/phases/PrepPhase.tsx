import { useEffect, useState } from 'react'
import CityMap from '../components/CityMap'
import MenuSelector from '../components/MenuSelector'
import IngredientShop from '../components/IngredientShop'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { estimateCustomers, getLocationById } from '../state/formulas'
import { getWeatherLabel } from '../utils/weather'

type PrepStep = 'location' | 'supply'

export default function PrepPhase() {
  const { state, dispatch } = useGame()
  const loc = getLocationById(state.location)
  const estimated = estimateCustomers(state.location, state.weather, state.fame)
  const canStart = state.activeMenus.length > 0
  const [step, setStep] = useState<PrepStep>('location')

  // 날이 바뀌면 다시 장소 선택부터
  useEffect(() => {
    setStep('location')
  }, [state.day])

  return (
    <section
      className={`phase phase-prep-full${step === 'supply' ? ' prep--supply' : ''}`}
    >
      <CityMap />

      <div className="prep-overlay">
        <header className="prep-hud-bar">
          <span className="prep-hud-chip">Day {state.day}/{state.maxDays}</span>
          <span className="prep-hud-chip">₩{state.cash.toLocaleString('ko-KR')}</span>
          <span className="prep-hud-chip">명성 {state.fame}</span>
          <span className="prep-hud-chip">{getWeatherLabel(state.weather)}</span>
        </header>

        <nav className="prep-steps" aria-label="준비 단계">
          <span className={`prep-step${step === 'location' ? ' is-active' : ''}`}>
            1. 장소
          </span>
          <span className="prep-step-sep" aria-hidden>
            →
          </span>
          <span className={`prep-step${step === 'supply' ? ' is-active' : ''}`}>
            2. 메뉴 · 재료
          </span>
        </nav>

        {step === 'location' && loc && (
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
        )}

        {step === 'supply' && (
          <div className="prep-supply-panel glass-panel">
            {loc && (
              <p className="prep-supply-loc">
                {loc.icon} {loc.name}
                <span>에서 영업</span>
              </p>
            )}
            <div className="prep-side-scroll">
              <MenuSelector />
              <IngredientShop />
            </div>
          </div>
        )}

        <footer className="prep-bottom-bar">
          {step === 'location' ? (
            <button
              type="button"
              className="prep-btn prep-btn--start"
              disabled={!loc}
              onClick={() => setStep('supply')}
            >
              다음: 메뉴 · 재료 →
            </button>
          ) : (
            <>
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
            </>
          )}
        </footer>
      </div>
    </section>
  )
}
