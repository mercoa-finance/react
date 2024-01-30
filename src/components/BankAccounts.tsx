import { Dialog, Transition } from '@headlessui/react'
import { BuildingLibraryIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { usePlaidLink } from 'react-plaid-link'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import {
  DefaultPaymentMethodIndicator,
  LoadingSpinnerIcon,
  MercoaButton,
  Tooltip,
  useMercoaSession,
} from '../components/index'
import { capitalize } from '../lib/lib'

const validBankAccount = require('us-bank-account-validator')

export function BankAccounts({
  children,
  onSelect,
  showAdd,
  showEdit,
  verifiedOnly,
}: {
  children?: Function
  onSelect?: Function
  showAdd?: boolean
  showEdit?: boolean
  verifiedOnly?: boolean
}) {
  const [bankAccounts, setBankAccounts] = useState<Array<Mercoa.BankAccountResponse>>()
  const [showDialog, setShowDialog] = useState(false)

  const mercoaSession = useMercoaSession()
  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod
        .getAll(mercoaSession.entity?.id, { type: 'bankAccount' })
        .then((resp) => {
          setBankAccounts(
            resp
              .map((e) => e as Mercoa.BankAccountResponse)
              .filter((e) => {
                if (verifiedOnly && e.status != 'VERIFIED') return null
                return e
              }),
          )
        })
    }
  }, [mercoaSession.entity?.id, mercoaSession.token, showDialog, mercoaSession.refreshId])

  const onClose = (account?: Mercoa.PaymentMethodResponse) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  if (children) return children({ bankAccounts })
  else {
    return (
      <>
        {!bankAccounts && (
          <div className="p-9 text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        {bankAccounts &&
          bankAccounts.map((account) => (
            <div className="mt-2" key={account.id}>
              <BankAccountComponent account={account} onSelect={onSelect} showEdit={showEdit} />
            </div>
          ))}
        {bankAccounts && showAdd && (
          <div className="mt-2">
            <AddDialog
              show={showDialog}
              onClose={onClose}
              component={
                <AddBankViaPlaidOrManual
                  onSubmit={(data) => {
                    onClose(data)
                  }}
                />
              }
            />
            <BankAccountComponent onSelect={() => setShowDialog(true)} />
          </div>
        )}
        {bankAccounts && bankAccounts.length == 0 && verifiedOnly && (
          <div className="mt-2 text-left text-gray-700">
            No verified bank accounts found. Please add and verify at least one bank account.
          </div>
        )}
      </>
    )
  }
}

export function AddBankViaPlaidOrManual({
  title,
  actions,
  onSubmit,
}: {
  title?: ReactNode
  actions?: ReactNode
  onSubmit: (data: Mercoa.PaymentMethodResponse) => void
}) {
  const mercoaSession = useMercoaSession()
  const [showManual, setShowManual] = useState(false)

  const [linkToken, setLinkToken] = useState<string | null>(null)

  const generateToken = async () => {
    if (!mercoaSession.entityId) return
    const token = await mercoaSession.client?.entity.plaidLinkToken(mercoaSession.entityId)
    if (!token) setShowManual(true)
    else setLinkToken(token)
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      let resp: Mercoa.PaymentMethodResponse | undefined
      await Promise.all(
        metadata.accounts.map(async (account) => {
          let accountType: Mercoa.BankType = Mercoa.BankType.Checking
          if (account.subtype == 'savings') accountType = Mercoa.BankType.Savings

          if (!mercoaSession.entityId) return
          resp = await mercoaSession.client?.entity.paymentMethod.create(mercoaSession.entityId, {
            type: 'bankAccount',
            plaid: {
              publicToken: public_token,
              accountId: account.id,
            },
            accountNumber: account.mask,
            routingNumber: '',
            accountType,
            bankName: metadata?.institution?.name ?? '',
          })
        }),
      )

      if (resp) onSubmit(resp)
    },
    onExit: (err, metadata) => {
      console.log('onPlaidExit', { err, metadata })
      if (err) {
        toast.error('There was an error adding your bank account automatically. Please try again or add manually.')
      }
      setShowManual(true)
    },
  })

  useEffect(() => {
    generateToken()
  }, [mercoaSession.entityId])

  useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  if (showManual) {
    return <AddBankAccount title={title} actions={actions} onSubmit={onSubmit} />
  } else if (!linkToken || !ready) {
    return (
      <div className="p-9 text-center">
        <LoadingSpinnerIcon />
      </div>
    )
  } else {
    return <div className="p-10 text-center"></div>
  }
}

