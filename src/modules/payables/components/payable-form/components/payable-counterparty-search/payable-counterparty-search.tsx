import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { CounterpartySearchBase, usePayableDetails } from '../../../../../../components'
import { PayableFormAction } from '../../constants'

export function PayableCounterpartySearch() {
  const [edit, setEdit] = useState<boolean>(false)
  const { formContextValue, propsContextValue } = usePayableDetails()
  const { vendorContextValue } = formContextValue
  const { selectedVendor, setSelectedVendor } = vendorContextValue
  const { config } = propsContextValue
  const { disableCreation, network, enableOnboardingLinkOnCreate } = config?.counterparty ?? {}

  const {
    formState: { errors },
    watch,
  } = useFormContext()

  const formAction = watch('formAction')

  useEffect(() => {
    if (formAction !== PayableFormAction.CREATE_UPDATE_COUNTERPARTY) {
      setEdit(false)
    }
  }, [formAction])

  const status = watch('status')

  return (
    <div className="sm:mercoa-col-span-3">
      <label
        htmlFor="vendor-name"
        className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700"
      >
        Vendor
      </label>
      <div className="mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-justify-left">
        <div className="mercoa-p-3 mercoa-bg-gray-100 mercoa-rounded-mercoa mercoa-relative mercoa-w-full">
          <CounterpartySearchBase
            counterparty={selectedVendor}
            disableCreation={disableCreation}
            onSelect={setSelectedVendor}
            type={'payee'}
            network={network}
            edit={edit}
            setEdit={setEdit}
            readOnly={!!status && status !== Mercoa.InvoiceStatus.Draft}
            enableOnboardingLinkOnCreate={enableOnboardingLinkOnCreate}
          />
        </div>
      </div>
      {errors.vendorId?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.vendorId?.message.toString()}</p>
      )}
    </div>
  )
}
