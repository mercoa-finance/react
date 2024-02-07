import { EnvelopeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { DefaultPaymentMethodIndicator, useMercoaSession } from './index'

export function AddCheck({
  onSubmit,
  title,
  actions,
  formOnlySubmit,
  check,
}: {
  onSubmit?: Function
  title?: ReactNode
  actions?: ReactNode
  formOnlySubmit?: Function
  check?: Mercoa.CheckRequest
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
      const resp = await mercoaSession.client?.entity.paymentMethod.create(mercoaSession.entity?.id, {
        ...check,
        type: 'check',
      })
      if (!onSubmit) return
      if (resp) onSubmit(resp)
      else onSubmit()
    }
  }

  return (
    <form className="mercoa-space-y-3 mercoa-text-left" onSubmit={handleSubmit((formOnlySubmit as any) || submitCheck)}>
      {title || (
        <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          Add Check Address
        </h3>
      )}
      <AddCheckForm register={register} />
      {actions || (
        <button className="mercoa-relative mercoa-inline-flex mercoa-items-center mercoa-rounded-md mercoa-border mercoa-border-transparent mercoa-bg-indigo-600 mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-indigo-700 focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-indigo-500 focus:mercoa-ring-offset-2">
          Add Check Address
        </button>
      )}
    </form>
  )
}

export function AddCheckForm({ register }: { register: Function }) {
  return (
    <div className="mercoa-mt-2">
      <div className="mercoa-mt-1">
        <input
          {...register('payToTheOrderOf')}
          type="text"
          placeholder="Pay To The Order Of"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
        />
      </div>
      <div className="mercoa-mt-1">
        <input
          {...register('addressLine1')}
          type="text"
          placeholder="Address Line 1"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
        />
      </div>
      <div className="mercoa-mt-1">
        <input
          {...register('addressLine2')}
          type="text"
          placeholder="Address Line 2"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
        />
      </div>
      <div className="mercoa-mt-1">
        <input
          {...register('city')}
          type="text"
          placeholder="City"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
        />
      </div>
      <div className="mercoa-mt-1">
        <input
          {...register('stateOrProvince')}
          type="text"
          placeholder="State Or Province"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
        />
      </div>
      <div className="mercoa-mt-1">
        <input
          {...register('postalCode')}
          type="text"
          placeholder="Postal Code"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
        />
      </div>
    </div>
  )
}

export function CheckComponent({
  account,
  onSelect,
  showEdit,
  selected,
}: {
  children?: Function
  account?: Mercoa.CheckResponse
  onSelect?: Function
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
          <EnvelopeIcon className="mercoa-h-5 mercoa-w-5" />
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
              <TrashIcon className="mercoa-h-5 mercoa-w-5" />
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
          <PlusIcon className="mercoa-h-5 mercoa-w-5" />
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
