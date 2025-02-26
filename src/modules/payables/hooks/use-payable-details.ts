import { useContext } from 'react'
import { PayableDetailsContext } from '../providers/payables-detail-provider'

export const usePayableDetails = () => {
  const context = useContext(PayableDetailsContext)
  if (!context) {
    throw new Error('usePayableDetailsContext must be used within a PayableDetailsProvider')
  }
  return context
}
