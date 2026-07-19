import { createContext, useContext, useReducer } from 'react'
import { gameReducer } from './gameReducer.js'
import { createInitialState } from './initialState.js'

const GameStateContext = createContext(null)
const GameDispatchContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  )
}

export function useGameState() {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGameState must be used within GameProvider')
  return ctx
}

export function useGameDispatch() {
  const ctx = useContext(GameDispatchContext)
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider')
  return ctx
}

export function useGame() {
  return { state: useGameState(), dispatch: useGameDispatch() }
}
