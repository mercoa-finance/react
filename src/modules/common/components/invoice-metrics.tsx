import { NoSession } from '../../../components'

import accounting from 'accounting'
import { useMemo } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { Skeleton, StatCard, useMercoaSession } from '../../../components'
import { currencyCodeToSymbol } from '../../../lib/currency'

export function InvoiceMetrics({
  metrics,
  isLoading,
  children,
  selectedInvoices,
}: {
  metrics?: Mercoa.InvoiceMetricsResponse[]
  isLoading?: boolean
  selectedInvoices?: Mercoa.InvoiceResponse[]
  children?: ({ metrics }: { metrics?: Mercoa.InvoiceMetricsResponse[] }) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  const selectedInvoicesMetrics: Mercoa.InvoiceMetricsResponse[] = useMemo(() => {
    if (!selectedInvoices || selectedInvoices.length < 1) return []
    return [
      {
        totalCount: selectedInvoices.length,
        totalAmount: selectedInvoices.reduce((sum, invoice) => sum + (invoice.amount ?? 0), 0),
        averageAmount:
          selectedInvoices.reduce((sum, invoice) => sum + (invoice.amount ?? 0), 0) / selectedInvoices.length,
        currency: 'USD',
      } as Mercoa.InvoiceMetricsResponse,
    ]
  }, [selectedInvoices])

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
          <StatCard
            size="xs"
            title={`Number of Invoices`}
            value={sumTotalCount(selectedInvoicesMetrics.length > 0 ? selectedInvoicesMetrics : metrics)}
          />
          <StatCard
            size="xs"
            title={`Total Amount`}
            value={formatCurrencyMetrics(
              selectedInvoicesMetrics.length > 0 ? selectedInvoicesMetrics : metrics,
              'totalAmount',
            )}
          />
          <StatCard
            size="xs"
            title={`Average Amount`}
            value={formatCurrencyMetrics(
              selectedInvoicesMetrics.length > 0 ? selectedInvoicesMetrics : metrics,
              'averageAmount',
            )}
          />
        </>
      )}
    </div>
  )
}
