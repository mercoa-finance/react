import { Mercoa } from '@mercoa/javascript'

export const invoicePaymentTypeMapper = (invoice: Mercoa.InvoiceResponse) => {
  if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.BankAccount) {
    if (
      invoice.paymentDestinationOptions?.type === Mercoa.PaymentMethodType.BankAccount &&
      invoice.paymentDestinationOptions?.delivery === Mercoa.BankDeliveryMethod.AchStandard
    ) {
      return 'ACH_STANDARD'
    } else if (
      !invoice.paymentDestinationOptions ||
      (invoice.paymentDestinationOptions.type === Mercoa.PaymentMethodType.BankAccount &&
        invoice.paymentDestinationOptions.delivery !== Mercoa.BankDeliveryMethod.AchStandard)
    ) {
      return 'ACH_SAME_DAY'
    } else {
      return 'UNKNOWN'
    }
  } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Check) {
    return 'CHECK'
  } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Custom) {
    return 'CUSTOM'
  } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.OffPlatform) {
    return 'OFF_PLATFORM'
  } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Card) {
    return 'CARD'
  } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Utility) {
    return 'UTILITY'
  } else {
    return 'UNKNOWN'
  }
}
