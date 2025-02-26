import { useContext } from 'react'
import { ReceivableDetailsContext } from '../providers/receivable-detail-provider'

export const useReceivableDetails = () => {
  const context = useContext(ReceivableDetailsContext)
  if (!context) {
    throw new Error('useReceivableDetails must be used within a ReceivableDetailsProvider')
  }
  return context
}
