import { Mercoa } from '@mercoa/javascript'
import { BankAccounts, Cards, Checks, CustomPaymentMethods, NoSession, useMercoaSession } from './index'

export function PaymentMethods({ isPayor, isPayee }: { isPayor?: boolean; isPayee?: boolean }) {
  const mercoaSession = useMercoaSession()
  if (!mercoaSession.client) return <NoSession componentName="PaymentMethods" />

  // Default to showing isPayor payment methods if no props are provided
  if (!isPayor && !isPayee) {
    isPayor = true
  }

  const showBanksAccounts =
    (isPayor &&
      mercoaSession.organization?.paymentMethods?.payerPayments?.find(
        (e) => e.type === Mercoa.PaymentMethodType.BankAccount && e.active,
      )) ||
    (isPayee &&
      mercoaSession.organization?.paymentMethods?.vendorDisbursements?.find(
        (e) => e.type === Mercoa.PaymentMethodType.BankAccount && e.active,
      ))
  const showCards =
    isPayor &&
    mercoaSession.organization?.paymentMethods?.payerPayments?.find(
      (e) => e.type === Mercoa.PaymentMethodType.Card && e.active,
    )
  const showChecks =
    isPayee &&
    mercoaSession.organization?.paymentMethods?.vendorDisbursements?.find(
      (e) => e.type === Mercoa.PaymentMethodType.Check && e.active,
    )
  const showCustom =
    (isPayor &&
      mercoaSession.organization?.paymentMethods?.payerPayments?.find(
        (e) => e.type === Mercoa.PaymentMethodType.Custom && e.active,
      )) ||
    (isPayee &&
      mercoaSession.organization?.paymentMethods?.vendorDisbursements?.find(
        (e) => e.type === Mercoa.PaymentMethodType.Custom && e.active,
      ))

  return (
    <div>
      {showBanksAccounts && (
        <>
          <h3 className="mercoa-mt-8">Bank Accounts</h3>
          <BankAccounts showEdit showAdd />
        </>
      )}
      {showCards && (
        <>
          <h3 className="mercoa-mt-8">Cards</h3>
          <Cards showEdit showAdd />
        </>
      )}
      {showChecks && (
        <>
          <h3 className="mercoa-mt-8">Checks</h3>
          <Checks showEdit showAdd />
        </>
      )}
      {showCustom && (
        <>
          <h3 className="mercoa-mt-8">Custom Payment Methods</h3>
          <CustomPaymentMethods showEdit />
        </>
      )}
    </div>
  )
}
