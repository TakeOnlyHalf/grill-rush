import type { CookResult } from './grillSlots'

export interface CookFeedbackCopy {
  title: string
  detail: string
  stars: 0 | 1 | 2 | 3
}

export const COOK_FEEDBACK_DURATION_MS = 800

export const cookFeedback: Record<CookResult, CookFeedbackCopy> = {
  raw: {
    title: '덜 익었어요',
    detail: '서빙할 수 없습니다',
    stars: 0,
  },
  good: {
    title: 'Good!',
    detail: '준비대로 이동합니다',
    stars: 2,
  },
  perfect: {
    title: 'Perfect!',
    detail: '준비대로 이동합니다',
    stars: 3,
  },
  danger: {
    title: '아슬아슬!',
    detail: '타기 직전에 꺼냈습니다',
    stars: 1,
  },
  burnt: {
    title: '태웠다!',
    detail: '재료를 잃었습니다',
    stars: 0,
  },
}

export function getCookFeedbackAnnouncement(result: CookResult): string {
  const feedback = cookFeedback[result]
  const stars = feedback.stars > 0 ? `, 별 ${feedback.stars}개` : ''
  return `${feedback.title}, ${feedback.detail}${stars}`
}
