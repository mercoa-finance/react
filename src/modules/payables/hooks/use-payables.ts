import { useContext } from 'react'
import { PayablesContext } from '../providers/payables-provider'

export const usePayables = () => {
  const context = useContext(PayablesContext)
  if (!context) {
    throw new Error('usePayables must be used within a PayablesProvider')
  }
  return context
}
