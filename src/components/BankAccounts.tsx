import { Dialog, Transition } from '@headlessui/react'
import { BuildingLibraryIcon, InformationCircleIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { usePlaidLink } from 'react-plaid-link'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import {
  AddDialog,
  DefaultPaymentMethodIndicator,
  LoadingSpinnerIcon,
  MercoaButton,
  Tooltip,
  stopPropagate,
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
  const [bankAccounts, setBankAccounts] = useState<Array<Mercoa.PaymentMethodResponse.BankAccount>>()

  const mercoaSession = useMercoaSession()
  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod
        .getAll(mercoaSession.entity?.id, { type: 'bankAccount' })
        .then((resp) => {
          setBankAccounts(
            resp
              .map((e) => e as Mercoa.PaymentMethodResponse.BankAccount)
              .filter((e) => {
                if (verifiedOnly && e.status != 'VERIFIED') return null
                return e
              }),
          )
        })
    }
  }, [mercoaSession.entity?.id, mercoaSession.token, mercoaSession.refreshId])

  if (children) return children({ bankAccounts })
  else {
    return (
      <>
        {!bankAccounts && (
          <div className="mercoa-p-9 mercoa-text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        {bankAccounts &&
          bankAccounts.map((account) => (
            <div className="mercoa-mt-2" key={account.id}>
              <BankAccountComponent account={account} onSelect={onSelect} showEdit={showEdit} />
            </div>
          ))}
        {bankAccounts && showAdd && <AddBankAccountDialog onSelect={onSelect} />}
        {bankAccounts && bankAccounts.length == 0 && verifiedOnly && (
          <div className="mercoa-mt-2 mercoa-text-left mercoa-text-gray-700">
            No verified bank accounts found. Please add and verify at least one bank account.
          </div>
        )}
      </>
    )
  }
}