export function AddBankAccount({
  onSubmit,
  title,
  actions,
  formOnlySubmit,
  bankAccount,
}: {
  onSubmit?: Function
  title?: ReactNode
  actions?: ReactNode
  formOnlySubmit?: Function
  bankAccount?: Mercoa.BankAccountRequest
}) {
  const mercoaSession = useMercoaSession()

  yup.addMethod(yup.string, 'accountNumber', function (message) {
    return this.test({
      name: 'accountNumber',
      exclusive: true,
      message: message || 'Invalid Account Number', // expect an i18n message to be passed in,
      test: (value) => value && validBankAccount.accountNumber(value).isPotentiallyValid,
    })
  })

  yup.addMethod(yup.string, 'routingNumber', function (message) {
    return this.test({
      name: 'routingNumber',
      exclusive: true,
      message: message || 'Invalid Routing Number', // expect an i18n message to be passed in,
      test: (value) => value && validBankAccount.routingNumber(value).isPotentiallyValid,
    })
  })

  const schema = yup
    .object({
      bankName: yup.string().required(),
      //@ts-ignore
      routingNumber: yup.string().required(),
      //@ts-ignore
      accountNumber: yup.string().accountNumber().required(),
    })
    .required()

  const {
    register,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: bankAccount,
    resolver: yupResolver(schema),
  })

  async function submitBankAccount(bankAccount: Mercoa.BankAccountRequest) {
    if (mercoaSession.entity?.id) {
      const resp = await mercoaSession.client?.entity.paymentMethod.create(mercoaSession.entity?.id, {
        ...bankAccount,
        type: 'bankAccount',
      })
      if (!onSubmit) return
      if (resp) onSubmit(resp)
      else onSubmit()
    }
  }

  return (
    <form className="space-y-3 text-left" onSubmit={handleSubmit((formOnlySubmit as any) || submitBankAccount)}>
      {title || <h3 className="text-center text-lg font-medium leading-6 text-gray-900">Manually Add Bank Account</h3>}

      <AddBankAccountForm
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        setError={setError}
        clearErrors={clearErrors}
      />

      {actions || (
        <div className="flex justify-between">
          <MercoaButton
            isEmphasized={false}
            onClick={() => {
              if (onSubmit) onSubmit()
            }}
            type="button"
          >
            Back
          </MercoaButton>
          <MercoaButton isEmphasized>Add Bank Account</MercoaButton>
        </div>
      )}
    </form>
  )
}

