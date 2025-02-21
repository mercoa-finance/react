import { Dispatch, SetStateAction } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { AddBankAccountButton, BankAccount } from '../../../../../../../../../../components'
import { PaymentMethodList } from '../payment-method-list'

export function SelectBankAccountButtonsV2({
  isPreview,
  bankAccounts,
  setBankAccounts,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
}: {
  isPreview?: boolean
  bankAccounts: Array<Mercoa.PaymentMethodResponse.BankAccount>
  setBankAccounts: Dispatch<SetStateAction<Mercoa.PaymentMethodResponse.BankAccount[]>>
  selectedPaymentMethodId: string | undefined
  setSelectedPaymentMethodId: Dispatch<SetStateAction<string | undefined>>
}) {
  const addAccountButton = isPreview ? (
    <BankAccount />
  ) : (
    <AddBankAccountButton
      onSelect={(bankAccount: Mercoa.PaymentMethodResponse.BankAccount) => {
        if (
          !bankAccounts.find(
            (e) => e.accountNumber === bankAccount.accountNumber && e.routingNumber === bankAccount.routingNumber,
          )
        ) {
          setBankAccounts((prevBankAccounts) => (prevBankAccounts ? [...prevBankAccounts, bankAccount] : [bankAccount]))
          setSelectedPaymentMethodId(bankAccount.id)
        }
      }}
    />
  )

  return (
    <PaymentMethodList
      accounts={bankAccounts}
      showDelete
      formatAccount={(bankAccount) => (
        <BankAccount
          key={bankAccount.id}
          showVerification
          account={bankAccount}
          selected={bankAccount.id === selectedPaymentMethodId}
          onSelect={() => {
            setSelectedPaymentMethodId(bankAccount.id)
          }}
        />
      )}
      addAccount={addAccountButton}
    />
  )
}
