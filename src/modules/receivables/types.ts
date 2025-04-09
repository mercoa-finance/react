import { UseMutateFunction } from '@tanstack/react-query'
import { ReactElement, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { ErrorResponse } from '../../lib/react-query/types'
import { ToastClient } from '../common/utils'
import { ReceivableFormAction } from './components/receivable-form/constants'
import { ReceivablesTableAction } from './components/receivables-table/constants'

// Receivable Details Props
export type ReceivableDetailsProps = {
  queryOptions?: ReceivableDetailsQueryOptions
  handlers?: ReceivableDetailsHandlers
  config?: ReceivableDetailsConfig
  displayOptions?: ReceivableDetailsDisplayOptions
  renderCustom?: ReceivableDetailsRenderCustom
  children?: ReactNode
}

export type ReceivableDetailsHandlers = {
  onInvoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  onCounterpartyPreSubmit?: (
    counterparty?: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onInvoiceUpdate?: (invoice?: Mercoa.InvoiceResponse) => void
  onInvoiceSubmit?: (resp: Mercoa.InvoiceResponse) => void
}

export type ReceivableDetailsQueryOptions = {
  invoiceId?: string
  invoice?: Mercoa.InvoiceResponse
  invoiceType?: 'invoice' | 'invoiceTemplate'
}
export type ReceivableDetailsConfig = {
  supportedCurrencies?: Mercoa.CurrencyCode[]
  disableCustomerCreation?: boolean
}

export type ReceivableDetailsDisplayOptions = {
  documentPosition?: 'right' | 'left' | 'none'
  heightOffset?: number
}

export type ReceivableDetailsRenderCustom = {
  toast?: ToastClient
}

// Receivable Details Context
export type ReceivableDetailsContextValue = {
  propsContextValue: ReceivableDetailsProps
  formContextValue: ReceivableFormContext
  dataContextValue: ReceivableDataContext
}

export type ReceivablePaymentMethodContext = {
  setMethodOnTypeChange: (paymentMethodType: Mercoa.PaymentMethodType | string, type: 'source' | 'destination') => void
  sourcePaymentMethods?: Mercoa.PaymentMethodResponse[]
  destinationPaymentMethods?: Mercoa.PaymentMethodResponse[]
  selectedSourcePaymentMethodId?: string
  selectedDestinationPaymentMethodId?: string
  setSelectedSourcePaymentMethodId: (paymentMethodId: string) => void
  setSelectedDestinationPaymentMethodId: (paymentMethodId: string) => void
  availableSourceTypes: Array<{ key: string; value: string }>
  selectedSourceType?: Mercoa.PaymentMethodType
  setSelectedSourceType: (type: Mercoa.PaymentMethodType) => void
  availableDestinationTypes: Array<{ key: string; value: string }>
  selectedDestinationType?: Mercoa.PaymentMethodType
  setSelectedDestinationType: (type: Mercoa.PaymentMethodType) => void
  paymentLink?: string
}

export type ReceivableFormContext = {
  formMethods: UseFormReturn<any>
  handleFormSubmit: (data: any) => void
  formLoading: boolean
  handleActionClick: (action: ReceivableFormAction) => void
  paymentMethodContextValue: ReceivablePaymentMethodContext
  payerContextValue: ReceivablePayerContext
  recurringScheduleContextValue: ReceivableRecurringScheduleContext
}

export type ReceivableDataContext = {
  invoice?: Mercoa.InvoiceResponse
  invoiceType?: 'invoice' | 'invoiceTemplate'
  invoiceLoading: boolean
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
}

export type ReceivablePayerContext = {
  selectedPayer?: Mercoa.EntityResponse
  setSelectedPayer: (payer?: Mercoa.EntityResponse) => void
}

export type ReceivableRecurringScheduleContext = {
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

// Receivables Props

export type ReceivablesTableActionProps = {
  invoiceId: string[] | string
  action: ReceivablesTableAction
  mode: 'single' | 'multiple'
}

export type ReceivablesProps = {
  queryOptions?: ReceivablesQueryOptions
  renderCustom?: ReceivablesRenderCustom
  displayOptions?: ReceivablesDisplayOptions
  handlers?: ReceivablesHandlers
  config?: ReceivablesConfig
}

type InvoiceTableColumn = {
  title: string
  field: keyof Mercoa.InvoiceResponse | `${'metadata.'}${string}`
  orderBy?: Mercoa.InvoiceOrderByField
  format?: (value: string | number | Date | any, invoice: Mercoa.InvoiceResponse) => string | ReactElement | null
}

type ReceivablesQueryOptions = {
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

type ReceivablesRenderCustom = {
  columns?: InvoiceTableColumn[]
}

type ReceivablesDisplayOptions = {
  tableOnly?: boolean
  showCumulativeFilter?: boolean
  statusTabsOptions?: {
    isVisible: boolean
    statuses: Mercoa.InvoiceStatus[]
  }
  showInvoiceMetrics?: boolean
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

type ReceivablesHandlers = {
  onCreateInvoice?: () => void
  onCreateInvoiceTemplate?: () => void
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => void
  onSelectInvoiceTemplate?: (invoiceTemplate: Mercoa.InvoiceTemplateResponse) => void
}

type ReceivablesConfig = {
  readOnly?: boolean
}

// Receivables Context Value

export type ReceivablesContextValue = {
  propsContextValue: ReceivablesProps
  dataContextValue: ReceivablesData
  filtersContextValue: ReceivablesFilters
  sortingContextValue: ReceivablesSorting
  paginationContextValue: ReceivablesPagination
  selectionContextValue: ReceivablesSelection
  actionsContextValue: ReceivablesActions
}

type ReceivablesTableRow = {
  select: string
  id: string
  invoice?: Mercoa.InvoiceResponse
  payer?: string
  invoiceNumber?: string
  currencyCode?: string
  payerName?: string
  payerEmail?: string
  amount?: number
  status: Mercoa.InvoiceStatus
  invoiceId: string
  dueDate?: Date
  invoiceDate?: Date
  paymentDestination?: Mercoa.PaymentMethodResponse
  invoiceType?: 'invoice' | 'invoiceTemplate'
  failureType?: string
  vendorId?: string
  payerId?: string
  paymentDestinationId?: string
  paymentSourceId?: string
}

type ReceivablesData = {
  tableData: ReceivablesTableRow[]
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
  recurringReceivablesData?: Mercoa.InvoiceTemplateResponse[]
  isRecurringReceivablesLoading: boolean
  metricsData?: Mercoa.InvoiceMetricsResponse[]
  isMetricsLoading: boolean
  statusTabsMetrics: any
  isStatusTabsMetricsLoading: boolean
}

type ReceivablesFilters = {
  search: string
  setSearch: (search: string) => void
  startDate?: Date
  setStartDate: (date?: Date) => void
  endDate?: Date
  setEndDate: (date?: Date) => void
  currentStatuses: Mercoa.InvoiceStatus[]
  setCurrentStatuses: (statuses: Mercoa.InvoiceStatus[]) => void
  toggleSelectedStatus: (status: Mercoa.InvoiceStatus) => void
}

type ReceivablesSorting = {
  orderBy: Mercoa.InvoiceOrderByField
  setOrderBy: (field: Mercoa.InvoiceOrderByField) => void
  orderDirection: Mercoa.OrderDirection
  setOrderDirection: (direction: Mercoa.OrderDirection) => void
  handleOrderByChange: (field: Mercoa.InvoiceOrderByField) => void
}

type ReceivablesPagination = {
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

type ReceivablesSelection = {
  selectedInvoices: Mercoa.InvoiceResponse[]
  setSelectedInvoices: (invoices: Mercoa.InvoiceResponse[]) => void
  isAllSelected: boolean
  handleSelectAll: () => void
  handleSelectRow: (invoice: Mercoa.InvoiceResponse) => void
  selectedColumns: InvoiceTableColumn[]
  setSelectedColumns: (columns: InvoiceTableColumn[]) => void
  toggleSelectedColumn: (column: InvoiceTableColumn) => void
}

type ReceivablesActions = {
  deleteReceivable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceId: string
      invoiceType?: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    },
    unknown
  >
  isDeleteReceivableLoading: boolean
  bulkDeleteReceivables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    },
    unknown
  >
  isBulkDeleteReceivableLoading: boolean
  restoreAsDraft: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoice: Mercoa.InvoiceResponse
      invoiceType?: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    },
    unknown
  >
  isRestoreAsDraftReceivableLoading: boolean
  bulkRestoreAsDraft: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
    },
    unknown
  >
  isBulkRestoreAsDraftReceivableLoading: boolean
  archiveReceivable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceId: string
    },
    unknown
  >
  isArchiveReceivableLoading: boolean
  bulkArchiveReceivables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
    },
    unknown
  >
  isBulkArchiveReceivablesLoading: boolean
  cancelReceivable: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceId: string
      toast?: ToastClient
    },
    unknown
  >
  isCancelReceivableLoading: boolean
  bulkCancelReceivables: UseMutateFunction<
    any,
    ErrorResponse,
    {
      invoiceIds: string[]
      toast?: ToastClient
    },
    unknown
  >
  isBulkCancelReceivablesLoading: boolean
  activeInvoiceAction: {
    invoiceId: string[] | string
    action: ReceivablesTableAction
    mode: 'single' | 'multiple'
  } | null
  setActiveInvoiceAction: (
    action: {
      invoiceId: string[] | string
      action: ReceivablesTableAction
      mode: 'single' | 'multiple'
    } | null,
  ) => void
  downloadInvoicesAsCSV: () => void
}
