import { Mercoa } from '@mercoa/javascript'
import type { Meta, StoryObj } from '@storybook/react'
import { Receivables } from '../../components/Receivables'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Receivables/Invoices',
  component: Receivables,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'padded',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
} satisfies Meta<typeof Receivables>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  name: 'Default',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
  },
}

export const Column: Story = {
  name: 'Dropdown',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
    statusSelectionStyle: 'dropdown',
  },
}
