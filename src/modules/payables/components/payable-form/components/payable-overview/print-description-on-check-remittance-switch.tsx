import { MercoaSwitch, usePayableDetails } from '../../../../../../components'
import { afterApprovedStatus } from '../../constants'

export function PrintDescriptionOnCheckRemittanceSwitch() {
  const { formContextValue } = usePayableDetails()
  const { formMethods } = formContextValue
  const {
    watch,
    register,
    formState: { errors },
  } = formMethods

  const paymentDestinationType = watch('paymentDestinationType')
  const status = watch('status')
  const readOnly = !!status && afterApprovedStatus.includes(status)

  if (paymentDestinationType !== 'check') return <></>
  return (
    <MercoaSwitch
      label="Print on check remittance"
      name="paymentDestinationOptions.printDescription"
      register={register}
      errors={errors}
      disabled={readOnly}
      className="mercoa-mt-[0px]"
    />
  )
}
