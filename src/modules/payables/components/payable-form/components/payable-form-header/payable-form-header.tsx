import { Mercoa } from '@mercoa/javascript'
import { usePayableDetails } from '../../../../hooks'
import { PayableFailureReason } from './payable-failure-reason'
import { PayableStatusPill } from './payable-status-pill'

export function PayableFormHeader({ hideId }: { hideId?: boolean }) {
  const { dataContextValue } = usePayableDetails()
  const { invoice } = dataContextValue

  return (
    <>
      <div className="mercoa-flex mercoa-col-span-full">
        <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
          Edit Invoice{' '}
          <PayableStatusPill
            failureType={invoice?.failureType}
            status={invoice?.status ?? Mercoa.InvoiceStatus.Draft}
            payerId={invoice?.payerId}
            dueDate={invoice?.dueDate}
            paymentSourceId={invoice?.paymentSourceId}
            paymentDestinationId={invoice?.paymentDestinationId}
            vendorId={invoice?.vendorId}
            amount={invoice?.amount}
            type="payable"
          />
        </h2>
      </div>
      {!hideId && (
        <p className="mercoa-col-span-full mercoa-text-xs mercoa-leading-6 mercoa-text-gray-400 mercoa-select-all">
          {invoice?.id}
        </p>
      )}
      <PayableFailureReason />
    </>
  )
}
