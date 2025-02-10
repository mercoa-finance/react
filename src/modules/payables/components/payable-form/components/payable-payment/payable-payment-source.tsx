import { useFormContext } from 'react-hook-form'
import { afterApprovedStatus } from '../../constants'
import { PayableSelectPaymentMethod } from './payable-select-payment-method'

export function PayablePaymentSource({ readOnly }: { readOnly?: boolean }) {
  const {
    watch,
    formState: { errors },
  } = useFormContext()

  const status = watch('status')
  readOnly = readOnly || (!!status && afterApprovedStatus.includes(status))

  return (
    <div className="mercoa-col-span-full">
      <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mb-5">
        {readOnly ? 'Paying from:' : 'How do you want to pay?'}
      </h2>
      <PayableSelectPaymentMethod isSource readOnly={readOnly} />
      {errors.paymentSourceId?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentSourceId?.message.toString()}</p>
      )}
    </div>
  )
}
