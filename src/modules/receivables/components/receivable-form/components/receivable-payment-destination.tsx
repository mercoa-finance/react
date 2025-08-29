import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { ReceivableSelectPaymentMethod } from './receivable-select-payment-method'

export function ReceivablePaymentDestination({ readOnly }: { readOnly?: boolean }) {
  const {
    watch,
    formState: { errors },
  } = useFormContext()

  const status = watch('status')
  readOnly = readOnly || (!!status && status !== Mercoa.InvoiceStatus.Draft)

  return (
    <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-16 mercoa-col-span-full">
      <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mt-5">
        {readOnly ? 'Paying to You:' : 'How do you want to get paid?'}
      </h2>
      <ReceivableSelectPaymentMethod isDestination readOnly={readOnly} />
      {errors.paymentDestinationId?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentDestinationId?.message.toString()}</p>
      )}
    </div>
  )
}
