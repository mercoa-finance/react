import { useFormContext } from 'react-hook-form'
import { PayableStatusPill } from './payable-status-pill'

export function PayableFormHeader({ hideId }: { hideId?: boolean }) {
  const { watch } = useFormContext()

  return (
    <>
      <div className="mercoa-flex mercoa-col-span-full">
        <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
          Edit Invoice{' '}
          <PayableStatusPill
            failureType={watch('failureType')}
            status={watch('status')}
            payerId={watch('payerId')}
            dueDate={watch('dueDate')}
            paymentSourceId={watch('paymentSourceId')}
            paymentDestinationId={watch('paymentDestinationId')}
            vendorId={watch('vendorId')}
            amount={watch('amount')}
            type="payable"
          />
        </h2>
      </div>
      {!hideId && (
        <p className="mercoa-col-span-full mercoa-text-xs mercoa-leading-6 mercoa-text-gray-400 mercoa-select-all">
          {watch('id')}
        </p>
      )}
    </>
  )
}
