import dayjs from 'dayjs'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../../components'

export function InvoiceDetails({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
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
