import { Mercoa } from '@mercoa/javascript'
import type { Meta, StoryObj } from '@storybook/react'
import { Counterparties } from '../../components'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Vendors/Manage',
  component: Counterparties,
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
} satisfies Meta<typeof Counterparties>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

export const Default: Story = {
  name: 'Manage Vendors',
  args: {
    type: 'payee',
  },
}

const filterStatus: Mercoa.InvoiceStatus[] = [
  Mercoa.InvoiceStatus.Draft,
  Mercoa.InvoiceStatus.New,
  Mercoa.InvoiceStatus.Approved,
  Mercoa.InvoiceStatus.Scheduled,
]

export const Custom: Story = {
  name: 'Custom UI',
  args: {
    type: 'payee',
    children({
      setSearch,
      dataLoaded,
      hasNext,
      getNext,
      hasPrevious,
      getPrevious,
      resultsPerPage,
      setResultsPerPage,
      counterparties,
    }) {
      return (
        <table className="mercoa-min-w-full mercoa-leading-normal">
          <thead>
            <tr>
              {['Vendor', 'Total bills', 'Total Payments'].map((text, index) => (
                <th
                  key={index}
                  className="mercoa-px-5 mercoa-py-3 mercoa-border-b-2 mercoa-text-left mercoa-text-xs mercoa-font-semibold mercoa-text-gray-600 mercoa-uppercase tracking-wider"
                >
                  {text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {counterparties.map((counterparty, rowIndex) => (
              <tr key={rowIndex} className="mercoa-cursor-pointer hover:mercoa-bg-gray-100 mercoa-bg-white">
                <td className="mercoa-px-5 mercoa-py-5 mercoa-border-b mercoa-border-gray-200 mercoa-text-sm">
                  <span className="mercoa-inline-flex mercoa-h-7 mercoa-w-7 mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-bg-[#F6F3EE] mercoa-mr-2">
                    <span className="mercoa-text-xs mercoa-font-medium mercoa-leading-none mercoa-text-gray-800">
                      {counterparty?.name.charAt(0) ?? '' + counterparty?.name.charAt(1)}
                    </span>
                  </span>
                  {counterparty.name}
                </td>
                <td className="mercoa-px-5 mercoa-py-5 mercoa-border-b mercoa-border-gray-200 mercoa-text-sm">
                  {counterparty.invoiceMetrics?.totalCount}
                </td>
                <td className="mercoa-px-5 mercoa-py-5 mercoa-border-b mercoa-border-gray-200 mercoa-text-sm">
                  $ {counterparty.invoiceMetrics?.totalAmount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    },
  },
}
