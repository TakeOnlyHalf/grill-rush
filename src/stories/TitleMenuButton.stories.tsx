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
          'title_day 톤 — 밝은 나무 이정표(`wood`)와 양피지 배너(`chalk`).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['wood', 'chalk'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    children: '이어서 하기',
    variant: 'wood',
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="title-stage title-stage--story">
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

export const Wood: Story = {}

export const Chalk: Story = {
  args: {
    variant: 'chalk',
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
      <TitleMenuButton disabled>이어서 하기</TitleMenuButton>
      <TitleMenuButton>처음부터</TitleMenuButton>
      <TitleMenuButton variant="chalk">옵션</TitleMenuButton>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story: '타이틀 화면에 배치되는 실제 메뉴 구성',
      },
    },
  },
}
