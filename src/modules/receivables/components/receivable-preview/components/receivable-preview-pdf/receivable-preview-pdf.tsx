import QRCode from 'react-qr-code'
import { Mercoa } from '@mercoa/javascript'
import { LoadingSpinner, useMercoaSession } from '../../../../../../components'
import { useReceivableDetails } from '../../../../hooks/use-receivable-details'
import { InvoiceDetails } from './invoice-details'
import { InvoiceHeader } from './invoice-header'
import { InvoiceTotal } from './invoice-total'
import { LineItems } from './line-items'

export function ReceivablePreviewPdf({
  invoice,
  hideQR = false,
}: {
  invoice?: Mercoa.InvoiceResponse
  hideQR?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const { formContextValue } = useReceivableDetails()
  const { paymentMethodContextValue } = formContextValue
  const { paymentLink } = paymentMethodContextValue
  if (!invoice || mercoaSession.isLoading) return <LoadingSpinner />

  const logo =
    invoice.vendor?.logo ??
    mercoaSession.organization?.logoUrl ??
    'https://1000logos.net/wp-content/uploads/2021/04/ACME-logo.png'

  return (
    <div className="mercoa-container mercoa-mx-auto mercoa-mt-10">
      <InvoiceHeader invoice={invoice} logo={logo} />
      <InvoiceDetails invoice={invoice} />
      <LineItems lineItems={invoice.lineItems ?? []} />
      <InvoiceTotal invoice={invoice} />

      {!hideQR && (
        <div className="mercoa-absolute mercoa-left-0 mercoa-bottom-2 mercoa-items-center mercoa-w-full mercoa-px-9">
          <div className="mercoa-flex mercoa-justify-end mercoa-w-full mercoa-border-t mercoa-border-gray-300 mercoa-pt-5 mercoa-gap-x-4">
            <div>
              {invoice.paymentDestination?.type === Mercoa.PaymentMethodType.BankAccount && invoice.vendor && (
                <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-x-1 mercoa-text-sm mercoa-leading-5">
                  <span className="mercoa-text-gray-500 te">Account Holder</span>
                  <span className="mercoa-text-gray-800">{invoice.vendor.name}</span>
                  <span className="mercoa-text-gray-500">Bank Name</span>
                  <span className="mercoa-text-gray-800">{invoice.paymentDestination.bankName}</span>
                  <span className="mercoa-text-gray-500">Account Number</span>
                  <span className="mercoa-text-gray-800">{invoice.paymentDestination.accountNumber}</span>
                  <span className="mercoa-text-gray-500">Routing Number</span>
                  <span className="mercoa-text-gray-800">{invoice.paymentDestination.routingNumber}</span>
                </div>
              )}
            </div>
            {paymentLink && (
              <div>
                <QRCode
                  size={75}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  value={paymentLink ?? mercoaSession.organization?.websiteUrl ?? 'https://mercoa.com'}
                />
                <div className="mercoa-text-gray-500 mercoa-text-sm mercoa-text-center">Scan to pay</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
