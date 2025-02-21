import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { CounterpartySearchBase } from '../../../../../../components'
import { PayableAction } from '../../constants'

interface PayableCounterpartySearchChildrenProps {
  counterparty?: Mercoa.CounterpartyResponse
  disableCreation?: boolean
  onSelect?: (counterparty: Mercoa.CounterpartyResponse | undefined) => any
  network?: Mercoa.CounterpartyNetworkType[]
  edit: boolean
  setEdit: React.Dispatch<React.SetStateAction<boolean>>
  status: any
  errors: any
}

export function PayableCounterpartySearch({
  counterparty,
  disableCreation,
  onSelect,
  network,
  children,
}: {
  counterparty?: Mercoa.CounterpartyResponse
  disableCreation?: boolean
  onSelect?: (counterparty: Mercoa.CounterpartyResponse | undefined) => any
  network?: Mercoa.CounterpartyNetworkType[]
  children?: (props: PayableCounterpartySearchChildrenProps) => React.ReactNode
}) {
  const [edit, setEdit] = useState<boolean>(false)

  const {
    formState: { errors },
    watch,
  } = useFormContext()

  const formAction = watch('formAction')

  useEffect(() => {
    if (formAction !== PayableAction.CREATE_UPDATE_COUNTERPARTY) {
      setEdit(false)
    }
  }, [formAction])

  const status = watch('status')

  return (
    <div className="sm:mercoa-col-span-3">
      {children ? (
        children({ counterparty, disableCreation, onSelect, network, edit, setEdit, status, errors })
      ) : (
        <>
          <label
            htmlFor="vendor-name"
            className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700"
          >
            Vendor
          </label>
          <div className="mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-justify-left">
            <div className="mercoa-p-3 mercoa-bg-gray-100 mercoa-rounded-mercoa mercoa-relative mercoa-w-full">
              <CounterpartySearchBase
                counterparty={counterparty}
                disableCreation={disableCreation}
                onSelect={onSelect}
                type={'payee'}
                network={network}
                edit={edit}
                setEdit={setEdit}
                readOnly={!!status && status !== Mercoa.InvoiceStatus.Draft}
              />
            </div>
          </div>
          {errors.vendorId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.vendorId?.message.toString()}</p>
          )}
        </>
      )}
    </div>
  )
}
