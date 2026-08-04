import type { Meta, StoryObj } from '@storybook/react-vite'
import GrillSlots from '../components/GrillSlots'
import type { GrillSlot } from '../grill/grillSlots'

const NOW = 10_000
const DURATION = 10_000

function slotAt(index: number, progress: number): GrillSlot {
  return {
    id: `grill-${index + 1}`,
    status: progress > 1 ? 'burnt' : 'cooking',
    ingredientId: ['egg', 'bacon', 'corn', 'patty', 'chicken', 'steak'][index] ?? 'egg',
    startedAt: NOW - progress * DURATION,
    cookDurationMs: DURATION,
  }
}

const meta = {
  title: 'Game/Grill Slots',
  component: GrillSlots,
  tags: ['autodocs'],
  args: {
    now: NOW,
    onCollect: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 520, height: 260, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: '실제 영업 화면에서 사용하는 DOM 그릴 슬롯과 완벽 타이밍 알림 상태.',
      },
    },
  },
} satisfies Meta<typeof GrillSlots>

export default meta
type Story = StoryObj<typeof meta>

export const AlarmNotOwned: Story = {
  name: '타이머 알람 미보유',
  args: {
    slots: [slotAt(0, 0.75), slotAt(1, 0.45), slotAt(2, 0.2)],
    alertingSlotIds: [],
  },
}

export const PerfectTimingAlert: Story = {
  name: '타이머 알람 보유 · 완벽 진입',
  args: {
    slots: [slotAt(0, 0.7), slotAt(1, 0.45), slotAt(2, 0.2)],
    alertingSlotIds: ['grill-1'],
  },
}

export const OneOfThreeAlerting: Story = {
  name: '3슬롯 중 하나 알림',
  args: {
    slots: [slotAt(0, 0.4), slotAt(1, 0.74), slotAt(2, 0.25)],
    alertingSlotIds: ['grill-2'],
  },
}

export const MultipleOfSixAlerting: Story = {
  name: '6슬롯 중 여러 슬롯 동시 알림',
  args: {
    slots: [
      slotAt(0, 0.71),
      slotAt(1, 0.5),
      slotAt(2, 0.73),
      slotAt(3, 0.25),
      slotAt(4, 0.78),
      slotAt(5, 0.4),
    ],
    alertingSlotIds: ['grill-1', 'grill-3', 'grill-5'],
  },
}

export const ReducedMotionStaticAlert: Story = {
  name: '모션 감소 · 정적 강조',
  args: {
    slots: [slotAt(0, 0.72), slotAt(1, 0.5), slotAt(2, 0.3)],
    alertingSlotIds: ['grill-1'],
  },
  parameters: {
    docs: {
      description: {
        story: '운영체제에서 모션 감소를 켜면 펄스 없이 금색 링·종·문구가 정적으로 유지됩니다.',
      },
    },
  },
}