export function BankAccountComponent({
  children,
  account,
  onSelect,
  showEdit,
  selected,
}: {
  children?: Function
  account?: Mercoa.PaymentMethodResponse.BankAccount
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
          <BuildingLibraryIcon className="mercoa-h-5 mercoa-w-5" />
        </div>
        <div className="mercoa-flex mercoa-min-w-0 mercoa-flex-1 mercoa-justify-between mercoa-group">
          <div className="mercoa-flex">
            <div>
              {!showEdit && <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />}
              <AddDialog
                component={<EditBankAccount account={account} onSubmit={() => setShowNameEdit(false)} />}
                onClose={() => setShowNameEdit(false)}
                show={showNameEdit}
              />
              {account?.accountName ? (
                <>
                  <p
                    className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${
                      selected ? 'mercoa-underline' : ''
                    }`}
                  >
                    {account.accountName}
                  </p>
                  <p
                    className={`mercoa-text-xs mercoa-font-medium mercoa-text-gray-800 ${
                      selected ? 'mercoa-underline' : ''
                    }`}
                  >
                    {account?.bankName}
                    {` ••••${String(account?.accountNumber).slice(-4)}`}
                  </p>
                </>
              ) : (
                <>
                  <p
                    className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${
                      selected ? 'mercoa-underline' : ''
                    }`}
                  >{`${capitalize(account?.accountType)} ••••${String(account?.accountNumber).slice(-4)}`}</p>
                  <p
                    className={`mercoa-text-xs mercoa-font-medium mercoa-text-gray-800 ${
                      selected ? 'mercoa-underline' : ''
                    }`}
                  >
                    {account?.bankName}
                  </p>
                </>
              )}
            </div>
            {showEdit && (
              <MercoaButton
                size="sm"
                isEmphasized={false}
                className="mercoa-hidden group-hover:mercoa-block mercoa-ml-2"
                onClick={() => setShowNameEdit(true)}
              >
                <PencilIcon className="mercoa-h-5 mercoa-w-5" />
              </MercoaButton>
            )}
          </div>
          {showEdit && (account?.status === Mercoa.BankStatus.New || account?.status === Mercoa.BankStatus.Pending) && (
            <button
              className="mercoa-relative mercoa-inline-flex mercoa-items-center mercoa-rounded-md mercoa-bg-green-600 mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-green-700"
              onClick={() => setVerify(true)}
            >
              {account?.status === Mercoa.BankStatus.New && 'Start Verification'}
              {account?.status === Mercoa.BankStatus.Pending && 'Complete Verification'}
            </button>
          )}
        </div>
        {showEdit && (
          <div className="mercoa-flex mercoa-cursor-pointer ">
            <DefaultPaymentMethodIndicator paymentMethod={account} />
            {account?.status === Mercoa.BankStatus.New && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can only receive funds">
                <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-indigo-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-indigo-800">
                  New
                </span>
              </Tooltip>
            )}
            {account?.status === Mercoa.BankStatus.Verified && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can send and receive funds">
                <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-green-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-green-800">
                  Verified
                </span>
              </Tooltip>
            )}
            {account?.status === Mercoa.BankStatus.Pending && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can only receive funds">
                <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-yellow-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-yellow-800">
                  Pending
                </span>
              </Tooltip>
            )}
            {(account?.status === Mercoa.BankStatus.VerificationFailed ||
              account?.status === Mercoa.BankStatus.Errored) && (
              /* @ts-ignore:next-line */
              <Tooltip title="Can only receive funds">
                <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-red-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-red-800">
                  VERIFICATION FAILED
                </span>
              </Tooltip>
            )}
            {/* <Popover className="mercoa-relative">
          {({ }) => (
            <>{(account?.bankAccount?.status === Mercoa.BankStatus.New || account?.bankAccount?.status === Mercoa.BankStatus.Pending) &&
              <>
                <Popover.Button className='mercoa-text-gray-900 group mercoa-inline-flex mercoa-items-center hover:mercoa-bg-gray-200 mercoa-rounded-md mercoa-p-1 mercoa-bg-white mercoa-text-base mercoa-font-medium hover:mercoa-text-gray-900 focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-indigo-500 focus:mercoa-ring-offset-2'>
                  <EllipsisVerticalIcon className="mercoa-h-5 mercoa-w-5" />
                </Popover.Button>

                <Transition
                  as={Fragment}
                  enter="mercoa-transition mercoa-ease-out mercoa-duration-200"
                  enterFrom="mercoa-opacity-0 mercoa-translate-y-1"
                  enterTo="mercoa-opacity-100 mercoa-translate-y-0"
                  leave="mercoa-transition mercoa-ease-in mercoa-duration-150"
                  leaveFrom="mercoa-opacity-100 mercoa-translate-y-0"
                  leaveTo="mercoa-opacity-0 mercoa-translate-y-1"
                >
                  <Popover.Panel className="mercoa-absolute mercoa-left-1/2 mercoa-z-10 mercoa-mt-3 mercoa-w-48 -mercoa-translate-x-1/2 mercoa-transform mercoa-px-2 sm:mercoa-px-0">
                    <div className="mercoa-overflow-hidden mercoa-rounded-lg mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 mercoa-bg-white mercoa-p-4">
                      {(account?.bankAccount?.status === Mercoa.BankStatus.New || account?.bankAccount?.status === Mercoa.BankStatus.Pending) &&
                        <button className="mercoa-text-sm mercoa-mb-1 mercoa-w-full mercoa-p-1 hover:mercoa-bg-gray-100 mercoa-rounded-md" onClick={() => setVerify(true)}>Verify Account</button>}
                    </div>
                  </Popover.Panel>
                </Transition>
              </>}</>
          )}
        </Popover> */}
            <Transition.Root show={!!verify} as={Fragment}>
              <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={() => setVerify(false)}>
                <Transition.Child
                  as={Fragment}
                  enter="mercoa-ease-out mercoa-duration-300"
                  enterFrom="mercoa-opacity-0"
                  enterTo="mercoa-opacity-100"
                  leave="mercoa-ease-in mercoa-duration-200"
                  leaveFrom="mercoa-opacity-100"
                  leaveTo="mercoa-opacity-0"
                >
                  <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-mercoa-opacity-75 mercoa-transition-opacity" />
                </Transition.Child>

                <div className="mercoa-fixed mercoa-inset-0 mercoa-z-10 mercoa-overflow-y-auto">
                  <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
                    <Transition.Child
                      as={Fragment}
                      enter="mercoa-ease-out mercoa-duration-300"
                      enterFrom="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
                      enterTo="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                      leave="mercoa-ease-in mercoa-duration-200"
                      leaveFrom="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                      leaveTo="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
                    >
                      <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-lg sm:mercoa-p-6">
                        <Dialog.Title
                          as="h3"
                          className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                        >
                          Verify Account
                        </Dialog.Title>

                        {account?.status === Mercoa.BankStatus.New && (
                          <>
                            <p className="mercoa-mt-5 mercoa-text-sm">
                              Mercoa will send two small deposits to verify this account. These deposits may take up to
                              1-2 days to appear.
                            </p>
                            <p className="mercoa-mt-3 mercoa-text-sm">
                              Once transactions have been sent, you&apos;ll have 14 days to verify their values.
                            </p>
                            {mercoaSession.organization?.sandbox && (
                              <p className="mercoa-mt-3 mercoa-rounded-md mercoa-bg-orange-200 mercoa-p-1 mercoa-text-sm">
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
                              className="mercoa-mt-5 mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-rounded-md mercoa-border mercoa-border-transparent mercoa-bg-indigo-600 mercoa-px-4 mercoa-py-2 mercoa-text-base mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-indigo-700 focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-indigo-500 focus:mercoa-ring-offset-2 disabled:mercoa-bg-indigo-300 sm:mercoa-text-sm"
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
                            <p className="mercoa-mt-5 mercoa-text-sm">
                              Micro-deposits may take up to 2 days to appear on your statement. Once you have both
                              values please enter the amounts to verify this account.
                            </p>
                            {mercoaSession.organization?.sandbox && (
                              <p className="mercoa-mt-3 mercoa-rounded-md mercoa-bg-orange-200 mercoa-p-1 mercoa-text-sm">
                                <b>Test Mode:</b> use 0 and 0 to instantly verify this account.
                              </p>
                            )}
                            <div className="mercoa-mt-2">
                              <label
                                htmlFor="md1"
                                className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
                              >
                                Amount
                              </label>
                              <div className="mercoa-mt-1">
                                <input
                                  {...register('md1')}
                                  type="number"
                                  placeholder="0.00"
                                  step={0.01}
                                  min={0}
                                  max={0.99}
                                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
                                />
                              </div>
                            </div>
                            <div className="mercoa-mt-2">
                              <label
                                htmlFor="md2"
                                className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
                              >
                                Amount
                              </label>
                              <div className="mercoa-mt-1">
                                <input
                                  {...register('md2')}
                                  type="number"
                                  placeholder="0.00"
                                  step={0.01}
                                  min={0}
                                  max={0.99}
                                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
                                />
                              </div>
                            </div>
                            <button className="mercoa-mt-5 mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-rounded-md mercoa-border mercoa-border-transparent mercoa-bg-indigo-600 mercoa-px-4 mercoa-py-2 mercoa-text-base mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-indigo-700 focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-indigo-500 focus:mercoa-ring-offset-2 disabled:mercoa-bg-indigo-300 sm:mercoa-text-sm">
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
          <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">Add new bank account</p>
          <p className="mercoa-truncate mercoa-text-sm mercoa-text-gray-500"></p>
        </div>
      </div>
    )
  }
}

export function AddBankAccountDialog({ entityId, onSelect }: { entityId?: Mercoa.EntityId; onSelect?: Function }) {
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
          <AddBankViaPlaidOrManual
            onSubmit={(data) => {
              onClose(data)
            }}
            entityId={entityId}
          />
        }
      />
      <BankAccountComponent onSelect={() => setShowDialog(true)} />
    </div>
  )
}