export function AddBankAccountForm({
  register,
  errors,
  watch,
  setValue,
  setError,
  clearErrors,
}: {
  register: Function
  errors: any
  watch: Function
  setValue: Function
  setError: Function
  clearErrors: Function
}) {
  const mercoaSession = useMercoaSession()
  const routingNumber = watch('routingNumber')
  const bankName = watch('bankName')

  useEffect(() => {
    setValue('bankName', '', { shouldDirty: true, shouldTouch: true })
    if (!routingNumber) return
    //if (validBankAccount.routingNumber(routingNumber).isPotentiallyValid) {
    if (routingNumber.length === 9) {
      mercoaSession.client?.bankLookup.find({ routingNumber }).then((bankNameResp) => {
        if (bankNameResp.bankName) {
          setValue('bankName', bankNameResp.bankName)
          clearErrors('routingNumber')
        } else {
          setError('routingNumber', { message: 'invalid' })
        }
      })
    } else if (routingNumber) {
      setError('routingNumber', { message: 'invalid' })
    }
  }, [routingNumber])
  return (
    <>
      <div>
        <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700">
          Routing Number
        </label>
        <div className="mt-1">
          <input
            {...register('routingNumber')}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          />
          {errors?.routingNumber?.message && (
            <p className="text-sm text-red-500">Please enter a valid routing number</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
          Account Number
        </label>
        <div className="mt-1">
          <input
            {...register('accountNumber')}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          />
          {errors?.accountNumber?.message && (
            <p className="text-sm text-red-500">Please enter a valid account number</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
          Account Type
        </label>
        <div className="mt-1">
          <select
            {...register('accountType')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="UNKNOWN">Other</option>
          </select>
        </div>
      </div>

      {bankName && (
        <div>
          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
            Bank Name
          </label>
          <div className="mt-1">
            <input
              readOnly
              disabled
              {...register('bankName')}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
            {errors?.bankName?.message && <p className="text-sm text-red-500">Please enter the bank name</p>}
          </div>
        </div>
      )}
    </>
  )
}

export function EditBankAccount({
  paymentMethodId,
  onSubmit,
}: {
  paymentMethodId: Mercoa.PaymentMethodId
  onSubmit?: Function
}) {
  const mercoaSession = useMercoaSession()

  const { register, handleSubmit } = useForm()

  function onUpdate(data: Mercoa.BankAccountUpdateRequest) {
    if (mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod
        .update(mercoaSession.entity?.id, paymentMethodId, {
          ...data,
          type: Mercoa.PaymentMethodType.BankAccount,
        })
        .then(() => {
          toast.success('Bank account updated')
          if (onSubmit) onSubmit(data)
          mercoaSession.refresh()
        })
    }
  }

  return (
    <form onSubmit={handleSubmit(onUpdate)}>
      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
          Account Name
        </label>
        <div className="mt-1">
          <input
            {...register('accountName')}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <MercoaButton
          isEmphasized={false}
          onClick={() => {
            if (onSubmit) onSubmit()
          }}
          type="button"
        >
          Back
        </MercoaButton>
        <MercoaButton isEmphasized>Update</MercoaButton>
      </div>
    </form>
  )
}

export function AddDialog({ show, onClose, component }: { show: boolean; onClose: Function; component: ReactNode }) {
  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                {component}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export function BankAccountComponent({
  children,
  account,
  onSelect,
  showEdit,
  selected,
}: {
  children?: Function
  account?: Mercoa.BankAccountResponse
  onSelect?: Function
  showEdit?: boolean
  selected?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [verify, setVerify] = useState(false)
  const [showNameEdit, setShowNameEdit] = useState(false)

  async function deleteAccount() {
    if (mercoaSession.token && mercoaSession.entity?.id && account?.id) {
      await mercoaSession.client?.entity.paymentMethod.delete(mercoaSession.entity?.id, account?.id)
      mercoaSession.refresh()
    }
  }

  const { register, handleSubmit } = useForm()

  if (account) {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
        }}
        key={`${account?.routingNumber} ${account?.accountNumber}`}
        className={`relative flex items-center space-x-3 rounded-lg border ${
          selected ? 'border-indigo-300' : 'border-gray-300'
        } bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
          onSelect ? 'cursor-pointer hover:border-gray-400' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <BuildingLibraryIcon className={`h-5 w-5 ${selected ? 'text-indigo-400' : ''}`} />
        </div>
        <div className="flex min-w-0 flex-1 justify-between">
          <div className="group flex">
            <div>
              {!showEdit && <span className="absolute inset-0" aria-hidden="true" />}
              <AddDialog
                component={<EditBankAccount paymentMethodId={account.id} onSubmit={() => setShowNameEdit(false)} />}
                onClose={() => setShowNameEdit(false)}
                show={showNameEdit}
              />
              {account?.accountName ? (
                <>
                  <p className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}>
                    {account.accountName}
                  </p>
                  <p className={`text-xs font-medium text-gray-800 ${selected ? 'underline' : ''}`}>
                    {account?.bankName}
                    {` ••••${String(account?.accountNumber).slice(-4)}`}
                  </p>
                </>
              ) : (
                <>
                  <p className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}>{`${capitalize(
                    account?.accountType,
                  )} ••••${String(account?.accountNumber).slice(-4)}`}</p>
                  <p className={`text-xs font-medium text-gray-800 ${selected ? 'underline' : ''}`}>
                    {account?.bankName}
                  </p>
                </>
              )}
            </div>
            {showEdit && (
              <MercoaButton
                size="sm"
                isEmphasized={false}
                className="hidden group-hover:block ml-2"
                onClick={() => setShowNameEdit(true)}
              >
                <PencilIcon className="h-5 w-5" />
              </MercoaButton>
            )}
          </div>
          {showEdit && (account?.status === Mercoa.BankStatus.New || account?.status === Mercoa.BankStatus.Pending) && (
            <button
              className="relative inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
              onClick={() => setVerify(true)}
            >
              {account?.status === Mercoa.BankStatus.New && 'Start Verification'}
              {account?.status === Mercoa.BankStatus.Pending && 'Complete Verification'}
            </button>
          )}
        </div>
        {showEdit && (
          <div className="flex cursor-pointer">
            <DefaultPaymentMethodIndicator paymentMethod={account} />
            {account?.status === Mercoa.BankStatus.New && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can only receive funds">
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                  New
                </span>
              </Tooltip>
            )}
            {account?.status === Mercoa.BankStatus.Verified && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can send and receive funds">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Verified
                </span>
              </Tooltip>
            )}
            {account?.status === Mercoa.BankStatus.Pending && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can only receive funds">
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  Pending
                </span>
              </Tooltip>
            )}
            {(account?.status === Mercoa.BankStatus.VerificationFailed ||
              account?.status === Mercoa.BankStatus.Errored) && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can only receive funds">
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  VERIFICATION FAILED
                </span>
              </Tooltip>
            )}
            {/* <Popover className="relative">
          {({ }) => (
            <>{(account?.bankAccount?.status === Mercoa.BankStatus.New || account?.bankAccount?.status === Mercoa.BankStatus.Pending) &&
              <>
                <Popover.Button className='text-gray-900 group inline-flex items-center hover:bg-gray-200 rounded-md p-1 bg-white text-base font-medium hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'>
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </Popover.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-48 -translate-x-1/2 transform px-2 sm:px-0">
                    <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white p-4">
                      {(account?.bankAccount?.status === Mercoa.BankStatus.New || account?.bankAccount?.status === Mercoa.BankStatus.Pending) &&
                        <button className="text-sm mb-1 w-full p-1 hover:bg-gray-100 rounded-md" onClick={() => setVerify(true)}>Verify Account</button>}
                    </div>
                  </Popover.Panel>
                </Transition>
              </>}</>
          )}
        </Popover> */}
            <Transition.Root show={!!verify} as={Fragment}>
              <Dialog as="div" className="relative z-10" onClose={() => setVerify(false)}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                  <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                      enterTo="opacity-100 translate-y-0 sm:scale-100"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                      leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    >
                      <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Verify Account
                        </Dialog.Title>

                        {account?.status === Mercoa.BankStatus.New && (
                          <>
                            <p className="mt-5 text-sm">
                              Mercoa will send two small deposits to verify this account. These deposits may take up to
                              1-2 days to appear.
                            </p>
                            <p className="mt-3 text-sm">
                              Once transactions have been sent, you&apos;ll have 14 days to verify their values.
                            </p>
                            {mercoaSession.organization?.sandbox && (
                              <p className="mt-3 rounded-md bg-orange-200 p-1 text-sm">
                                <b>Test Mode:</b> actual deposits will not be sent. Use 0 and 0 as the values to
                                instantly verify the account in the next step.
                              </p>
                            )}
                            <button
                              onClick={async () => {
                                if (mercoaSession.entity?.id && account?.id) {
                                  await mercoaSession.client?.entity.paymentMethod.initiateMicroDeposits(
                                    mercoaSession.entity?.id,
                                    account?.id,
                                  )
                                  setVerify(false)
                                  mercoaSession.refresh()
                                }
                              }}
                              className="mt-5 inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
                            >
                              Send deposits
                            </button>
                          </>
                        )}

                        {account?.status === Mercoa.BankStatus.Pending && (
                          <form
                            onSubmit={handleSubmit(async (data) => {
                              if (mercoaSession.entity?.id && account?.id) {
                                await mercoaSession.client?.entity.paymentMethod.completeMicroDeposits(
                                  mercoaSession.entity?.id,
                                  account?.id,
                                  {
                                    amounts: [Number(data.md1), Number(data.md2)],
                                  },
                                )
                                setVerify(false)
                                mercoaSession.refresh()
                              }
                            })}
                          >
                            <p className="mt-5 text-sm">
                              Micro-deposits may take up to 2 days to appear on your statement. Once you have both
                              values please enter the amounts to verify this account.
                            </p>
                            {mercoaSession.organization?.sandbox && (
                              <p className="mt-3 rounded-md bg-orange-200 p-1 text-sm">
                                <b>Test Mode:</b> use 0 and 0 to instantly verify this account.
                              </p>
                            )}
                            <div className="mt-2">
                              <label htmlFor="md1" className="block text-left text-sm font-medium text-gray-700">
                                Amount
                              </label>
                              <div className="mt-1">
                                <input
                                  {...register('md1')}
                                  type="number"
                                  placeholder="0.00"
                                  step={0.01}
                                  min={0}
                                  max={0.99}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-2">
                              <label htmlFor="md2" className="block text-left text-sm font-medium text-gray-700">
                                Amount
                              </label>
                              <div className="mt-1">
                                <input
                                  {...register('md2')}
                                  type="number"
                                  placeholder="0.00"
                                  step={0.01}
                                  min={0}
                                  max={0.99}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            </div>
                            <button className="mt-5 inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm">
                              Verify Account
                            </button>
                          </form>
                        )}
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition.Root>
          </div>
        )}
      </div>
    )
  } else {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
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
          <p className="text-sm font-medium text-gray-900">Add new bank account</p>
          <p className="truncate text-sm text-gray-500"></p>
        </div>
      </div>
    )
  }
}
