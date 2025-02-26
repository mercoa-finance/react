import accounting from 'accounting'
import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../../../../../../../src/lib/currency'
import { useMercoaSession, usePayableDetails } from '../../../../../../components'

export function PayableFees({
  children,
}: {
  children?: ({ fees }: { fees?: Mercoa.InvoiceFeesResponse }) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  const { fees, vendorCreditUsage } = usePayableDetails()

  const { watch, setError, clearErrors } = useFormContext()

  const invoiceId = watch('id')
  const status = watch('status')
  const amount = watch('amount')
  const currency = watch('currency')
  const payerId = mercoaSession.entityId
  const vendorId = watch('vendorId')
  const paymentSourceId = watch('paymentSourceId')
  const paymentDestinationId = watch('paymentDestinationId')
  const paymentDestinationOptions = watch('paymentDestinationOptions')
  const vendorCreditIds = watch('vendorCreditIds') as Mercoa.VendorCreditId[] | undefined

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
