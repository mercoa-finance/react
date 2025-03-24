import { UseMutateFunction } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { ErrorResponse } from '../../lib/react-query/types'
import { ReceivableFormAction } from './components/receivable-form/constants'
import { ReceivablesTableAction } from './components/receivables-table/constants'

// Receivable Details Props
export interface ReceivableDetailsProps {
  queryOptions: ReceivableDetailsQueryParams
  handlers?: ReceivableDetailsHandlers
  config?: ReceivableDetailsConfig
  displayOptions?: ReceivableDetailsDisplayOptions
  renderCustom?: ReceivableDetailsRenderCustom
}

export interface ReceivableDetailsHandlers {
  onInvoiceUpdate: (invoice: Mercoa.InvoiceResponse | undefined) => void
}

export interface ReceivableDetailsQueryParams {
  invoiceId?: string
  invoiceType?: 'invoice' | 'invoiceTemplate'
}
export interface ReceivableDetailsConfig {
  supportedCurrencies?: Mercoa.CurrencyCode[]
  disableCustomerCreation?: boolean
}

export interface ReceivableDetailsDisplayOptions {
  documentPosition?: 'right' | 'left' | 'none'
  heightOffset?: number
}

export interface ReceivableDetailsRenderCustom {
  toast?: {
    error: (message: string) => void
    success: (message: string) => void
    info: (message: string) => void
  }
}

// Receivable Details Context
export type ReceivablePaymentMethodContext = {
  setMethodOnTypeChange: (paymentMethodType: Mercoa.PaymentMethodType | string, type: 'source' | 'destination') => void
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
  paymentLink: string | undefined
}

export type ReceivableDetailsContextValue = {
  propsContextValue: ReceivableDetailsProps
  formContextValue: ReceivableFormContext
  dataContextValue: ReceivableDataContext
}

export type ReceivableFormContext = {
  formMethods: UseFormReturn<any>
  handleFormSubmit: (data: any) => void
  formLoading: boolean
  handleActionClick: (action: ReceivableFormAction) => void
  paymentMethodContextValue: ReceivablePaymentMethodContext
  payerContextValue: ReceivablePayerContext
  recurringScheduleContextValue: RecurringScheduleContext
}

export type ReceivableDataContext = {
  invoice: Mercoa.InvoiceResponse | undefined
  invoiceType: 'invoice' | 'invoiceTemplate'
  invoiceLoading: boolean
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
}

export type ReceivablePayerContext = {
  selectedPayer: Mercoa.EntityResponse | undefined
  setSelectedPayer: (payer: Mercoa.EntityResponse | undefined) => void
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

// Receivables Props
export interface ReceivablesProps {
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
  invoice: Mercoa.InvoiceResponse
  payer: string | undefined
  invoiceNumber: string | undefined
  currencyCode: string | undefined
  payerName?: string
  payerEmail?: string
  amount: number | undefined
  status: Mercoa.InvoiceStatus
  invoiceId: string
  dueDate: Date | undefined
  invoiceDate: Date | undefined
  paymentDestination: Mercoa.PaymentMethodResponse | undefined
  invoiceType: string
  failureType?: string | undefined
  vendorId: string | undefined
  payerId: string | undefined
  paymentDestinationId?: string | undefined
  paymentSourceId?: string | undefined
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
  recurringReceivablesData: Mercoa.InvoiceTemplateResponse[] | undefined
  isRecurringReceivablesLoading: boolean
  metricsData: Mercoa.InvoiceMetricsResponse[] | undefined
  isMetricsLoading: boolean
  statusTabsMetrics: any
  isStatusTabsMetricsLoading: boolean
}

type ReceivablesFilters = {
  search: string
  setSearch: (search: string) => void
  startDate: Date | undefined
  setStartDate: (date: Date | undefined) => void
  endDate: Date | undefined
  setEndDate: (date: Date | undefined) => void
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
  selectedInvoiceIds: string[]
  setSelectedInvoiceIds: (ids: string[]) => void
  isAllSelected: boolean
  handleSelectAll: () => void
  handleSelectRow: (invoiceId: string) => void
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
    },
    unknown
  >
  isBulkDeleteReceivableLoading: boolean
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
