import accounting from 'accounting'
import dayjs from 'dayjs'
import QRCode from 'react-qr-code'
import { Mercoa } from '@mercoa/javascript'
import { LoadingSpinnerIcon, useMercoaSession } from '../../../../../../components'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'
import { useReceivableDetailsContext } from '../../../../providers/receivable-detail-provider'
import { LineItems } from './lineItems'

export function ReceivablePreviewPdfV2({
  invoice,
  hideQR = false,
}: {
  invoice?: Mercoa.InvoiceResponse
  hideQR?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const { paymentLink } = useReceivableDetailsContext()

  if (!invoice) return <LoadingSpinnerIcon />

  const payerAddress = invoice.payer?.profile?.individual?.address ?? invoice.payer?.profile?.business?.address
  const payerEmail = invoice.payer?.profile?.individual?.email ?? invoice.payer?.profile?.business?.email
  const vendorAddress = invoice.vendor?.profile?.individual?.address ?? invoice.vendor?.profile?.business?.address
  const vendorEmail = invoice.vendor?.profile?.individual?.email ?? invoice.vendor?.profile?.business?.email
  const logo =
    invoice.vendor?.logo ??
    mercoaSession.organization?.logoUrl ??
    'https://1000logos.net/wp-content/uploads/2021/04/ACME-logo.png'
  // 'https://storage.googleapis.com/mercoa-partner-logos/mercoa-logo.png'

  const invoiceHeader = (
    <div className="mercoa-flex mercoa-justify-between mercoa-mt-10">
      <div>
        <p className="mercoa-text-2xl mercoa-font-bold">Bill To:</p>
        <p className="mercoa-text-xl">{invoice.payer?.name}</p>
        {payerAddress?.addressLine1 && (
          <>
            <p>
              {payerAddress.addressLine1} {payerAddress.addressLine2}
            </p>
            <p>
              {payerAddress.city}, {payerAddress.stateOrProvince}, {payerAddress.postalCode}
            </p>
          </>
        )}
        {payerEmail && <p>{payerEmail}</p>}
      </div>

      <div className="mercoa-border-l-2 mercoa-border-gray-500 mercoa-pl-6">
        {logo && <img src={logo} alt="logo" width={150} />}
        <p className="mercoa-text-xl mercoa-mt-2">{invoice.vendor?.name}</p>
        {vendorAddress?.addressLine1 && (
          <>
            <p>
              {vendorAddress.addressLine1} {vendorAddress.addressLine2}
            </p>
            <p>
              {vendorAddress.city}, {vendorAddress.stateOrProvince}, {vendorAddress.postalCode}
            </p>
          </>
        )}
        {vendorEmail && <p>{vendorEmail}</p>}
      </div>
    </div>
  )

  const invoiceNumberAndDate = (
    <div className="mercoa-flex mercoa-justify-between mercoa-mt-10">
      <div className="mercoa-text-5xl mercoa-font-medium">INVOICE</div>
      <div>
        <div className="mercoa-flex mercoa-justify-between">
          <span className="mercoa-text-gray-500">Invoice #:</span>
          <span className="mercoa-text-gray-800 mercoa-pl-2">{invoice.invoiceNumber}</span>
        </div>
        <div className="mercoa-flex mercoa-justify-between">
          <span className="mercoa-text-gray-500">Issued:</span>
          <span className="mercoa-text-gray-800 mercoa-pl-2">{dayjs(invoice.invoiceDate).format('MMM DD, YYYY')}</span>
        </div>
        <div className="mercoa-flex mercoa-justify-between">
          <span className="mercoa-text-gray-500">Due:</span>
          <span className="mercoa-text-gray-800 mercoa-pl-2">{dayjs(invoice.dueDate).format('MMM DD, YYYY')}</span>
        </div>

        {mercoaSession.organization?.metadataSchema?.map((schema) => {
          if (invoice.metadata[schema.key]) {
            return (
              <div key={schema.key}>
                <span className="mercoa-text-gray-500">{schema.displayName}</span>
                {/* TODO: format based on schema type */}
                <span className="mercoa-text-gray-800 mercoa-pl-2">{invoice.metadata[schema.key]}</span>
              </div>
            )
          }
        })}
      </div>
    </div>
  )

  const invoiceTotal = (
    <div className="mercoa-flex mercoa-justify-end mercoa-mt-10 mercoa-text-xl">
      <div>
        <div className="mercoa-flex mercoa-justify-between mercoa-items-baseline">
          <div className="mercoa-text-gray-500">Total</div>
          <div className="mercoa-text-gray-800 mercoa-ml-4 mercoa-mr-1">{`${accounting.formatMoney(
            invoice.amount ?? 0,
            currencyCodeToSymbol(invoice.currency),
          )}`}</div>
          <div className="mercoa-text-gray-500 mercoa-text-xs">{invoice.currency}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="mercoa-container mercoa-mx-auto mercoa-mt-10">
      {invoiceHeader}
      {invoiceNumberAndDate}
      <LineItems lineItems={invoice.lineItems ?? []} />
      {invoiceTotal}

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
            <div>
              <QRCode
                size={75}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                value={paymentLink ?? mercoaSession.organization?.websiteUrl ?? 'https://mercoa.com'}
              />
              <div className="mercoa-text-gray-500 mercoa-text-sm mercoa-text-center">Scan to pay</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
