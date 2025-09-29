import dayjs from 'dayjs'
import { Mercoa } from '@mercoa/javascript'
import { MercoaSwitch, usePayableDetails } from '../../../../../components'
import { afterApprovedStatus } from '../constants'

/**
 * PaymentOptions component for enabling batch payments in the PayableDetails form.
 * This component shows a toggle switch for batch payments when the payment method 
 * supports it (bank account to bank account or check payments).
 * 
 * @example
 * ```tsx
 * // Use as a standalone component within PayableDetails
 * <PayableDetails>
 *   <PaymentOptions />
 * </PayableDetails>
 * ```
 */
export function PaymentOptions() {
  const { formContextValue } = usePayableDetails()
  const { formMethods } = formContextValue
  const {
    watch,
    register,
    formState: { errors },
  } = formMethods

  const deductionDate = watch('deductionDate')
  const vendorName = watch('vendor.name')
  const paymentSourceType = watch('paymentSourceType')
  const paymentDestinationType = watch('paymentDestinationType')
  const status = watch('status')
  const readOnly = !!status && afterApprovedStatus.includes(status)

  // Only show batch payment option for bank account to bank account or check payments
  if (
    paymentSourceType !== Mercoa.PaymentMethodType.BankAccount ||
    (paymentDestinationType !== Mercoa.PaymentMethodType.BankAccount &&
      paymentDestinationType !== Mercoa.PaymentMethodType.Check)
  ) {
    return <></>
  }

  return (
    <div className="mercoa-col-span-full">
      <MercoaSwitch
        label="Batch Payment"
        name="batchPayment"
        register={register}
        errors={errors}
        disabled={readOnly}
        tooltip={
          vendorName && deductionDate ? (
            <div className="mercoa-whitespace-normal mercoa-w-[300px]">
              {`Send a single payment to ${vendorName} for invoices scheduled on ${dayjs(deductionDate).format(
                'MMM DD',
              )}`}
            </div>
          ) : (
            <div className="mercoa-whitespace-normal mercoa-w-[300px]">
              Send a single payment for multiple invoices scheduled on the same date
            </div>
          )
        }
      />
    </div>
  )
}