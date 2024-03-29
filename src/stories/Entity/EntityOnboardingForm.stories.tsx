import type { Meta, StoryObj } from '@storybook/react'
import { EntityOnboarding } from '../../components'
import { payerEntity, vendorEntities } from '../mockData'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Entity/Entity Onboarding Form',
  component: EntityOnboarding,
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
} satisfies Meta<typeof EntityOnboarding>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Payor: Story = {
  name: 'Payor (payer) Entity',
  args: {
    entity: payerEntity,
    type: 'payor',
    setEntityData: (e) => {
      alert(JSON.stringify(e))
    },
  },
}

export const Payee: Story = {
  name: 'Payee (vendor) Entity',
  args: {
    entity: vendorEntities[0],
    type: 'payee',
    setEntityData: (e) => {
      alert(JSON.stringify(e))
    },
  },
}
