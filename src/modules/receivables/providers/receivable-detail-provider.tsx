import { createContext, ReactNode } from 'react'
import { useReceivableDetailsInternal } from '../hooks/use-receivable-details-internal'
import { ReceivableDetailsContextValue, ReceivableDetailsProps } from '../types'

export const ReceivableDetailsContext = createContext<ReceivableDetailsContextValue | undefined>(undefined)

export const ReceivableDetailsProvider = ({
  children,
  receivableDetailsProps,
}: {
  children: ReactNode
  receivableDetailsProps: ReceivableDetailsProps
}) => {
  const contextValue = useReceivableDetailsInternal(receivableDetailsProps)

  return <ReceivableDetailsContext.Provider value={contextValue}>{children}</ReceivableDetailsContext.Provider>
}
