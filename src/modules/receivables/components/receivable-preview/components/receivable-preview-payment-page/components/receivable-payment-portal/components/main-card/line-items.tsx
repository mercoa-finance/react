import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../../../../../../../../../../lib/currency'

export function LineItemsV2({ lineItems }: { lineItems: Mercoa.InvoiceLineItemResponse[] }) {
  if (!lineItems.length) return <></>
  return (
    <ul>
      {lineItems.map((lineItem) => (
        <li
          key={lineItem.id}
          className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-p-2 mercoa-border-b"
        >
          <div className="mercoa-flex mercoa-items-center">
            <div className="">
              <p className="mercoa-text-md mercoa-font-medium mercoa-text-gray-900">{lineItem.name}</p>
              <p className="mercoa-text-xs mercoa-font-medium mercoa-text-gray-400">{lineItem.description}</p>
              <p className="mercoa-text-sm mercoa-text-gray-500">
                {lineItem.quantity} x {currencyCodeToSymbol(lineItem.currency)}
                {lineItem.unitPrice}
              </p>
            </div>
          </div>
          <div className="mercoa-text-sm mercoa-text-gray-500">
            {currencyCodeToSymbol(lineItem.currency)}
            {lineItem.amount}
          </div>
        </li>
      ))}
    </ul>
  )
}
