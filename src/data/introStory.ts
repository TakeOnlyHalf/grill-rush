import type { StoryLine } from '../types/story'

/**
 * 오프닝 스토리 (처음부터 시작 시)
 * leftCharacter / rightCharacter 키에 맞춰 이미지를 나중에 넣으면 됩니다.
 */
export const INTRO_STORY: StoryLine[] = [
  {
    id: 'intro-1',
    text: '낡은 푸드트럭 열쇠가 손안에서 가볍게 울렸다.',
    side: 'none',
    leftCharacter: null,
    rightCharacter: null,
  },
  {
    id: 'intro-2',
    speaker: '???',
    text: '여기가… 내가 물려받은 트럭이라고?',
    side: 'left',
    leftCharacter: 'protagonist',
    rightCharacter: null,
  },
  {
    id: 'intro-3',
    speaker: '마을 사람',
    text: '어서 와. 이 골목은 오래전부터 좋은 냄새가 그리웠거든.',
    side: 'right',
    leftCharacter: 'protagonist',
    rightCharacter: 'villager',
  },
  {
    id: 'intro-4',
    speaker: '???',
    text: '그래… 일단 재료를 준비하고, 손님을 맞아 보자.',
    side: 'left',
    leftCharacter: 'protagonist',
    rightCharacter: 'villager',
  },
  {
    id: 'intro-5',
    text: '7일 동안, 최고의 푸드트럭을 만드는 여정이 시작된다.',
    side: 'none',
    leftCharacter: 'protagonist',
    rightCharacter: 'villager',
  },
]
