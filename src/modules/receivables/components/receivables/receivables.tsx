import { ReceivablesTable } from '../receivables-table'
import { FC, PropsWithChildren } from 'react'
import { ReceivablesProvider } from '../../providers/receivables-provider'
import { ReceivablesDashboard } from '../receivables-dashboard'
import { ReceivablesProps } from './types'

export const Receivables: FC<PropsWithChildren<ReceivablesProps>> = ({ children, ...props }) => {
  const { displayOptions } = props
  const tableOnly = displayOptions?.tableOnly
  return (
    <ReceivablesProvider receivableProps={props}>
      {children ? children : tableOnly ? <ReceivablesTable /> : <ReceivablesDashboard />}
    </ReceivablesProvider>
  )
}
