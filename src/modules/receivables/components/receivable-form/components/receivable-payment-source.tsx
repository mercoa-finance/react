import { Mercoa } from '@mercoa/javascript'
import { useReceivableDetails } from '../../../hooks/use-receivable-details'
import { ReceivableSelectPaymentMethod } from './receivable-select-payment-method'

export function ReceivablePaymentSource({ readOnly }: { readOnly?: boolean }) {
  const { formContextValue } = useReceivableDetails()
  const { formMethods } = formContextValue
  const {
    watch,
    formState: { errors },
  } = formMethods

  const status = watch('status')
  readOnly = readOnly || (!!status && status !== Mercoa.InvoiceStatus.Draft)

  const paymentDestinationType = watch('paymentDestinationType')
  const payerId = watch('payerId')
  const payerName = watch('payerName')

  return (
    <>
      {payerId && payerName && paymentDestinationType !== 'offPlatform' && (
        <div className="mercoa-pb-6 mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mt-5">
            {readOnly ? (
              <>
                Payment method on file for <span className="mercoa-text-gray-800 mercoa-underline">{payerName}</span>:
              </>
            ) : (
              <>
                Choose existing payment method on file for{' '}
                <span className="mercoa-text-gray-800 mercoa-underline">{payerName}</span>:
              </>
            )}
          </h2>
          <ReceivableSelectPaymentMethod isSource readOnly={readOnly} />
          {errors.paymentSourceId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentSourceId?.message.toString()}</p>
          )}
        </div>
      )}
    </>
  )
}
