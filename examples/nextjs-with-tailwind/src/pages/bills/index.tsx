import { Mercoa } from '@mercoa/javascript'
import { InvoiceInbox, MercoaButton, MercoaSession, useMercoaSession } from '@mercoa/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Bills() {
  const router = useRouter()

  const [mercoaToken, setMercoaToken] = useState<string>()

  const mercoaSession = useMercoaSession()

  useEffect(() => {
    fetch('/api/getMercoaToken')
      .then((res) => res.text())
      .then((data) => {
        setMercoaToken(data)
      })
  })

  if (!mercoaToken) return <div>loading...</div>

  return (
    <MercoaSession token={mercoaToken}>
      <div className="container m-auto mt-10">
        <div className="mercoa-flex mercoa-items-center mercoa-mt-8">
          {mercoaSession.organization?.emailProvider?.inboxDomain && (
            <div className="mercoa-text-sm mercoa-text-gray-700">
              Forward invoices to:{' '}
              <b>
                {mercoaSession.entity?.emailTo || 'test'}@{mercoaSession.organization?.emailProvider?.inboxDomain}
              </b>
            </div>
          )}

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
        <InvoiceInbox
          statusSelectionStyle="dropdown"
          onSelectInvoice={(invoice: Mercoa.InvoiceResponse) => {
            router.push(`/bills/${invoice.id}`)
          }}
        />
      </div>
    </MercoaSession>
  )
}
