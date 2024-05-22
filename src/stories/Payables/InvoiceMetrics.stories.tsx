import { Mercoa } from '@mercoa/javascript'
import type { Meta, StoryObj } from '@storybook/react'
import { InvoiceMetrics } from '../../components/Payables'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Payables/Metrics',
  component: InvoiceMetrics,
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
} satisfies Meta<typeof InvoiceMetrics>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

export const Default: Story = {
  name: 'Single Status',
  args: {
    statuses: [Mercoa.InvoiceStatus.New],
  },
}

export const Multi: Story = {
  name: 'Multiple Statuses',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
  },
}

export const Search: Story = {
  name: 'Vendor Search Filter',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
    search: 'Umb',
  },
}
