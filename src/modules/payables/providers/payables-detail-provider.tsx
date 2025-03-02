import { createContext, Dispatch, ReactNode, SetStateAction } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { PayableFormAction } from '../components/payable-form/constants'
import { PayableFormData } from '../components/payable-form/types'
import { PayableDetailsProps, usePayableDetailsInternal } from '../hooks/use-payable-details-internal'

export type PayableDetailsContextValue = {
  dataContextValue: PayableDataContext
  displayContextValue: PayableDisplayContext
  propsContextValue: PayableDetailsProps
  formContextValue: PayableFormContext
  documentContextValue: PayableDocumentContext
}

export type PayableDataContext = {
  invoice: Mercoa.InvoiceResponse | undefined
  invoiceType: 'invoice' | 'invoiceTemplate'
  invoiceLoading: boolean
  refreshInvoice: (invoiceId: string) => void
}

export type PayableDisplayContext = {
  heightOffset: number
  height: number
}

export type PayableFormContext = {
  formMethods: UseFormReturn<any>
  handleFormAction: (formData: PayableFormData, action: PayableFormAction) => void
  formActionLoading: boolean
  vendorContextValue: PayableVendorContext
  overviewContextValue: PayableOverviewContext
  lineItemsContextValue: PayableLineItemsContext
  commentsContextValue: PayableCommentsContext
  metadataContextValue: PayableMetadataContext
  paymentMethodContextValue: PaymentMethodContext
  approversContextValue: PayableApproversContext
  taxAndShippingContextValue: PayableTaxAndShippingContext
  feesContextValue: PayableFeesContext
  vendorCreditContextValue: PayableVendorCreditContext
  paymentTimingContextValue: PayablePaymentTimingContext
  recurringScheduleContextValue: RecurringScheduleContext
}

export type PayableDocumentContext = {
  documents:
    | {
        fileReaderObj: string
        mimeType: string
      }[]
    | undefined
  documentsLoading: boolean
  handleFileUpload: (fileReaderObj: string, mimeType: string) => void
  ocrProcessing: boolean
  sourceEmails: Mercoa.EmailLog[] | undefined
  sourceEmailsLoading: boolean
}

export type PayableOverviewContext = {
  currency: Mercoa.CurrencyCode
  setCurrency: (currency: Mercoa.CurrencyCode) => void
  amount: number | undefined
  setAmount: (amount: number) => void
  description: string
  setDescription: (description: string) => void
  setDueDate: (dueDate: Date) => void
  invoiceNumber: string | undefined
  setInvoiceNumber: (invoiceNumber: string) => void
  scheduledPaymentDate: Date | undefined
  setScheduledPaymentDate: (deductionDate: Date) => void
  invoiceDate: Date | undefined
  setInvoiceDate: (invoiceDate: Date) => void
  supportedCurrencies: Mercoa.CurrencyCode[]
  printDescriptionOnCheckRemittance: boolean
  setPrintDescriptionOnCheckRemittance: (printDescriptionOnCheckRemittance: boolean) => void
}

export type PayableLineItemsContext = {
  lineItems: Mercoa.InvoiceLineItemUpdateRequest[]
  addItem: () => void
  removeItem: (index: number, id?: string) => void
  updateItem: (index: number, item: Mercoa.InvoiceLineItemUpdateRequest, id?: string) => void
  updateTotalAmount: () => void
  filteredMetadata: Mercoa.MetadataSchema[]
}

export type PayableTaxAndShippingContext = {
  taxAmount: number | undefined
  setTaxAmount: (taxAmount: number) => void
  shippingAmount: number | undefined
  setShippingAmount: (shippingAmount: number) => void
}

export type PayableFeesContext = {
  fees: Mercoa.InvoiceFeesResponse | undefined
  feesLoading: boolean
}

export type PayableVendorCreditContext = {
  vendorCreditUsage: Mercoa.CalculateVendorCreditUsageResponse | undefined
  vendorCreditUsageLoading: boolean
}

export type PayablePaymentTimingContext = {
  paymentTiming: Mercoa.CalculatePaymentTimingResponse | undefined
  paymentTimingLoading: boolean
}

export type PayableVendorContext = {
  selectedVendor: Mercoa.CounterpartyResponse | undefined
  setSelectedVendor: Dispatch<SetStateAction<Mercoa.CounterpartyResponse | undefined>>
  vendors: Mercoa.CounterpartyResponse[] | undefined
  vendorsLoading: boolean
  vendorSearch: string
  setVendorSearch: (search: string) => void
}

export type PayableCommentsContext = {
  comments: Mercoa.CommentResponse[]
  commentText: string
  setCommentText: (commentText: string) => void
  addComment: () => void
  getCommentAuthor: (comment: Mercoa.CommentResponse) => string
}

export type PayableMetadataContext = {
  metadataSchemas: Mercoa.MetadataSchema[]
  getSchemaMetadataValues: (schema: Mercoa.MetadataSchema) => Promise<string[] | undefined>
  schemaFieldValue: (schemaKey: string) => string
  setSchemaFieldValue: (schemaKey: string, value: string) => void
}

export type PaymentMethodContext = {
  sourcePaymentMethods: Mercoa.PaymentMethodResponse[] | undefined
  destinationPaymentMethods: Mercoa.PaymentMethodResponse[] | undefined
  selectedSourcePaymentMethodId: string | undefined
  selectedDestinationPaymentMethodId: string | undefined
  setSelectedSourcePaymentMethodId: (paymentMethodId: string) => void
  setSelectedDestinationPaymentMethodId: (paymentMethodId: string) => void
  availableSourceTypes: Array<{ key: string; value: string }>
  selectedSourceType: Mercoa.PaymentMethodType | undefined
  setSelectedSourceType: (type: Mercoa.PaymentMethodType) => void
  availableDestinationTypes: Array<{ key: string; value: string }>
  selectedDestinationType: Mercoa.PaymentMethodType | undefined
  setSelectedDestinationType: (type: Mercoa.PaymentMethodType) => void
  getVendorPaymentLink: (invoiceId: string) => Promise<string | undefined>
}

export type RecurringScheduleContext = {
  type: 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime'
  repeatEvery: number | undefined
  repeatOn: Array<Mercoa.DayOfWeek> | undefined
  repeatOnDay: number | undefined
  repeatOnMonth: number | undefined
  ends: Date | undefined
  setType: (type: 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime') => void
  setRepeatEvery: (repeatEvery: number) => void
  setRepeatOn: (repeatOn: Array<Mercoa.DayOfWeek>) => void
  setRepeatOnDay: (repeatOnDay: number) => void
  setRepeatOnMonth: (repeatOnMonth: number) => void
  setEnds: (ends: Date | undefined) => void
}

export type PayableApproversContext = {
  approvers: Mercoa.ApprovalSlot[]
  approvalPolicy: Mercoa.ApprovalPolicyResponse[]
  setApproverBySlot: (approvalSlotId: string, assignedUserId: string) => void
  getApprovalSlotOptions: (approvalSlotId: string) => any
  selectedApproverBySlot: (approvalSlotId: string) => any
}

export const PayableDetailsContext = createContext<PayableDetailsContextValue | undefined>(undefined)

export const PayableDetailsProvider = ({
  children,
  payableDetailsProps,
}: {
  children: ReactNode
  payableDetailsProps: PayableDetailsProps
}) => {
  const details = usePayableDetailsInternal(payableDetailsProps)

  return <PayableDetailsContext.Provider value={details}>{children}</PayableDetailsContext.Provider>
}
