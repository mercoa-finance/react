import { Dialog, Transition } from '@headlessui/react'
import { PlusIcon, WalletIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import accounting from 'accounting'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import { removeThousands } from '../lib/lib'
import {
  AddDialog,
  BankAccount,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaInput,
  NoSession,
  PaymentMethodList,
  PaymentMethodButton,
  Tooltip,
  useMercoaSession,
} from './index'

export function Wallets({
  children,
  onSelect,
  showAdd,
  showEdit,
  showDelete,
  entityId,
}: {
  children?: Function
  onSelect?: (value?: Mercoa.PaymentMethodResponse.Wallet) => void
  showAdd?: boolean
  showEdit?: boolean
  showDelete?: boolean
  entityId?: string
}) {
  const [wallets, setWallets] = useState<Array<Mercoa.PaymentMethodResponse.Wallet>>()

  const mercoaSession = useMercoaSession()

  const entityIdFinal = entityId ?? mercoaSession.entity?.id

  useEffect(() => {
    if (mercoaSession.token && entityIdFinal) {
      mercoaSession.client?.entity.paymentMethod.getAll(entityIdFinal, { type: 'wallet' }).then((resp) => {
        setWallets(resp.map((e) => e as Mercoa.PaymentMethodResponse.Wallet))
      })
    }
  }, [entityIdFinal, mercoaSession.token, mercoaSession.refreshId])

  if (!mercoaSession.client) return <NoSession componentName="Wallets" />

  if (children) {
    return children({ wallets })
  }

  if (!wallets) {
    return (
      <div className="mercoa-p-9 mercoa-text-center">
        <LoadingSpinnerIcon />
      </div>
    )
  }

  return (
    <PaymentMethodList
      accounts={wallets}
      showDelete={showDelete || showEdit} // NOTE: For backwards compatibility, showEdit implies showDelete
      addAccount={
        wallets && wallets.length === 0 && showAdd ? (
          <AddWalletButton
            onSelect={(wallet: Mercoa.PaymentMethodResponse.Wallet) => {
              if (!wallets.find((e) => e.id === wallet.id)) {
                setWallets((prevWallets) => [...(prevWallets ?? []), wallet])
              }
              if (onSelect) onSelect(wallet)
            }}
            entityId={entityId}
          />
        ) : undefined
      }
      formatAccount={(account: Mercoa.PaymentMethodResponse.Wallet) => (
        <Wallet account={account} onSelect={onSelect} showEdit={showEdit} />
      )}
    />
  )
}

export function Wallet({
  children,
  account,
  onSelect,
  showEdit,
  selected,
}: {
  children?: Function
  account?: Mercoa.PaymentMethodResponse.Wallet
  onSelect?: (value?: Mercoa.PaymentMethodResponse.Wallet) => void
  showEdit?: boolean
  selected?: boolean
}) {
  const mercoaSession = useMercoaSession()
  const [showManageWallet, setShowManageWallet] = useState(false)

  if (!mercoaSession.client) return <NoSession componentName="WalletComponent" />

  if (!account) {
    return (
      <PaymentMethodButton
        onSelect={onSelect}
        account={account}
        selected={selected}
        icon={<PlusIcon className="mercoa-size-5" />}
        text="Add new wallet"
      />
    )
  }

  return (
    <div className={account.frozen ? 'mercoa-line-through pointer-events-none' : ''}>
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
        }}
        key={`${account?.id}`}
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
          <WalletIcon className="mercoa-size-5" />
        </div>
        <div className="mercoa-flex mercoa-min-w-0 mercoa-flex-1 mercoa-justify-between mercoa-group">
          <div className="mercoa-flex">
            <div>
              <p
                className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${
                  selected ? 'mercoa-underline' : ''
                }`}
              >
                Wallet
              </p>
              <p
                className={`mercoa-text-xs mercoa-font-medium mercoa-text-gray-800 ${
                  selected ? 'mercoa-underline' : ''
                }`}
              >
                Balance:{' '}
                {accounting.formatMoney(
                  account.availableBalance.amount,
                  currencyCodeToSymbol(account.availableBalance.currency),
                )}{' '}
              </p>
            </div>
          </div>
        </div>
        <div className="mercoa-flex mercoa-items-center mercoa-gap-x-1">
          {showEdit && (
            <MercoaButton
              isEmphasized={false}
              size="sm"
              className="mercoa-mr-2"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                setShowManageWallet(true)
              }}
            >
              <Tooltip title="Add or withdraw funds">Manage Wallet</Tooltip>
            </MercoaButton>
          )}
        </div>
      </div>

      <AddDialog
        component={
          <MercoaWallet
            entityId={mercoaSession.entityId}
            title={mercoaSession.entity?.name ? `${mercoaSession.entity.name} Wallet` : 'Wallet'}
          />
        }
        onClose={() => setShowManageWallet(false)}
        show={showManageWallet}
      />
    </div>
  )
}

export function AddWalletButton({ onSelect, entityId }: { onSelect?: Function; entityId?: Mercoa.EntityId }) {
  const mercoaSession = useMercoaSession()

  const handleSelect = async () => {
    if (!confirm('Are you sure you want to add a wallet?')) {
      return
    }
    const entityIdFinal = entityId ?? mercoaSession.entityId
    if (!entityIdFinal) {
      console.error('No entity ID found')
      toast.error('Error adding wallet')
      return
    }
    try {
      const wallet = await mercoaSession.client?.entity.paymentMethod.create(entityIdFinal, {
        type: 'wallet',
      })
      if (onSelect && wallet) {
        onSelect(wallet)
      }
    } catch (error) {
      console.error('Error adding wallet:', error)
      toast.error('Error adding wallet')
    }
  }

  return (
    <div>
      <Wallet onSelect={handleSelect} />
    </div>
  )
}

// Component for managing the wallet balance and adding/removing funds
// TODO: Change the component name to show that this is for managing funds (WalletManager?)
export function MercoaWallet({
  global,
  entityId: passedEntityId,
  title,
}: {
  global?: boolean
  entityId?: Mercoa.EntityId
  title?: string
}) {
  const mercoaSession = useMercoaSession()
  const [balanceIsResolved, setBalanceIsResolved] = useState(false)
  const [walletPaymentMethodId, setWalletPaymentMethodId] = useState<Mercoa.PaymentMethodId>()
  const [availableBalance, setAvailableBalance] = useState<number>(0)
  const [pendingBalance, setPendingBalance] = useState<number>(0)
  const [bankAccounts, setBankAccounts] = useState<Array<Mercoa.PaymentMethodResponse.BankAccount>>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState<Mercoa.PaymentMethodResponse.BankAccount>()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'add' | 'remove' | ''>('')

  const openDialog = (type: 'add' | 'remove') => {
    setDialogType(type)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
  }

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

  // Consolidated useEffect for fetching bank accounts and wallet funds
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

        // Fetch wallet funds
        const walletPaymentMethods = await mercoaSession.client.entity.paymentMethod.getAll(entityId, {
          type: 'wallet',
        })
        if (walletPaymentMethods.length === 0) {
          return
        }
        setWalletPaymentMethodId(walletPaymentMethods[0].id)
        const walletResp = await mercoaSession.client.entity.paymentMethod.wallet.getWalletBalance(
          entityId,
          walletPaymentMethods[0].id,
        )
        setAvailableBalance(walletResp.availableBalance.amount)
        setPendingBalance(walletResp.pendingBalance.amount)
        setBalanceIsResolved(true)
      } catch (error) {
        console.error('Error fetching bank accounts or wallet:', error)
      }
    }

    fetchBankAccountsAndFunds()
  }, [mercoaSession.client, entityId, mercoaSession.token])

  // Add wallet funds
  const handleAddFunds = async (data: { amount?: number }) => {
    if (!data.amount) return
    if (!confirm('Are you sure you want to add funds?')) return
    if (!mercoaSession.token || !entityId || !mercoaSession.client || !balanceIsResolved || !walletPaymentMethodId) {
      toast.error('Failed to resolve wallet')
      return
    }
    if (!selectedBankAccount?.id) {
      toast.error('No bank account selected')
      return
    }
    try {
      await mercoaSession.client.entity.paymentMethod.wallet.addWalletFunds(entityId, walletPaymentMethodId, {
        amount: data.amount,
        currency: Mercoa.CurrencyCode.Usd,
        sourcePaymentMethodId: selectedBankAccount.id,
      })
    } catch (e: any) {
      toast.error(`Failed to add funds to wallet: ${e.message}`)
      return
    }
    // Keep local state in sync with wallet funds
    setPendingBalance((prevBalance) => prevBalance + (data?.amount ?? 0))
    addMethods.setValue('amount', 0)
    toast.success('Funds added to wallet')
    closeDialog()
  }

  // Remove wallet funds
  const handleRemoveFunds = async (data: { amount?: number }) => {
    if (!data.amount) return
    if (!confirm('Are you sure you want to remove funds?')) return
    if (!mercoaSession.token || !entityId || !mercoaSession.client || !balanceIsResolved || !walletPaymentMethodId) {
      toast.error('Failed to resolve wallet')
      return
    }
    if (!selectedBankAccount?.id) {
      toast.error('No bank account selected')
      return
    }
    try {
      await mercoaSession.client.entity.paymentMethod.wallet.withdrawWalletFunds(entityId, walletPaymentMethodId, {
        amount: data.amount,
        currency: Mercoa.CurrencyCode.Usd,
        destinationPaymentMethodId: selectedBankAccount.id,
      })
    } catch (e: any) {
      toast.error(`Failed to withdraw funds from wallet: ${e.message}`)
      return
    }
    // Keep local state in sync with wallet funds
    setAvailableBalance((prevBalance) => prevBalance - (data?.amount ?? 0))
    removeMethods.setValue('amount', 0)
    toast.success('Funds withdrawn from wallet')
    closeDialog()
  }

  if (!entityId) {
    return (
      <div className="mercoa-px-4 sm:mercoa-px-6 lg:mercoa-px-8 mercoa-pb-8">
        <div className="sm:mercoa-flex sm:mercoa-items-center">
          <div className="sm:mercoa-flex-auto">
            <h1 className="mercoa-text-xl mercoa-font-semibold mercoa-text-gray-900">
              {title ?? `${global ? 'Global ' : ''}${mercoaSession.organization?.name || ''} Wallet`} - Disabled
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
            {title ?? `${global ? 'Global ' : ''}${mercoaSession.organization?.name} Wallet`}
          </h1>

          {/* Current Wallet Balance */}
          <div className="mercoa-mt-8">
            <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-2">
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
              <MercoaButton color="indigo" isEmphasized={false} onClick={() => openDialog('add')}>
                Add Funds
              </MercoaButton>
              <MercoaButton color="red" isEmphasized={false} onClick={() => openDialog('remove')}>
                Withdraw Funds
              </MercoaButton>
              <Transition.Root show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={closeDialog}>
                  <Transition.Child
                    as={Fragment}
                    enter="mercoa-ease-out mercoa-duration-300"
                    enterFrom="mercoa-opacity-0"
                    enterTo="mercoa-opacity-100"
                    leave="mercoa-ease-in mercoa-duration-200"
                    leaveFrom="mercoa-opacity-100"
                    leaveTo="mercoa-opacity-0"
                  >
                    <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-opacity-75 mercoa-transition-opacity" />
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
                        afterLeave={() => setDialogType('')} // Reset dialog type after transition
                      >
                        <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-lg sm:mercoa-p-6">
                          <Dialog.Title
                            as="h3"
                            className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                          >
                            Transfer Funds
                          </Dialog.Title>

                          {dialogType === 'remove' && (
                            <>
                              <h2 className="mercoa-block mercoa-text-left mercoa-font-medium mercoa-text-gray-900 mercoa-mt-4">
                                Transfer From
                              </h2>
                              <div className="mercoa-mt-1">
                                <PaymentMethodButton
                                  selected
                                  icon={<WalletIcon className="mercoa-size-5" />}
                                  text={title ?? `${mercoaSession.organization?.name} Wallet`}
                                />
                              </div>
                            </>
                          )}

                          {/* Select Source Bank Account */}
                          <div className="mercoa-my-4">
                            <h2 className="mercoa-block mercoa-text-left mercoa-font-medium mercoa-text-gray-900">
                              {dialogType === 'add' ? 'Transfer From' : 'To'}
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

                            {dialogType === 'add' && (
                              <>
                                <h2 className="mercoa-block mercoa-text-left mercoa-font-medium mercoa-text-gray-900 mercoa-mt-4">
                                  To
                                </h2>
                                <div className="mercoa-mt-1">
                                  <PaymentMethodButton
                                    selected
                                    icon={<WalletIcon className="mercoa-size-5" />}
                                    text={title ?? `${mercoaSession.organization?.name} Wallet`}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {dialogType === 'add' ? (
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
