import { UseMutateFunction } from '@tanstack/react-query'
import { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { ErrorResponse } from '../../lib/react-query/types'
import { ToastClient } from '../common/utils'
import { PayableFormAction } from './components/payable-form/constants'
import { PayableFormData } from './components/payable-form/types'
import { PayablesTableAction } from './components/payables-table/constants'

//Payable Details Props

export type PayableDetailsProps = {
  queryOptions?: PayableDetailsQueryOptions
  handlers?: PayableDetailsHandlers
  config?: PayableDetailsConfig
  displayOptions?: PayableDetailsDisplayOptions
  renderCustom?: PayableDetailsRenderCustom
  children?: ReactNode
}

export type PayableDetailsHandlers = {
  onInvoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  onCounterpartyPreSubmit?: (
    counterparty?: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onInvoiceUpdate?: (invoice?: Mercoa.InvoiceResponse) => void
  onInvoiceSubmit?: (resp: Mercoa.InvoiceResponse) => void
  onOcrComplete?: (ocr: Mercoa.OcrResponse) => Promise<Mercoa.OcrResponse>
  onCounterpartySelect?: (counterparty: Mercoa.CounterpartyResponse) => void
}

export type PayableDetailsQueryOptions = {
  invoiceId?: string
  invoice?: Mercoa.InvoiceResponse
  invoiceType?: 'invoice' | 'invoiceTemplate'
  getInvoiceEvents?: boolean
}

export type PayableDetailsConfig = {
  supportedCurrencies?: Mercoa.CurrencyCode[]
  counterparty?: {
    showLabel?: boolean
    defaultCounterparty?: Mercoa.CounterpartyResponse
    network?: Mercoa.CounterpartyNetworkType[]
    disableCreation?: boolean
    enableOnboardingLinkOnCreate?: boolean
  }
}

export type PayableDetailsDisplayOptions = {
  heightOffset?: number
  documentPosition?: 'right' | 'left' | 'none'
  formLayout?: 'fullWidth' | 'grid'
  paymentMethods?: {
    showDestinationPaymentMethodConfirmation?: boolean
  }
}

export type PayableDetailsRenderCustom = {
  toast?: ToastClient
}

// Payable Details Context
export type PayableDetailsContextValue = {
  dataContextValue: PayableDataContext
  displayContextValue: PayableDisplayContext
  propsContextValue: PayableDetailsProps
  formContextValue: PayableFormContext
  documentContextValue: PayableDocumentContext
  eventsContextValue: PayableEventsContext
}

export type PayableDataContext = {
  invoice?: Mercoa.InvoiceResponse
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
  paymentMethodContextValue: PayablePaymentMethodContext
  approversContextValue: PayableApproversContext
  taxAndShippingContextValue: PayableTaxAndShippingContext
  feesContextValue: PayableFeesContext
  vendorCreditContextValue: PayableVendorCreditContext
  paymentTimingContextValue: PayablePaymentTimingContext
  recurringScheduleContextValue: PayableRecurringScheduleContext
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
  sourceEmails?: Mercoa.EmailLog[]
  sourceEmailsLoading: boolean
}

export type PayableOverviewContext = {
  currency: Mercoa.CurrencyCode
  setCurrency: (currency: Mercoa.CurrencyCode) => void
  amount?: number
  setAmount: (amount: number) => void
  description: string
  setDescription: (description: string) => void
  setDueDate: (dueDate: Date) => void
  invoiceNumber?: string
  setInvoiceNumber: (invoiceNumber: string) => void
  scheduledPaymentDate?: Date
  setScheduledPaymentDate: (deductionDate: Date) => void
  invoiceDate?: Date
  setInvoiceDate: (invoiceDate: Date) => void
  supportedCurrencies: Mercoa.CurrencyCode[]
  printDescriptionOnCheckRemittance: boolean
  setPrintDescriptionOnCheckRemittance: (printDescriptionOnCheckRemittance: boolean) => void
}

export type PayableLineItemsContext = {
  lineItems: Mercoa.InvoiceLineItemUpdateRequest[]
  setLineItems: (lineItems: Mercoa.InvoiceLineItemUpdateRequest[]) => void
  addItem: () => void
  removeItem: (index: number, id?: string) => void
  updateItem: (index: number, item: Mercoa.InvoiceLineItemUpdateRequest, id?: string) => void
  updateTotalAmount: () => void
  filteredMetadata: Mercoa.MetadataSchema[]
}

export type PayableTaxAndShippingContext = {
  taxAmount?: number
  setTaxAmount: (taxAmount: number) => void
  shippingAmount?: number
  setShippingAmount: (shippingAmount: number) => void
}

export type PayableFeesContext = {
  fees?: Mercoa.InvoiceFeesResponse
  feesLoading: boolean
}

export type PayableVendorCreditContext = {
  vendorCreditUsage?: Mercoa.CalculateVendorCreditUsageResponse
  vendorCreditUsageLoading: boolean
}

export type PayablePaymentTimingContext = {
  paymentTiming?: Mercoa.CalculatePaymentTimingResponse
  paymentTimingLoading: boolean
}

export type PayableVendorContext = {
  selectedVendor?: Mercoa.CounterpartyResponse
  setSelectedVendor: Dispatch<SetStateAction<Mercoa.CounterpartyResponse | undefined>>
  vendors?: Mercoa.CounterpartyResponse[]
  vendorsLoading: boolean
  vendorSearch: string
  setVendorSearch: (search: string) => void
  duplicateVendorModalOpen: boolean
  setDuplicateVendorModalOpen: (open: boolean) => void
  duplicateVendorInfo?: {
    duplicates: Mercoa.CounterpartyResponse[]
    foundType: string
    foundString: string
    type: 'payee' | 'payor'
  }
}

export type PayableCommentsContext = {
  comments: Mercoa.CommentResponse[]
  commentText: string
  setCommentText: (commentText: string) => void
  addComment: () => void
  getCommentAuthor: (comment: Mercoa.CommentResponse) => string
}

export type PayableEventsContext = {
  events: Mercoa.InvoiceEvent[]
  eventsLoading: boolean
  getEventAuthor: (event: Mercoa.InvoiceEvent) => string
}

export type PayableMetadataContext = {
  metadataSchemas: Mercoa.MetadataSchema[]
  getSchemaMetadataValues: (schema: Mercoa.MetadataSchema) => Promise<string[] | undefined>
  schemaFieldValue: (schemaKey: string) => string
  setSchemaFieldValue: (schemaKey: string, value: string) => void
}

export type PayablePaymentMethodContext = {
  sourcePaymentMethods?: Mercoa.PaymentMethodResponse[]
  destinationPaymentMethods?: Mercoa.PaymentMethodResponse[]
  selectedSourcePaymentMethodId?: string
  selectedDestinationPaymentMethodId?: string
  showDestinationPaymentMethodConfirmation?: boolean
  setSelectedSourcePaymentMethodId: (paymentMethodId: string) => void
  setSelectedDestinationPaymentMethodId: (paymentMethodId: string) => void
  availableSourceTypes: Array<{ key: string; value: string }>
  selectedSourceType?: Mercoa.PaymentMethodType
  setSelectedSourceType: (type: Mercoa.PaymentMethodType) => void
  availableDestinationTypes: Array<{ key: string; value: string }>
  selectedDestinationType?: Mercoa.PaymentMethodType
  setSelectedDestinationType: (type: Mercoa.PaymentMethodType) => void
  getVendorPaymentLink: (invoiceId: string) => Promise<string | undefined>
}

export type PayableRecurringScheduleContext = {
  type: 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime'
  repeatEvery?: number
  repeatOn?: Array<Mercoa.DayOfWeek>
  repeatOnDay?: number
  repeatOnMonth?: number
  ends?: Date
  setType: (type: 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime') => void
  setRepeatEvery: (repeatEvery: number) => void
  setRepeatOn: (repeatOn: Array<Mercoa.DayOfWeek>) => void
  setRepeatOnDay: (repeatOnDay: number) => void
  setRepeatOnMonth: (repeatOnMonth: number) => void
  setEnds: (ends?: Date) => void
}

export type PayableApproversContext = {
  approvers: Mercoa.ApprovalSlot[]
  approvalPolicy: Mercoa.ApprovalPolicyResponse[]
  setApproverBySlot: (approvalSlotId: string, assignedUserId: string) => void
  getApprovalSlotOptions: (approvalSlotId: string) => any
  selectedApproverBySlot: (approvalSlotId: string) => any
}

//Payables Props

export type PayablesTableActionProps = {
  invoiceId: string[] | string
  action: PayablesTableAction
  mode: 'single' | 'multiple'
}

export type PayablesProps = {
  queryOptions?: PayablesQueryOptions
  renderCustom?: PayablesRenderCustom
  displayOptions?: PayablesDisplayOptions
  handlers?: PayablesHandlers
  config?: PayablesConfig
}

export type InvoiceTableColumn = {
  field: keyof Mercoa.InvoiceResponse | `${'metadata.'}${string}`
  orderBy?: Mercoa.InvoiceOrderByField
  header?: string | ReactElement | null
  cell?: (value: string | number | Date | any, invoice: Mercoa.InvoiceResponse) => string | ReactElement | null
}

type PayablesQueryOptions = {
  currentStatuses?: Mercoa.InvoiceStatus[]
  search?: string
  startDate?: Date
  endDate?: Date
  orderBy?: Mercoa.InvoiceOrderByField
  orderDirection?: Mercoa.OrderDirection
  excludeReceivables?: boolean
  resultsPerPage: number
  paymentType?: Mercoa.PaymentType[]
  metadata?: Mercoa.MetadataFilter | Mercoa.MetadataFilter[]
  dateType?: Mercoa.InvoiceDateFilter
  approverId?: string
  approverAction?: Mercoa.ApproverAction
  isInitial?: boolean
}

type PayablesRenderCustom = {
  columns?: InvoiceTableColumn[]
  toast?: ToastClient
  searchBar?: (setSearch: (search: string) => void) => ReactNode
  payableDetails?: (props: PayableDetailsProps) => ReactNode
  editInvoicesDialog?: (
    open: boolean,
    setOpen: (open: boolean) => void,
    selectedInvoices: Mercoa.InvoiceResponse[],
    setSelectedInvoices: (invoices: Mercoa.InvoiceResponse[]) => void,
  ) => ReactNode
}

type PayablesDisplayOptions = {
  tableOnly?: boolean
  showCumulativeFilter?: boolean
  statusTabsOptions?: {
    isVisible: boolean
    statuses: Mercoa.InvoiceStatus[]
    customStatuses?: {
      statuses: Mercoa.InvoiceStatus[]
      label: string
    }[]
  }
  invoiceMetrics?: {
    isVisible: boolean
    showSelectedMetrics?: boolean
  }
  classNames?: {
    table?: {
      root?: string
      thead?: string
      tbody?: string
      th?: string
      tr?: string
      td?: string
    }
    searchbar?: string
    checkbox?: string
  }
}

type PayablesHandlers = {
  onCreateInvoice?: () => void
  onCreateInvoiceTemplate?: () => void
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => void
  onSelectInvoiceTemplate?: (invoiceTemplate: Mercoa.InvoiceTemplateResponse) => void
}

type PayablesConfig = {
  readOnly?: boolean
}

//Payables Context Value

export type PayablesContextValue = {
  propsContextValue: PayablesProps
  dataContextValue: PayablesDataContext
  filtersContextValue: PayablesFiltersContext
  paginationContextValue: PayablesPaginationContext
  selectionContextValue: PayablesSelectionContext
  actionsContextValue: PayablesActionsContext
}

// Payables Data Context Type
export type PayablesDataContext = {
  tableData: Array<{
    select: string
    id: string
    invoice?: Mercoa.InvoiceResponse
    invoiceNumber?: string
    currencyCode?: string
    vendor?: Mercoa.CounterpartyResponse
    amount?: number
    status: Mercoa.InvoiceStatus
    invoiceId: string
    dueDate?: Date
    invoiceDate?: Date
    deductionDate?: Date
    paymentDestination?: Mercoa.PaymentMethodResponse
    invoiceType?: 'invoice' | 'invoiceTemplate'
    failureType?: Mercoa.InvoiceFailureType
    vendorId?: string
    payerId?: string
    paymentDestinationId?: string
    paymentSourceId?: string
    approvers?: Mercoa.ApprovalSlot[]
  }>
  infiniteData: any
  allFetchedInvoices: Mercoa.InvoiceResponse[]
  isDataLoading: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  isLoading: boolean
  isError: boolean
  isRefreshLoading: boolean
  handleRefresh: () => void
  recurringPayablesData?: Mercoa.InvoiceTemplateResponse[]
  isRecurringPayablesLoading: boolean
  approvalPolicies?: Mercoa.ApprovalPolicyResponse[]
  isApprovalPoliciesLoading: boolean
  metricsData?: Mercoa.InvoiceMetricsResponse[]
  isMetricsLoading: boolean
  statusTabsMetrics: any
  isStatusTabsMetricsLoading: boolean
}

// Payables Filters Context Type
export type PayablesFiltersContext = {
  currentStatuses: Mercoa.InvoiceStatus[]
  setCurrentStatuses: (statuses: Mercoa.InvoiceStatus[]) => void
  search: string
  setSearch: (search: string) => void
  startDate?: Date
  setStartDate: (date?: Date) => void
  endDate?: Date
  setEndDate: (date?: Date) => void
  selectedStatusFilters: {
    toggleSelectedStatus: (status: Mercoa.InvoiceStatus) => void
  }
}

// Payables Pagination Context Type
export type PayablesPaginationContext = {
  orderBy: Mercoa.InvoiceOrderByField
  setOrderBy: (field: Mercoa.InvoiceOrderByField) => void
  orderDirection: Mercoa.OrderDirection
  setOrderDirection: (direction: Mercoa.OrderDirection) => void
  resultsPerPage: number
  setResultsPerPage: (perPage: number) => void
  page: number
  totalEntries: number
  goToNextPage: () => void
  goToPreviousPage: () => void
  isNextDisabled: boolean
  isPrevDisabled: boolean
  handleOrderByChange: (field: Mercoa.InvoiceOrderByField) => void
}

// Payables Selection Context Type
export type PayablesSelectionContext = {
  selectedInvoices: Mercoa.InvoiceResponse[]
  setSelectedInvoices: (invoices: Mercoa.InvoiceResponse[]) => void
  isAllSelected: boolean
  handleSelectAll: () => void
  handleSelectRow: (invoice: Mercoa.InvoiceResponse) => void
  selectedColumns: InvoiceTableColumn[]
  setSelectedColumns: (columns: InvoiceTableColumn[]) => void
  toggleSelectedColumn: (field: string) => void
}

// Payables Actions Context Type
export type PayablesActionsContext = {
  deletePayable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceId: string
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isDeletePayableLoading: boolean
  bulkDeletePayables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkDeletePayableLoading: boolean
  schedulePayment: UseMutateFunction<
    Mercoa.InvoiceTemplateResponse,
    ErrorResponse,
    {
      invoice: Mercoa.InvoiceResponse
      deductionDate: Date
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isSchedulePaymentLoading: boolean
  bulkSchedulePayment: UseMutateFunction<
    {
      success: boolean
      successfulInvoices: string[]
      failedInvoices: string[]
      errors: {
        invoiceId: string
        error: any
      }[]
    },
    ErrorResponse,
    {
      invoices: Mercoa.InvoiceResponse[]
      deductionDate: Date
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkSchedulePaymentLoading: boolean
  approvePayable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    },
    unknown
  >
  isApprovePayableLoading: boolean
  bulkApprovePayables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkApprovePayablesLoading: boolean
  rejectPayable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    },
    unknown
  >
  isRejectPayableLoading: boolean
  bulkRejectPayables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkRejectPayablesLoading: boolean
  restoreAsDraft: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    },
    unknown
  >
  isRestoreAsDraftLoading: boolean
  bulkRestoreAsDraft: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkRestoreAsDraftLoading: boolean
  submitForApproval: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    },
    unknown
  >
  isSubmitForApprovalLoading: boolean
  bulkSubmitForApproval: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkSubmitForApprovalLoading: boolean
  assignApprover: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoice: Mercoa.InvoiceResponse
      userId: string
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isAssignApproverLoading: boolean
  bulkAssignApprover: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoices: Mercoa.InvoiceResponse[]
      userId: string
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkAssignApproverLoading: boolean
  archivePayable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceId: string
    },
    unknown
  >
  isArchivePayableLoading: boolean
  bulkArchivePayables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
    },
    unknown
  >
  isBulkArchivePayablesLoading: boolean
  cancelPayable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceId: string
    },
    unknown
  >
  isCancelPayableLoading: boolean
  bulkCancelPayables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
    },
    unknown
  >
  isBulkCancelPayablesLoading: boolean
  activeInvoiceAction: {
    invoiceId: string[] | string
    action: PayablesTableAction
    mode: 'single' | 'multiple'
  } | null
  setActiveInvoiceAction: (
    action: {
      invoiceId: string[] | string
      action: PayablesTableAction
      mode: 'single' | 'multiple'
    } | null,
  ) => void
  downloadInvoicesAsCSV: () => void
}
