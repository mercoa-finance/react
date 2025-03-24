import { createContext, ReactNode } from 'react'
import { PayablesProps } from '../components/payables/types'
import { usePayablesInternal } from '../hooks/use-payables-internal'

export type PayablesContextValue = ReturnType<typeof usePayablesInternal>

export const PayablesContext = createContext<PayablesContextValue | undefined>(undefined)

export const PayablesProvider = ({ children, payableProps }: { children: ReactNode; payableProps: PayablesProps }) => {
  const payables = usePayablesInternal(payableProps)

  return <PayablesContext.Provider value={payables}>{children}</PayablesContext.Provider>
}
