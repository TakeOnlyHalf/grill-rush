import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { gameReducer } from './gameReducer'
import { createInitialState } from './initialState'
import { clearSave, saveGame, shouldAutosave } from '../utils/saveGame'
import type { GameAction, GameState } from '../types/game'
import { ActionTypes } from './actions'

const GameStateContext = createContext<GameState | null>(null)
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  useEffect(() => {
    if (!shouldAutosave(state.phase)) return
    saveGame(state)
  }, [state])

  useEffect(() => {
    if (state.phase === 'ending') clearSave()
  }, [state.phase])

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  )
}

export function useGameState(): GameState {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGameState must be used within GameProvider')
  return ctx
}

export function useGameDispatch(): Dispatch<GameAction> {
  const ctx = useContext(GameDispatchContext)
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider')
  return ctx
}

export function useGame() {
  return { state: useGameState(), dispatch: useGameDispatch() }
}

/** 처음부터 — 세이브 삭제 후 새 게임 */
export function startNewGame(dispatch: Dispatch<GameAction>) {
  clearSave()
  dispatch({ type: ActionTypes.START_GAME })
}
