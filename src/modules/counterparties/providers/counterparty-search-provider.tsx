import { createContext, ReactNode } from 'react'
import { useCounterpartiesSearchInternal } from '../hooks/use-counterparties-search-internal'
import { CounterpartySearchProps } from '../types'

export type CounterpartySearchContextValue = ReturnType<typeof useCounterpartiesSearchInternal>

export const CounterpartySearchContext = createContext<CounterpartySearchContextValue | undefined>(undefined)

export const CounterpartySearchProvider = ({
  children,
  counterpartySearchProps,
}: {
  children: ReactNode
  counterpartySearchProps: CounterpartySearchProps
}) => {
  const counterpartySearch = useCounterpartiesSearchInternal(counterpartySearchProps)

  return <CounterpartySearchContext.Provider value={counterpartySearch}>{children}</CounterpartySearchContext.Provider>
}
