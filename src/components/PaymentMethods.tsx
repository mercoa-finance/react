import { Mercoa } from '@mercoa/javascript'
import { BankAccounts, Cards, Checks, CustomPaymentMethods, NoSession, useMercoaSession } from './index'

export function PaymentMethods({
  isPayor,
  isPayee,
  showAdd = true,
  showEdit = true,
  showDelete = true,
  hideIndicators,
}: {
  isPayor?: boolean
  isPayee?: boolean
  showAdd?: boolean
  showEdit?: boolean
  showDelete?: boolean
  hideIndicators?: boolean
}) {
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
        <div className="mercoa-mt-8">
          <h3>Bank Accounts</h3>
          <BankAccounts showAdd={showAdd} showEdit={showEdit} showDelete={showDelete} hideIndicators={hideIndicators} />
        </div>
      )}
      {showCards && (
        <div className="mercoa-mt-8">
          <h3>Cards</h3>
          <Cards showAdd={showAdd} showEdit={showEdit} showDelete={showDelete} hideIndicators={hideIndicators} />
        </div>
      )}
      {showChecks && (
        <div className="mercoa-mt-8">
          <h3>Checks</h3>
          <Checks showAdd={showAdd} showEdit={showEdit} showDelete={showDelete} hideIndicators={hideIndicators} />
        </div>
      )}
      {showCustom && (
        <div className="mercoa-mt-8">
          <h3>Custom Payment Methods</h3>
          <CustomPaymentMethods
            showAdd={showAdd}
            showEdit={showEdit}
            showDelete={showDelete}
            hideIndicators={hideIndicators}
          />
        </div>
      )}
    </div>
  )
}
