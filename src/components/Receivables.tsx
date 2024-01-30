import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useEffect, useState } from 'react'
import { pdfjs } from 'react-pdf'
import { TableOrderHeader, useMercoaSession } from '.'
import { currencyCodeToSymbol } from '../lib/currency'
import { DebouncedSearch, LoadingSpinner, Skeleton, StatCard, TableNavigation } from './generics'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

dayjs.extend(utc)

function ReceivablesTable({ search, onClick }: { search: string; onClick?: (invoice: Mercoa.InvoiceResponse) => any }) {
  const mercoaSession = useMercoaSession()

  const [invoices, setInvoices] = useState<Array<Mercoa.InvoiceResponse>>()
  const [orderBy, setOrderBy] = useState<Mercoa.InvoiceOrderByField>(Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState<Mercoa.OrderDirection>(Mercoa.OrderDirection.Asc)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [count, setCount] = useState<number>(0)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)

  const [startingAfter, setStartingAfter] = useState<string[]>([])
  const [resultsPerPage, setResultsPerPage] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.invoice
      .find(mercoaSession.entity.id, {
        search,
        orderBy,
        orderDirection,
        limit: resultsPerPage,
        startingAfter: startingAfter[startingAfter.length - 1],
        excludePayables: true,
      })
      .then((resp) => {
        if (resp) {
          setHasMore(resp.hasMore)
          setCount(resp.count)
          setInvoices(resp.data)
          setDataLoaded(true)
        }
      })
  }, [
    mercoaSession.token,
    mercoaSession.entity,
    mercoaSession.refreshId,
    search,
    orderBy,
    orderDirection,
    startingAfter,
    resultsPerPage,
  ])

  if (!dataLoaded) {
    return (
      <div className="mt-7">
        <Skeleton rows={10} />
      </div>
    )
  }

  return (
    <>
      {/* ******** All invoices table ******** */}
      {mercoaSession.entity && !!invoices ? (
        <>
          <div className="min-h-[600px]">
            <table className="min-w-full divide-y divide-gray-300 mt-5">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                    <TableOrderHeader
                      title="Payer"
                      setOrder={(direction) => {
                        setOrderBy(Mercoa.InvoiceOrderByField.PayerName)
                        setOrderDirection(direction)
                      }}
                      isSelected={orderBy === Mercoa.InvoiceOrderByField.PayerName}
                      orderDirection={orderDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell"
                  >
                    <TableOrderHeader
                      title="Invoice Number"
                      setOrder={(direction) => {
                        setOrderBy(Mercoa.InvoiceOrderByField.InvoiceNumber)
                        setOrderDirection(direction)
                      }}
                      isSelected={orderBy === Mercoa.InvoiceOrderByField.InvoiceNumber}
                      orderDirection={orderDirection}
                    />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <TableOrderHeader
                      title="Due Date"
                      setOrder={(direction) => {
                        setOrderBy(Mercoa.InvoiceOrderByField.DueDate)
                        setOrderDirection(direction)
                      }}
                      isSelected={orderBy === Mercoa.InvoiceOrderByField.DueDate}
                      orderDirection={orderDirection}
                    />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <TableOrderHeader
                      title="Amount"
                      setOrder={(direction) => {
                        setOrderBy(Mercoa.InvoiceOrderByField.Amount)
                        setOrderDirection(direction)
                      }}
                      isSelected={orderBy === Mercoa.InvoiceOrderByField.Amount}
                      orderDirection={orderDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 pl-6 hidden lg:table-cell"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (onClick) onClick(invoice)
                    }}
                  >
                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">
                      {invoice.payer?.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 hidden sm:table-cell">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
                      {dayjs(invoice.dueDate).format('MMM DD, YYYY')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">
                      {accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm hidden lg:table-cell">{invoice.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableNavigation
            data={invoices}
            page={page}
            setPage={setPage}
            hasMore={hasMore}
            startingAfter={startingAfter}
            setStartingAfter={setStartingAfter}
            count={count}
            resultsPerPage={resultsPerPage}
            setResultsPerPage={setResultsPerPage}
          />
        </>
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}

export function Receivables({ onSelectInvoice }: { onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => any }) {
  const mercoaSession = useMercoaSession()
  const [search, setSearch] = useState<string>('')

  const [invoiceMetrics, setInvoiceMetrics] = useState<Mercoa.InvoiceMetricsResponse[]>([])

  function sumTotalCount(metrics: Mercoa.InvoiceMetricsResponse[]) {
    return metrics.reduce((acc, e) => {
      acc += e.totalCount
      return acc
    }, 0)
  }

  function formatCurrencyMetrics(metrics: Mercoa.InvoiceMetricsResponse[], key: 'totalAmount' | 'averageAmount') {
    if (!metrics || metrics.length < 1) return accounting.formatMoney(0, currencyCodeToSymbol('USD'))
    if (metrics.length < 2)
      return accounting.formatMoney(metrics[0][key] ?? 0 ?? '', currencyCodeToSymbol(metrics[0].currency))
    return (
      <div>
        {metrics.map((metric) => (
          <p key={metric.currency}>
            <span>{accounting.formatMoney(metric[key] ?? 0 ?? '', currencyCodeToSymbol(metric.currency))}</span>
            <span className="text-gray-500 text-xs"> {metric.currency}</span>
          </p>
        ))}
      </div>
    )
  }

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return

    mercoaSession.client?.entity.invoice
      .metrics(mercoaSession.entity.id, {
        search,
        excludePayables: true,
      })
      .then((metrics) => {
        setInvoiceMetrics(metrics)
      })
  }, [search, mercoaSession.client, mercoaSession.entity, mercoaSession.refreshId])

  return (
    <div className="mt-8">
      <div className="grid items-center grid-cols-3">
        <div className="hidden md:block md:col-span-2" />
        <div className="mt-2 flex w-full rounded-md shadow-sm mr-2 col-span-3 md:col-span-1">
          <DebouncedSearch placeholder="Search Payers" onSettle={setSearch} />
        </div>
      </div>

      <div className="grid grid-cols-3 space-x-3 mt-2">
        <StatCard size="sm" title={`Total  Invoices`} value={sumTotalCount(invoiceMetrics) ?? 0} />
        <StatCard size="sm" title={`Total Amount`} value={formatCurrencyMetrics(invoiceMetrics, 'totalAmount')} />
        <StatCard size="sm" title={`Average Amount`} value={formatCurrencyMetrics(invoiceMetrics, 'averageAmount')} />
      </div>

      <ReceivablesTable search={search} onClick={onSelectInvoice} />
    </div>
  )
}
