import { useEffect, useState } from 'react'
import { useGameState } from '../state/GameContext'

/** 서빙 결과 토스트 — 방금 완료된 주문의 별점·팁·매출을 잠깐 보여준다 */
export default function ServeResult() {
  const state = useGameState()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!state.lastServe) return undefined
    setVisible(true)
    const id = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(id)
  }, [state.lastServe])

  if (!state.lastServe || !visible) return null
  const { menuName, stars, tip, price } = state.lastServe

  return (
    <div className="serve-toast" role="status">
      <span className="serve-toast-stars">
        {'★'.repeat(stars)}
        {'☆'.repeat(5 - stars)}
      </span>
      <span className="serve-toast-menu">{menuName} 서빙 완료</span>
      <span className="serve-toast-amount">
        +₩{price.toLocaleString('ko-KR')}
        {tip > 0 ? ` (팁 ₩${tip.toLocaleString('ko-KR')})` : ''}
      </span>
    </div>
  )
}
