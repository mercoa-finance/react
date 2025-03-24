import { useContext } from 'react'
import { ReceivablesContext } from '../providers/receivables-provider'

export const useReceivables = () => {
  const context = useContext(ReceivablesContext)
  if (!context) {
    throw new Error('useReceivables must be used within a ReceivablesProvider')
  }
  return context
}
