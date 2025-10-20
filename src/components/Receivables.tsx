import accounting from 'accounting'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../lib/currency'
import { classNames } from '../lib/lib'
import {
  AssignEntityModal,
  DebouncedSearch,
  InvoiceMetrics,
  InvoiceTableColumn,
  LoadingSpinner,
  NoSession,
  Skeleton,
  StatusDropdown,
  StatusTabs,
  TableNavigation,
  TableOrderHeader,
  useMercoaSession,
} from './index'

dayjs.extend(utc)

export function ReceivablesTableV1({
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
  metadata?: Mercoa.MetadataFilter[]
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
    count,
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
    count: number
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

    try {
      const response = await mercoaSession.client?.entity.invoice.download(mercoaSession.entity.id, {
        format: 'CSV',
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        excludePayables: true,
        metadata: metadata as any,
      })

      if (response) {
        // Handle local file URLs (non-production)
        if (response.url.startsWith('file://')) {
          toast.info(`File saved locally: ${response.url.replace('file://', '')}`)
          return
        }

        // Download the file from the signed URL
        const a = document.createElement('a')
        a.setAttribute('mercoa-hidden', '')
        a.setAttribute('href', response.url)
        a.setAttribute(
          'download',
          `mercoa-receivables-export-${startDate ? dayjs(startDate).format('YYYY-MM-DD') : 'all'}-to-${
            endDate ? dayjs(endDate).format('YYYY-MM-DD') : 'all'
          }.csv`,
        )
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading invoices:', error)
      toast.error('Failed to download invoices. Please try again.')
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
      count,
    })
  }

  if (!mercoaSession.client) return <NoSession componentName="ReceivablesTable" />

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

export function GroupReceivablesTableV1({
  search,
  metadata,
  startDate,
  endDate,
  onSelectInvoice,
  columns,
}: {
  search?: string
  metadata?: Mercoa.MetadataFilter[]
  startDate?: Date
  endDate?: Date
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => any
  columns?: InvoiceTableColumn[]
}) {
  const mercoaSession = useMercoaSession()

  const [invoices, setInvoices] = useState<Array<Mercoa.InvoiceResponse>>()
  const [orderBy, setOrderBy] = useState<Mercoa.InvoiceOrderByField>(Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState<Mercoa.OrderDirection>(Mercoa.OrderDirection.Asc)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [count, setCount] = useState<number>(0)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)
  const [currentStatuses, setCurrentStatuses] = useState<Mercoa.InvoiceStatus[]>(['UNASSIGNED'])

  const [startingAfter, setStartingAfter] = useState<string[]>([])
  const [resultsPerPage, setResultsPerPage] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  const checkbox = useRef<HTMLInputElement>(null)
  const [checked, setChecked] = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<Array<Mercoa.InvoiceResponse>>([])

  const [showBatchScheduleModal, setShowBatchScheduleModal] = useState(false)

  useLayoutEffect(() => {
    const isIndeterminate = selectedInvoices.length > 0 && selectedInvoices.length < (invoices ? invoices.length : 0)
    setChecked(selectedInvoices.length === (invoices ? invoices.length : 0))
    setIndeterminate(isIndeterminate)
    if (checkbox.current) {
      checkbox.current.indeterminate = isIndeterminate
    }
  }, [selectedInvoices, invoices])

  function toggleAll() {
    setSelectedInvoices(checked || indeterminate ? [] : (invoices ?? []))
    setChecked(!checked && !indeterminate)
    setIndeterminate(false)
  }

  async function handleDelete() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.delete(invoice.id)
          anySuccessFlag = true
        } catch (e) {
          console.error('Error deleting invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Invoices Deleted')
    } else {
      toast.error('Error deleting invoices')
    }
    mercoaSession.refresh()
  }

  async function handleAssignEntity(entityId: string) {
    if (!mercoaSession.token || !mercoaSession.entityGroup?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.update(invoice.id, {
            creatorEntityId: entityId,
            vendorId: entityId,
            status: Mercoa.InvoiceStatus.Draft,
          })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error assigning invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Invoices Assigned')
    }
    mercoaSession.refresh()
    setSelectedInvoices([])
    setDataLoaded(true)
  }

  async function downloadAsCSV() {
    if (!mercoaSession.token || !mercoaSession.entityGroup?.id) return

    try {
      const response = await mercoaSession.client?.entityGroup.invoice.download(mercoaSession.entityGroup.id, {
        format: 'CSV',
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        excludePayables: true,
        metadata: metadata as any,
      })

      if (response) {
        // Handle local file URLs (non-production)
        if (response.url.startsWith('file://')) {
          toast.info(`File saved locally: ${response.url.replace('file://', '')}`)
          return
        }

        // Download the file from the signed URL
        const a = document.createElement('a')
        a.setAttribute('mercoa-hidden', '')
        a.setAttribute('href', response.url)
        a.setAttribute(
          'download',
          `mercoa-receivables-export-${startDate ? dayjs(startDate).format('YYYY-MM-DD') : 'all'}-to-${
            endDate ? dayjs(endDate).format('YYYY-MM-DD') : 'all'
          }.csv`,
        )
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading invoices:', error)
      toast.error('Failed to download invoices. Please try again.')
    }
  }

  // Load invoices
  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entityGroup?.id) return
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

    mercoaSession.client?.entityGroup.invoice.find(mercoaSession.entityGroup.id, filter).then((resp) => {
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
    mercoaSession.entityGroup,
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
    setDataLoaded(false)
    setStartingAfter([])
    setPage(1)
    setCount(0)
  }, [startDate, endDate])

  if (!dataLoaded || !mercoaSession.entityGroup || !invoices) {
    return (
      <div className="mercoa-min-h-[710px] mercoa-min-w-[710px]">
        <Skeleton rows={20} />
      </div>
    )
  }

  const defaultColumns: InvoiceTableColumn[] = [
    {
      title: 'Vendor',
      field: 'vendor',
      orderBy: Mercoa.InvoiceOrderByField.VendorName,
    },
    {
      title: 'Invoice Number',
      field: 'invoiceNumber',
      orderBy: Mercoa.InvoiceOrderByField.InvoiceNumber,
    },
    {
      title: 'Due Date',
      field: 'dueDate',
      orderBy: Mercoa.InvoiceOrderByField.DueDate,
    },
    {
      title: 'Amount',
      field: 'amount',
      orderBy: Mercoa.InvoiceOrderByField.Amount,
    },
  ]

  function columnHasData(column: InvoiceTableColumn) {
    if (!invoices) return false
    return invoices.some((invoice) => {
      if (column.field.startsWith('metadata.')) return true
      if (invoice[`${column.field}` as keyof Mercoa.InvoiceResponse] && column.format) {
        return column.format(invoice[`${column.field}` as keyof Mercoa.InvoiceResponse] as any, invoice)
      }
      return invoice[`${column.field}` as keyof Mercoa.InvoiceResponse]
    })
  }

  const headers = (
    <thead>
      <tr>
        {/* ******** CHECK BOX HEADER ******** */}
        <th scope="col" className="mercoa-relative mercoa-px-7 sm:mercoa-w-12 sm:mercoa-px-6">
          {invoices.length > 0 && (
            <input
              type="checkbox"
              className="mercoa-absolute mercoa-left-4 mercoa-top-1/2 -mercoa-mt-2 mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
              ref={checkbox}
              checked={checked}
              onChange={toggleAll}
            />
          )}
        </th>
        {(columns ?? defaultColumns).map((column, index) => {
          if (!columnHasData(column) && invoices.length > 0) return null
          return (
            <th
              key={index}
              scope="col"
              className={`mercoa-min-w-[12rem] mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-3 ${
                selectedInvoices.length > 0 ? 'mercoa-invisible' : ''
              }`}
            >
              {column.orderBy ? (
                <TableOrderHeader
                  title={column.title}
                  setOrder={(direction) => {
                    if (column.orderBy) {
                      setOrderBy(column.orderBy)
                      setOrderDirection(direction)
                    }
                  }}
                  isSelected={orderBy === column.orderBy}
                  orderDirection={orderDirection}
                />
              ) : (
                column.title
              )}
            </th>
          )
        })}
      </tr>
    </thead>
  )

  const body = (
    <tbody className="mercoa-divide-y mercoa-divide-gray-200 mercoa-bg-white">
      {invoices.map((invoice) => (
        <tr
          key={invoice.id}
          className={classNames(
            'mercoa-cursor-pointer hover:mercoa-bg-gray-100',
            selectedInvoices.includes(invoice) ? 'mercoa-bg-gray-50' : undefined,
          )}
        >
          {/* ******** CHECK BOX ******** */}

          <td className="mercoa-relative mercoa-px-7 sm:mercoa-w-12 sm:mercoa-px-6">
            {selectedInvoices.includes(invoice) && (
              <div className="mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-w-0.5 mercoa-bg-mercoa-primary" />
            )}
            <input
              type="checkbox"
              className="mercoa-absolute mercoa-left-4 mercoa-top-1/2 -mercoa-mt-2 mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
              value={invoice.id}
              checked={selectedInvoices.includes(invoice)}
              onChange={(e) =>
                setSelectedInvoices(
                  e.target.checked ? [...selectedInvoices, invoice] : selectedInvoices.filter((inv) => inv !== invoice),
                )
              }
            />
          </td>
          {(columns ?? defaultColumns).map((column, index) => {
            if (!columnHasData(column)) return null

            let toDisplay: any
            if (column.field.startsWith('metadata.')) {
              toDisplay = JSON.stringify(invoice.metadata[column.field.split('.')[1]])
            } else {
              toDisplay = invoice[column.field as keyof Mercoa.InvoiceResponse]
            }
            if (column.format) {
              toDisplay = column.format(toDisplay, invoice)
            } else {
              if (column.field === 'amount') {
                toDisplay = accounting.formatMoney(toDisplay ?? '', currencyCodeToSymbol(invoice.currency))
              } else if (toDisplay instanceof Date) {
                toDisplay = dayjs(toDisplay).format('MMM DD, YYYY')
              } else if (typeof toDisplay === 'object') {
                if (toDisplay.name) {
                  toDisplay = toDisplay.name
                } else {
                  toDisplay = JSON.stringify(toDisplay)
                }
              } else {
                toDisplay = toDisplay?.toString() ?? ''
              }
            }
            return (
              <td
                key={index}
                className={`mercoa-whitespace-nowrap mercoa-py-3 mercoa-pl-4 mercoa-pr-3 mercoa-text-sm mercoa-text-gray-900 sm:mercoa-pl-3 ${
                  selectedInvoices.includes(invoice) ? 'mercoa-text-mercoa-primary-text' : 'mercoa-text-gray-900'
                } ${index === 0 ? 'mercoa-font-medium' : ''}`}
                onClick={() => {
                  if (onSelectInvoice) onSelectInvoice(invoice)
                }}
              >
                {toDisplay}
              </td>
            )
          })}
        </tr>
      ))}
    </tbody>
  )

  if (!mercoaSession.client) return <NoSession componentName="GroupPayablesTable" />
  return (
    <div>
      <div className="mercoa-min-h-[600px]">
        <div
          className="mercoa-relative mercoa-grid"
          style={{
            gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
            overflow: 'auto',
            whiteSpace: 'normal',
          }}
        >
          {/* ******** BULK ACTIONS ******** */}
          <div className="mercoa-absolute mercoa-left-14 mercoa-top-6 mercoa-flex mercoa-h-12 mercoa-items-center mercoa-space-x-3 mercoa-bg-white sm:mercoa-left-12">
            {selectedInvoices.length > 0 && (
              <>
                <button
                  type="button"
                  className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                  onClick={() => {
                    setShowBatchScheduleModal(true)
                  }}
                >
                  Assign to Payer
                </button>
                <button
                  type="button"
                  className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete these invoices? This action cannot be undone.')) {
                      handleDelete()
                    }
                  }}
                >
                  Delete
                </button>
                <AssignEntityModal
                  open={showBatchScheduleModal}
                  onClose={() => setShowBatchScheduleModal(false)}
                  setEntity={handleAssignEntity}
                />
              </>
            )}
          </div>

          {/* ******** TABLE ******** */}
          <table className="mercoa-min-w-full mercoa-divide-y mercoa-divide-gray-300 mercoa-mt-5">
            {headers}
            {body}
          </table>
        </div>
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
        downloadAll={downloadAsCSV}
      />
    </div>
  )
}

