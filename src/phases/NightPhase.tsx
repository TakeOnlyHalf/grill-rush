import { useMemo, useState } from 'react'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { getWeatherEmoji } from '../utils/weather'
import { TRUCK_UPGRADE_NIGHT_BG } from '../utils/assets'
import upgradesData from '../data/upgrades.json'
import events from '../data/events.json'

type UpgradeCategory =
  | 'all'
  | 'kitchen'
  | 'performance'
  | 'promo'
  | 'convenience'
  | 'automation'

type UpgradeDef = (typeof upgradesData)[number] & {
  category: Exclude<UpgradeCategory, 'all'>
  icon: string
  detail?: string
  requires?: string
  requiresLabel?: string
}

const upgrades = upgradesData as UpgradeDef[]

const CATEGORIES: { id: UpgradeCategory; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: '▦' },
  { id: 'kitchen', label: '주방', icon: '♨' },
  { id: 'performance', label: '성능', icon: '⚡' },
  { id: 'promo', label: '홍보', icon: '📢' },
  { id: 'convenience', label: '편의', icon: '🔔' },
  { id: 'automation', label: '자동화', icon: '⚙' },
]

function formatWon(n: number): string {
  return `₩${Math.abs(n).toLocaleString('ko-KR')}`
}

function baseTruckStats(owned: string[]) {
  const slots = 3 + (owned.includes('grill_expand') ? 1 : 0)
  const cookSpeed = owned.includes('heat_boost') ? 120 : 100
  const visitBonus = owned.includes('signboard') ? 10 : 0
  return { slots, cookSpeed, visitBonus }
}

function previewStats(owned: string[], planned: string[]) {
  const merged = [...new Set([...owned, ...planned])]
  return baseTruckStats(merged)
}

/**
 * 야간 / 성장 — truck_upgrade_night.webp 보드 위 오버레이
 */
interface NightPhaseProps {
  mode?: 'night' | 'prep'
  onBack?: () => void
}

