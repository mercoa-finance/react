import { NoSession } from '../../../components'

import accounting from 'accounting'
import { Mercoa } from '@mercoa/javascript'
import { Skeleton, StatCard, useMercoaSession } from '../../../components'
import { currencyCodeToSymbol } from '../../../lib/currency'

export function InvoiceMetrics({
  metrics,
  isLoading,
  children,
}: {
  metrics?: Mercoa.InvoiceMetricsResponse[]
  isLoading?: boolean
  children?: ({ metrics }: { metrics?: Mercoa.InvoiceMetricsResponse[] }) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  function sumTotalCount(metrics: Mercoa.InvoiceMetricsResponse[]) {
    return metrics?.reduce((acc, metric) => {
      acc += metric.totalCount
      return acc
    }, 0)
  }
  function formatCurrencyMetrics(metrics: Mercoa.InvoiceMetricsResponse[], key: 'totalAmount' | 'averageAmount') {
    if (!metrics || metrics.length < 1) {
      return accounting.formatMoney(0, currencyCodeToSymbol('USD'))
    }
    const total = metrics.reduce((acc, metric) => acc + (metric[key] ?? 0), 0)
    const currency = metrics[0]?.currency ?? 'USD'

    return accounting.formatMoney(total, currencyCodeToSymbol(currency))
  }

  if (children) return children({ metrics })

  if (!mercoaSession.client) return <NoSession componentName="InvoiceMetrics" />
  return (
    <div className="mercoa-grid mercoa-grid-cols-3 mercoa-space-x-3 mercoa-h-[55px]">
      {isLoading || !metrics ? (
        <>
          <Skeleton rows={2} />
          <Skeleton rows={2} />
          <Skeleton rows={2} />
        </>
      ) : (
        <>
          <StatCard size="xs" title={`Number of Invoices`} value={sumTotalCount(metrics)} />
          <StatCard size="xs" title={`Total Amount`} value={formatCurrencyMetrics(metrics, 'totalAmount')} />
          <StatCard size="xs" title={`Average Amount`} value={formatCurrencyMetrics(metrics, 'averageAmount')} />
        </>
      )}
    </div>
  )
}
