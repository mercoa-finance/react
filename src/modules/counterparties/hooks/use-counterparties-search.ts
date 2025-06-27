import { useContext } from 'react'
import { CounterpartySearchContext } from '../providers/counterparty-search-provider'

export const useCounterpartiesSearch = () => {
  const context = useContext(CounterpartySearchContext)
  if (!context) {
    throw new Error('useCounterpartiesSearch must be used within a CounterpartySearchProvider')
  }
  return context
}
