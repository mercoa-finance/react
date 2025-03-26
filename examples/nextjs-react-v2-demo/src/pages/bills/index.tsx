import { Payables } from '@mercoa/react'
import { useRouter } from 'next/router'

export default function Bills() {
  const router = useRouter()

  return (
    <div className="container m-auto mt-10">
      <Payables
        handlers={{
          onSelectInvoice: (invoice) => {
            router.push(`/bills/${invoice.id}`)
          },
        }}
      />
    </div>
  )
}
