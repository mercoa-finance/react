import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton, useMercoaSession } from '../../../../../../../../../components'

export function ReceivableDetailsCardV2({
  invoice,
  totalDisplay,
}: {
  invoice: Mercoa.InvoiceResponse
  totalDisplay: string
}) {
  const mercoaSession = useMercoaSession()

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

  return (
    <div className="mercoa-flex-1 mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-3 mercoa-py-4 mercoa-border mercoa-border-gray-300">
      <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900">
        {invoice.vendor?.name}
      </h3>
      <p className="mercoa-mt-5 mercoa-text-sm mercoa-font-medium mercoa-flex">
        <span className="mercoa-text-gray-600">Invoice</span>
        <span className="mercoa-ml-auto mercoa-text-gray-800">{invoice.invoiceNumber}</span>
      </p>
      <p className="mercoa-mt-1 mercoa-text-sm mercoa-font-medium mercoa-flex">
        <span className="mercoa-text-gray-600">Due Date</span>
        <span className="mercoa-ml-auto mercoa-text-gray-800">{dayjs(invoice.dueDate).format('MMM D, YYYY')}</span>
      </p>
      <p className="mercoa-mt-1 mercoa-text-sm mercoa-font-medium mercoa-flex">
        <span className="mercoa-text-gray-600">Invoice Amount</span>
        <span className="mercoa-ml-auto mercoa-text-gray-800">{totalDisplay}</span>
      </p>
      <hr className="mercoa-my-3" />
      <div className="mercoa-flex mercoa-items-center">
        <div className="mercoa-flex-1" />
        <MercoaButton isEmphasized={false} size="sm" onClick={getPDFLink}>
          <ArrowDownTrayIcon className="mercoa-size-4" />
        </MercoaButton>
        <MercoaButton isEmphasized={false} size="sm" className="mercoa-ml-3">
          <PrinterIcon className="mercoa-size-4" onClick={getPDFLink} />
        </MercoaButton>
      </div>
    </div>
  )
}
