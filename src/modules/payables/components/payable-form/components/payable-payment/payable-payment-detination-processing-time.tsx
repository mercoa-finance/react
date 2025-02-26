import { ArrowRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { Mercoa } from '@mercoa/javascript'
import { Tooltip, usePayableDetails } from '../../../../../../components'

export function PaymentDestinationProcessingTime({
  children,
}: {
  children?: ({ timing }: { timing?: Mercoa.CalculatePaymentTimingResponse }) => JSX.Element
}) {
  const { paymentTiming, formMethods } = usePayableDetails()
  const { watch } = formMethods

  const deductionDate = watch('deductionDate') as Date
  const processedAt = watch('processedAt') as Date
  const paymentSourceId = watch('paymentSourceId') as Mercoa.PaymentMethodType
  const paymentDestinationId = watch('paymentDestinationId') as Mercoa.PaymentMethodType
  const paymentDestinationOptions = watch('paymentDestinationOptions') as Mercoa.PaymentDestinationOptions
  const status = watch('status') as Mercoa.InvoiceStatus
  const invoiceId = watch('invoiceId') as string

  if (children) return children({ timing: paymentTiming })

  if (!paymentTiming) return null
  if (paymentTiming.businessDays < 0) return null

  return (
    <div className="mercoa-col-span-full">
      <div className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-p-5 mercoa-rounded-md mercoa-text-center mercoa-max-w-[500px] mercoa-m-auto">
        <div className="mercoa-flex mercoa-items-center">
          <CalendarDaysIcon className="mercoa-size-5 mercoa-mr-2" />
          <span className="mercoa-text-gray-900">{dayjs(paymentTiming.estimatedProcessingDate).format('MMM D')}</span>
        </div>

        <div className="mercoa-flex mercoa-items-center">
          <hr className="mercoa-border-t mercoa-border-gray-300 mercoa-w-10" />
          <ArrowRightIcon className="mercoa-border-t mercoa-border-transparent mercoa-size-5 mercoa-text-gray-300 -mercoa-ml-1" />
          <Tooltip
            title={
              <div className="mercoa-text-xs">
                Estimated time.
                <br />
                Business days are Monday through Friday, excluding holidays.
              </div>
            }
          >
            <span className="mercoa-text-gray-500 mercoa-mx-4">
              {paymentTiming?.businessDays} business days<span className="mercoa-text-xs">*</span>
            </span>
          </Tooltip>
          <hr className="mercoa-border-t mercoa-border-gray-300 mercoa-w-10" />
          <ArrowRightIcon className="mercoa-border-t mercoa-border-transparent mercoa-size-5 mercoa-text-gray-300 -mercoa-ml-1" />
        </div>

        <div className="mercoa-flex mercoa-items-center">
          <CalendarDaysIcon className="mercoa-size-5 mercoa-mr-2" />
          <span className="mercoa-text-gray-900">{dayjs(paymentTiming.estimatedSettlementDate).format('MMM D')}</span>
        </div>
      </div>
    </div>
  )
}
