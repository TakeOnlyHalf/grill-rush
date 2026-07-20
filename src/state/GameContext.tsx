import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { gameReducer } from './gameReducer'
import { createInitialState } from './initialState'
import type { GameAction, GameState } from '../types/game'

const GameStateContext = createContext<GameState | null>(null)
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

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
