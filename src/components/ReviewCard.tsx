import { generateReviewText } from '../utils/reviewGenerator'

export interface ReviewCardProps {
  reviews?: number[]
}

/** 리뷰 표시 */
export default function ReviewCard({ reviews = [] }: ReviewCardProps) {
  if (!reviews.length) {
    return (
      <div className="panel">
        <h3>오늘의 리뷰</h3>
        <p className="muted">아직 리뷰가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="panel">
      <h3>오늘의 리뷰</h3>
      <ul className="review-list">
        {reviews.slice(0, 5).map((stars, i) => (
          <li key={i}>
            {'★'.repeat(stars)}
            {'☆'.repeat(5 - stars)} — {generateReviewText({ stars })}
          </li>
        ))}
      </ul>
    </div>
  )
}
