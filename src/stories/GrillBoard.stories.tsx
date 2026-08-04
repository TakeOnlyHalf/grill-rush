import type { Meta, StoryObj } from '@storybook/react-vite'
import GrillBoard from '../components/GrillBoard'
import { grillIngredients } from '../grill/grillIngredients'
import { createIdleGrillSlots, type GrillSlot } from '../grill/grillSlots'

const LONG_DURATION = 1_000_000_000

function slotAt(index: number, ingredientId: string, progress: number): GrillSlot {
  return {
    id: `grill-${index + 1}`,
    status: progress > 1 ? 'burnt' : 'cooking',
    ingredientId,
    startedAt: Date.now() - progress * LONG_DURATION,
    cookDurationMs: LONG_DURATION,
  }
}

const defaultInventory = {
  egg: 3,
  bacon: 2,
  corn: 4,
}

const meta = {
  title: 'Game/Grill Board',
  component: GrillBoard,
  tags: ['autodocs'],
  args: {
    ingredients: grillIngredients,
    height: 350,
  },
  parameters: {
    docs: {
      description: {
        component:
          '영업 화면과 동일한 PixiJS 그릴 및 재료 트레이. 트레이를 한 번 클릭하면 첫 빈 슬롯에 즉시 투입됩니다.',
      },
    },
  },
} satisfies Meta<typeof GrillBoard>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyTray: Story = {
  name: '재료가 없는 빈 트레이',
  args: {
    initialSlots: createIdleGrillSlots(),
    inventory: {},
  },
}

export const DefaultGrill: Story = {
  name: '재고가 있는 기본 그릴',
  args: {
    initialSlots: createIdleGrillSlots(),
    inventory: defaultInventory,
    neededIngredientIds: ['egg', 'bacon'],
  },
}

export const ExpandedGrill: Story = {
  name: '주방 확장 Lv.1 · 4슬롯',
  args: {
    initialSlots: createIdleGrillSlots(4),
    inventory: defaultInventory,
    neededIngredientIds: ['egg', 'bacon'],
  },
}

export const LevelTwoExpansion: Story = {
  name: '주방 확장 Lv.2 · 5슬롯',
  args: {
    initialSlots: createIdleGrillSlots(5),
    inventory: defaultInventory,
    neededIngredientIds: ['egg', 'bacon'],
  },
}

export const LevelThreeExpansion: Story = {
  name: '주방 확장 Lv.3 · 6슬롯',
  args: {
    initialSlots: createIdleGrillSlots(6),
    inventory: defaultInventory,
    neededIngredientIds: ['egg', 'bacon'],
  },
}

export const MixedCookResults: Story = {
  name: 'Raw · Good · Perfect · Danger · Burnt',
  args: {
    initialSlots: [
      slotAt(0, 'egg', 0.2),
      slotAt(1, 'bacon', 0.55),
      slotAt(2, 'corn', 0.78),
    ],
    inventory: {
      egg: 1,
      bacon: 1,
      corn: 1,
      patty: 1,
      steak: 1,
    },
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <GrillBoard {...args} />
      <GrillBoard
        {...args}
        initialSlots={[
          slotAt(0, 'patty', 0.95),
          slotAt(1, 'steak', 1.1),
          createIdleGrillSlots()[2],
        ]}
      />
    </div>
  ),
}

export const PartiallySoldOut: Story = {
  name: '일부 재료가 품절된 상태',
  args: {
    initialSlots: createIdleGrillSlots(),
    inventory: {
      egg: 0,
      bacon: 2,
      corn: 0,
      patty: 1,
    },
  },
}

export const FullGrill: Story = {
  name: '그릴이 가득 찬 상태',
  args: {
    initialSlots: [
      slotAt(0, 'egg', 0.25),
      slotAt(1, 'bacon', 0.72),
      slotAt(2, 'corn', 0.93),
    ],
    inventory: defaultInventory,
  },
}

export const FullExpandedGrill: Story = {
  name: '주방 확장 Lv.1 · 4슬롯 모두 사용 중',
  args: {
    initialSlots: [
      slotAt(0, 'egg', 0.25),
      slotAt(1, 'bacon', 0.55),
      slotAt(2, 'corn', 0.72),
      slotAt(3, 'steak', 0.93),
    ],
    inventory: defaultInventory,
  },
}

export const FullLevelTwoExpansion: Story = {
  name: '주방 확장 Lv.2 · 5슬롯 모두 사용 중',
  args: {
    initialSlots: [
      slotAt(0, 'egg', 0.25),
      slotAt(1, 'bacon', 0.42),
      slotAt(2, 'corn', 0.58),
      slotAt(3, 'patty', 0.72),
      slotAt(4, 'steak', 0.93),
    ],
    inventory: defaultInventory,
  },
}

export const FullLevelThreeExpansion: Story = {
  name: '주방 확장 Lv.3 · 6슬롯 모두 사용 중',
  args: {
    initialSlots: [
      slotAt(0, 'egg', 0.2),
      slotAt(1, 'bacon', 0.35),
      slotAt(2, 'corn', 0.5),
      slotAt(3, 'patty', 0.65),
      slotAt(4, 'chicken', 0.8),
      slotAt(5, 'steak', 0.95),
    ],
    inventory: defaultInventory,
  },
}

export const ResultFeedback: Story = {
  name: '조리 판정 결과 피드백',
  args: {
    initialSlots: createIdleGrillSlots(),
    inventory: defaultInventory,
    initialFeedback: 'perfect',
  },
  argTypes: {
    initialFeedback: {
      control: 'select',
      options: ['raw', 'good', 'perfect', 'danger', 'burnt'],
    },
  },
}
