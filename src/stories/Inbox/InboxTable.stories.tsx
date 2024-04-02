import { Mercoa } from '@mercoa/javascript'
import type { Meta, StoryObj } from '@storybook/react'
import { InvoiceTable } from '../../components/Inbox'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Invoice Inbox/Invoice Table',
  component: InvoiceTable,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'padded',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: [''],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
} satisfies Meta<typeof InvoiceTable>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  name: 'Default',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
    search: '',
  },
}

export const Column: Story = {
  name: 'Custom Columns',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
    search: '',
    columns: [
      {
        title: 'Merchant',
        field: 'vendor',
        orderBy: Mercoa.InvoiceOrderByField.VendorName,
      },
      {
        title: 'Amount',
        field: 'amount',
        orderBy: Mercoa.InvoiceOrderByField.Amount,
      },
      {
        title: 'Project ID',
        field: 'metadata.projectId',
        format: (value) => {
          const v = JSON.parse(value as string) as any
          return (
            <a href={`https://acme.com/projects/${v}`} className="hover:mercoa-underline">
              {v}
            </a>
          )
        },
      },
    ],
  },
}

export const Search: Story = {
  name: 'Vendor Search Filter',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
    search: 'Umb',
  },
}

/** This is a description of the foo function. */
export const Custom: Story = {
  name: 'Custom Design',
  args: {
    statuses: Object.values(Mercoa.InvoiceStatus),
    search: '',
    children: ({ invoices, hasNext, getNext, hasPrevious, getPrevious, setResultsPerPage }) => {
      return (
        <div style={{ maxWidth: '800px', margin: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '5px' }}>
            {invoices.map((invoice) => (
              <div key={invoice.id} style={{ padding: '5px', border: '1px solid #eee' }}>
                <p style={{ fontWeight: 'bold' }}>{invoice.vendor?.name ?? 'N/A'}</p>
                <p style={{ textDecoration: 'underline' }}>{invoice.metadata.projectId}</p>
                <p>Amount: ${invoice.amount}</p>
                <p>Due: {invoice.dueDate?.toDateString()}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
            <button
              style={{ padding: '5px', border: '1px solid #eee', color: hasPrevious ? '#000' : '#ccc' }}
              disabled={!hasPrevious}
              onClick={getPrevious}
            >
              Previous
            </button>
            <button
              style={{ padding: '5px', border: '1px solid #eee', color: hasNext ? '#000' : '#ccc' }}
              disabled={!hasNext}
              onClick={getNext}
            >
              Next
            </button>
          </div>
        </div>
      )
    },
  },
}
