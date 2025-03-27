import accounting from 'accounting'
import { ReactNode } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../../../../../../../src/lib/currency'
import { usePayableDetails } from '../../../../../../components'

export function PayableFees({
  children,
}: {
  children?: ({ fees }: { fees?: Mercoa.InvoiceFeesResponse }) => ReactNode
}) {
  const { formContextValue } = usePayableDetails()
  const { formMethods, feesContextValue, vendorCreditContextValue } = formContextValue
  const { fees } = feesContextValue
  const { vendorCreditUsage } = vendorCreditContextValue

  const { watch } = formMethods

  const amount = watch('amount')
  const currency = watch('currency')

  // Convert number to digits
  let amountNumber = amount
  if (typeof amount === 'string') {
    amountNumber = Number(amount.replace(/,/g, ''))
  }

  // Calculate fees

  if (children) {
    return children({ fees })
  }

  const feeTotal = (fees?.destinationPlatformMarkupFee ?? 0) + (fees?.sourcePlatformMarkupFee ?? 0)
  const vendorCreditTotal = !!(amountNumber !== undefined && vendorCreditUsage?.remainingAmount !== undefined)
    ? amountNumber - vendorCreditUsage.remainingAmount
    : 0

  if (amount && (feeTotal || vendorCreditTotal)) {
    return (
      <div className="mercoa-col-span-full">
        <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-md">
          <div className="mercoa-flex-1" />
          Invoice Amount:
          <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
            {accounting.formatMoney(amount, currencyCodeToSymbol(currency))}
          </span>
        </div>

        {feeTotal > 0 && (
          <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-md">
            <div className="mercoa-flex-1" />
            Payment Fees:
            <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
              {accounting.formatMoney(feeTotal, currencyCodeToSymbol(currency))}
            </span>
          </div>
        )}

        {vendorCreditTotal > 0 && (
          <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-md">
            <div className="mercoa-flex-1" />
            Vendor Credits:
            <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
              -{accounting.formatMoney(vendorCreditTotal, currencyCodeToSymbol(currency))}
            </span>
          </div>
        )}

        <div className="mercoa-flex mercoa-mb-1">
          <div className="mercoa-flex-1" />
          <div className="mercoa-border-b-2 mercoa-border-gray-300 mercoa-w-64" />
        </div>

        <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-lg">
          <div className="mercoa-flex-1" />
          Total Payment:
          <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
            {accounting.formatMoney(amount + feeTotal - vendorCreditTotal, currencyCodeToSymbol(currency))}
          </span>
        </div>
      </div>
    )
  }

  return null
}
