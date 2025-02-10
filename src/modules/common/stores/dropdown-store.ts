import { create } from 'zustand'

export interface DropdownState {
  open: boolean
}

export interface DropdownStoreState {
  state: Record<string, DropdownState> | null
}

export interface DropdownStoreActions {
  getOrCreateDropdownState: (dropdownId: string) => DropdownState
  removeDropdownState: (dropdownId: string) => void
  updateDropdownState: (dropdownId: string, updatedDropdown?: Partial<DropdownState>) => void
}

export const useDropdownStore = create<DropdownStoreState & DropdownStoreActions>((set, get) => ({
  state: null,

  getOrCreateDropdownState: (dropdownId) => {
    const existingState = get().state?.[dropdownId]
    if (existingState) {
      return existingState
    }

    set((state) => {
      const updatedState = state.state
        ? { ...state.state, [dropdownId]: { open: false } }
        : { [dropdownId]: { open: false } }

      return { state: updatedState }
    })

    return get().state![dropdownId]
  },

  removeDropdownState: (dropdownId) => {
    set((state) => {
      if (!state.state) return { state: null }

      const { [dropdownId]: _, ...remainingState } = state.state
      return { state: Object.keys(remainingState).length > 0 ? remainingState : null }
    })
  },

  updateDropdownState: (dropdownId, updatedDropdown) => {
    set((state) => {
      if (!state.state || !state.state[dropdownId]) {
        return state
      }

      return {
        state: {
          ...state.state,
          [dropdownId]: {
            ...state.state[dropdownId],
            ...updatedDropdown,
          },
        },
      }
    })
  },
}))
