import { FC, PropsWithChildren } from 'react'
import { ReceivablesProvider } from '../../providers/receivables-provider'
import { ReceivablesProps } from '../../types'
import { ReceivablesDashboard } from '../receivables-dashboard'
import { ReceivablesTable } from '../receivables-table'

export const Receivables: FC<PropsWithChildren<ReceivablesProps>> = ({ children, ...props }) => {
  const { displayOptions } = props
  const tableOnly = displayOptions?.tableOnly
  return (
    <ReceivablesProvider receivableProps={props}>
      {children ? children : tableOnly ? <ReceivablesTable /> : <ReceivablesDashboard />}
    </ReceivablesProvider>
  )
}
