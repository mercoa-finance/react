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
    <form className="space-y-3 text-left" onSubmit={handleSubmit((formOnlySubmit as any) || submitCheck)}>
      {title || <h3 className="text-center text-lg font-medium leading-6 text-gray-900">Add Check Address</h3>}
      <AddCheckForm register={register} />
      {actions || (
        <button className="relative inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          Add Check Address
        </button>
      )}
    </form>
  )
}

export function AddCheckForm({ register }: { register: Function }) {
  return (
    <div className="mt-2">
      <div className="mt-1">
        <input
          {...register('payToTheOrderOf')}
          type="text"
          placeholder="Pay To The Order Of"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mt-1">
        <input
          {...register('addressLine1')}
          type="text"
          placeholder="Address Line 1"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mt-1">
        <input
          {...register('addressLine2')}
          type="text"
          placeholder="Address Line 2"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mt-1">
        <input
          {...register('city')}
          type="text"
          placeholder="City"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mt-1">
        <input
          {...register('stateOrProvince')}
          type="text"
          placeholder="State Or Province"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mt-1">
        <input
          {...register('postalCode')}
          type="text"
          placeholder="Postal Code"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
        className={`relative flex items-center space-x-3 rounded-lg border ${
          selected ? 'border-indigo-300' : 'border-gray-300'
        } bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
          onSelect ? 'cursor-pointer hover:border-gray-400' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <EnvelopeIcon className={`h-5 w-5 ${selected ? 'text-indigo-400' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          {!showEdit && <span className="absolute inset-0" aria-hidden="true" />}
          <p
            className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}
          >{`${account?.payToTheOrderOf}`}</p>
          <p
            className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}
          >{`${account?.addressLine1}, ${account?.addressLine2}`}</p>
          <p
            className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}
          >{`${account?.city} ${account?.stateOrProvince}, ${account?.postalCode}`}</p>
        </div>
        {showEdit && (
          <div className="flex-shrink-0">
            <DefaultPaymentMethodIndicator paymentMethod={account} />
            <button className="ml-1 cursor-pointer hover:text-red-300" onClick={() => deleteAccount()}>
              {' '}
              <TrashIcon className="h-5 w-5" />
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
        className={`relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 ${
          onSelect ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <PlusIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-900">Add new address</p>
          <p className="truncate text-sm text-gray-500"></p>
        </div>
      </div>
    )
  }
}