export default function NightPhase({
  mode = 'night',
  onBack,
}: NightPhaseProps) {
  const { state, dispatch } = useGame()
  const [category, setCategory] = useState<UpgradeCategory>('all')
  const [planned, setPlanned] = useState<string[]>([])

  const isLastDay = state.day >= state.maxDays
  const nextDay =
    mode === 'prep' ? state.day : Math.min(state.day + 1, state.maxDays)
  const tomorrowEvent = events.find(
    (e) => e.day === (mode === 'prep' ? state.day : state.day + 1),
  )
  const owned = state.upgrades

  const current = baseTruckStats(owned)
  const preview = previewStats(owned, planned)

  const filtered = useMemo(
    () =>
      category === 'all'
        ? upgrades
        : upgrades.filter((u) => u.category === category),
    [category],
  )

  const plannedItems = planned
    .map((id) => upgrades.find((u) => u.id === id))
    .filter((u): u is UpgradeDef => Boolean(u))

  const planCost = plannedItems.reduce((s, u) => s + u.cost, 0)
  const balanceAfter = state.cash - planCost
  const canPurchase =
    plannedItems.length > 0 && balanceAfter >= 0 && plannedItems.every((u) => !owned.includes(u.id))

  const equipmentOwned = owned.filter((id) =>
    upgrades.some((u) => u.id === id),
  ).length
  const truckLevel = 1 + Math.min(equipmentOwned, 5)

  function isLocked(up: UpgradeDef): boolean {
    return Boolean(up.requires && !owned.includes(up.requires))
  }

  function togglePlan(up: UpgradeDef) {
    if (owned.includes(up.id) || isLocked(up)) return
    setPlanned((prev) =>
      prev.includes(up.id) ? prev.filter((id) => id !== up.id) : [...prev, up.id],
    )
  }

  function purchasePlan() {
    if (!canPurchase) return
    for (const up of plannedItems) {
      dispatch({
        type: ActionTypes.BUY_UPGRADE,
        payload: { upgradeId: up.id, cost: up.cost },
      })
    }
    setPlanned([])
  }

  const effectLines: string[] = []
  if (preview.cookSpeed !== current.cookSpeed) {
    effectLines.push(`조리 속도 ${current.cookSpeed}% → ${preview.cookSpeed}%`)
  }
  if (preview.visitBonus !== current.visitBonus) {
    effectLines.push(`방문 보너스 ${current.visitBonus}% → ${preview.visitBonus}%`)
  }
  if (preview.slots !== current.slots) {
    effectLines.push(`조리 슬롯 ${current.slots} → ${preview.slots}`)
  }

  return (
    <section className="phase phase-night" aria-label="트럭 관리실">
      <img
        className="night-bg"
        src={TRUCK_UPGRADE_NIGHT_BG}
        alt=""
        draggable={false}
      />

      <div className="night-layer">
        <header className="night-title">
          <h2 className="night-title__main">트럭 관리실</h2>
          <p className="night-title__sub">
            {mode === 'prep'
              ? '오늘 영업 전에 트럭 설비를 점검하세요.'
              : '설비를 계획하고 한 번에 업그레이드하세요.'}
          </p>
        </header>

        <div className="night-stats" aria-label="현황">
          <div className="night-stat">
            <span className="night-stat__label">보유 자금</span>
            <strong className="night-stat__value night-stat__value--gold">
              {formatWon(state.cash)}
            </strong>
          </div>
          <div className="night-stat">
            <span className="night-stat__label">트럭 등급</span>
            <strong className="night-stat__value">Lv.{truckLevel}</strong>
          </div>
          <div className="night-stat">
            <span className="night-stat__label">설비</span>
            <strong className="night-stat__value">
              {equipmentOwned} / {upgrades.length}
            </strong>
          </div>
          <div className="night-stat">
            <span className="night-stat__label">다음 영업</span>
            <strong className="night-stat__value">Day {nextDay}</strong>
          </div>
        </div>

        <aside className="night-cats" aria-label="업그레이드 분류">
          <p className="night-panel-label">업그레이드 분류</p>
          <ul className="night-cats__list">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`night-cat${category === c.id ? ' is-active' : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  <span className="night-cat__icon" aria-hidden>
                    {c.icon}
                  </span>
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <aside className="night-truck-status" aria-label="트럭 상태">
          <p className="night-panel-label">트럭 상태</p>
          <ul className="night-status-list">
            <li>
              <span>조리 슬롯</span>
              <strong>{current.slots}</strong>
            </li>
            <li>
              <span>조리 속도</span>
              <strong>{current.cookSpeed}%</strong>
            </li>
            <li>
              <span>방문 보너스</span>
              <strong>{current.visitBonus}%</strong>
            </li>
          </ul>
        </aside>

        <div className="night-grid" aria-label="업그레이드 목록">
          {filtered.map((up) => {
            const isOwned = owned.includes(up.id)
            const locked = isLocked(up)
            const selected = planned.includes(up.id)
            return (
              <button
                key={up.id}
                type="button"
                className={`night-card${selected ? ' is-selected' : ''}${
                  isOwned ? ' is-owned' : ''
                }${locked ? ' is-locked' : ''}`}
                disabled={isOwned || locked}
                onClick={() => togglePlan(up)}
              >
                <span className="night-card__check" aria-hidden>
                  {isOwned || selected ? '✓' : ''}
                </span>
                <span className="night-card__icon" aria-hidden>
                  {up.icon}
                </span>
                <span className="night-card__name">{up.name}</span>
                {locked ? (
                  <span className="night-card__lock">
                    {up.requiresLabel ?? '해금 조건 미충족'}
                  </span>
                ) : (
                  <>
                    <span className="night-card__cost">
                      {isOwned ? '보유 중' : formatWon(up.cost)}
                    </span>
                    <span className="night-card__detail">
                      {up.detail ?? up.description}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        <p className="night-plan__title">업그레이드 계획</p>

        <div className="night-plan-list" aria-label="업그레이드 계획">
          {plannedItems.length === 0 ? (
            <p className="night-plan__empty">선택한 업그레이드가 없습니다.</p>
          ) : (
            <ul className="night-plan__list">
              {plannedItems.map((up) => (
                <li key={up.id}>
                  <span>
                    {up.icon} {up.name}
                  </span>
                  <span className="night-plan__row-cost">{formatWon(up.cost)}</span>
                  <button
                    type="button"
                    className="night-plan__remove"
                    aria-label={`${up.name} 제거`}
                    onClick={() =>
                      setPlanned((prev) => prev.filter((id) => id !== up.id))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="night-preview" aria-label="효과 미리보기">
          <p className="night-preview__title">효과 미리보기</p>
          {effectLines.length === 0 ? (
            <p className="night-preview__empty">변경 예정 효과 없음</p>
          ) : (
            <ul>
              {effectLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="night-checkout">
          <p>
            선택 <strong>{plannedItems.length}</strong>개 · 총{' '}
            <strong className="is-cost">{formatWon(planCost)}</strong>
          </p>
          <p>
            구매 후{' '}
            <strong className={balanceAfter < 0 ? 'is-cost' : 'is-ok'}>
              {formatWon(balanceAfter)}
            </strong>
          </p>
          <button
            type="button"
            className="night-buy"
            disabled={!canPurchase}
            onClick={purchasePlan}
          >
            선택한 업그레이드 구매
          </button>
          <button
            type="button"
            className="night-reset"
            disabled={planned.length === 0}
            onClick={() => setPlanned([])}
          >
            선택 초기화
          </button>
        </div>

        <p className="night-forecast__day">Day {nextDay}</p>
        <div className="night-forecast__weather">
          <span className="night-forecast__emoji" aria-hidden>
            {getWeatherEmoji(state.weather)}
          </span>
          <p>날씨는 아침에 결정됩니다.</p>
        </div>
        <div className="night-forecast__event">
          {tomorrowEvent ? (
            <p>
              예고 이벤트: {tomorrowEvent.name}. {tomorrowEvent.description}
            </p>
          ) : (
            <p>예정된 스크립트 이벤트 없음</p>
          )}
        </div>

        <button
          type="button"
          className="night-next"
          onClick={() => {
            if (mode === 'prep') {
              onBack?.()
              return
            }
            dispatch({ type: ActionTypes.NEXT_DAY })
          }}
        >
          {mode === 'prep'
            ? '준비 로비로 →'
            : isLastDay
              ? '엔딩 보기 →'
              : '다음 날로 →'}
        </button>
      </div>
    </section>
  )
}
