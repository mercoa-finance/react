import { ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'

// Main Props Types
export type CounterpartySearchProps = {
  queryOptions?: CounterpartySearchQueryOptions
  handlers?: CounterpartySearchHandlers
  config?: CounterpartySearchConfig
  displayOptions?: CounterpartySearchDisplayOptions
  renderCustom?: CounterpartySearchRenderCustom
  children?: ReactNode
}

// Query Options
export type CounterpartySearchQueryOptions = {
  network?: Mercoa.CounterpartyNetworkType[]
  search?: string
  limit?: number
  startingAfter?: Mercoa.EntityId
  paymentMethods?: boolean
  invoiceMetrics?: boolean
  returnMetadata?: string | string[]
}

// Handlers
export type CounterpartySearchHandlers = {
  onCounterpartyPreSubmit?: (
    counterparty: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onCounterpartySelect?: (counterparty: Mercoa.CounterpartyResponse | undefined) => void
}

// Config
export type CounterpartySearchConfig = {
  type: 'payee' | 'payor'
  selectedCounterparty?: Mercoa.CounterpartyResponse
  disableCreation?: boolean
  readOnly?: boolean
  enableOnboardingLinkOnCreate?: boolean
}

// Display Options
export type CounterpartySearchDisplayOptions = {
  showLabel?: boolean
  classNames?: {
    searchbar?: string
    dropdown?: string
    selectedCounterparty?: string
  }
}

// Render Custom
export type CounterpartySearchRenderCustom = {
  counterpartySearchBase?: (props: {
    counterparties: Mercoa.CounterpartyResponse[] | undefined
    onSearchChangeCb: (search: string) => void
    selectedCounterparty: Mercoa.CounterpartyResponse | undefined
    setSelectedCounterparty: (counterparty: Mercoa.CounterpartyResponse | undefined) => void
  }) => JSX.Element
  selectedCounterparty?: (props: {
    selectedCounterparty?: Mercoa.CounterpartyResponse
    clearSelection: () => void
    readOnly?: boolean
    disableCreation?: boolean
  }) => JSX.Element
  counterpartySearchDropdown?: (props: {
    counterparties: Mercoa.CounterpartyResponse[]
    onSearchChangeCb: (search: string) => void
    selectedCounterparty: Mercoa.CounterpartyResponse | undefined
    setSelectedCounterparty: (counterparty: Mercoa.CounterpartyResponse | undefined) => void
  }) => JSX.Element
}

// Context Value
export type CounterpartySearchContextValue = {
  dataContextValue: CounterpartySearchDataContext
  formContextValue: CounterpartySearchFormContext
  displayContextValue: CounterpartySearchDisplayContext
  propsContextValue: CounterpartySearchProps
}

// Data Context
export type CounterpartySearchDataContext = {
  counterparties?: Mercoa.CounterpartyResponse[]
  selectedCounterparty?: Mercoa.CounterpartyResponse
  setSelectedCounterparty: (counterparty: Mercoa.CounterpartyResponse | undefined) => void
  search: string
  setSearch: (search: string) => void
  hasMore: boolean
  isLoading: boolean
  isError: boolean
  refreshCounterparties: () => void
  duplicateVendorInfo?: {
    duplicates: Mercoa.CounterpartyResponse[]
    foundType: 'name' | 'email'
    foundString: string
    type: 'payee' | 'payor'
  }
  setDuplicateVendorInfo: (
    duplicateVendorInfo:
      | {
          duplicates: Mercoa.CounterpartyResponse[]
          foundType: 'name' | 'email'
          foundString: string
          type: 'payee' | 'payor'
        }
      | undefined,
  ) => void
}

// Form Context
export type CounterpartySearchFormContext = {
  formMethods: UseFormReturn<any>
  handleFormAction: (formData: any, action: string) => void
  formActionLoading: boolean
  edit: boolean
  setEdit: (edit: boolean) => void
  errors: any
}

// Display Context
export type CounterpartySearchDisplayContext = {
  isDropdownOpen: boolean
  setIsDropdownOpen: (isOpen: boolean) => void
  inputValue: string
  setInputValue: (value: string) => void
  duplicateVendorModalOpen: boolean
  setDuplicateVendorModalOpen: (isOpen: boolean) => void
}

// Children Props
export type CounterpartySearchChildrenProps = {
  setSearch: (search: string) => void
  dataLoaded: boolean
  hasNext: boolean
  getNext: () => void
  hasPrevious: boolean
  getPrevious: () => void
  resultsPerPage: number
  setResultsPerPage: (value: number) => void
  count: number
  counterparties: Mercoa.CounterpartyResponse[]
}
