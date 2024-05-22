import { Mercoa } from '@mercoa/javascript'

export * from './ApprovalPolicy'
export * from './BankAccounts'
export * from './Checks'
export * from './Counterparties'
export * from './CreditCard'
export * from './CustomPaymentMethod'
export * from './DisbursementMethods'
export * from './EntityDetails'
export * from './EntityOnboarding'
export * from './EntityPortal'
export * from './EntityUser'
export * from './InvoiceComments'
export * from './Mercoa'
export * from './PayableDetails'
export * from './Payables'
export * from './PaymentMethods'
export * from './ReceivableDetails'
export * from './Receivables'
export * from './generics'

export type onCloseFunction = (value: boolean) => void

export interface TokenOptions {
  organizationId: string
  entityId?: string
  userId?: string
  entityForeignId?: string
  invoiceId?: string
  counterpartyId?: string
  options: Mercoa.TokenGenerationOptions
}
