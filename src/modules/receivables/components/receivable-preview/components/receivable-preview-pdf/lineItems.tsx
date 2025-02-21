import accounting from 'accounting'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'

export function LineItems({ lineItems }: { lineItems: Mercoa.InvoiceLineItemResponse[] }) {
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
