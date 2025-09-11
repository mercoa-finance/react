import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { CounterpartySearchBase, useMercoaSession, usePayableDetails } from '../../../../../../components'
import { PayableFormAction } from '../../constants'
import { PayableFormData } from '../../types'
import { DuplicateCounterpartyModal } from './duplicate-counterparty-modal'

export function PayableCounterpartySearch() {
  const [edit, setEdit] = useState<boolean>(false)
  const { formContextValue, propsContextValue } = usePayableDetails()
  const { vendorContextValue, handleFormAction, formMethods } = formContextValue
  const {
    selectedVendor,
    setSelectedVendor,
    duplicateVendorModalOpen,
    setDuplicateVendorModalOpen,
    duplicateVendorInfo,
  } = vendorContextValue
  const { config } = propsContextValue
  const mercoaSession = useMercoaSession()
  const { disableCreation, network, enableOnboardingLinkOnCreate, showLabel = true } = config?.counterparty ?? {}
  // Respect disableVendorCreation from iframeOptions as fallback
  const isCreationDisabled = disableCreation || mercoaSession.iframeOptions?.options?.vendors?.disableCreation
  const { handleSubmit, setValue } = formMethods

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
    <>
      <div className="sm:mercoa-col-span-3">
        {showLabel && (
          <label
            htmlFor="vendor-name"
            className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700"
          >
            Vendor
          </label>
        )}
        <div className="mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-justify-left">
          <div className="mercoa-p-3 mercoa-bg-gray-100 mercoa-rounded-mercoa mercoa-relative mercoa-w-full">
            <CounterpartySearchBase
              counterparty={selectedVendor}
              disableCreation={isCreationDisabled}
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

      <DuplicateCounterpartyModal
        isOpen={duplicateVendorModalOpen}
        onCreateNew={async () => {
          setDuplicateVendorModalOpen(false)
          setValue('formAction', PayableFormAction.CREATE_UPDATE_COUNTERPARTY)
          handleSubmit((data: PayableFormData) =>
            handleFormAction(data, PayableFormAction.CREATE_UPDATE_COUNTERPARTY),
          )()
        }}
        onUseExisting={(counterparty) => {
          setDuplicateVendorModalOpen(false)
          setValue('formAction', PayableFormAction.CREATE_UPDATE_COUNTERPARTY)
          setSelectedVendor(counterparty)
          handleSubmit((data: PayableFormData) =>
            handleFormAction({ ...data, vendor: counterparty as any }, PayableFormAction.CREATE_UPDATE_COUNTERPARTY),
          )()
        }}
        duplicateInfo={duplicateVendorInfo}
      />
    </>
  )
}
