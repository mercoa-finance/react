import { Mercoa } from '@mercoa/javascript'

export function formatBankAccount(account: Mercoa.PaymentMethodResponse.BankAccount): string {
  const lastFour = String(account.accountNumber).slice(-4)
  return `${account.bankName} ****${lastFour}`
}
