import { createContext, ReactNode } from 'react'
import { useCounterpartySearchInternal } from '../hooks/use-counterparty-search-internal'
import { CounterpartySearchProps } from '../types'

export type CounterpartySearchContextValue = ReturnType<typeof useCounterpartySearchInternal>

export const CounterpartySearchContext = createContext<CounterpartySearchContextValue | undefined>(undefined)

export const CounterpartySearchProvider = ({
  children,
  counterpartySearchProps,
}: {
  children: ReactNode
  counterpartySearchProps: CounterpartySearchProps
}) => {
  const counterpartySearch = useCounterpartySearchInternal(counterpartySearchProps)

  return <CounterpartySearchContext.Provider value={counterpartySearch}>{children}</CounterpartySearchContext.Provider>
}
