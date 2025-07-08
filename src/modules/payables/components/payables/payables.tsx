import { FC, memo, PropsWithChildren } from 'react'
import { PayablesProvider } from '../../providers/payables-provider'
import { PayablesProps } from '../../types'
import { PayablesDashboard } from '../payables-dashboard/payables-dashboard'
import { PayablesTable } from '../payables-table/payables-table'

export const Payables: FC<PropsWithChildren<PayablesProps>> = memo(
  ({ queryOptions, renderCustom, displayOptions, handlers, config, children }) => {
    const { tableOnly } = displayOptions ?? {}
    return (
      <PayablesProvider payableProps={{ queryOptions, renderCustom, displayOptions, handlers, config }}>
        {children ? children : tableOnly ? <PayablesTable /> : <PayablesDashboard />}
      </PayablesProvider>
    )
  },
)

Payables.displayName = 'Payables'
