import { MercoaButton, ReceivableDetails } from '@mercoa/react'
import { useRouter } from 'next/router'

export default function Bills() {
  const router = useRouter()

  const invoiceIdParam = router.query.invoiceId as string

  let invoiceId: string | undefined = invoiceIdParam

  // If the page router is set to "new", we should set the invoiceId to undefined
  // so that the component renders a blank invoice creation page
  if (invoiceIdParam === 'new') {
    invoiceId = undefined
  }

  return (
    <div className="container m-auto mt-10">
      <MercoaButton
        isEmphasized={false}
        type="button"
        className="ml-2 inline-flex text-sm"
        onClick={() => {
          router.push(`/bills`)
        }}
      >
        Back
      </MercoaButton>
      <ReceivableDetails
        queryOptions={{
          invoiceType: 'invoice',
          invoiceId,
        }}
        config={{
          supportedCurrencies: ['USD'],
          disableCustomerCreation: true,
        }}
        handlers={{
          onInvoiceUpdate: (invoice) => {
            if (invoice) router.push(`/invoices/${invoice.id}`)
          },
        }}
      />
    </div>
  )
}
