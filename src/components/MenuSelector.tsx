import menus from '../data/menus.json'
import { useGame } from '../state/GameContext'
import { ActionTypes, MAX_ACTIVE_MENUS } from '../state/actions'

/** 메뉴 선택·가격 설정 — TODO: 가격 슬라이더 UX 고도화 */
export default function MenuSelector() {
  const { state, dispatch } = useGame()

  return (
    <div className="panel">
      <h3>
        메뉴 선택 ({state.activeMenus.length}/{MAX_ACTIVE_MENUS})
      </h3>
      <ul className="picker-list">
        {menus.map((menu) => {
          const unlocked = state.unlockedMenus.includes(menu.id)
          const active = state.activeMenus.includes(menu.id)
          const price = state.menuPrices[menu.id] ?? menu.basePrice

          return (
            <li key={menu.id} className="menu-row">
              <button
                type="button"
                className={`picker-item${active ? ' selected' : ''}`}
                disabled={!unlocked}
                onClick={() =>
                  dispatch({ type: ActionTypes.TOGGLE_MENU, payload: menu.id })
                }
              >
                <span>
                  {menu.icon} {menu.name}
                </span>
                <small>
                  {unlocked ? `원가 ${menu.cost.toLocaleString('ko-KR')}` : '잠김'}
                </small>
              </button>
              {unlocked && (
                <label className="price-field">
                  <span className="sr-only">판매가</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={price}
                    disabled={!active}
                    onChange={(e) =>
                      dispatch({
                        type: ActionTypes.SET_MENU_PRICE,
                        payload: {
                          menuId: menu.id,
                          price: Number(e.target.value) || 0,
                        },
                      })
                    }
                  />
                  원
                </label>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
