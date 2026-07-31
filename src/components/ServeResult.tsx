import { useEffect, useState } from 'react'
import { useGameState } from '../state/GameContext'

/** 서빙 결과 토스트 — 방금 완료된 주문의 매출을 잠깐 보여준다 */
export default function ServeResult() {
  const state = useGameState()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!state.lastServeFeedback) return undefined
    setVisible(true)
    const id = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(id)
  }, [state.lastServeFeedback])

  if (!state.lastServeFeedback || !visible) return null
  const { menuName, amount } = state.lastServeFeedback

  return (
    <div className="serve-toast" role="status">
      <span className="serve-toast-menu">{menuName} 서빙 완료</span>
      <span className="serve-toast-amount">+₩{amount.toLocaleString('ko-KR')}</span>
    </div>
  )
}
