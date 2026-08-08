import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import CustomerQueue from '../components/CustomerQueue'
import { ActionTypes } from '../state/actions'
import { useGameDispatch } from '../state/GameContext'
import { createInitialState } from '../state/initialState'
import type { Customer, GameState, Order } from '../types/game'
import { withGame } from './decorators'

const customerPresets = [
  { type: 'office', typeName: '직장인', icon: '👔', tipChance: 0.15 },
  { type: 'student', typeName: '학생', icon: '🎒', tipChance: 0.08 },
  { type: 'family', typeName: '가족', icon: '👨‍👩‍👧', tipChance: 0.12 },
  { type: 'tourist', typeName: '관광객', icon: '📷', tipChance: 0.2 },
] as const

function menuName(menuId: string): string {
  if (menuId === 'egg_bacon') return '에그 & 베이컨'
  if (menuId === 'grilled_corn') return '그릴 옥수수'
  return '그릴 소시지'
}

function queueState(
  menuGroups: string[][],
  completed?: { customerIndex: number; orderIndex: number },
): GameState {
  const customers: Customer[] = menuGroups.map((menuIds, customerIndex) => {
    const preset = customerPresets[customerIndex % customerPresets.length]
    return {
      id: `storybook-customer-${customerIndex}`,
      ...preset,
      orderedMenuIds: menuIds,
      orderedMenuNames: menuIds.map(menuName),
      patience: 18 + customerIndex,
      maxPatience: 25,
    }
  })
  const orders: Order[] = menuGroups.flatMap((menuIds, customerIndex) => menuIds.map(
    (menuId, orderIndex) => {
      const isCompleted = completed?.customerIndex === customerIndex
        && completed.orderIndex === orderIndex
      return {
        id: `storybook-order-${customerIndex}-${orderIndex}`,
        customerId: customers[customerIndex].id,
        menuId,
        status: isCompleted ? 'done' : 'queued',
        servedAmount: isCompleted ? 4_500 : undefined,
        satisfaction: isCompleted ? 0.8 : undefined,
      }
    },
  ))
  return {
    ...createInitialState(),
    phase: 'open',
    customers,
    orders,
  }
}

function QueueScenario({ state }: { state: GameState }) {
  const dispatch = useGameDispatch()
  useEffect(() => {
    dispatch({ type: ActionTypes.LOAD_GAME, payload: state })
  }, [dispatch, state])

  return (
    <div style={{ width: '114rem', height: '11rem', padding: '0.5rem', background: '#211a15' }}>
      <CustomerQueue />
    </div>
  )
}

const singleOrderState = queueState([['egg_bacon']])
const twoOrderState = queueState([['egg_bacon', 'grilled_corn']])
const mixedOrderState = queueState([
  ['egg_bacon'],
  ['grilled_corn', 'grilled_sausage'],
  ['grilled_sausage'],
  ['egg_bacon', 'grilled_corn'],
])
const partiallyServedState = queueState(
  [['egg_bacon', 'grilled_corn'], ['grilled_sausage']],
  { customerIndex: 0, orderIndex: 0 },
)

const meta = {
  title: 'Game/Customer Queue',
  component: CustomerQueue,
  tags: ['autodocs'],
  decorators: [withGame()],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '손님 초상화 옆에 아직 서빙하지 않은 메뉴를 최대 2개까지 가로로 표시합니다.',
      },
    },
  },
} satisfies Meta<typeof CustomerQueue>

export default meta
type Story = StoryObj<typeof meta>

export const SingleOrder: Story = {
  name: '메뉴 1개 주문',
  render: () => <QueueScenario state={singleOrderState} />,
}

export const TwoOrders: Story = {
  name: '서로 다른 메뉴 2개 주문',
  render: () => <QueueScenario state={twoOrderState} />,
}

export const MixedWidths: Story = {
  name: '1개 → 2개 → 1개 → 2개 혼합',
  render: () => <QueueScenario state={mixedOrderState} />,
}

export const PartiallyServed: Story = {
  name: '첫 메뉴 서빙 완료',
  render: () => <QueueScenario state={partiallyServedState} />,
}
