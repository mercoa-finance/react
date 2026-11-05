import { Mercoa } from '@mercoa/javascript'
import { findCustomPaymentMethodAccountNameAndNumber } from '../../../../../../../../components'

export function formatBankAccount(account: Mercoa.PaymentMethodResponse.BankAccount): string {
  const lastFour = String(account.accountNumber).slice(-4)
  return `${account.bankName} ****${lastFour}`
}

export function formatPaymentSource(source?: Mercoa.PaymentMethodResponse | null): string {
  if (!source) return ''
  if (source.type === Mercoa.PaymentMethodType.BankAccount) {
    return formatBankAccount(source as Mercoa.PaymentMethodResponse.BankAccount)
  }
  if (source.type === Mercoa.PaymentMethodType.Custom) {
    const custom = source as Mercoa.PaymentMethodResponse.Custom
    const { accountName, accountNumber } = findCustomPaymentMethodAccountNameAndNumber(custom)
    const lastFour = accountNumber ? String(accountNumber).slice(-4) : undefined
    if (accountName && lastFour) return `${accountName} ****${lastFour}`
    if (accountName) return accountName
    return custom.schema?.name ?? 'Custom'
  }
  return source.type
}
