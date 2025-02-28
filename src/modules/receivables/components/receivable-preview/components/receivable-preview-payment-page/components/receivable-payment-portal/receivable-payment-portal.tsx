import { useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { LoadingSpinner, useMercoaSession } from '../../../../../../../../components'
import { ReceivableDetailsCardV2 } from './components/invoice-details-card'
import { MainCardV2 } from './components/main-card'
import { PaymentCompleteV2 } from './components/payment-complete'
import { VendorDetailsCard } from './components/vendor-details-card'

export function ReceivablePaymentPortalV2({
  isPreview,
  complete,
  invoice,
  supportEmail,
  totalDisplay,
  updateInvoice,
}: {
  isPreview?: boolean
  complete?: boolean
  invoice: Mercoa.InvoiceResponse
  supportEmail?: string
  totalDisplay: string
  updateInvoice: (updateRequest: Mercoa.InvoiceUpdateRequest) => Promise<void>
}) {
  const [selectedPaymentType, setSelectedPaymentType] = useState<Mercoa.PaymentMethodType | string>(
    Mercoa.PaymentMethodType.BankAccount,
  )

  const mercoaSession = useMercoaSession()

  if (!invoice || mercoaSession.isLoading) return <LoadingSpinner />

  const logo =
    invoice.vendor?.logo ??
    mercoaSession.organization?.logoUrl ??
    'https://storage.googleapis.com/mercoa-partner-logos/mercoa-logo.png'

  return (
    <div className="mercoa-min-h-full mercoa-w-full">
      <div className="mercoa-m-auto mercoa-h-28 mercoa-flex mercoa-items-center mercoa-max-w-5xl">
        <img src={logo} alt="logo" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }} />
      </div>
      {complete ? (
        <PaymentCompleteV2 invoice={invoice} totalDisplay={totalDisplay} />
      ) : (
        <div className="mercoa-m-auto mercoa-grid sm:mercoa-grid-cols-12 mercoa-max-w-5xl sm:mercoa-gap-x-4 mercoa-px-2 sm:mercoa-px-0 ">
          <div className="mercoa-col-span-12 sm:mercoa-col-span-8">
            <MainCardV2
              isPreview={isPreview}
              invoice={invoice}
              totalDisplay={totalDisplay}
              selectedPaymentType={selectedPaymentType}
              setSelectedPaymentType={setSelectedPaymentType}
              updateInvoice={updateInvoice}
            />
          </div>
          <aside className="mercoa-col-span-12 mercoa-mt-4 sm:mercoa-mt-0 sm:mercoa-col-span-4">
            <div className="mercoa-flex mercoa-flex-col mercoa-gap-y-5">
              <ReceivableDetailsCardV2 invoice={invoice} totalDisplay={totalDisplay} />
              {invoice.vendor && <VendorDetailsCard vendor={invoice.vendor} />}
            </div>
          </aside>
        </div>
      )}
      <div className="mercoa-mt-5 mercoa-p-2 mercoa-text-center mercoa-text-xs mercoa-text-gray-500">
        <b className="mercoa-mr-2">Have any questions?</b>
        <a href={`mailto:${supportEmail ?? 'support@mercoa.com'}`} target="_blank" rel="noreferrer">
          {supportEmail ?? 'support@mercoa.com'}
        </a>
      </div>
      <div className="mercoa-mt-5 mercoa-p-2 mercoa-text-center mercoa-text-xs mercoa-text-gray-500">
        <a href="https://mercoa.com/legal/privacy-policy" target="_blank" rel="noreferrer">
          Privacy Policy
        </a>{' '}
        |{' '}
        <a href="https://mercoa.com/legal/platform-agreement" target="_blank" rel="noreferrer">
          Terms of Service
        </a>
      </div>
    </div>
  )
}
