import { Mercoa } from '@mercoa/javascript'
import { create } from 'zustand'

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

export interface ReceivablesFilters {
  selectedStatusFilters: Mercoa.InvoiceStatus[]
  dateRange: DateRange
  dateType: Mercoa.InvoiceDateFilter
}

export interface ReceivablesFilterStoreState {
  state: Record<string, ReceivablesFilters>
}

export interface ReceivablesFilterStoreActions {
  setFilters: (tableId: string, filters: Partial<ReceivablesFilters>) => void
  getFilters: (tableId: string, initialStatusFilters?: Mercoa.InvoiceStatus[]) => ReceivablesFilters
}

export const useReceivablesFilterStore = create<ReceivablesFilterStoreState & ReceivablesFilterStoreActions>((set, get) => ({
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

  getFilters: (tableId, initialStatusFilters: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Draft]) => {
    const existingState = get().state[tableId]
    if (existingState) {
      return existingState
    }

    const defaultFilters: ReceivablesFilters = {
      selectedStatusFilters: initialStatusFilters,
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
