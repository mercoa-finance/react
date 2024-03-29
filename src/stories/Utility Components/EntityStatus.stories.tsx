import { Mercoa } from '@mercoa/javascript'
import type { Meta, StoryObj } from '@storybook/react'
import { EntityStatus } from '../../components'
import { payerEntity } from '../mockData'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Utility/Entity Status Pill',
  component: EntityStatus,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
} satisfies Meta<typeof EntityStatus>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  name: 'Current Entity',
  args: {},
}

export const Unverified: Story = {
  name: 'Unverified Entity',
  args: {
    entity: {
      ...payerEntity,
      status: Mercoa.EntityStatus.Unverified,
    },
  },
}

export const Pending: Story = {
  name: 'Pending KYB Entity',
  args: {
    entity: {
      ...payerEntity,
      status: Mercoa.EntityStatus.Pending,
    },
  },
}

export const Verified: Story = {
  name: 'Verified KYB Entity',
  args: {
    entity: {
      ...payerEntity,
      status: Mercoa.EntityStatus.Verified,
    },
  },
}

export const Failed: Story = {
  name: 'Failed KYB Entity',
  args: {
    entity: {
      ...payerEntity,
      status: Mercoa.EntityStatus.Failed,
    },
  },
}
