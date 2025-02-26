import { EntityInboxEmail, MercoaButton, Payables } from '@mercoa/react'
import { useRouter } from 'next/router'
import { Mercoa} from '@mercoa/javascript'

export default function Bills() {
  const router = useRouter()

  return (
    <div className="container m-auto mt-10">
      <div className="mercoa-flex mercoa-items-center mercoa-mt-8">
        <div className="mercoa-text-sm mercoa-text-gray-700">
          Forward invoices to: <EntityInboxEmail />
        </div>
        <div className="mercoa-flex-grow" />
        <MercoaButton
          isEmphasized
          type="button"
          className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
          onClick={() => {
            router.push(`/bills/new`)
          }}
        >
          <span className="mercoa-hidden md:mercoa-inline-block">New Invoice</span>
        </MercoaButton>
      </div>
      <div className="mercoa-mt-8">
        <Payables
           displayOptions={{
            statusTabsOptions: {
              isVisible: true,
              statuses: [
                Mercoa.InvoiceStatus.Draft,
                Mercoa.InvoiceStatus.New,
                Mercoa.InvoiceStatus.Approved,
                Mercoa.InvoiceStatus.Scheduled,
                Mercoa.InvoiceStatus.Pending,
                Mercoa.InvoiceStatus.Paid,
                Mercoa.InvoiceStatus.Canceled,
                Mercoa.InvoiceStatus.Refused,
                Mercoa.InvoiceStatus.Failed,
                Mercoa.InvoiceStatus.Archived,
              ],
            },
          }}
          handlers={{
            onSelectInvoice: (invoice) => {
              router.push(`/bills/${invoice.id}`)
            },
          }}
        />
      </div>
    </div>
  )
}
