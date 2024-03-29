import type { Meta, StoryObj } from '@storybook/react'
import { InvoiceDetails } from '../../components'
import { inv_new_ready } from '../mockData'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Invoice/Invoice Form',
  component: InvoiceDetails,
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
} satisfies Meta<typeof InvoiceDetails>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

export const Default: Story = {
  name: 'Existing Invoice',
  args: {
    invoice: inv_new_ready,
    onRedirect: (invoice) => {
      console.log(invoice)
    },
  },
}

export const ID: Story = {
  name: 'Existing Invoice By ID',
  args: {
    invoiceId: inv_new_ready.id,
    onRedirect: (invoice) => {
      console.log(invoice)
    },
  },
}

export const New: Story = {
  name: 'Create New Invoice',
  args: {
    onRedirect: (invoice) => {
      console.log(invoice)
    },
  },
}