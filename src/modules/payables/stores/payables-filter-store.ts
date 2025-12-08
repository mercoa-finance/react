import dayjs from 'dayjs'
import { Mercoa } from '@mercoa/javascript'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { InvoiceTableColumn } from '../types'

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

export interface PayablesFilters {
  selectedStatusFilters: Mercoa.InvoiceStatus[]
  selectedPaymentModeFilters: Mercoa.PaymentMethodType[]
  selectedApprovers: Mercoa.EntityUserResponse[]
  selectedApproverActions: Mercoa.ApproverAction[]
  dateRange: DateRange
  dateType: Mercoa.InvoiceDateFilter
  dateRangeLabel: string
  resultsPerPage: number
  selectedColumns: InvoiceTableColumn[]
  orderBy: Mercoa.InvoiceOrderByField
  orderDirection: Mercoa.OrderDirection
  search: string
}

export interface PayablesFilterStoreState {
  state: Record<string, PayablesFilters>
}

export interface PayablesFilterStoreActions {
  setFilters: (tableId: string, filters: Partial<PayablesFilters>) => void
  getFilters: (
    tableId: string,
    initialStatusFilters?: Mercoa.InvoiceStatus[],
    currentUser?: Mercoa.EntityUserResponse | null,
    columns?: InvoiceTableColumn[],
  ) => PayablesFilters
}

export const usePayablesFilterStore = create<PayablesFilterStoreState & PayablesFilterStoreActions>()(
  persist(
      (set, get) => ({
        state: {},

        setFilters: (tableId, filters) => {
          set((state) => ({
            state: {
              ...state.state,
              [tableId]: {
                ...state.state[tableId],
                ...filters,
              },
            },
          }))
        },

        getFilters: (
          tableId: string,
          initialStatusFilters = [Mercoa.InvoiceStatus.Draft],
          currentUser = null,
          columns,
        ) => {
          const existingState = get().state[tableId]
          if (existingState) {
            const needsHydration =
              typeof existingState.dateRange?.startDate === 'string' ||
              typeof existingState.dateRange?.endDate === 'string'

            if (!needsHydration) {
              return existingState
            }

            const hydratedFilters: PayablesFilters = {
              ...existingState,
              dateRange: {
                startDate:
                  existingState.dateRange?.startDate !== null
                    ? dayjs(existingState.dateRange.startDate).toDate()
                    : null,
                endDate:
                  existingState.dateRange?.endDate !== null ? dayjs(existingState.dateRange.endDate).toDate() : null,
              },
            }

            set((state) => ({
              state: {
                ...state.state,
                [tableId]: hydratedFilters,
              },
            }))

            return hydratedFilters
          }

          const defaultColumns: InvoiceTableColumn[] = columns ?? [
            { header: 'Vendor Name', field: 'vendor' },
            { header: 'Invoice Number', field: 'invoiceNumber' },
            { header: 'Amount', field: 'amount' },
            { header: 'Due Date', field: 'dueDate' },
            { header: 'Invoice Date', field: 'invoiceDate' },
            { header: 'Scheduled Payment Date', field: 'deductionDate' },
            { header: 'Payment Initiated', field: 'processedAt' },
            { header: 'Status', field: 'status' },
          ]

          const defaultFilters: PayablesFilters = {
            selectedStatusFilters: initialStatusFilters,
            selectedPaymentModeFilters: [],
            selectedApprovers: [],
            selectedApproverActions: [],
            dateRange: { startDate: null, endDate: null },
            dateType: Mercoa.InvoiceDateFilter.CreatedAt,
            dateRangeLabel: '',
            resultsPerPage: 10,
            selectedColumns: defaultColumns,
            orderBy: Mercoa.InvoiceOrderByField.CreatedAt,
            orderDirection: Mercoa.OrderDirection.Desc,
            search: '',
          }

          set((state) => ({
            state: {
              ...state.state,
              [tableId]: defaultFilters,
            },
          }))
          return defaultFilters
        },
    }),
    {
      name: 'payables-filter-store',
    },
  ),
)
