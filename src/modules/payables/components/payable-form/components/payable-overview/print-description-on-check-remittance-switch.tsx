import { MercoaSwitch } from '../../../../../../components'
import { usePayableDetailsContext } from '../../../../providers/payables-detail-provider'
import { afterApprovedStatus } from '../../constants'

export function PrintDescriptionOnCheckRemittanceSwitch() {
  const { formMethods } = usePayableDetailsContext()
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
      label="Print Description on Check Remittance"
      name="paymentDestinationOptions.printDescription"
      register={register}
      errors={errors}
      disabled={readOnly}
      className="mercoa-mt-[0px]"
    />
  )
}
