import { useContext } from 'react'
import { CounterpartySearchContext } from '../providers/counterparty-search-provider'

export const useCounterpartySearch = () => {
  const context = useContext(CounterpartySearchContext)
  if (!context) {
    throw new Error('useCounterpartySearch must be used within a CounterpartySearchProvider')
  }
  return context
}
