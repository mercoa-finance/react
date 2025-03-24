import { createContext, ReactNode } from 'react'
import { ReceivablesProps } from '../components/receivables/types'
import { useReceivablesInternal } from '../hooks/use-receivables-internal'

export type ReceivablesContextValue = ReturnType<typeof useReceivablesInternal>

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
