import { createContext, ReactNode } from 'react'
import { useReceivablesInternal } from '../hooks/use-receivables-internal'
import { ReceivablesContextValue, ReceivablesProps } from '../types'

export const ReceivablesContext = createContext<ReceivablesContextValue | undefined>(undefined)

export const ReceivablesProvider = ({
  children,
  receivableProps,
}: {
  children: ReactNode
  receivableProps: ReceivablesProps
}) => {
  const receivables = useReceivablesInternal(receivableProps)

  return <ReceivablesContext.Provider value={receivables}>{children}</ReceivablesContext.Provider>
}
