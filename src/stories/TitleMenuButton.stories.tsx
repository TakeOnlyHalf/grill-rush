import type { Meta, StoryObj } from '@storybook/react-vite'
import TitleMenuButton from '../ui/TitleMenuButton'
import { TITLE_DAY_ART } from '../utils/assets'

const meta = {
  title: 'Design System/TitleMenuButton',
  component: TitleMenuButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '타이틀 메뉴 버튼 — 종이/천 질감, 따뜻한 갈색 외곽선, primary/secondary/tertiary 계층.',
      },
    },
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
    },
    icon: {
      control: 'select',
      options: ['none', 'continue', 'new', 'options'],
    },
    variant: {
      control: 'select',
      options: ['wood', 'chalk'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    children: '이어서 하기',
    tone: 'primary',
    icon: 'continue',
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="title-stage title-stage--story">
        <img className="title-art-bleed" src={TITLE_DAY_ART} alt="" aria-hidden />
        <img className="title-art" src={TITLE_DAY_ART} alt="" />
        <div className="title-actions">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof TitleMenuButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: {
    tone: 'secondary',
    icon: 'new',
    children: '처음부터',
  },
}

export const Tertiary: Story = {
  args: {
    tone: 'tertiary',
    icon: 'options',
    children: '옵션',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '이어서 하기',
  },
}

export const TitleMenu: Story = {
  render: () => (
    <>
      <TitleMenuButton tone="primary" icon="continue">
        이어서 하기
      </TitleMenuButton>
      <TitleMenuButton tone="secondary" icon="new">
        처음부터
      </TitleMenuButton>
      <TitleMenuButton tone="tertiary" icon="options">
        옵션
      </TitleMenuButton>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: '저장 데이터가 있을 때의 타이틀 메뉴 계층',
      },
    },
  },
}