export function AddBankViaPlaidOrManual({
  title,
  actions,
  onSubmit,
  entityId,
}: {
  title?: ReactNode
  actions?: ReactNode
  onSubmit: (data: Mercoa.PaymentMethodResponse) => void
  entityId?: Mercoa.EntityId
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
    if (!mercoaSession.entityId) return
    if (entityId && entityId != mercoaSession.entityId) {
      setShowManual(true)
    } else {
      generateToken()
    }
  }, [mercoaSession.entityId, entityId])

  useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  if (showManual) {
    return <AddBankAccount title={title} actions={actions} onSubmit={onSubmit} entityId={entityId} />
  } else if (!linkToken || !ready) {
    return (
      <div className="mercoa-p-9 mercoa-text-center">
        <LoadingSpinnerIcon />
      </div>
    )
  } else {
    return <div className="mercoa-p-10 mercoa-text-center"></div>
  }
}

export function AddBankAccount({
  onSubmit,
  title,
  actions,
  formOnlySubmit,
  bankAccount,
  entityId,
}: {
  onSubmit?: Function
  title?: ReactNode
  actions?: ReactNode
  formOnlySubmit?: Function
  bankAccount?: Mercoa.BankAccountRequest
  entityId?: Mercoa.EntityId
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
      const resp = await mercoaSession.client?.entity.paymentMethod.create(entityId ?? mercoaSession.entity?.id, {
        ...bankAccount,
        type: 'bankAccount',
      })
      if (!onSubmit) return
      if (resp) onSubmit(resp)
      else onSubmit()
    }
  }

  return (
    <form
      className="mercoa-space-y-3 mercoa-text-left"
      onSubmit={stopPropagate(handleSubmit((formOnlySubmit as any) || submitBankAccount))}
    >
      {title || (
        <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          Add Bank Account
        </h3>
      )}

      <AddBankAccountForm
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        setError={setError}
        clearErrors={clearErrors}
      />

      {actions || (
        <div className="mercoa-flex mercoa-justify-between">
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
        <label htmlFor="routingNumber" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
          Routing Number
        </label>
        <div className="mercoa-mt-1">
          <input
            {...register('routingNumber')}
            className="mercoa-block mercoa-w-full mercoa-appearance-none mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-px-3 mercoa-py-2 mercoa-placeholder-gray-400 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
          />
          {errors?.routingNumber?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">Please enter a valid routing number</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="accountNumber" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
          Account Number
        </label>
        <div className="mercoa-mt-1">
          <input
            {...register('accountNumber')}
            className="mercoa-block mercoa-w-full mercoa-appearance-none mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-px-3 mercoa-py-2 mercoa-placeholder-gray-400 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
          />
          {errors?.accountNumber?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">Please enter a valid account number</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="accountType" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
          Account Type
        </label>
        <div className="mercoa-mt-1">
          <select
            {...register('accountType')}
            className="mercoa-mt-1 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-py-2 mercoa-px-3 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
          >
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="UNKNOWN">Other</option>
          </select>
        </div>
      </div>

      {bankName && (
        <div>
          <label htmlFor="bankName" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
            Bank Name
          </label>
          <div className="mercoa-mt-1">
            <input
              readOnly
              disabled
              {...register('bankName')}
              className="mercoa-block mercoa-w-full mercoa-appearance-none mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-px-3 mercoa-py-2 mercoa-placeholder-gray-400 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
            />
            {errors?.bankName?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">Please enter the bank name</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function EditBankAccount({
  account,
  onSubmit,
}: {
  account: Mercoa.PaymentMethodResponse.BankAccount
  onSubmit?: Function
}) {
  const mercoaSession = useMercoaSession()

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      accountName: account.accountName,
      checkOptions: account.checkOptions,
    },
  })

  function onUpdate(data: Mercoa.BankAccountUpdateRequest) {
    if (mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod
        .update(mercoaSession.entity?.id, account.id, {
          accountName: data.accountName,
          checkOptions: {
            enabled: data.checkOptions?.enabled,
            initialCheckNumber: Number(data.checkOptions?.initialCheckNumber),
            signatoryName: data.checkOptions?.signatoryName,
          },
          type: Mercoa.PaymentMethodType.BankAccount,
        })
        .then(() => {
          toast.success('Bank account updated')
          if (onSubmit) onSubmit(data)
          mercoaSession.refresh()
        })
        .catch((err) => {
          toast.error('There was an error updating your bank account')
        })
    }
  }

  const checkEnabled = !!(account.accountType === 'CHECKING' && watch('checkOptions.enabled'))

  return (
    <form onSubmit={handleSubmit(onUpdate)}>
      <div>
        <label htmlFor="accountName" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
          Account Name
        </label>
        <div className="mercoa-mt-1">
          <input
            {...register('accountName')}
            className="mercoa-block mercoa-w-full mercoa-appearance-none mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-px-3 mercoa-py-2 mercoa-placeholder-gray-400 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
          />
        </div>
      </div>
      {account.accountType === 'CHECKING' && (
        <div className="mercoa-relative mercoa-mt-5 mercoa-flex mercoa-items-start mercoa-items-center">
          <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
            <input
              {...register('checkOptions.enabled')}
              type="checkbox"
              className="mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
            />
          </div>
          <div className="mercoa-ml-3 mercoa-text-sm">
            {/* @ts-ignore:next-line */}
            <Tooltip title="If enabled, checks can be printed with the account and routing number of this account.">
              <label htmlFor="checkOptions.enabled" className="mercoa-font-medium mercoa-text-gray-700">
                Enable Check Payments
                <InformationCircleIcon className="mercoa-inline mercoa-h-5 mercoa-w-5" />
              </label>
            </Tooltip>
          </div>
        </div>
      )}
      {checkEnabled && (
        <>
          <div className="mercoa-mt-2">
            <label
              htmlFor="checkOptions.initialCheckNumber"
              className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              Initial Check Number
            </label>
            <div className="mercoa-mt-1">
              <input
                {...register('checkOptions.initialCheckNumber')}
                className="mercoa-block mercoa-w-full mercoa-appearance-none mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-px-3 mercoa-py-2 mercoa-placeholder-gray-400 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              />
            </div>
          </div>
          <div className="mercoa-mt-2">
            <label
              htmlFor="checkOptions.signatoryName"
              className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              Signatory Name
            </label>
            <div className="mercoa-mt-1">
              <input
                {...register('checkOptions.signatoryName')}
                className="mercoa-block mercoa-w-full mercoa-appearance-none mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-px-3 mercoa-py-2 mercoa-placeholder-gray-400 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              />
            </div>
          </div>
        </>
      )}
      <div className="mercoa-flex mercoa-justify-between mercoa-mt-5">
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
