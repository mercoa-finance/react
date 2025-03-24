import { EntityInboxEmail, MercoaButton, PayablesDashboardV2 } from '@mercoa/react'
import { useRouter } from 'next/router'

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
        {/* <Payables
          onSelectInvoice={(invoice) => {
            router.push(`/bills/${invoice.id}`)
          }}
        /> */}
        <PayablesDashboardV2
          onSelectInvoice={(invoice) => {
            router.push(`/bills/${invoice.id}`)
          }}
        />
      </div>
    </div>
  )
}
