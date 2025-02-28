import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'

export function InvoiceTotal({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
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
