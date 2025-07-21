import accounting from 'accounting'
import dayjs from 'dayjs'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../lib/currency'

export function getStatusMessage(invoice: Mercoa.InvoiceResponse) {
  switch (invoice.status) {
    case Mercoa.InvoiceStatus.Paid:
    case Mercoa.InvoiceStatus.Archived:
      return {
        title: 'Payment Successful',
        subtitle: 'Your payment has been processed and settled successfully',
      }
    case Mercoa.InvoiceStatus.Pending:
      return {
        title: 'Payment On The Way',
        subtitle: 'Your payment is being processed and will arrive soon',
      }
    case Mercoa.InvoiceStatus.Scheduled:
      return {
        title: 'Payment Scheduled',
        subtitle: 'Your payment has been scheduled and will be processed on the due date',
      }
    default:
      return {
        title: 'Payment Confirmation',
        subtitle: 'Your payment details have been saved',
      }
  }
}

export function PaymentConfirmationPdf({
  invoice,
  fromName,
  existingMethods,
  paymentMethodSchemas,
  paymentTiming,
  logoUrl,
  supportEmail,
}: {
  invoice: Mercoa.InvoiceResponse
  fromName: string
  existingMethods: Array<Mercoa.PaymentMethodResponse>
  paymentMethodSchemas: Array<{
    name: string
    id: string
  }>
  paymentTiming: {
    estimatedProcessingDate: string
    businessDays: number
    estimatedProcessingTime: number
    estimatedSettlementDate: string
  } | null
  logoUrl?: string
  supportEmail?: string
}) {
  if (!invoice) return null

  const totalDisplay = accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))
  const logo = logoUrl ?? 'https://storage.googleapis.com/mercoa-partner-logos/mercoa.png'

  const statusInfo = getStatusMessage(invoice)

  function ReceiptItem({ title, value }: { title: string; value?: string }) {
    if (!invoice) return <></>
    return (
      <p className="mercoa-flex mercoa-text-sm">
        <span className="mercoa-text-gray-500">{title}</span>
        <span className="mercoa-flex-1" />
        <span className="mercoa-font-bold">{value}</span>
      </p>
    )
  }

  function typeToDisplay(
    req?: Mercoa.PaymentMethodResponse,
    schemas?: Array<{
      name: string
      id: string
    }>,
  ) {
    const type = req?.type
    if (type === Mercoa.PaymentMethodType.BankAccount) {
      return 'Bank Account'
    } else if (type === Mercoa.PaymentMethodType.Check) {
      return 'Check'
    } else if (type === Mercoa.PaymentMethodType.Custom) {
      return schemas?.find((e) => e.id === req?.schemaId)?.name
    } else {
      return 'Other'
    }
  }

  const paidStatuses = [Mercoa.InvoiceStatus.Paid, Mercoa.InvoiceStatus.Archived] as Mercoa.InvoiceStatus[]
  const postScheduledStatuses = [
    Mercoa.InvoiceStatus.Paid,
    Mercoa.InvoiceStatus.Archived,
    Mercoa.InvoiceStatus.Pending,
  ] as Mercoa.InvoiceStatus[]

  return (
    <div className="mercoa-container mercoa-mx-auto mercoa-mt-10 mercoa-max-w-3xl">
      {/* Header */}
      <div className="mercoa-flex mercoa-justify-between mercoa-mb-8">
        <div>
          <h1 className="mercoa-text-3xl mercoa-font-bold mercoa-text-gray-900">{statusInfo.title}</h1>
          <p className="mercoa-text-lg mercoa-text-gray-600">{statusInfo.subtitle}</p>
        </div>
        {logo && <img src={logo} alt="logo" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }} />}
      </div>

      {/* Total Amount */}
      <div className="mercoa-bg-gray-50 mercoa-rounded-lg mercoa-p-6 mercoa-mb-6">
        <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
          <span className="mercoa-text-lg mercoa-text-gray-600">Total Amount</span>
          <span className="mercoa-text-2xl mercoa-font-bold">{totalDisplay}</span>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="mercoa-bg-gray-50 mercoa-rounded-lg mercoa-p-6 mercoa-mb-6">
        <h2 className="mercoa-text-xl mercoa-font-bold mercoa-mb-4">Payment Receipt Details</h2>
        {[
          { key: 'From', value: fromName },
          {
            key: postScheduledStatuses.includes(invoice.status) ? 'Payment Date' : 'Scheduled Payment Date',
            value: invoice.deductionDate ? dayjs(invoice.deductionDate).format('MMM DD, YYYY') : 'N/A',
          },
          {
            key: paidStatuses.includes(invoice.status) ? 'Settlement Date' : 'Estimated Arrival Date',
            value: paymentTiming?.estimatedSettlementDate
              ? dayjs(paymentTiming.estimatedSettlementDate).format('MMM DD, YYYY')
              : 'N/A',
          },
          { key: 'Payment Id', value: invoice?.id },
          { key: 'Invoice Number', value: invoice?.invoiceNumber },
          {
            key: 'Payment Method',
            value: typeToDisplay(invoice?.paymentDestination, paymentMethodSchemas),
          },
        ].map((e) => (
          <ReceiptItem key={e.key} title={e.key} value={e.value} />
        ))}
      </div>

      {/* Payment Destination */}
      <div className="mercoa-bg-gray-50 mercoa-rounded-lg mercoa-p-6 mercoa-mb-6">
        <h2 className="mercoa-text-xl mercoa-font-bold mercoa-mb-4">
          {paidStatuses.includes(invoice.status) ? 'Sent To:' : 'Sending To:'}
        </h2>
        <div className="mercoa-flex">
          <div className="mercoa-flex-1">
            {invoice?.paymentDestination?.type === Mercoa.PaymentMethodType.BankAccount && (
              <div className="mercoa-bg-white mercoa-p-4 mercoa-rounded-lg mercoa-border">
                <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-mb-2">Bank Account</h3>
                {(() => {
                  const existingPaymentMethod = existingMethods?.find((e) => e.id === invoice?.paymentDestination?.id)
                  return existingPaymentMethod ? (
                    <div className="mercoa-space-y-2">
                      {(existingPaymentMethod as Mercoa.PaymentMethodResponse.BankAccount).accountName && (
                        <p className="mercoa-text-sm">
                          <span className="mercoa-text-gray-500">Account Name:</span>{' '}
                          <span className="mercoa-font-medium">
                            {(existingPaymentMethod as Mercoa.PaymentMethodResponse.BankAccount).accountName}
                          </span>
                        </p>
                      )}
                      <p className="mercoa-text-sm">
                        <span className="mercoa-text-gray-500">Account Number:</span>{' '}
                        <span className="mercoa-font-medium">
                          ****
                          {(existingPaymentMethod as Mercoa.PaymentMethodResponse.BankAccount).accountNumber.slice(-4)}
                        </span>
                      </p>
                      <p className="mercoa-text-sm">
                        <span className="mercoa-text-gray-500">Routing Number:</span>{' '}
                        <span className="mercoa-font-medium">
                          {(existingPaymentMethod as Mercoa.PaymentMethodResponse.BankAccount).routingNumber}
                        </span>
                      </p>
                      <p className="mercoa-text-sm">
                        <span className="mercoa-text-gray-500">Bank Name:</span>{' '}
                        <span className="mercoa-font-medium">
                          {(existingPaymentMethod as Mercoa.PaymentMethodResponse.BankAccount).bankName}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="mercoa-text-gray-600">Bank account details will be provided</p>
                  )
                })()}
              </div>
            )}
            {invoice?.paymentDestination?.type === Mercoa.PaymentMethodType.Check && (
              <div className="mercoa-bg-white mercoa-p-4 mercoa-rounded-lg mercoa-border">
                <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-mb-2">Check</h3>
                {existingMethods?.find((e) => e.id === invoice?.paymentDestination?.id) ? (
                  <div className="mercoa-space-y-2">
                    <p className="mercoa-text-sm">
                      <span className="mercoa-text-gray-500">Pay To The Order Of:</span>{' '}
                      <span className="mercoa-font-medium">
                        {
                          (
                            existingMethods?.find(
                              (e) => e.id === invoice?.paymentDestination?.id,
                            ) as Mercoa.PaymentMethodResponse.Check
                          ).payToTheOrderOf
                        }
                      </span>
                    </p>
                    <p className="mercoa-text-sm">
                      <span className="mercoa-text-gray-500">Address:</span>{' '}
                      <span className="mercoa-font-medium">
                        {(() => {
                          const check = existingMethods?.find(
                            (e) => e.id === invoice?.paymentDestination?.id,
                          ) as Mercoa.PaymentMethodResponse.Check
                          const addressParts = [
                            check.addressLine1,
                            check.addressLine2,
                            check.city,
                            check.stateOrProvince,
                            check.postalCode,
                            check.country,
                          ].filter(Boolean)
                          return addressParts.join(', ')
                        })()}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mercoa-text-gray-600">Check will be mailed to your address</p>
                )}
              </div>
            )}
            {invoice?.paymentDestination?.type === Mercoa.PaymentMethodType.Custom && (
              <div className="mercoa-bg-white mercoa-p-4 mercoa-rounded-lg mercoa-border">
                {(() => {
                  const existingPaymentMethod = existingMethods?.find((e) => e.id === invoice?.paymentDestination?.id)
                  const schemaName =
                    paymentMethodSchemas?.find(
                      (e) => e.id === (invoice?.paymentDestination as Mercoa.PaymentMethodResponse.Custom)?.schemaId,
                    )?.name || ''

                  const accountName = (existingPaymentMethod as Mercoa.PaymentMethodResponse.Custom)?.accountName
                  const accountNumber = (existingPaymentMethod as Mercoa.PaymentMethodResponse.Custom)?.accountNumber

                  if (existingPaymentMethod) {
                    return (
                      <>
                        <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-mb-2">{schemaName}</h3>
                        <div className="mercoa-space-y-2">
                          {accountName && (
                            <p className="mercoa-text-sm">
                              <span className="mercoa-text-gray-500">Account Name:</span>{' '}
                              <span className="mercoa-font-medium">{accountName}</span>
                            </p>
                          )}
                          {accountNumber && (
                            <p className="mercoa-text-sm">
                              <span className="mercoa-text-gray-500">Account Number:</span>{' '}
                              <span className="mercoa-font-medium">{accountNumber}</span>
                            </p>
                          )}
                        </div>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-mb-2">{schemaName}</h3>
                      </>
                    )
                  }
                })()}
              </div>
            )}
            {invoice?.paymentDestination?.type === Mercoa.PaymentMethodType.OffPlatform && (
              <div className="mercoa-bg-white mercoa-p-4 mercoa-rounded-lg mercoa-border">
                <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-mb-2">Off Platform Payment</h3>
                <p className="mercoa-text-gray-600">Payment will be processed outside of this platform</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <div className="mercoa-bg-gray-50 mercoa-rounded-lg mercoa-p-6 mercoa-mb-6">
          <h2 className="mercoa-text-xl mercoa-font-bold mercoa-mb-4">Line Items</h2>
          <div className="mercoa-space-y-3">
            {invoice.lineItems.map((lineItem, index) => (
              <div key={lineItem.id || index} className="mercoa-bg-white mercoa-p-4 mercoa-rounded-lg mercoa-border">
                <div className="mercoa-flex mercoa-justify-between mercoa-items-start">
                  <div className="mercoa-flex-1">
                    <h3 className="mercoa-text-base mercoa-font-semibold mercoa-text-gray-900">{lineItem.name}</h3>
                    {lineItem.description && (
                      <p className="mercoa-text-sm mercoa-text-gray-600 mercoa-mt-1">{lineItem.description}</p>
                    )}
                    {lineItem.quantity && lineItem.unitPrice && (
                      <p className="mercoa-text-sm mercoa-text-gray-500 mercoa-mt-1">
                        Qty: {lineItem.quantity} ×{' '}
                        {accounting.formatMoney(lineItem.unitPrice, currencyCodeToSymbol(lineItem.currency))}
                      </p>
                    )}
                  </div>
                  <div className="mercoa-text-right">
                    <p className="mercoa-text-base mercoa-font-semibold mercoa-text-gray-900">
                      {accounting.formatMoney(lineItem.amount ?? 0, currencyCodeToSymbol(lineItem.currency))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mercoa-mt-8 mercoa-text-center mercoa-text-sm mercoa-text-gray-500">
        <p className="mercoa-mt-2">
          Have questions? Contact{' '}
          <a
            href={`mailto:${supportEmail ?? 'support@mercoa.com'}`}
            className="mercoa-text-blue-600 hover:mercoa-text-blue-800"
          >
            {supportEmail ?? 'support@mercoa.com'}
          </a>
        </p>
      </div>
    </div>
  )
}
