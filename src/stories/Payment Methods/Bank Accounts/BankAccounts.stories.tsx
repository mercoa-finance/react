import type { Meta, StoryObj } from '@storybook/react'
import { BankAccounts } from '../../../components'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Payment Methods/Bank Account/Bank Account List',
  component: BankAccounts,
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
} satisfies Meta<typeof BankAccounts>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  name: 'Show Existing Accounts',
  args: {},
}

export const Edit: Story = {
  name: 'Edit Existing Accounts',
  args: {
    showEdit: true,
  },
}

export const Add: Story = {
  name: 'Show All Existing Accounts With Add New Button',
  args: {
    showAdd: true,
  },
}

export const Verified: Story = {
  name: 'Show Only Verified (Can Send Funds) Accounts',
  args: {
    verifiedOnly: true,
  },
}
