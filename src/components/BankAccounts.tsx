import { Dialog, Transition } from '@headlessui/react'
import {
  BuildingLibraryIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PencilSquareIcon,
  PlusIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Fragment, ReactNode, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { PlaidLinkError, PlaidLinkOnExitMetadata, usePlaidLink } from 'react-plaid-link'
import SignatureCanvas from 'react-signature-canvas'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import { capitalize, removeThousands } from '../lib/lib'
import {
  AddDialog,
  DefaultPaymentMethodIndicator,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  MercoaInput,
  NoSession,
  PaymentMethodButton,
  PaymentMethodList,
  Tooltip,
  inputClassName,
  useMercoaSession,
} from './index'

export function BankAccounts({
  children,
  onSelect,
  showAdd,
  showEdit,
  showDelete,
  verifiedOnly,
  hideIndicators,
}: {
  children?: Function
  onSelect?: (value?: Mercoa.PaymentMethodResponse.BankAccount) => void
  showAdd?: boolean
  showEdit?: boolean
  showDelete?: boolean
  verifiedOnly?: boolean
  hideIndicators?: boolean
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

  if (!mercoaSession.client) return <NoSession componentName="BankAccounts" />

  if (children) return children({ bankAccounts })
  else {
    return (
      <>
        {!bankAccounts && (
          <div className="mercoa-p-9 mercoa-text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        <PaymentMethodList
          accounts={bankAccounts}
          showDelete={showDelete || showEdit}
          addAccount={
            bankAccounts && showAdd ? (
              <AddBankAccountButton
                onSelect={(account: Mercoa.PaymentMethodResponse.BankAccount) => {
                  if (
                    !bankAccounts.find(
                      (e) => e.accountNumber === account.accountNumber && e.routingNumber === account.routingNumber,
                    )
                  ) {
                    setBankAccounts([...bankAccounts, account])
                  }
                  if (onSelect) onSelect(account)
                }}
              />
            ) : undefined
          }
          formatAccount={(account: Mercoa.PaymentMethodResponse.BankAccount) => (
            <BankAccount
              account={account}
              onSelect={onSelect}
              showEdit={showEdit}
              hideDefaultIndicator={hideIndicators}
              hideVerificationButton={hideIndicators}
              hideVerificationStatus={hideIndicators}
              hideCheckSendStatus={hideIndicators}
            />
          )}
        />
        {bankAccounts && bankAccounts.length == 0 && verifiedOnly && (
          <div className="mercoa-mt-2 mercoa-text-left mercoa-text-gray-700">
            No verified bank accounts found. Please add and verify at least one bank account.
          </div>
        )}
      </>
    )
  }
}

export function BankAccount({
  children,
  account,
  onSelect,
  showEdit,
  selected,
  hideDefaultIndicator,
  hideVerificationButton,
  hideVerificationStatus,
  hideCheckSendStatus,
}: {
  children?: Function
  account?: Mercoa.PaymentMethodResponse.BankAccount
  onSelect?: (value?: Mercoa.PaymentMethodResponse.BankAccount) => void
  showEdit?: boolean
  selected?: boolean
  hideDefaultIndicator?: boolean
  hideVerificationButton?: boolean
  hideVerificationStatus?: boolean
  hideCheckSendStatus?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [verify, setVerify] = useState(false)
  const [showNameEdit, setShowNameEdit] = useState(false)

  const { register, handleSubmit } = useForm()

  if (!mercoaSession.client) return <NoSession componentName="BankAccountComponent" />

  if (account) {
    return (
      <div className={account.frozen ? 'mercoa-line-through pointer-events-none' : ''}>
        <div
          onClick={() => {
            if (onSelect) onSelect(account)
          }}
          key={`${account?.routingNumber} ${account?.accountNumber}`}
          className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border ${
            selected ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
          } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 ${
            onSelect ? 'mercoa-cursor-pointer hover:mercoa-border-mercoa-primary-dark' : ''
          }`}
        >
          <div
            className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
              selected
                ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
                : 'mercoa-bg-gray-200 mercoa-text-gray-600'
            }`}
          >
            <BuildingLibraryIcon className="mercoa-size-5" />
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
            </div>
          </div>
          {showEdit && (
            <div className="mercoa-flex mercoa-items-center mercoa-gap-x-1">
              {/* Default Payment Method Indicator */}
              {!hideDefaultIndicator && <DefaultPaymentMethodIndicator paymentMethod={account} />}

              {/* Verification Button */}
              {(account?.status === Mercoa.BankStatus.New ||
                account?.status === Mercoa.BankStatus.Pending ||
                account?.status === Mercoa.BankStatus.VerificationFailed) &&
                !hideVerificationButton && (
                  <MercoaButton isEmphasized size="sm" className="mercoa-mr-2" onClick={() => setVerify(true)}>
                    {account?.status === Mercoa.BankStatus.New && 'Start Verification'}
                    {account?.status === Mercoa.BankStatus.VerificationFailed && 'Retry Verification'}
                    {account?.status === Mercoa.BankStatus.Pending && 'Complete Verification'}
                  </MercoaButton>
                )}

              {/* Verification Status Indicator */}
              {!hideVerificationStatus && (
                <div>
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
                </div>
              )}

              {/* Check Send Status Indicator */}
              {!hideCheckSendStatus && (
                <div>
                  {account.checkOptions?.enabled ? (
                    <Tooltip title="Can send checks">
                      <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-green-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-green-800">
                        _<EnvelopeIcon className="mercoa-size-4" />
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Check send disabled">
                      <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-gray-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-gray-800">
                        _<EnvelopeIcon className="mercoa-size-4" />
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}

              {/* Edit Button */}
              <MercoaButton
                size="sm"
                isEmphasized={false}
                className="mercoa-mr-2 mercoa-px-[4px] mercoa-py-[4px]"
                onClick={() => setShowNameEdit(true)}
              >
                <Tooltip title="Edit">
                  <PencilIcon className="mercoa-size-4" />
                </Tooltip>
              </MercoaButton>
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
                        <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-lg sm:mercoa-p-6">
                          <Dialog.Title
                            as="h3"
                            className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                          >
                            Verify Account
                          </Dialog.Title>

                          {(account?.status === Mercoa.BankStatus.New ||
                            account?.status === Mercoa.BankStatus.VerificationFailed) && (
                            <>
                              <p className="mercoa-mt-5 mercoa-text-sm">
                                Mercoa will send two small deposits to verify this account. These deposits may take up
                                to 1-2 days to appear.
                              </p>
                              <p className="mercoa-mt-3 mercoa-text-sm">
                                Once transactions have been sent, you&apos;ll have 14 days to verify their values.
                              </p>
                              {mercoaSession.organization?.sandbox && (
                                <p className="mercoa-mt-3 mercoa-rounded-mercoa mercoa-bg-orange-200 mercoa-p-1 mercoa-text-sm">
                                  <b>Test Mode:</b> actual deposits will not be sent. Use 0 and 0 as the values to
                                  instantly verify the account in the next step. Any other values will set the account
                                  to verification failed.
                                </p>
                              )}
                              <MercoaButton
                                isEmphasized
                                onClick={async () => {
                                  if (mercoaSession.entity?.id && account?.id) {
                                    await mercoaSession.client?.entity.paymentMethod.bankAccount.initiateMicroDeposits(
                                      mercoaSession.entity?.id,
                                      account?.id,
                                    )
                                    setVerify(false)
                                    toast.info('Micro-deposits sent')
                                    mercoaSession.refresh()
                                  }
                                }}
                                className="mercoa-mt-5 mercoa-inline-flex mercoa-w-full mercoa-justify-center"
                              >
                                Send deposits
                              </MercoaButton>
                            </>
                          )}

                          {account?.status === Mercoa.BankStatus.Pending && (
                            <form
                              onSubmit={handleSubmit(async (data) => {
                                if (mercoaSession.entity?.id && account?.id) {
                                  try {
                                    const bankAccount =
                                      await mercoaSession.client?.entity.paymentMethod.bankAccount.completeMicroDeposits(
                                        mercoaSession.entity?.id,
                                        account?.id,
                                        {
                                          amounts: [Number(data.md1), Number(data.md2)],
                                        },
                                      )
                                    if (
                                      bankAccount &&
                                      bankAccount.type === Mercoa.PaymentMethodType.BankAccount &&
                                      bankAccount.status === Mercoa.BankStatus.Verified
                                    ) {
                                      toast.info('Micro-deposits verified.')
                                    } else {
                                      toast.error('Micro-deposit verification failed.')
                                    }
                                  } catch (e) {
                                    toast.error('Micro-deposit verification failed.')
                                  }
                                  setVerify(false)
                                  await mercoaSession.refresh()
                                  setTimeout(() => mercoaSession.refresh(), 5000)
                                }
                              })}
                            >
                              <p className="mercoa-mt-5 mercoa-text-sm">
                                Micro-deposits may take up to 2 days to appear on your statement. Once you have both
                                values please enter the amounts to verify this account.
                              </p>
                              {mercoaSession.organization?.sandbox && (
                                <p className="mercoa-mt-3 mercoa-rounded-mercoa mercoa-bg-orange-200 mercoa-p-1 mercoa-text-sm">
                                  <b>Test Mode:</b> use 0 and 0 to instantly verify this account. Any other values will
                                  set the account to verification failed.
                                </p>
                              )}
                              <MercoaInput
                                name="md1"
                                label="Amount"
                                type="number"
                                placeholder="0.00"
                                step={0.01}
                                min={0}
                                max={0.99}
                                register={register}
                                className="mercoa-mt-2"
                              />
                              <MercoaInput
                                name="md2"
                                label="Amount"
                                type="number"
                                placeholder="0.00"
                                step={0.01}
                                min={0}
                                max={0.99}
                                register={register}
                                className="mercoa-mt-2"
                              />
                              <MercoaButton isEmphasized className="mercoa-mt-5">
                                Verify Account
                              </MercoaButton>
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
      </div>
    )
  } else {
    return (
      <PaymentMethodButton
        onSelect={onSelect}
        account={account}
        selected={selected}
        icon={<PlusIcon className="mercoa-size-5" />}
        text="Add new bank account"
      />
    )
  }
}

export function AddBankAccountButton({
  entityId,
  onSelect,
  bankAccount,
}: {
  entityId?: Mercoa.EntityId
  onSelect?: Function
  bankAccount?: Mercoa.BankAccountRequest
}) {
  const [showDialog, setShowDialog] = useState(false)

  const onClose = (account?: Mercoa.PaymentMethodResponse) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  return (
    <div>
      <AddDialog
        show={showDialog}
        onClose={onClose}
        component={
          <AddBankViaPlaidOrManual
            onSubmit={(data) => {
              onClose(data)
            }}
            entityId={entityId}
            bankAccount={bankAccount}
          />
        }
      />
      <BankAccount onSelect={() => setShowDialog(true)} />
    </div>
  )
}

export function PlaidPopup({
  onExit,
  onSubmit,
  paymentMethodId,
}: {
  onExit?: (err: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata | null) => void
  onSubmit?: (paymentMethod: Mercoa.PaymentMethodResponse) => void
  paymentMethodId?: Mercoa.PaymentMethodId
}) {
  const mercoaSession = useMercoaSession()

  const [linkToken, setLinkToken] = useState<string | null>(null)

  const generateToken = async () => {
    if (!mercoaSession.entityId) return
    const token = await mercoaSession.client?.entity.paymentMethod.plaidLinkToken(mercoaSession.entityId, {
      paymentMethodId,
    })
    if (token) setLinkToken(token)
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
          try {
            if (paymentMethodId) {
              resp = await mercoaSession.client?.entity.paymentMethod.update(mercoaSession.entityId, paymentMethodId, {
                type: 'bankAccount',
                plaid: {
                  publicToken: public_token,
                  accountId: account.id,
                },
              })
            } else {
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
            }
          } catch (e) {
            console.error(e)
          }
        }),
      )
      if (resp) {
        if (onSubmit) onSubmit(resp)
      } else {
        if (onExit) onExit(null, null)
      }
    },
    onExit: (err, metadata) => {
      console.log('onPlaidExit', { err, metadata })
      if (onExit) onExit(err, metadata)
    },
    onEvent: (event) => {
      console.log('onPlaidEvent', { event })
    },
  })

  useEffect(() => {
    if (!mercoaSession.entityId) return
    generateToken()
  }, [mercoaSession.entityId])

  useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  if (!mercoaSession.client) return <NoSession componentName="PlaidPopup" />

  if (!linkToken || !ready) {
    return (
      <div className="mercoa-p-9 mercoa-text-center">
        <LoadingSpinnerIcon />
      </div>
    )
  } else {
    return <div className="mercoa-p-10 mercoa-text-center"></div>
  }
}

export function AddBankViaPlaidOrManual({
  title,
  actions,
  onSubmit,
  entityId,
  bankAccount,
  mode,
}: {
  title?: ReactNode
  actions?: ReactNode
  onSubmit: (data: Mercoa.PaymentMethodResponse) => void
  entityId?: Mercoa.EntityId
  bankAccount?: Mercoa.BankAccountRequest
  mode?: 'option' | 'plaid' | 'manual'
}) {
  const mercoaSession = useMercoaSession()
  const [selectedMode, setSelectedMode] = useState<'option' | 'plaid' | 'manual'>(mode ?? 'option')

  useEffect(() => {
    if (!mercoaSession.entityId) return
    if (entityId && entityId != mercoaSession.entityId) {
      setSelectedMode('manual')
    }
  }, [mercoaSession.entityId, entityId])

  if (!mercoaSession.client) return <NoSession componentName="AddBankViaPlaidOrManual" />
  if (selectedMode === 'manual') {
    return (
      <AddBankAccount
        title={title}
        actions={actions}
        onSubmit={onSubmit}
        entityId={entityId}
        bankAccount={bankAccount}
      />
    )
  } else if (selectedMode === 'plaid') {
    return (
      <PlaidPopup
        onSubmit={onSubmit}
        onExit={(err, metadata) => {
          if (err) {
            toast.error('There was an error adding your bank account automatically. Please try again or add manually.')
          }
          setSelectedMode('manual')
        }}
      />
    )
  } else {
    return (
      <div>
        <PaymentMethodButton
          onSelect={() => {
            setSelectedMode('plaid')
          }}
          selected={false}
          icon={<MagnifyingGlassIcon className="mercoa-size-5" />}
          text="Search for your bank"
        />
        <div className="mercoa-mt-2" />
        <PaymentMethodButton
          onSelect={() => {
            setSelectedMode('manual')
          }}
          selected={false}
          icon={<PencilSquareIcon className="mercoa-size-5" />}
          text="Use Routing and Account number"
        />
        {actions}
      </div>
    )
  }
}

export function AddBankAccount({
  onSubmit,
  title,
  actions,
  bankAccount,
  entityId,
}: {
  onSubmit?: Function
  title?: ReactNode
  actions?: ReactNode
  bankAccount?: Mercoa.BankAccountRequest
  entityId?: Mercoa.EntityId
}) {
  const mercoaSession = useMercoaSession()

  yup.addMethod(yup.string, 'accountNumber', function (message) {
    return this.test({
      name: 'accountNumber',
      exclusive: true,
      message: message || 'Invalid Account Number', // expect an i18n message to be passed in,
      test: (value) => {
        return !!value && Number(value) > 0
      },
    })
  })

  yup.addMethod(yup.string, 'routingNumber', function (message) {
    return this.test({
      name: 'routingNumber',
      exclusive: true,
      message: message || 'Invalid Routing Number', // expect an i18n message to be passed in,
      test: (value) => {
        return !!value && value.length == 9 && Number(value) > 0
      },
    })
  })

  const schema = yup
    .object({
      //@ts-ignore
      routingNumber: yup.string('Please enter a valid routing number').required('Please enter a valid routing number'),
      //@ts-ignore
      accountNumber: yup.string().accountNumber().required('Please enter a valid account number'),
    })
    .required()

  const methods = useForm({
    defaultValues: bankAccount,
    resolver: yupResolver(schema),
  })

  async function submitBankAccount(bankAccount: Mercoa.BankAccountRequest) {
    if (mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod
        .create(entityId ?? mercoaSession.entity?.id, {
          ...bankAccount,
          type: 'bankAccount',
        })
        .then((resp) => {
          if (!onSubmit) return
          if (resp) onSubmit(resp)
          else onSubmit()
        })
        .catch((e) => {
          console.error(JSON.stringify(e))
          if (e.body) {
            if (e.body.includes('already exists')) {
              toast.error('Bank account already exists')
            } else {
              if (e.body.includes('routing number')) {
                methods.setError('routingNumber', { message: 'Invalid routing number' })
              }
            }
          }
        })
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="AddBankAccount" />
  return (
    <FormProvider {...methods}>
      <form className="mercoa-space-y-3 mercoa-text-left" onSubmit={methods.handleSubmit(submitBankAccount as any)}>
        {title || (
          <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
            Add Bank Account
          </h3>
        )}

        <AddBankAccountForm />

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
    </FormProvider>
  )
}

export function AddBankAccountForm({ prefix }: { prefix?: string }) {
  const mercoaSession = useMercoaSession()

  if (!prefix) prefix = ''

  const {
    register,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useFormContext()

  const routingNumber = watch(prefix + 'routingNumber')
  const bankName = watch(prefix + 'bankName')

  useEffect(() => {
    setValue(prefix + 'bankName', '', { shouldDirty: true, shouldTouch: true })
    if (!routingNumber) return
    //if (validBankAccount.routingNumber(routingNumber).isPotentiallyValid) {
    if (routingNumber.length === 9) {
      mercoaSession.client?.bankLookup.find({ routingNumber }).then((bankNameResp) => {
        if (bankNameResp.bankName) {
          setValue(prefix + 'bankName', bankNameResp.bankName)
          clearErrors(prefix + 'routingNumber')
        } else {
          setError(prefix + 'routingNumber', { message: 'Please enter a valid routing number' })
        }
      })
    } else if (routingNumber) {
      setError(prefix + 'routingNumber', { message: 'Please enter a valid routing number' })
    }
  }, [routingNumber])

  if (!mercoaSession.client) return <NoSession componentName="AddBankAccountForm" />
  return (
    <div className="mercoa-flex mercoa-flex-col mercoa-gap-y-2">
      <MercoaInput
        label={`Routing Number ${bankName ? ` - ${bankName}` : ''}`}
        name={prefix + 'routingNumber'}
        register={register}
        errors={errors}
      />
      <MercoaInput label="Account Number" name={prefix + 'accountNumber'} register={register} errors={errors} />
      <div>
        <label htmlFor="accountType" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">
          Account Type
        </label>
        <div className="mercoa-mt-1">
          <select {...register(prefix + 'accountType')} className={inputClassName({})}>
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="UNKNOWN">Other</option>
          </select>
        </div>
      </div>
      <MercoaInput label="Account Name" name={prefix + 'accountName'} register={register} errors={errors} optional />
    </div>
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
  const [showPlaid, setShowPlaid] = useState(false)
  const sigRef = useRef<SignatureCanvas | null>(null)
  const inputFile = useRef<HTMLInputElement | null>(null)
  const [externalBankAccountIds, setExternalBankAccountIds] = useState<{ key: string; value: string }[]>([])

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      accountName: account.accountName,
      checkOptions: {
        ...account.checkOptions,
        signatoryName: account.checkOptions?.signatoryName ?? '',
        accountNumberOverride: account.checkOptions?.accountNumberOverride ?? account.accountNumber,
        routingNumberOverride: account.checkOptions?.routingNumberOverride ?? account.routingNumber,
      },
      externalAccountingSystemId: account.externalAccountingSystemId,
    },
  })

  function onUpdate(data: Mercoa.BankAccountUpdateRequest) {
    let signatureImage
    if (data.checkOptions?.useSignatureImage) {
      signatureImage = sigRef.current?.getCanvas().toDataURL('image/png') ?? ''
    }
    if ((data.checkOptions?.signatoryName?.length ?? 0) > 30) {
      toast.error('Signatory name must be less than 30 characters. Use the signature image instead.')
      return
    }
    if (mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod
        .update(mercoaSession.entity?.id, account.id, {
          accountName: data.accountName,
          checkOptions: {
            enabled: data.checkOptions?.enabled,
            initialCheckNumber: Number(data.checkOptions?.initialCheckNumber),
            accountNumberOverride: data.checkOptions?.accountNumberOverride,
            routingNumberOverride: data.checkOptions?.routingNumberOverride,
            signatoryName: `${data.checkOptions?.signatoryName}`,
            useSignatureImage: data.checkOptions?.useSignatureImage,
            ...(signatureImage && { signatureImage }),
          },
          type: Mercoa.PaymentMethodType.BankAccount,
          externalAccountingSystemId: data.externalAccountingSystemId,
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
  const useSig = watch('checkOptions.useSignatureImage')

  useEffect(() => {
    if (account.checkOptions?.signatureImage && sigRef.current) {
      const canvasWidth = sigRef.current?.getCanvas()?.width ?? 375
      const canvasHeight = sigRef.current?.getCanvas()?.height ?? 150
      sigRef.current?.fromDataURL('data:image/gif;base64,' + account.checkOptions?.signatureImage, {
        width: canvasWidth,
        height: canvasHeight,
      })
    }
  }, [account.checkOptions?.signatureImage, useSig])

  useEffect(() => {
    if (!mercoaSession.entityId) return
    mercoaSession.client?.entity.metadata
      .get(mercoaSession.entityId, 'externalAccountingSystemBankAccounts')
      .then((resp) => {
        if (resp) {
          const externalBankAccountIds = resp.map((e) => JSON.parse(e) as { key: string; value: string })
          console.log(externalBankAccountIds)
          setExternalBankAccountIds(externalBankAccountIds)
        }
      })
  }, [mercoaSession.entityId, mercoaSession.refreshId])

  if (!mercoaSession.client) return <NoSession componentName="EditBankAccount" />
  return (
    <form onSubmit={handleSubmit(onUpdate)}>
      <MercoaInput label="Account Name" name="accountName" register={register} optional />
      {externalBankAccountIds.length > 0 && (
        <MercoaCombobox
          label="Accounting System Bank Name"
          onChange={(e) => {
            setValue('externalAccountingSystemId', e.key)
          }}
          options={externalBankAccountIds.map((e) => ({ disabled: false, value: e }))}
          displayIndex="value"
          value={externalBankAccountIds.find((e) => e.key === watch('externalAccountingSystemId'))}
          className="mercoa-mt-2"
          showAllOptions
        />
      )}
      {account.accountType === 'CHECKING' && (
        <div className="mercoa-relative mercoa-mt-5 mercoa-flex mercoa-items-center">
          <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
            <input
              {...register('checkOptions.enabled')}
              type="checkbox"
              className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
            />
          </div>
          <div className="mercoa-ml-3 mercoa-text-sm">
            {/* @ts-ignore:next-line */}
            <Tooltip title="If enabled, checks can be printed with the account and routing number of this account.">
              <label htmlFor="checkOptions.enabled" className="mercoa-font-medium mercoa-text-gray-700">
                Enable Check Payments
                <InformationCircleIcon className="mercoa-inline mercoa-size-5" />
              </label>
            </Tooltip>
          </div>
        </div>
      )}
      {checkEnabled && (
        <div className="mercoa-bg-gray-100 mercoa-p-2 mercoa-rounded-mercoa mercoa-mt-2">
          <MercoaInput
            label="Initial Check Number"
            name="checkOptions.initialCheckNumber"
            register={register}
            optional
            className="mercoa-mt-2"
          />
          <MercoaInput
            label="Signatory Name"
            name="checkOptions.signatoryName"
            register={register}
            required
            className="mercoa-mt-2"
          />
          <MercoaInput
            label="Full Account Number"
            name="checkOptions.accountNumberOverride"
            register={register}
            required
            className="mercoa-mt-2"
          />
          <MercoaInput
            label="Full Routing Number"
            name="checkOptions.routingNumberOverride"
            register={register}
            required
            className="mercoa-mt-2"
          />
          <div className="mercoa-relative mercoa-mt-5 mercoa-flex mercoa-items-center">
            <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
              <input
                {...register('checkOptions.useSignatureImage')}
                type="checkbox"
                className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
              />
            </div>
            <div className="mercoa-ml-3 mercoa-text-sm">
              <label htmlFor="useSig" className="mercoa-font-medium mercoa-text-gray-700">
                Use Custom Signature
              </label>
            </div>
          </div>
          {useSig && (
            <>
              <div className="mercoa-mt-2 mercoa-bg-white">
                <SignatureCanvas ref={sigRef} canvasProps={{ width: 375, height: 150 }} />
              </div>
              <div className="mercoa-mt-2 mercoa-flex mercoa-gap-x-2">
                <input
                  type="file"
                  ref={inputFile}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const canvasWidth = sigRef.current?.getCanvas()?.width ?? 375
                      const canvasHeight = sigRef.current?.getCanvas()?.height ?? 150
                      sigRef.current?.fromDataURL(URL.createObjectURL(e.target.files[0]), {
                        width: canvasWidth,
                        height: canvasHeight,
                      })
                    }
                  }}
                />
                <MercoaButton size="sm" isEmphasized={false} type="button" onClick={() => inputFile?.current?.click()}>
                  Upload Image
                </MercoaButton>
                <MercoaButton
                  color="secondary"
                  size="sm"
                  isEmphasized={false}
                  type="button"
                  onClick={() => sigRef.current?.clear()}
                >
                  Clear Signature
                </MercoaButton>
              </div>
            </>
          )}
        </div>
      )}
      <MercoaButton
        size="sm"
        isEmphasized={false}
        className="mercoa-mt-5"
        type="button"
        onClick={() => setShowPlaid(true)}
      >
        Reconnect Bank Account
      </MercoaButton>
      {showPlaid && <PlaidPopup onExit={() => setShowPlaid(false)} paymentMethodId={account.id} />}
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

export function AcceleratedAchFunds({
  global,
  entityId: passedEntityId,
}: {
  global?: boolean
  entityId?: Mercoa.EntityId
}) {
  const mercoaSession = useMercoaSession()

  const [balanceIsResolved, setBalanceIsResolved] = useState(false)
  const [availableBalance, setAvailableBalance] = useState<number>(0)
  const [pendingBalance, setPendingBalance] = useState<number>(0)
  const [bankAccounts, setBankAccounts] = useState<Array<Mercoa.PaymentMethodResponse.BankAccount>>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState<Mercoa.PaymentMethodResponse.BankAccount>()
  const [showDialog, setShowDialog] = useState<'add' | 'remove' | ''>('')

  const entityId = passedEntityId ?? mercoaSession.entity?.id ?? mercoaSession.organization?.organizationEntityId

  const schema = yup
    .object({
      amount: yup.number().transform(removeThousands).positive().typeError('Please enter a valid number'),
    })
    .required()

  const addMethods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: 0,
    },
  })

  const removeMethods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: 0,
    },
  })

  // Consolidated useEffect for fetching bank accounts and acceleration funds
  useEffect(() => {
    const fetchBankAccountsAndFunds = async () => {
      if (!mercoaSession.token || !entityId || !mercoaSession.client) return
      try {
        // Fetch bank accounts
        const resp = await mercoaSession.client.entity.paymentMethod.getAll(entityId, { type: 'bankAccount' })
        const bankAccountPms = resp.filter(
          (e) => e.type === 'bankAccount' && e.status === 'VERIFIED',
        ) as Array<Mercoa.PaymentMethodResponse.BankAccount>
        const firstBankAccount = bankAccountPms[0]
        setBankAccounts(bankAccountPms)
        setSelectedBankAccount(firstBankAccount)

        // Fetch acceleration funds if a bank account exists
        if (firstBankAccount) {
          const fundsResp = await mercoaSession.client.entity.paymentMethod.bankAccount.getAccelerationFunds(
            entityId,
            firstBankAccount.id,
          )
          setAvailableBalance(fundsResp.availableBalance.amount)
          setPendingBalance(fundsResp.pendingBalance.amount)
          setBalanceIsResolved(true)
        }
      } catch (error) {
        console.error('Error fetching bank accounts or acceleration funds:', error)
      }
    }

    fetchBankAccountsAndFunds()
  }, [mercoaSession.client, entityId, mercoaSession.token])

  // Add acceleration funds
  const handleAddFunds = async (data: { amount?: number }) => {
    if (!data.amount) return
    if (!confirm('Are you sure you want to add funds?')) return
    if (!mercoaSession.token || !entityId || !mercoaSession.client || !balanceIsResolved) {
      toast.error('Failed to resolve acceleration funds')
      return
    }
    if (!selectedBankAccount?.id) {
      toast.error('No bank account selected')
      return
    }
    try {
      await mercoaSession.client.entity.paymentMethod.bankAccount.addAccelerationFunds(
        entityId,
        selectedBankAccount.id,
        { amount: data.amount, currency: Mercoa.CurrencyCode.Usd },
      )
    } catch (e) {
      toast.error('Failed to add acceleration funds')
      return
    }
    // Keep local state in sync with acceleration funds
    setPendingBalance((prevBalance) => prevBalance + (data?.amount ?? 0))
    addMethods.setValue('amount', 0)
  }

  // Remove acceleration funds
  const handleRemoveFunds = async (data: { amount?: number }) => {
    if (!data.amount) return
    if (!confirm('Are you sure you want to remove funds?')) return
    if (!mercoaSession.token || !entityId || !mercoaSession.client || !balanceIsResolved) {
      toast.error('Failed to resolve acceleration funds')
      return
    }
    if (!selectedBankAccount?.id) {
      toast.error('No bank account selected')
      return
    }
    try {
      await mercoaSession.client.entity.paymentMethod.bankAccount.removeAccelerationFunds(
        entityId,
        selectedBankAccount.id,
        { amount: data.amount, currency: Mercoa.CurrencyCode.Usd },
      )
    } catch (e) {
      toast.error('Failed to remove acceleration funds')
      return
    }
    // Keep local state in sync with acceleration funds
    setAvailableBalance((prevBalance) => prevBalance - (data?.amount ?? 0))
    removeMethods.setValue('amount', 0)
  }

  if (!entityId) {
    return (
      <div className="mercoa-px-4 sm:mercoa-px-6 lg:mercoa-px-8 mercoa-pb-8">
        <div className="sm:mercoa-flex sm:mercoa-items-center">
          <div className="sm:mercoa-flex-auto">
            <h1 className="mercoa-text-xl mercoa-font-semibold mercoa-text-gray-900">
              {global ? 'Global' : ''} Accelerated ACH - Disabled
            </h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mercoa-px-4 sm:mercoa-px-6 lg:mercoa-px-8 mercoa-pb-8">
      <div className="sm:mercoa-flex sm:mercoa-items-center">
        <div className="sm:mercoa-flex-auto">
          <h1 className="mercoa-text-xl mercoa-font-semibold mercoa-text-gray-900">
            {global ? 'Global' : ''} Accelerated ACH
          </h1>

          {/* Current Acceleration Funds Balance */}
          <div className="mercoa-mt-8">
            <div className="mercoa-grid mercoa-grid-cols-4 mercoa-gap-2">
              <div className="mercoa-flex mercoa-flex-col mercoa-items-center mercoa-justify-center">
                <h2 className="mercoa-block mercoa-text-left mercoa-text-2xl mercoa-font-medium mercoa-text-gray-700">
                  {balanceIsResolved ? `$${availableBalance.toFixed(2)}` : '--'}
                </h2>
                <div className="mercoa-text-sm">Available Funds</div>
              </div>
              <div className="mercoa-flex mercoa-flex-col mercoa-items-center mercoa-justify-center">
                <h2 className="mercoa-block mercoa-text-left mercoa-text-2xl mercoa-font-medium mercoa-text-gray-700">
                  {balanceIsResolved ? `$${pendingBalance.toFixed(2)}` : '--'}
                </h2>
                <div className="mercoa-text-sm">Pending Funds</div>
              </div>
              <MercoaButton color="indigo" isEmphasized={false} onClick={() => setShowDialog('add')}>
                Add Funds
              </MercoaButton>
              <MercoaButton color="red" isEmphasized={false} onClick={() => setShowDialog('remove')}>
                Withdraw Funds
              </MercoaButton>
              <Transition.Root show={!!showDialog} as={Fragment}>
                <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={() => setShowDialog('')}>
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
                        <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-lg sm:mercoa-p-6">
                          <Dialog.Title
                            as="h3"
                            className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                          >
                            Transfer Funds
                          </Dialog.Title>

                          {showDialog === 'remove' && (
                            <>
                              <h2 className="mercoa-block mercoa-text-left mercoa-font-medium mercoa-text-gray-900 mercoa-mt-4">
                                Transfer From
                              </h2>
                              <div className="mercoa-mt-1">
                                <PaymentMethodButton
                                  selected
                                  icon={<WalletIcon className="mercoa-size-5" />}
                                  text={'Acceleration Wallet'}
                                />
                              </div>
                            </>
                          )}

                          {/* Select Source Bank Account */}
                          <div className="mercoa-my-4">
                            <h2 className="mercoa-block mercoa-text-left mercoa-font-medium mercoa-text-gray-900">
                              {showDialog === 'add' ? 'Transfer From' : 'To'}
                            </h2>
                            <div className="mercoa-mt-1 mercoa-overflow-y-auto mercoa-h-48 mercoa-p-3 mercoa-border mercoa-border-gray-200 mercoa-rounded-md">
                              {bankAccounts.map((bankAccount) => (
                                <div key={bankAccount.id} className="mercoa-mt-1">
                                  <BankAccount
                                    account={bankAccount}
                                    selected={bankAccount.id === selectedBankAccount?.id}
                                    onSelect={() => {
                                      setSelectedBankAccount(bankAccount)
                                    }}
                                  />
                                </div>
                              ))}
                            </div>

                            {bankAccounts.length === 0 && (
                              <div className="mercoa-mt-2 mercoa-text-left mercoa-text-gray-700">
                                No verified bank accounts found. Please add and verify at least one bank account.
                              </div>
                            )}

                            {showDialog === 'add' && (
                              <>
                                <h2 className="mercoa-block mercoa-text-left mercoa-font-medium mercoa-text-gray-900 mercoa-mt-4">
                                  To
                                </h2>
                                <div className="mercoa-mt-1">
                                  <PaymentMethodButton
                                    selected
                                    icon={<WalletIcon className="mercoa-size-5" />}
                                    text={'Acceleration Wallet'}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {showDialog === 'add' ? (
                            <form
                              className="mercoa-p-3 mercoa-rounded-md mercoa-bg-gray-200 mercoa-flex mercoa-items-end mercoa-gap-x-4"
                              onSubmit={addMethods.handleSubmit(handleAddFunds)}
                            >
                              <MercoaInput
                                control={addMethods.control}
                                name="amount"
                                label="Amount"
                                type="currency"
                                className="md:mercoa-col-span-1 mercoa-col-span-full"
                                leadingIcon={
                                  <span className="mercoa-text-gray-500 sm:mercoa-text-sm">
                                    {currencyCodeToSymbol(Mercoa.CurrencyCode.Usd)}
                                  </span>
                                }
                                errors={addMethods.formState.errors}
                              />

                              <MercoaButton
                                isEmphasized
                                type="submit"
                                className="mercoa-mt-4"
                                disabled={!balanceIsResolved}
                              >
                                Transfer
                              </MercoaButton>
                            </form>
                          ) : (
                            <form
                              className="mercoa-p-3 mercoa-rounded-md mercoa-bg-gray-200 mercoa-flex mercoa-items-end mercoa-gap-x-4"
                              onSubmit={removeMethods.handleSubmit(handleRemoveFunds)}
                            >
                              <MercoaInput
                                control={removeMethods.control}
                                name="amount"
                                label="Amount"
                                type="currency"
                                className="md:mercoa-col-span-1 mercoa-col-span-full"
                                leadingIcon={
                                  <span className="mercoa-text-gray-500 sm:mercoa-text-sm">
                                    {currencyCodeToSymbol(Mercoa.CurrencyCode.Usd)}
                                  </span>
                                }
                                errors={removeMethods.formState.errors}
                              />

                              <MercoaButton
                                isEmphasized
                                type="submit"
                                className="mercoa-mt-4"
                                disabled={!balanceIsResolved}
                              >
                                Transfer
                              </MercoaButton>
                            </form>
                          )}
                        </Dialog.Panel>
                      </Transition.Child>
                    </div>
                  </div>
                </Dialog>
              </Transition.Root>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