export function ReceivablesV1({
  statuses,
  onSelectInvoice,
  statusSelectionStyle,
}: {
  statuses?: Array<Mercoa.InvoiceStatus>
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => any
  statusSelectionStyle?: 'tabs' | 'dropdown'
}) {
  const mercoaSession = useMercoaSession()
  const [selectedStatuses, setSelectedStatuses] = useState<Mercoa.InvoiceStatus[]>([Mercoa.InvoiceStatus.Draft])
  const [search, setSearch] = useState<string>('')

  const defaultStatuses = statuses ?? [
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
    Mercoa.InvoiceStatus.Pending,
    Mercoa.InvoiceStatus.Paid,
  ]

  return (
    <div className="mercoa-mt-8">
      {mercoaSession.entityGroup && !mercoaSession.entity ? (
        <GroupReceivablesTableV1 search={search} onSelectInvoice={onSelectInvoice} />
      ) : (
        <>
          <div className="mercoa-grid mercoa-items-center mercoa-grid-cols-3">
            <div className="mercoa-hidden md:mercoa-block md:mercoa-col-span-2">
              {statusSelectionStyle == 'dropdown' && (
                <div className="mercoa-grid mercoa-grid-cols-2">
                  <StatusDropdown availableStatuses={defaultStatuses} onStatusChange={setSelectedStatuses} multiple />
                </div>
              )}
            </div>
            <div className="mercoa-flex mercoa-w-full mercoa-rounded-mercoa mercoa-shadow-sm mercoa-mr-2 mercoa-col-span-3 md:mercoa-col-span-1">
              <DebouncedSearch placeholder="Search Customers, Invoice #, Amount" onSettle={setSearch} />
            </div>
          </div>
          {statusSelectionStyle != 'dropdown' && (
            <StatusTabs
              statuses={defaultStatuses}
              search={search}
              onStatusChange={setSelectedStatuses}
              excludePayables
            />
          )}
          <InvoiceMetrics statuses={selectedStatuses} search={search} excludePayables />
          <ReceivablesTableV1 statuses={selectedStatuses} search={search} onSelectInvoice={onSelectInvoice} />
        </>
      )}
    </div>
  )
}
