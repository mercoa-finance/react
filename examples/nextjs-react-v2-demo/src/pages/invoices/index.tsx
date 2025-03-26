import { Receivables } from '@mercoa/react'
import { useRouter } from 'next/router'

export default function Bills() {
  const router = useRouter()

  return (
    <div className="container m-auto mt-10">
      <Receivables
        handlers={{
          onSelectInvoice: (invoice) => {
            router.push(`/invoices/${invoice.id}`)
          },
        }}
      />
    </div>
  )
}
