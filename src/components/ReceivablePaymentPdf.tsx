import accounting from 'accounting'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../lib/currency'
import { LoadingSpinner, useMercoaSession } from './index'

export function ReceivablePaymentPdfV1({
  invoice,
  hideQR = false,
}: {
  invoice?: Mercoa.InvoiceResponse
  hideQR?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [paymentLink, setPaymentLink] = useState<string>()

  useEffect(() => {
    if (paymentLink || !invoice?.id || !invoice?.payer || !mercoaSession.client) return
    // get payment link
    mercoaSession.client.invoice.paymentLinks
      .getPayerLink(invoice.id)
      .then((resp) => {
        setPaymentLink(resp)
      })
      .catch((e) => {
        console.error(e)
      })
  }, [paymentLink, invoice?.id, invoice?.payer, mercoaSession.client])

  if (!invoice || mercoaSession.isLoading) return <LoadingSpinner />

  const logo =
    invoice.vendor?.logo ??
    mercoaSession.organization?.logoUrl ??
    'https://storage.googleapis.com/mercoa-partner-logos/mercoa-logo.png'
  // 'https://1000logos.net/wp-content/uploads/2021/04/ACME-logo.png'

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

function InvoiceHeader({ invoice, logo }: { invoice: Mercoa.InvoiceResponse; logo: string }) {
  const payerAddress = invoice.payer?.profile?.individual?.address ?? invoice.payer?.profile?.business?.address
  const payerEmail = invoice.payer?.profile?.individual?.email ?? invoice.payer?.profile?.business?.email
  const vendorAddress = invoice.vendor?.profile?.individual?.address ?? invoice.vendor?.profile?.business?.address
  const vendorEmail = invoice.vendor?.profile?.individual?.email ?? invoice.vendor?.profile?.business?.email

  return (
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
        {logo && <img src={logo} alt="logo" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }} />}
        <p className="mercoa-text-xl mercoa-mt-2">
          {invoice.vendor?.profile?.business?.doingBusinessAs ?? invoice.vendor?.name}
        </p>
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
}

function InvoiceDetails({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
  const mercoaSession = useMercoaSession()

  return (
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

        {mercoaSession.organization?.metadataSchema?.map((schema: any) => {
          if (invoice.metadata[schema.key]) {
            return (
              <div key={schema.key}>
                <span className="mercoa-text-gray-500">{schema.displayName}</span>
                <span className="mercoa-text-gray-800 mercoa-pl-2">{invoice.metadata[schema.key]}</span>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}

// NOTE: \u2014 is an em dash character
function LineItems({ lineItems }: { lineItems: Mercoa.InvoiceLineItemResponse[] }) {
  return (
    <div className="mercoa-mt-10">
      {/* Header */}
      <div className="mercoa-grid mercoa-grid-cols-[2fr_1fr_1fr_1fr] mercoa-gap-4 mercoa-py-3.5 mercoa-font-semibold mercoa-text-gray-900 mercoa-border-b-[1px] mercoa-border-gray-500">
        <div className="mercoa-text-left">Item</div>
        <div className="mercoa-text-right">Quantity</div>
        <div className="mercoa-text-right">Unit Price</div>
        <div className="mercoa-text-right">Total</div>
      </div>

      {/* Line Items */}
      {lineItems.map((lineItem) => (
        <div
          key={lineItem.id}
          className="mercoa-grid mercoa-grid-cols-[2fr_1fr_1fr_1fr] mercoa-gap-4 mercoa-py-4 mercoa-border-b-[1px] mercoa-border-gray-300"
        >
          <div>
            <p className="mercoa-text-md mercoa-font-medium mercoa-text-gray-900">{lineItem.name}</p>
            <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-500">{lineItem.description}</p>
          </div>
          <div className="mercoa-text-gray-700 mercoa-text-right">{lineItem.quantity ?? '\u2014'}</div>
          <div className="mercoa-text-gray-700 mercoa-text-right">
            {lineItem.unitPrice !== undefined
              ? accounting.formatMoney(lineItem.unitPrice, {
                  symbol: currencyCodeToSymbol(lineItem.currency),
                  precision: 2,
                  format: {
                    pos: '%s%v',
                    neg: '-%s%v',
                    zero: '%s%v',
                  },
                })
              : '\u2014'}
          </div>
          <div className="mercoa-text-gray-800 mercoa-font-bold mercoa-text-right">
            {lineItem.amount !== undefined
              ? accounting.formatMoney(lineItem.amount, {
                  symbol: currencyCodeToSymbol(lineItem.currency),
                  precision: 2,
                  format: {
                    pos: '%s%v',
                    neg: '-%s%v',
                    zero: '%s%v',
                  },
                })
              : '\u2014'}
          </div>
        </div>
      ))}
    </div>
  )
}

function InvoiceTotal({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
  return (
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
}
