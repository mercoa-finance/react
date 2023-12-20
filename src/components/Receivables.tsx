import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Fragment, useEffect, useState } from 'react'
import { pdfjs } from 'react-pdf'
import { TableOrderHeader, useMercoaSession } from '.'
import { currencyCodeToSymbol } from '../lib/currency'
import { DebouncedSearch, LoadingSpinner, Skeleton, StatCard } from './generics'

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
  const [resultsPerPage, setResultsPerPageLocal] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  function setResultsPerPage(value: number) {
    setResultsPerPageLocal(value)
    setPage(1)
    setStartingAfter([])
  }

  function nextPage() {
    if (!invoices) return
    setPage(page + 1)
    setStartingAfter([...startingAfter, invoices[invoices.length - 1].id])
  }

  function prevPage() {
    setPage(Math.max(1, page - 1))
    setStartingAfter(startingAfter.slice(0, startingAfter.length - 1))
  }

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
          {/* ******** Pagination controls ********  */}
          <nav
            className="flex items-center justify-between border-t border-gray-200 bg-white px-2 py-3 sm:px-3"
            aria-label="Pagination"
          >
            <div>
              <Listbox value={resultsPerPage} onChange={setResultsPerPage}>
                {({ open }) => (
                  <div className="flex items-center mb-2">
                    <Listbox.Label className="block text-xs text-gray-900">Results per Page</Listbox.Label>
                    <div className="relative mx-2">
                      <Listbox.Button className="relative w-24 cursor-default rounded-md bg-white py-1 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-mercoa-primary sm:text-sm sm:leading-6">
                        <span className="block truncate">{resultsPerPage}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </Listbox.Button>

                      <Transition
                        show={open}
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {[10, 20, 50, 100].map((num) => (
                            <Listbox.Option
                              key={num}
                              className={({ active }) =>
                                `${
                                  active ? 'bg-mercoa-primary text-white' : 'text-gray-900'
                                } relative cursor-default select-none py-2 pl-3 pr-9`
                              }
                              value={num}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span className={`${selected ? 'font-semibold' : 'font-normal'} block truncate`}>
                                    {num}
                                  </span>

                                  {selected ? (
                                    <span
                                      className={`${
                                        active ? 'text-white' : 'text-mercoa-primary-text'
                                      } absolute inset-y-0 right-0 flex items-center pr-4`}
                                    >
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </div>
                )}
              </Listbox>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * resultsPerPage, count)}</span> of{' '}
                  <span className="font-medium">{count}</span> results
                </p>
              </div>
            </div>
            <div className="flex flex-1 justify-between sm:justify-end">
              <button
                disabled={page === 1}
                type="button"
                onClick={prevPage}
                className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={!hasMore}
                type="button"
                onClick={nextPage}
                className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </nav>
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
