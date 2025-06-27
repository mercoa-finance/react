import { CounterpartySearchProvider } from '../../providers/counterparty-search-provider'
import { CounterpartySearchProps } from '../../types'
import { CounterpartySearchInternal } from './counterparty-search-internal'

export function CounterpartiesSearch(props: CounterpartySearchProps) {
  return (
    <CounterpartySearchProvider counterpartySearchProps={props}>
      <CounterpartySearchInternal />
    </CounterpartySearchProvider>
  )
}
