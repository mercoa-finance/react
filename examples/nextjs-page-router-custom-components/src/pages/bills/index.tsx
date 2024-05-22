import { Mercoa } from '@mercoa/javascript'
import {
  DebouncedSearch,
  EntityInboxEmail,
  InvoiceMetrics,
  MercoaButton,
  PayablesTable,
  StatusTabs,
} from '@mercoa/react'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Bills() {
  const router = useRouter()

  const [selectedStatuses, setSelectedStatuses] = useState<Mercoa.InvoiceStatus[]>([Mercoa.InvoiceStatus.Draft])
  const [search, setSearch] = useState<string>()

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
        <InvoiceMetrics statuses={selectedStatuses} search={search} />

        <StatusTabs search={search} onStatusChange={setSelectedStatuses} />
        <div className="mercoa-grid mercoa-grid-cols-2 mercoa-mt-2">
          <DebouncedSearch placeholder="Search Vendors, Invoice #, Amount" onSettle={setSearch} />
        </div>
        <PayablesTable
          statuses={selectedStatuses}
          search={search}
          onSelectInvoice={(invoice) => {
            router.push(`/bills/${invoice.id}`)
          }}
          columns={[
            {
              title: 'Merchant',
              field: 'vendor',
            },
            {
              title: 'Amount',
              field: 'amount',
            },
            {
              title: 'Project ID',
              field: 'metadata.projectId',
              format: (value) => {
                if (value) {
                  const v = JSON.parse(value as string) as any
                  return (
                    <a href={`https://acme.com/projects/${v}`} className="hover:mercoa-underline">
                      {v}
                    </a>
                  )
                } else {
                  return <></>
                }
              },
            },
          ]}
        />
      </div>
    </div>
  )
}
