import { createContext, ReactNode } from 'react'
import { usePayableDetailsInternal } from '../hooks/use-payable-details-internal'
import { PayableDetailsContextValue, PayableDetailsProps } from '../types'

export const PayableDetailsContext = createContext<PayableDetailsContextValue | undefined>(undefined)

export const PayableDetailsProvider = ({
  children,
  payableDetailsProps,
}: {
  children: ReactNode
  payableDetailsProps: PayableDetailsProps
}) => {
  const payableDetails = usePayableDetailsInternal(payableDetailsProps)

  return <PayableDetailsContext.Provider value={payableDetails}>{children}</PayableDetailsContext.Provider>
}
