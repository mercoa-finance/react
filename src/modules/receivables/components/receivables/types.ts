import { ReactElement } from 'react'
import { Mercoa } from '@mercoa/javascript'

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
  onCreateRecurringInvoice?: () => void
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => void
}

type ReceivablesConfig = {
  readOnly?: boolean
}

export interface ReceivablesProps {
  queryOptions?: ReceivablesQueryOptions
  renderCustom?: ReceivablesRenderCustom
  displayOptions?: ReceivablesDisplayOptions
  handlers?: ReceivablesHandlers
  config?: ReceivablesConfig
}
