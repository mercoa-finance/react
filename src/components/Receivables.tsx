import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Papa from 'papaparse'
import { ReactElement, useEffect, useState } from 'react'
import { currencyCodeToSymbol } from '../lib/currency'
import {
  DebouncedSearch,
  InvoiceMetrics,
  InvoiceTableColumn,
  LoadingSpinner,
  Skeleton,
  StatusDropdown,
  StatusTabs,
  TableNavigation,
  TableOrderHeader,
  useMercoaSession,
} from './index'

dayjs.extend(utc)

function ReceivablesTable({
  statuses,
  search,
  metadata,
  startDate,
  endDate,
  onSelectInvoice,
  columns,
  children,
}: {
  statuses: Mercoa.InvoiceStatus[]
  search?: string
  metadata?: Mercoa.InvoiceMetadataFilter[]
  startDate?: Date
  endDate?: Date
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => any
  columns?: InvoiceTableColumn[]
  children?: ({
    dataLoaded,
    invoices,
    hasNext,
    getNext,
    hasPrevious,
    getPrevious,
    resultsPerPage,
    setResultsPerPage,
    selectedInvoiceStatuses,
    setSelectedInvoiceStatues,
    downloadCSV,
  }: {
    dataLoaded: boolean
    invoices: Mercoa.InvoiceResponse[]
    hasNext: boolean
    getNext: () => void
    hasPrevious: boolean
    getPrevious: () => void
    resultsPerPage: number
    setResultsPerPage: (value: number) => void
    selectedInvoiceStatuses: Mercoa.InvoiceStatus[]
    setSelectedInvoiceStatues: (statuses: Mercoa.InvoiceStatus[]) => void
    downloadCSV: () => void
  }) => ReactElement | null
}) {
  const mercoaSession = useMercoaSession()

  const [invoices, setInvoices] = useState<Array<Mercoa.InvoiceResponse>>()
  const [orderBy, setOrderBy] = useState<Mercoa.InvoiceOrderByField>(Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState<Mercoa.OrderDirection>(Mercoa.OrderDirection.Asc)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [count, setCount] = useState<number>(0)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)
  const [currentStatuses, setCurrentStatuses] = useState<Mercoa.InvoiceStatus[]>(statuses)
  const [selectedInvoices, setSelectedInvoices] = useState<Array<Mercoa.InvoiceResponse>>([])

  const [startingAfter, setStartingAfter] = useState<string[]>([])
  const [resultsPerPage, setResultsPerPage] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  async function downloadAsCSV() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let startingAfter = ''
    let invoices: Mercoa.InvoiceResponse[] = []

    getNextPage()

    async function getNextPage() {
      if (!mercoaSession.token || !mercoaSession.entity?.id) return

      const filter = {
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        limit: 100,
        startingAfter,
        excludePayables: true,
        metadata: metadata as any,
      }

      const response = await mercoaSession.client?.entity.invoice.find(mercoaSession.entity.id, filter)

      if (response) {
        if (response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id
          invoices = [...invoices, ...response.data]
          await getNextPage()
        } else {
          const csv = Papa.unparse(
            invoices.map((invoice) => {
              return {
                'Invoice ID': invoice.id,
                'Invoice Number': invoice.invoiceNumber,
                Status: invoice.status,
                Amount: invoice.amount,
                Currency: invoice.currency,
                Note: invoice.noteToSelf,

                'Payer ID': invoice.payer?.id,
                'Payer Email': invoice.payer?.email,
                'Payer Name': invoice.payer?.name,
                'Vendor ID': invoice.vendor?.id,
                'Vendor Email': invoice.vendor?.email,
                'Vendor Name': invoice.vendor?.name,

                Metadata: JSON.stringify(invoice.metadata),

                'Due Date': dayjs(invoice.dueDate),
                'Deduction Date': dayjs(invoice.deductionDate),
                'Processed At': dayjs(invoice.processedAt),
                'Created At': dayjs(invoice.createdAt),
                'Updated At': dayjs(invoice.updatedAt),
              }
            }),
          )
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.setAttribute('mercoa-hidden', '')
          a.setAttribute('href', url)
          a.setAttribute('download', `mercoa-invoice-export-${dayjs().format('YYYY-MM-DD')}.csv`)
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      }
    }
  }

  useEffect(() => {
    setCurrentStatuses(statuses)
  }, [statuses])

  // Load invoices
  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let isCurrent = true
    setSelectedInvoices([])
    setDataLoaded(false)

    const filter = {
      status: currentStatuses,
      search,
      startDate,
      endDate,
      orderBy,
      orderDirection,
      limit: resultsPerPage,
      startingAfter: startingAfter[startingAfter.length - 1],
      excludePayables: true,
      metadata: metadata as any,
    }

    mercoaSession.client?.entity.invoice.find(mercoaSession.entity.id, filter).then((resp) => {
      if (resp && isCurrent) {
        setHasMore(resp.hasMore)
        setCount(resp.count)
        setInvoices(resp.data)
        setDataLoaded(true)
      }
    })
    return () => {
      isCurrent = false
    }
  }, [
    mercoaSession.token,
    mercoaSession.entity,
    mercoaSession.refreshId,
    currentStatuses,
    search,
    startDate,
    endDate,
    metadata,
    orderBy,
    orderDirection,
    startingAfter,
    resultsPerPage,
  ])

  // Reset pagination on search
  useEffect(() => {
    setPage(1)
    setStartingAfter([])
  }, [search])

  // Refresh when selected statuses changes
  useEffect(() => {
    if (statuses.some((status) => currentStatuses.indexOf(status) < 0)) {
      setCurrentStatuses(statuses)
      setDataLoaded(false)
      setStartingAfter([])
      setPage(1)
      setCount(0)
    }
  }, [statuses, startDate, endDate])

  if (children) {
    return children({
      dataLoaded,
      invoices: invoices || [],
      hasNext: hasMore,
      getNext: () => {
        if (!invoices) return
        setPage(page + 1)
        setStartingAfter([...startingAfter, invoices[invoices.length - 1].id])
      },
      hasPrevious: page !== 1,
      getPrevious: () => {
        setPage(Math.max(1, page - 1))
        setStartingAfter(startingAfter.slice(0, startingAfter.length - 1))
      },
      resultsPerPage,
      setResultsPerPage,
      selectedInvoiceStatuses: currentStatuses,
      setSelectedInvoiceStatues: setCurrentStatuses,
      downloadCSV: downloadAsCSV,
    })
  }

  if (!dataLoaded) {
    return (
      <div className="mercoa-mt-7">
        <Skeleton rows={10} />
      </div>
    )
  }

  return (
    <>
      {/* ******** All invoices table ******** */}
      {mercoaSession.entity && !!invoices ? (
        <>
          <div className="mercoa-min-h-[600px]">
            <table className="mercoa-min-w-full mercoa-divide-y mercoa-divide-gray-300 mercoa-mt-5">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-3"
                  >
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
                    className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-hidden sm:mercoa-table-cell"
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
                  <th
                    scope="col"
                    className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
                  >
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
                  <th
                    scope="col"
                    className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
                  >
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
                    className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-pl-6 mercoa-hidden lg:mercoa-table-cell"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="mercoa-divide-y mercoa-divide-gray-200 mercoa-bg-white">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="mercoa-cursor-pointer  hover:mercoa-bg-gray-100"
                    onClick={() => {
                      if (onSelectInvoice) onSelectInvoice(invoice)
                    }}
                  >
                    <td className="mercoa-whitespace-nowrap mercoa-py-3 mercoa-pl-4 mercoa-pr-3 mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 sm:mercoa-pl-3">
                      {invoice.payer?.name}
                    </td>
                    <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900 mercoa-hidden sm:mercoa-table-cell">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900">
                      {dayjs(invoice.dueDate).format('MMM DD, YYYY')}
                    </td>
                    <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900">
                      {accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))}
                    </td>
                    <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-hidden lg:mercoa-table-cell">
                      {invoice.status}
                    </td>
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

export function Receivables({
  statuses,
  onSelectInvoice,
  statusSelectionStyle,
}: {
  statuses?: Array<Mercoa.InvoiceStatus>
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => any
  statusSelectionStyle?: 'tabs' | 'dropdown'
}) {
  const [selectedStatuses, setSelectedStatuses] = useState<Mercoa.InvoiceStatus[]>([Mercoa.InvoiceStatus.Draft])
  const [search, setSearch] = useState<string>('')

  const defaultStatuses = statuses ?? [
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Pending,
    Mercoa.InvoiceStatus.Paid,
  ]

  return (
    <div className="mercoa-mt-8">
      <div className="mercoa-grid mercoa-items-center mercoa-grid-cols-3">
        <div className="mercoa-hidden md:mercoa-block md:mercoa-col-span-2">
          {statusSelectionStyle == 'dropdown' && (
            <div className="mercoa-grid mercoa-grid-cols-2">
              <StatusDropdown availableStatuses={defaultStatuses} onStatusChange={setSelectedStatuses} multiple />
            </div>
          )}
        </div>
        <div className="mercoa-flex mercoa-w-full mercoa-rounded-md mercoa-shadow-sm mercoa-mr-2 mercoa-col-span-3 md:mercoa-col-span-1">
          <DebouncedSearch placeholder="Search Customers, Invoice #, Amount" onSettle={setSearch} />
        </div>
      </div>
      {statusSelectionStyle != 'dropdown' && (
        <StatusTabs statuses={defaultStatuses} search={search} onStatusChange={setSelectedStatuses} excludePayables />
      )}
      <InvoiceMetrics statuses={selectedStatuses} search={search} excludePayables />
      <ReceivablesTable statuses={selectedStatuses} search={search} onSelectInvoice={onSelectInvoice} />
    </div>
  )
}
