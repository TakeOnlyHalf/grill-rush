import type { Meta, StoryObj } from '@storybook/react-vite'
import DialogueBox from '../ui/visualNovel/DialogueBox'
import { DAY_STREET_BG } from '../utils/assets'

const meta = {
  title: 'Design System/Visual Novel/DialogueBox',
  component: DialogueBox,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '비주얼 노벨 하단 자막창. day_street 톤 — 프로스티 화이트 + 시폼 틸 악센트.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        className="phase-story"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <img
          src={DAY_STREET_BG}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 'auto 0 0',
            height: '42%',
            background:
              'linear-gradient(180deg, transparent, rgba(240,248,252,0.55))',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Story />
        </div>
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
