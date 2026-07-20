import type { Meta, StoryObj } from '@storybook/react-vite'
import DialogueBox from '../ui/visualNovel/DialogueBox'

const meta = {
  title: 'Design System/Visual Novel/DialogueBox',
  component: DialogueBox,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          '비주얼 노벨 하단 자막창. 화자 네임플레이트 + 타이핑 텍스트. 캐릭터 이미지는 별도 슬롯에 연결합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        className="phase-story"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1.5rem',
          background:
            'linear-gradient(180deg, #9bb6e8 0%, #7a9ad4 50%, #5f7fc2 100%)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DialogueBox>

export default meta
type Story = StoryObj<typeof meta>

export const Narration: Story = {
  args: {
    text: '낡은 푸드트럭 열쇠가 손안에서 가볍게 울렸다.',
    complete: true,
    typing: false,
  },
}

export const WithSpeaker: Story = {
  args: {
    speaker: '주인공',
    text: '여기가… 내가 물려받은 트럭이라고?',
    complete: true,
    typing: false,
  },
}

export const Typing: Story = {
  args: {
    speaker: '마을 사람',
    text: '어서 와. 이 골목은 오래전부터 좋은 냄새가 그리웠거든.',
    typing: true,
    complete: false,
  },
}
