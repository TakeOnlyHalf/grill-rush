import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import VisualNovelStage, {
  type VisualNovelStageProps,
} from '../ui/visualNovel/VisualNovelStage'
import { INTRO_STORY } from '../data/introStory'
import { DAY_STREET_BG } from '../utils/assets'

const meta = {
  title: 'Design System/Visual Novel/Stage',
  component: VisualNovelStage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'day_street 배경 + 좌·우 캐릭터 슬롯 + 하단 자막. 클릭/Space로 진행.',
      },
    },
  },
  args: {
    backgroundSrc: DAY_STREET_BG,
    lines: INTRO_STORY,
  },
} satisfies Meta<typeof VisualNovelStage>

export default meta
type Story = StoryObj<typeof meta>

function StageDemo(props: VisualNovelStageProps) {
  const [done, setDone] = useState(false)
  if (done) {
    return (
      <div
        className="phase-story"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--vn-ink)',
          background:
            'linear-gradient(180deg, #78c1f3 0%, #c5dde8 100%)',
        }}
      >
        스토리 종료 (게임에서는 준비 페이즈로 이동)
      </div>
    )
  }
  return (
    <div className="phase-story">
      <VisualNovelStage {...props} onComplete={() => setDone(true)} />
    </div>
  )
}

export const WithDayStreet: Story = {
  render: (args) => <StageDemo {...args} />,
}

export const SingleLine: Story = {
  args: {
    backgroundSrc: DAY_STREET_BG,
    lines: [
      {
        id: 'demo',
        speaker: '주인공',
        text: '이미지는 public/images/characters/ 에 넣고 characterImages로 연결하면 됩니다.',
        side: 'left',
        leftCharacter: 'protagonist',
        rightCharacter: null,
      },
    ],
  },
  render: (args) => <StageDemo {...args} />,
}
