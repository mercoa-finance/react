import { Mercoa } from '@mercoa/javascript'
import { BankAccounts } from './BankAccounts'
import { CreditCards } from './CreditCard'
import { CustomPaymentMethod } from './CustomPaymentMethod'
import { useMercoaSession } from './Mercoa'

export function PaymentMethods() {
  const mercoaSession = useMercoaSession()
  return (
    <div>
      {mercoaSession.organization?.paymentMethods?.payerPayments?.find(
        (e) => e.type === Mercoa.PaymentMethodType.BankAccount && e.active,
      ) && (
        <>
          <h3 className="mercoa-mt-8">Bank Accounts</h3>
          <BankAccounts showEdit showAdd />
        </>
      )}
      {mercoaSession.organization?.paymentMethods?.payerPayments?.find(
        (e) => e.type === Mercoa.PaymentMethodType.Card && e.active,
      ) && (
        <>
          <h3 className="mercoa-mt-8">Cards</h3>
          <CreditCards showEdit showAdd />
        </>
      )}
      {mercoaSession.organization?.paymentMethods?.payerPayments?.find(
        (e) => e.type === Mercoa.PaymentMethodType.Custom && e.active,
      ) && (
        <>
          <h3 className="mercoa-mt-8"></h3>
          <CustomPaymentMethod showEdit />
        </>
      )}
    </div>
  )
}
