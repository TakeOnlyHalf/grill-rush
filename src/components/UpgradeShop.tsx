import upgrades from '../data/upgrades.json'
import {
  getDisplayedGrillExpansionUpgrade,
  getDisplayedHeatControlUpgrade,
  GRILL_EXPANSION_UPGRADE_IDS,
  HEAT_CONTROL_UPGRADE_IDS,
} from '../grill/grillUpgrades'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { playSfx } from '../audio/sfx'

const grillExpansionUpgradeIdSet = new Set<string>(GRILL_EXPANSION_UPGRADE_IDS)
const heatControlUpgradeIdSet = new Set<string>(HEAT_CONTROL_UPGRADE_IDS)

/** Storybook / 간단 목록용. 실제 야간 UI는 NightPhase. */
export default function UpgradeShop() {
  const { state, dispatch } = useGame()
  const displayedGrillExpansion = getDisplayedGrillExpansionUpgrade(state.upgrades)
  const displayedHeatControl = getDisplayedHeatControlUpgrade(state.upgrades)
  const displayedUpgrades = upgrades.filter(
    (upgrade) =>
      (!grillExpansionUpgradeIdSet.has(upgrade.id) ||
        upgrade.id === displayedGrillExpansion?.id) &&
      (!heatControlUpgradeIdSet.has(upgrade.id) ||
        upgrade.id === displayedHeatControl?.id),
  )

  return (
    <div className="panel">
      <h3>업그레이드</h3>
      <ul className="picker-list">
        {displayedUpgrades.map((up) => {
          const owned = state.upgrades.includes(up.id)
          const requiredUpgradeId =
            'requires' in up && typeof up.requires === 'string' ? up.requires : null
          const locked = Boolean(requiredUpgradeId && !state.upgrades.includes(requiredUpgradeId))
          const canBuy = !owned && !locked && state.cash >= up.cost
          return (
            <li key={up.id}>
              <button
                type="button"
                className={`picker-item${owned ? ' selected' : ''}`}
                disabled={!canBuy && !owned}
                onClick={() => {
                  if (owned) return
                  playSfx('menu_select')
                  dispatch({
                    type: ActionTypes.BUY_UPGRADE,
                    payload: { upgradeId: up.id },
                  })
                }}
              >
                <span>
                  {up.name}
                  {owned ? ' ✓' : ''}
                </span>
                <small>
                  {owned
                    ? up.description
                    : locked
                      ? ('requiresLabel' in up && up.requiresLabel) || '해금 조건 미충족'
                      : `${up.cost.toLocaleString('ko-KR')}원 · ${up.description}`}
                </small>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
