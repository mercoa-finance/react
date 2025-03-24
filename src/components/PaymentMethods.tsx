import { Mercoa } from '@mercoa/javascript'
import { BankAccounts, Cards, Checks, CustomPaymentMethods, NoSession, useMercoaSession } from './index'

export function PaymentMethods({
  isPayor,
  isPayee,
  showAdd = true,
  showEdit = true,
  showDelete = true,
  showEntityConfirmation = false,
  hideIndicators,
  entityId,
  onSelect,
}: {
  isPayor?: boolean
  isPayee?: boolean
  showAdd?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showEntityConfirmation?: boolean
  hideIndicators?: boolean
  entityId?: string
  onSelect?: (value?: Mercoa.PaymentMethodResponse) => void
}) {
  const mercoaSession = useMercoaSession()
  if (!mercoaSession.client) return <NoSession componentName="PaymentMethods" />

  // Default to showing isPayor payment methods if no props are provided
  if (!isPayor && !isPayee) {
    isPayor = true
  }

  const showBankAccounts =
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

  return (
    <div className="mercoa-flex mercoa-flex-col mercoa-gap-y-4">
      {showBankAccounts && (
        <div>
          <h3>Bank Accounts</h3>
          <BankAccounts
            showAdd={showAdd}
            showEdit={showEdit}
            showDelete={showDelete}
            showEntityConfirmation={showEntityConfirmation}
            hideIndicators={hideIndicators}
            entityId={entityId}
            onSelect={onSelect}
          />
        </div>
      )}
      {showCards && (
        <div>
          <h3>Cards</h3>
          <Cards
            showAdd={showAdd}
            showEdit={showEdit}
            showDelete={showDelete}
            showEntityConfirmation={showEntityConfirmation}
            hideIndicators={hideIndicators}
            entityId={entityId}
            onSelect={onSelect}
          />
        </div>
      )}
      {showChecks && (
        <div>
          <h3>Checks</h3>
          <Checks
            showAdd={showAdd}
            showEdit={showEdit}
            showDelete={showDelete}
            showEntityConfirmation={showEntityConfirmation}
            hideIndicators={hideIndicators}
            entityId={entityId}
            onSelect={onSelect}
          />
        </div>
      )}

      <CustomPaymentMethods
        isPayor={isPayor ?? false}
        isPayee={isPayee ?? false}
        showAdd={showAdd}
        showEdit={showEdit}
        showDelete={showDelete}
        showEntityConfirmation={showEntityConfirmation}
        hideIndicators={hideIndicators}
        entityId={entityId}
        onSelect={onSelect}
      />
    </div>
  )
}
