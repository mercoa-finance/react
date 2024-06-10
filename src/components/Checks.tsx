import { EnvelopeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import { ReactNode, useState } from 'react'
import { UseFormRegister, useForm } from 'react-hook-form'
import * as yup from 'yup'
import {
  AddDialog,
  DefaultPaymentMethodIndicator,
  MercoaButton,
  MercoaInput,
  NoSession,
  stopPropagate,
  useMercoaSession,
} from './index'

export function Check({
  account,
  onSelect,
  showEdit,
  selected,
}: {
  children?: Function
  account?: Mercoa.PaymentMethodResponse.Check
  onSelect?: (value?: Mercoa.PaymentMethodResponse.Check) => void
  showEdit?: boolean
  selected?: boolean
}) {
  const mercoaSession = useMercoaSession()

  async function deleteAccount() {
    if (mercoaSession.token && mercoaSession.entity?.id && account?.id) {
      await mercoaSession.client?.entity.paymentMethod.delete(mercoaSession.entity?.id, account?.id)
      mercoaSession.refresh()
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="CheckComponent" />
  if (account) {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
        }}
        key={`${account?.addressLine1} ${account?.addressLine1}`}
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-lg mercoa-border ${
          selected ? 'mercoa-border-gray-600' : 'mercoa-border-gray-300'
        } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-indigo-500 focus-within:mercoa-ring-offset-2 ${
          onSelect ? 'mercoa-cursor-pointer  hover:mercoa-border-gray-400' : ''
        }`}
      >
        <div
          className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
            selected
              ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
              : 'mercoa-bg-gray-200 mercoa-text-gray-600'
          }`}
        >
          <EnvelopeIcon className="mercoa-size-5" />
        </div>
        <div className="mercoa-min-w-0 mercoa-flex-1">
          {!showEdit && <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />}
          <p
            className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
          >{`${account?.payToTheOrderOf}`}</p>
          <p
            className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
          >{`${account?.addressLine1}, ${account?.addressLine2}`}</p>
          <p
            className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
          >{`${account?.city} ${account?.stateOrProvince}, ${account?.postalCode}`}</p>
        </div>
        {showEdit && (
          <div className="mercoa-flex-shrink-0">
            <DefaultPaymentMethodIndicator paymentMethod={account} />
            <button
              className="mercoa-ml-1 mercoa-cursor-pointer hover:mercoa-text-red-300"
              onClick={() => deleteAccount()}
            >
              {' '}
              <TrashIcon className="mercoa-size-5" />
            </button>
          </div>
        )}
      </div>
    )
  } else {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect()
        }}
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-lg mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-indigo-500 focus-within:mercoa-ring-offset-2 hover:mercoa-border-gray-400 ${
          onSelect ? 'mercoa-cursor-pointer ' : ''
        }`}
      >
        <div
          className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
            selected
              ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
              : 'mercoa-bg-gray-200 mercoa-text-gray-600'
          }`}
        >
          <PlusIcon className="mercoa-size-5" />
        </div>
        <div className="mercoa-min-w-0 mercoa-flex-1">
          <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />
          <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">Add new address</p>
          <p className="mercoa-truncate mercoa-text-sm mercoa-text-gray-500"></p>
        </div>
      </div>
    )
  }
}

export function AddCheckDialog({
  entityId,
  onSelect,
  check,
}: {
  entityId?: Mercoa.EntityId
  onSelect?: Function
  check?: Mercoa.CheckRequest
}) {
  const [showDialog, setShowDialog] = useState(false)

  const onClose = (account?: Mercoa.PaymentMethodResponse) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  return (
    <div className="mercoa-mt-2">
      <AddDialog
        show={showDialog}
        onClose={onClose}
        component={
          <AddCheck
            onSubmit={(data) => {
              onClose(data)
            }}
            entityId={entityId}
            check={check}
          />
        }
      />
      <Check onSelect={() => setShowDialog(true)} />
    </div>
  )
}

export function AddCheck({
  onSubmit,
  title,
  actions,
  formOnlySubmit,
  check,
  entityId,
}: {
  onSubmit?: (data?: Mercoa.PaymentMethodResponse) => void
  title?: ReactNode
  actions?: ReactNode
  formOnlySubmit?: Function
  check?: Mercoa.CheckRequest
  entityId?: Mercoa.EntityId
}) {
  const mercoaSession = useMercoaSession()

  const schema = yup
    .object({
      payToTheOrderOf: yup.string().required(),
      addressLine1: yup.string().required(),
      city: yup.string().required(),
      stateOrProvince: yup.string().required(),
      postalCode: yup.string().required(),
    })
    .required()

  const { register, handleSubmit } = useForm({
    defaultValues: check,
    resolver: yupResolver(schema),
  })

  async function submitCheck(check: Mercoa.CheckRequest) {
    if (mercoaSession.entity?.id) {
      check.country = 'US'
      const resp = await mercoaSession.client?.entity.paymentMethod.create(entityId ?? mercoaSession.entity?.id, {
        ...check,
        type: 'check',
      })
      if (!onSubmit) return
      if (resp) onSubmit(resp)
      else onSubmit()
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="AddCheck" />
  return (
    <form
      className="mercoa-space-y-3 mercoa-text-left"
      onSubmit={stopPropagate(handleSubmit((formOnlySubmit as any) || submitCheck))}
    >
      {title || (
        <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          Add Check Address
        </h3>
      )}
      <AddCheckForm register={register} />
      <div className="mercoa-flex mercoa-justify-end">
        {actions || <MercoaButton isEmphasized>Add Check Address</MercoaButton>}
      </div>
    </form>
  )
}

export function AddCheckForm({ register }: { register: UseFormRegister<any> }) {
  return (
    <div className="mercoa-mt-2">
      <MercoaInput
        register={register}
        name="payToTheOrderOf"
        placeholder="Pay To The Order Of"
        className="mercoa-mt-1"
      />
      <MercoaInput register={register} name="addressLine1" placeholder="Address Line 1" className="mercoa-mt-1" />
      <MercoaInput register={register} name="addressLine2" placeholder="Address Line 2" className="mercoa-mt-1" />
      <MercoaInput register={register} name="city" placeholder="City" className="mercoa-mt-1" />
      <MercoaInput register={register} name="stateOrProvince" placeholder="State Or Province" className="mercoa-mt-1" />
      <MercoaInput register={register} name="postalCode" placeholder="Postal Code" className="mercoa-mt-1" />
    </div>
  )
}
