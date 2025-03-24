import { Mercoa } from '@mercoa/javascript'
import { create } from 'zustand'

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

export interface PayablesFilters {
  selectedStatusFilters: Mercoa.InvoiceStatus[]
  selectedPaymentModeFilters: Mercoa.PaymentMethodType[]
  selectedApprovers: Mercoa.EntityUserResponse[]
  dateRange: DateRange
  dateType: Mercoa.InvoiceDateFilter
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
  ) => PayablesFilters
}

export const usePayablesFilterStore = create<PayablesFilterStoreState & PayablesFilterStoreActions>((set, get) => ({
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
    tableId,
    initialStatusFilters: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Draft],
    currentUser: Mercoa.EntityUserResponse | null = null,
  ) => {
    const existingState = get().state[tableId]
    if (existingState) {
      return existingState
    }

    const defaultFilters: PayablesFilters = {
      selectedStatusFilters: initialStatusFilters,
      selectedPaymentModeFilters: [],
      selectedApprovers: [],
      dateRange: { startDate: null, endDate: null },
      dateType: Mercoa.InvoiceDateFilter.CreatedAt,
    }
    set((state) => ({
      state: {
        ...state.state,
        [tableId]: defaultFilters,
      },
    }))
    return defaultFilters
  },
}))
