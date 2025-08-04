import { Dialog, Transition } from '@headlessui/react'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import { BankAccount, LoadingSpinnerIcon, MercoaButton, MercoaInput, NoSession, useMercoaSession } from './index'

interface HeldFundsData {
  id: string
  name: string
  balance: number
  currency: string
  lastUpdated: string
}

export function HeldFunds({ entityId, heldFundsData }: { entityId: string; heldFundsData?: HeldFundsData }) {
  const mercoaSession = useMercoaSession()
  const [heldFundsDataLocal, setHeldFundsDataLocal] = useState<HeldFundsData | null>(heldFundsData || null)
  const [loading, setLoading] = useState(true)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<Mercoa.PaymentMethodResponse.BankAccount[]>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState<Mercoa.PaymentMethodResponse.BankAccount | null>(null)

  // Form for withdraw amount
  const withdrawForm = useForm<{ amount: number }>({
    resolver: yupResolver(
      yup.object().shape({
        amount: yup
          .number()
          .required('Amount is required')
          .min(0.01, 'Amount must be greater than 0')
          .test('max-balance', 'Amount cannot exceed available balance', function (value) {
            if (!value || !heldFundsData) return true
            return value <= heldFundsData.balance
          })
          .transform((value, originalValue) => {
            if (!originalValue) return 0
            const numValue =
              typeof originalValue === 'string' ? parseFloat(originalValue.replace(/,/g, '')) : originalValue
            return isNaN(numValue) ? 0 : numValue
          }),
      }),
    ),
    defaultValues: {
      amount: 0,
    },
  })

  // Check if entity has held funds
  useEffect(() => {
    const checkHeldFunds = async () => {
      if (heldFundsData) {
        setHeldFundsDataLocal(heldFundsData)
        setLoading(false)
        return
      }
      if (!mercoaSession.token || !entityId) return

      try {
        const response = await fetch('/api/entitiesWithHeldFunds', {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${mercoaSession.token}`,
          },
          method: 'GET',
        })

        if (response.ok) {
          const data = (await response.json()) as { entities: HeldFundsData[] }
          const entityWithFunds = data.entities.find((entity: HeldFundsData) => entity.id === entityId)
          setHeldFundsDataLocal(entityWithFunds || null)
        }
      } catch (error) {
        console.error('Error checking held funds:', error)
      } finally {
        setLoading(false)
      }
    }

    checkHeldFunds()
  }, [entityId, mercoaSession.token])

  // Re-validate form when heldFundsData changes
  useEffect(() => {
    if (heldFundsDataLocal) {
      withdrawForm.trigger('amount')
    }
  }, [heldFundsDataLocal, withdrawForm])

  // Fetch bank accounts for withdrawal destination
  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (!mercoaSession.token || !entityId) return

      try {
        const bankAccountsResponse = await mercoaSession.client?.entity.paymentMethod.getAll(entityId, {
          type: 'bankAccount',
        })
        if (bankAccountsResponse) {
          const accounts = bankAccountsResponse.map((pm) => pm as Mercoa.PaymentMethodResponse.BankAccount)
          setBankAccounts(accounts)
          if (accounts.length > 0) {
            setSelectedBankAccount(accounts[0])
          }
        }
      } catch (error) {
        console.error('Error fetching bank accounts:', error)
      }
    }

    if (showWithdrawDialog) {
      fetchBankAccounts()
    }
  }, [entityId, mercoaSession.token, showWithdrawDialog])

  const handleWithdrawFunds = async (data: { amount: number }) => {
    if (!data.amount || data.amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!confirm('Are you sure you want to withdraw funds?')) return

    if (!mercoaSession.token || !entityId) {
      toast.error('Failed to resolve session')
      return
    }

    if (!selectedBankAccount?.id) {
      toast.error('No bank account selected')
      return
    }

    try {
      const response = await fetch('/api/withdrawHeldFunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${mercoaSession.token}`,
        },
        body: JSON.stringify({
          entityId,
          amount: Number(data.amount),
          destinationPaymentMethodId: selectedBankAccount.id,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string }
        throw new Error(errorData.error || 'Failed to withdraw funds')
      }

      toast.success('Funds withdrawn successfully')
      setShowWithdrawDialog(false)
      withdrawForm.reset()

      // Refresh held funds data
      setLoading(true)
      const refreshResponse = await fetch('/api/entitiesWithHeldFunds', {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${mercoaSession.token}`,
        },
        method: 'GET',
      })

      if (refreshResponse.ok) {
        const data = (await refreshResponse.json()) as { entities: HeldFundsData[] }
        const entityWithFunds = data.entities.find((entity: HeldFundsData) => entity.id === entityId)
        setHeldFundsDataLocal(entityWithFunds || null)
      }
    } catch (e: any) {
      toast.error(`Failed to withdraw funds: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="HeldFunds" />

  if (loading) {
    return (
      <div className="mercoa-p-4 mercoa-text-center">
        <LoadingSpinnerIcon />
      </div>
    )
  }

  // Don't show anything if no held funds
  if (!heldFundsDataLocal || heldFundsDataLocal.balance <= 0) {
    return null
  }

  return (
    <>
      <div className="mercoa-mt-4 mercoa-p-4 mercoa-bg-yellow-50 mercoa-border mercoa-border-yellow-200 mercoa-rounded-md">
        <div className="mercoa-flex mercoa-items-center mercoa-justify-between">
          <div>
            <div className="mercoa-flex mercoa-items-center">
              <BanknotesIcon className="mercoa-size-5 mercoa-text-yellow-600 mercoa-mr-2" />
              <h3 className="mercoa-text-sm mercoa-font-medium mercoa-text-yellow-800">Held Funds</h3>
            </div>
            <p className="mercoa-mt-1 mercoa-text-sm mercoa-text-yellow-700">
              This entity has ${heldFundsDataLocal.balance.toFixed(2)} in held funds that can be withdrawn.
            </p>
          </div>
          <MercoaButton color="red" isEmphasized={false} size="sm" onClick={() => setShowWithdrawDialog(true)}>
            Withdraw Funds
          </MercoaButton>
        </div>
      </div>

      {/* Withdraw Funds Dialog */}
      <Transition.Root show={showWithdrawDialog} as={Fragment}>
        <Dialog as="div" className="mercoa-relative mercoa-z-[100]" onClose={() => setShowWithdrawDialog(false)}>
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

          <div className="mercoa-fixed mercoa-inset-0 mercoa-z-[100] mercoa-overflow-y-auto">
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
                    className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-mb-4"
                  >
                    Withdraw Held Funds
                  </Dialog.Title>

                  <form onSubmit={withdrawForm.handleSubmit(handleWithdrawFunds)} className="mercoa-space-y-4">
                    <div>
                      <label className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700 mercoa-mb-1">
                        Amount to Withdraw
                      </label>
                      <MercoaInput
                        control={withdrawForm.control}
                        name="amount"
                        label="Amount"
                        type="currency"
                        className="md:mercoa-col-span-1 mercoa-col-span-full"
                        leadingIcon={
                          <span className="mercoa-text-gray-500 sm:mercoa-text-sm">
                            {currencyCodeToSymbol(Mercoa.CurrencyCode.Usd)}
                          </span>
                        }
                        errors={withdrawForm.formState.errors}
                      />
                      <p className="mercoa-mt-1 mercoa-text-xs mercoa-text-gray-500">
                        Available: ${heldFundsDataLocal.balance.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700 mercoa-mb-1">
                        Destination Bank Account
                      </label>
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
                    </div>

                    <div className="mercoa-mt-5 mercoa-flex mercoa-justify-end mercoa-space-x-3">
                      <MercoaButton type="button" isEmphasized={false} onClick={() => setShowWithdrawDialog(false)}>
                        Cancel
                      </MercoaButton>
                      <MercoaButton type="submit" isEmphasized disabled={withdrawForm.formState.isSubmitting}>
                        {withdrawForm.formState.isSubmitting ? 'Withdrawing...' : 'Withdraw Funds'}
                      </MercoaButton>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
