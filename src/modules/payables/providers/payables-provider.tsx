import { createContext, ReactNode } from 'react'
import { usePayablesTable, UsePayablesTableOptions } from '../hooks'

export type PayablesContextValue = {
  payablesTable: ReturnType<typeof usePayablesTable>
}

export const PayablesContext = createContext<PayablesContextValue | undefined>(undefined)

export const PayablesProvider = ({
  children,
  payableTableProps,
}: {
  children: ReactNode
  payableTableProps: UsePayablesTableOptions
}) => {
  const payables = usePayablesTable(payableTableProps)

  return <PayablesContext.Provider value={{ payablesTable: payables }}>{children}</PayablesContext.Provider>
}
