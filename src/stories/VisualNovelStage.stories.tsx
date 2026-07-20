import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import VisualNovelStage, {
  type VisualNovelStageProps,
} from '../ui/visualNovel/VisualNovelStage'
import { INTRO_STORY } from '../data/introStory'

const meta = {
  title: 'Design System/Visual Novel/Stage',
  component: VisualNovelStage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '좌·우 캐릭터 슬롯(이미지 자리) + 하단 자막. 클릭/Space로 타이핑 스킵·다음 대사.',
      },
    },
  },
} satisfies Meta<typeof VisualNovelStage>

export default meta
type Story = StoryObj<typeof meta>

function StageDemo(props: VisualNovelStageProps) {
  const [done, setDone] = useState(false)
  if (done) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: '#1a2744',
          background: 'linear-gradient(180deg, #9bb6e8, #5f7fc2)',
        }}
      >
        스토리 종료 (게임에서는 준비 페이즈로 이동)
      </div>
    )
  }
  return <VisualNovelStage {...props} onComplete={() => setDone(true)} />
}

export const EmptyPlaceholders: Story = {
  args: {
    lines: INTRO_STORY,
  },
  render: (args) => <StageDemo {...args} />,
}

export const SingleLine: Story = {
  args: {
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
