import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton, useMercoaSession } from '../../../../../../../../../../src/components'
import { formatBankAccount } from '../utils'

export function PaymentCompleteV2({
  invoice,
  totalDisplay,
}: {
  invoice: Mercoa.InvoiceResponse
  totalDisplay: string
}) {
  const mercoaSession = useMercoaSession()

  const sourcePaymentMethod = invoice.paymentSource
  const formattedPaymentMethod =
    sourcePaymentMethod?.type === Mercoa.PaymentMethodType.BankAccount
      ? formatBankAccount(sourcePaymentMethod as Mercoa.PaymentMethodResponse.BankAccount)
      : sourcePaymentMethod?.type

  async function getPDFLink() {
    if (!invoice?.id) return
    const pdfLink = await mercoaSession.client?.invoice.document.generateInvoicePdf(invoice.id)
    if (pdfLink?.uri) {
      // open in new window
      window.open(pdfLink.uri, '_blank')
    } else {
      toast.error('There was an issue generating the Invoice PDF. Please refresh and try again.')
    }
  }

  const receiptData: { name: string; value: string }[] = [
    { name: 'Merchant', value: invoice.vendor?.name ?? '' },
    { name: 'Invoice Number', value: invoice.invoiceNumber ?? '' },
    { name: 'Payment Method', value: formattedPaymentMethod ?? '' },
    { name: 'Invoice ID', value: invoice?.id ?? '' },
    { name: 'Due Date', value: dayjs(invoice.dueDate).format('MMM D, YYYY') },
    { name: 'Payment Amount', value: totalDisplay },
  ]

  return (
    <div className="mercoa-max-w-2xl mercoa-m-auto">
      <div className="mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-5 mercoa-py-6 mercoa-border mercoa-border-gray-300">
        <h2 className="mercoa-primary-text mercoa-font-bold mercoa-leading-6 mercoa-text-gray-900 mercoa-text-3xl mercoa-mt-2  mercoa-text-center">
          Success!
        </h2>
        <div className="mercoa-max-w-md mercoa-m-auto">
          {receiptData.map(({ name, value }) => (
            <p
              key={name}
              className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 mercoa-gap-x-6"
            >
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">{name}</span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">{value}</span>
            </p>
          ))}
          <MercoaButton isEmphasized size="lg" className="mercoa-w-full mercoa-mt-10" onClick={getPDFLink}>
            Download Invoice
          </MercoaButton>
        </div>
      </div>
    </div>
  )
}
