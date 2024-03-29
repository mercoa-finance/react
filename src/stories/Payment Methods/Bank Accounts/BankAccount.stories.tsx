import type { Meta, StoryObj } from '@storybook/react'
import { BankAccountComponent } from '../../../components'
import { payerBankAccount } from '../../mockData'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Payment Methods/Bank Account/Bank Account Details',
  component: BankAccountComponent,
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
} satisfies Meta<typeof BankAccountComponent>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  name: 'Existing Bank Account',
  args: {
    account: payerBankAccount,
  },
}

export const Edit: Story = {
  name: 'Edit Existing Bank Account',
  args: {
    account: payerBankAccount,
    showEdit: true,
  },
}

export const Selected: Story = {
  name: 'Selected Bank Account',
  args: {
    account: payerBankAccount,
    selected: true,
  },
}

export const New: Story = {
  name: 'Add New Bank Account',
  args: {
    onSelect: (e) => {
      console.log(e)
    },
  },
}
