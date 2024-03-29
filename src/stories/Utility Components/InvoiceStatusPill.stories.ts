import type { Meta, StoryObj } from '@storybook/react'
import { InvoiceStatusPill } from '../../components/Inbox'
import {
  inv_approved,
  inv_archived,
  inv_canceled,
  inv_draft_incomplete,
  inv_draft_ready,
  inv_failed,
  inv_new_incomplete,
  inv_new_ready,
  inv_paid,
  inv_pending,
  inv_rejected,
  inv_scheduled,
} from '../mockData'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Utility/Invoice Status Pill',
  component: InvoiceStatusPill,
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
} satisfies Meta<typeof InvoiceStatusPill>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const DraftIncomplete: Story = {
  name: 'Draft Incomplete',
  args: {
    invoice: inv_draft_incomplete,
  },
}

export const DraftReady: Story = {
  name: 'Draft Ready',
  args: {
    invoice: inv_draft_ready,
  },
}

export const NewIncomplete: Story = {
  name: 'New Incomplete',
  args: {
    invoice: inv_new_incomplete,
  },
}

export const NewReady: Story = {
  name: 'New Ready',
  args: {
    invoice: inv_new_ready,
  },
}

export const Approved: Story = {
  name: 'Approved',
  args: {
    invoice: inv_approved,
  },
}

export const Rejected: Story = {
  name: 'Rejected',
  args: {
    invoice: inv_rejected,
  },
}

export const Scheduled: Story = {
  name: 'Scheduled',
  args: {
    invoice: inv_scheduled,
  },
}

export const Pending: Story = {
  name: 'Pending',
  args: {
    invoice: inv_pending,
  },
}

export const Paid: Story = {
  name: 'Paid',
  args: {
    invoice: inv_paid,
  },
}

export const Canceled: Story = {
  name: 'Canceled',
  args: {
    invoice: inv_canceled,
  },
}

export const Failed: Story = {
  name: 'Failed',
  args: {
    invoice: inv_failed,
  },
}

export const Archived: Story = {
  name: 'Archived',
  args: {
    invoice: inv_archived,
  },
}
