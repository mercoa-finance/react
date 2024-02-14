import { Mercoa } from '@mercoa/javascript'

export * from './ApprovalPolicy'
export * from './BankAccounts'
export * from './Checks'
export * from './Counterparties'
export * from './CreditCard'
export * from './CustomPaymentMethod'
export * from './EntityDetails'
export * from './EntityOnboarding'
export * from './EntityPortal'
export * from './EntityUser'
export * from './Inbox'
export * from './InvoiceComments'
export * from './InvoiceDetails'
export * from './Mercoa'
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

/*
export interface Invoice {
  id?: string,
  status?: string
  amount?: number,
  currency?: string,
  dueDate?: string,
  invoiceNumber?: string,
  noteToSelf?: string,
  createdAt?: string,
  updatedAt?: string,
  vendorId?: string,
  vendor?: Entity,
  payerId?: string,
  payer?: Entity,
  paymentSource?: PaymentMethod,
  paymentSourceId?: string
  paymentDestination?: PaymentMethod,
  paymentDestinationId?: string
}

export interface BusinessProfile {
  email?: string,
  phone?: Phone,
  businessType?: string,
  legalBusinessName?: string,
  doingBusinessAs?: string,
  website?: string,
  ownersProvided?: boolean,
  taxID?: {
    ein?: {
      number?: string
    }
  },
  address?: Address
}

export interface IndividualProfile {
  email?: string,
  phone?: Phone,
  name?: Name,
  birthDate?: BirthDate,
  address?: Address
}

export interface Entity {
  id?: string,
  accountType: string,
  name?: string,
  email?: string,
  profile: {
    business?: BusinessProfile,
    individual?: IndividualProfile
  },
  moovStatus?: string,
  ownersProvided?: boolean,
  acceptedMoovTos?: boolean,
  createdAt?: string,
  updatedAt?: string
}

export interface Phone {
  number: string,
  countryCode: string
}

export interface Address {
  addressLine1: string,
  addressLine2?: string,
  city: string,
  stateOrProvince: string,
  postalCode: string,
  country?: string,
}

export interface IndividualGovernmentId {
  ssn?: {
    full?: string,
    lastFour?: string
  },
  itin?: {
    full?: string,
    lastFour?: string
  }
}

export interface Name {
  firstName: string,
  lastName: string,
  middleName?: string,
  suffix?: string
}

export interface BirthDate {
  day: number | null,
  month: number | null,
  year: number | null
}

export interface Representative {
  id?: string,
  name: Name,
  phone: Phone,
  email: string,
  address: Address,
  birthDateProvided?: boolean,
  governmentIDProvided?: boolean,
  birthDate?: BirthDate,
  governmentID?: IndividualGovernmentId,
  responsibilities?: {
    jobTitle?: string,
    isController?: boolean,
    isOwner?: boolean,
    ownershipPercentage?: number,
  },
  createdOn?: string,
  updatedOn?: string,
  disabledOn?: string
}

export interface PaymentMethod {
  id?: string
  type?: string
  bankAccount?: BankAccount
  check?: Check
}
export interface BankAccount {
  id?: string,
  bankName: string,
  accountName?: string,
  routingNumber: string,
  accountNumber: string,
  accountType: string,
  moovStatus: string
}

export interface Check {
  id?: string,
  payToTheOrderOf: string,
  addressLine1: string,
  addressLine2?: string,
  city: string,
  stateOrProvince: string,
  postalCode: string,
  country: string,
}
*/
