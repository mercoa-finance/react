import { Mercoa } from '@mercoa/javascript'

export * from '../modules/counterparties'
export * from '../modules/payables'
export * from './ApprovalPolicy'
export * from './BankAccounts'
export * from './Card'
export * from './Checks'
export * from './Counterparties'
export * from './CustomPaymentMethod'
export * from './DisbursementMethods'
export * from './EntityDetails'
export * from './EntityOnboarding'
export * from './EntityPortal'
export * from './EntityUser'
export * from './ExternalAccountingSystem'
export * from './generics'
export * from './InvoiceComments'
export * from './Mercoa'
export * from './PayableDetails'
export * from './Payables'
export * from './PaymentMethods'
export * from './ReceivableDetails'
export * from './ReceivablePaymentPdf'
export * from './ReceivablePaymentPortal'
export * from './Receivables'

export type onCloseFunction = (value: boolean) => void

export interface TokenOptions {
  organizationId: string
  entityGroupId?: string
  entityId?: string
  userId?: string
  entityForeignId?: string
  invoiceId?: string
  counterpartyId?: string
  options: Mercoa.TokenGenerationOptions
  exp: number
  iat: number
}
