import type { Meta, StoryObj } from '@storybook/react-vite'
import Panel from '../ui/Panel'
import Button from '../ui/Button'

const meta = {
  title: 'Design System/Panel',
  component: Panel,
  tags: ['autodocs'],
  args: {
    title: '위치 선택',
  },
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Panel {...args}>
      <p className="muted" style={{ margin: 0 }}>
        구역을 고르고 자릿세를 확인하세요.
      </p>
    </Panel>
  ),
}

export const WithActions: Story = {
  render: () => (
    <Panel title="오늘의 요약">
      <ul className="summary-list">
        <li>예상 손님 약 80명</li>
        <li>판매 메뉴 2종</li>
      </ul>
      <div style={{ marginTop: '0.75rem' }}>
        <Button variant="primary">▶ 영업 시작</Button>
      </div>
    </Panel>
  ),
}

export const TodoNote: Story = {
  render: () => (
    <Panel title="개발 힌트">
      <p className="todo-note" style={{ margin: 0 }}>
        TODO: 도시 맵 시각화, Day1 튜토리얼 강제 진행
      </p>
    </Panel>
  ),
}
