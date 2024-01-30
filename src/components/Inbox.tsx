import { Dialog } from '@headlessui/react'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import { pdfjs } from 'react-pdf'
import { toast } from 'react-toastify'
import { TableNavigation, TableOrderHeader, useMercoaSession } from '.'
import { currencyCodeToSymbol } from '../lib/currency'
import { classNames } from '../lib/lib'
import { isWeekday } from '../lib/scheduling'
import { DebouncedSearch, LoadingSpinner, MercoaButton, Skeleton, StatCard } from './index'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

function ApprovalsTable({ search, onClick }: { search: string; onClick?: (invoice: Mercoa.InvoiceResponse) => any }) {
  const mercoaSession = useMercoaSession()
  const status = Mercoa.InvoiceStatus.New

  const [invoices, setInvoices] = useState<Array<Mercoa.InvoiceResponse>>()
  const [orderBy, setOrderBy] = useState<Mercoa.InvoiceOrderByField>(Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState<Mercoa.OrderDirection>(Mercoa.OrderDirection.Asc)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [count, setCount] = useState<number>(0)
  const [showTable, setShowTable] = useState<boolean>(false)

  const [startingAfter, setStartingAfter] = useState<string[]>([])
  const [resultsPerPage, setResultsPerPage] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  const checkbox = useRef<HTMLInputElement>(null)
  const [checked, setChecked] = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<Array<Mercoa.InvoiceResponse>>([])

  useLayoutEffect(() => {
    const isIndeterminate = selectedInvoices.length > 0 && selectedInvoices.length < (invoices ? invoices.length : 0)
    setChecked(selectedInvoices.length === (invoices ? invoices.length : 0))
    setIndeterminate(isIndeterminate)
    if (checkbox.current) {
      checkbox.current.indeterminate = isIndeterminate
    }
  }, [selectedInvoices, invoices])

  function toggleAll() {
    // Calm TS
    if (!invoices) {
      return
    }
    setSelectedInvoices(checked || indeterminate ? [] : invoices)
    setChecked(!checked && !indeterminate)
    setIndeterminate(false)
  }

  async function handleApprove() {
    if (!mercoaSession.token || !mercoaSession.entity?.id || !mercoaSession.user) return

    let anySuccessFlag = false
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.approval.approve(invoice.id, { userId: mercoaSession.user?.id! })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error approving invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Approved')
    }
    mercoaSession.refresh()
  }

  async function handleReject() {
    if (!mercoaSession.token || !mercoaSession.entity?.id || !mercoaSession.user) return

    let anySuccessFlag = false
    await Promise.all(
      selectedInvoices.map((invoice) => {
        try {
          mercoaSession.client?.invoice.approval.reject(invoice.id, { userId: mercoaSession.user?.id! })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error rejecting invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Rejected')
    }
    mercoaSession.refresh()
  }

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id || !mercoaSession.user?.id) return
    mercoaSession.client?.entity.invoice
      .find(mercoaSession.entity.id, {
        status,
        search,
        orderBy,
        orderDirection,
        approverId: mercoaSession.user?.id,
        limit: resultsPerPage,
        startingAfter: startingAfter[startingAfter.length - 1],
        excludeReceivables: true,
      })
      .then((resp) => {
        if (resp) {
          setHasMore(resp.hasMore)
          setCount(resp.count)
          setInvoices(resp.data)
          setShowTable(resp.data.length > 0)
        }
      })
  }, [
    mercoaSession.token,
    mercoaSession.entity,
    mercoaSession.refreshId,
    mercoaSession.user?.id,
    search,
    orderBy,
    orderDirection,
    startingAfter,
    resultsPerPage,
  ])

  if (!mercoaSession.user?.id) {
    return <></>
  }

  if (!invoices) {
    return <Skeleton rows={10} />
  }

  return (
    <>
      {showTable && (
        <>
          {mercoaSession.entity && !!invoices ? (
            <>
              <div className="mt-7 ">
                {/* ******** TITLE ******** */}
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Assigned to Me</h1>
                    <p className="mt-2 text-sm text-gray-700">A list of all invoices that require your review</p>
                  </div>
                </div>
                <div className="flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <div className="relative">
                        {/* ******** BULK ACTIONS ******** */}
                        {selectedInvoices.length > 0 && (
                          <div className="absolute left-14 top-0 flex h-12 items-center space-x-3 bg-white sm:left-12">
                            <button
                              type="button"
                              className="inline-flex items-center rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                              onClick={handleApprove}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                              onClick={handleReject}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {/* ******** TABLE ******** */}
                        <table className="min-w-full table-fixed divide-y divide-gray-300 mt-5">
                          {/* ******** COLUMN HEADERS ******** */}
                          <thead>
                            <tr>
                              <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                                <input
                                  type="checkbox"
                                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-mercoa-primary-text focus:ring-mercoa-primary"
                                  ref={checkbox}
                                  checked={checked}
                                  onChange={toggleAll}
                                />
                              </th>
                              <th
                                scope="col"
                                className="min-w-[12rem] py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                              >
                                <TableOrderHeader
                                  title="Vendor"
                                  setOrder={(direction) => {
                                    setOrderBy(Mercoa.InvoiceOrderByField.VendorName)
                                    setOrderDirection(direction)
                                  }}
                                  isSelected={orderBy === Mercoa.InvoiceOrderByField.VendorName}
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

                          {/* ******** TABLE BODY ******** */}
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {invoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                className={classNames(
                                  'cursor-pointer hover:bg-gray-100',
                                  selectedInvoices.includes(invoice) ? 'bg-gray-50' : undefined,
                                )}
                              >
                                <td className="relative px-7 sm:w-12 sm:px-6">
                                  {selectedInvoices.includes(invoice) && (
                                    <div className="absolute inset-y-0 left-0 w-0.5 bg-mercoa-primary" />
                                  )}
                                  <input
                                    type="checkbox"
                                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-mercoa-primary-text focus:ring-mercoa-primary"
                                    value={invoice.id}
                                    checked={selectedInvoices.includes(invoice)}
                                    onChange={(e) =>
                                      setSelectedInvoices(
                                        e.target.checked
                                          ? [...selectedInvoices, invoice]
                                          : selectedInvoices.filter((inv) => inv !== invoice),
                                      )
                                    }
                                  />
                                </td>
                                <td
                                  className={classNames(
                                    'whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3',
                                    selectedInvoices.includes(invoice) ? 'text-mercoa-primary-text' : 'text-gray-900',
                                  )}
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {invoice.vendor?.name}
                                </td>
                                <td
                                  className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 hidden sm:table-cell"
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {invoice.invoiceNumber}
                                </td>
                                <td
                                  className="whitespace-nowrap px-3 py-3 text-sm text-gray-900"
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {dayjs(invoice.dueDate).format('MMM DD, YYYY')}
                                </td>
                                <td
                                  className="whitespace-nowrap px-3 py-3 text-sm text-gray-900"
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))}
                                </td>
                                <td
                                  className="whitespace-nowrap px-3 py-3 text-sm hidden lg:table-cell"
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  <InvoiceStatusPill invoice={invoice} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header for the table beneath ApprovalsTable, so it only renders when ApprovalsTable is rendered.*/}
              <div className="mt-10 sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h1 className="text-base font-semibold leading-6 text-gray-900">All invoices</h1>
                  <p className="mt-2 text-sm text-gray-700">
                    A list of all invoices that require review from an assigned approver
                  </p>
                </div>
              </div>
            </>
          ) : (
            <LoadingSpinner />
          )}
        </>
      )}
    </>
  )
}

function SchedulePaymentModal({
  show,
  closeModal,
  setDate,
}: {
  show: boolean
  closeModal: () => void
  setDate: Function
}) {
  return (
    <Dialog as="div" open={show} onClose={closeModal} className="relative z-10">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DatePickerPanel closeModal={closeModal} setDate={setDate} />
        </div>
      </div>
    </Dialog>
  )
}

function DatePickerPanel({ closeModal, setDate }: { closeModal: () => void; setDate: Function }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>()

  return (
    <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
      <div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
            When should these payments be scheduled?
          </Dialog.Title>
          <div className="mt-2">
            <DatePicker
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholderText="Select deduction date"
              onChange={(date) => setSelectedDate(date)}
              selected={selectedDate}
              minDate={dayjs().add(1, 'day').toDate()}
              filterDate={isWeekday}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">
        <MercoaButton
          type="button"
          className="inline-flex w-full justify-center "
          isEmphasized
          onClick={() => {
            closeModal()
            console.log(selectedDate)
            setDate(selectedDate)
          }}
          disabled={!selectedDate}
        >
          Schedule Payments
        </MercoaButton>
      </div>
    </Dialog.Panel>
  )
}

function InvoiceInboxTable({
  status,
  search,
  onClick,
}: {
  status: Mercoa.InvoiceStatus[]
  search: string
  onClick?: (invoice: Mercoa.InvoiceResponse) => any
}) {
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
    // Calm TS
    if (!invoices) {
      return
    }
    setSelectedInvoices(checked || indeterminate ? [] : invoices)
    setChecked(!checked && !indeterminate)
    setIndeterminate(false)
  }

  const showModal = () => {
    setShowBatchScheduleModal(true)
  }
  const closeModal = () => {
    setShowBatchScheduleModal(false)
  }

  async function handleSchedulePayment(deductionDate: Date) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return

    function canInvoiceBeScheduled(invoice: Mercoa.InvoiceResponse) {
      if (!invoice.vendor) {
        return false
      }
      const vendor = invoice.vendor

      let canInvoiceBeNew =
        !!invoice.amount &&
        !!invoice.dueDate &&
        !!invoice.currency &&
        !!invoice.vendorId &&
        !!invoice.paymentSourceId &&
        !!vendor.name

      if (!mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
        canInvoiceBeNew =
          canInvoiceBeNew &&
          !!vendor.email &&
          !!(
            vendor.accountType === Mercoa.AccountType.Individual ||
            (vendor.accountType === Mercoa.AccountType.Business &&
              (!!vendor.profile.business?.website || !!vendor.profile.business?.description))
          )
      }

      const canInvoiceBeScheduled =
        canInvoiceBeNew && invoice.status === Mercoa.InvoiceStatus.Approved && !!invoice.paymentDestinationId
      return canInvoiceBeScheduled
    }

    let anySuccessFlag = false
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          if (canInvoiceBeScheduled(invoice)) {
            const invoiceData: Mercoa.InvoiceRequest = {
              status: Mercoa.InvoiceStatus.Scheduled,
              deductionDate: deductionDate,
            }

            await mercoaSession.client?.invoice.update(invoice.id, invoiceData)
            anySuccessFlag = true
          } else {
            console.error('Invoice does not have all the information needed to schedule payment')
            console.log('Invalid invoice:', { invoice })
          }
        } catch (e) {
          console.error('Error updating invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Payment Scheduled')
    } else {
      toast.error('Error scheduling payment')
    }
    mercoaSession.refresh()
  }

  async function downloadAsCSV() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let startingAfter = ''
    let invoices: Mercoa.InvoiceResponse[] = []

    getNextPage()

    async function getNextPage() {
      if (!mercoaSession.token || !mercoaSession.entity?.id) return

      const response = await mercoaSession.client?.entity.invoice.find(mercoaSession.entity.id, {
        status,
        limit: 100,
        startingAfter,
        excludeReceivables: true,
      })

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
          a.setAttribute('hidden', '')
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
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    setSelectedInvoices([])
    setDataLoaded(false)
    mercoaSession.client?.entity.invoice
      .find(mercoaSession.entity.id, {
        status,
        search,
        orderBy,
        orderDirection,
        limit: resultsPerPage,
        startingAfter: startingAfter[startingAfter.length - 1],
        excludeReceivables: true,
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
    status,
    search,
    orderBy,
    orderDirection,
    startingAfter,
    resultsPerPage,
  ])
  useEffect(() => {
    // hack to avoid having to implement debounce for search feature
    setDataLoaded(false)
    setStartingAfter([])
    setPage(1)
    setCount(0)
  }, [status])

  if (!dataLoaded) {
    return (
      <div className="mt-7">
        <Skeleton rows={10} />
      </div>
    )
  }

  return (
    <>
      {mercoaSession.entity && !!invoices ? (
        <>
          <div className="min-h-[600px]">
            <div className="relative">
              {/* ******** BULK ACTIONS ******** */}
              {status.some((status) => status === Mercoa.InvoiceStatus.Approved) && selectedInvoices.length > 0 && (
                <div className="absolute left-14 top-0 flex h-12 items-center space-x-3 bg-white sm:left-12">
                  <button
                    type="button"
                    className="inline-flex items-center rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                    onClick={showModal}
                  >
                    Schedule Payment
                  </button>
                </div>
              )}
              {/* ******** TABLE ******** */}
              <table className="min-w-full table-fixed divide-y divide-gray-300 mt-5">
                {/* ******** COLUMN HEADERS ******** */}
                <thead>
                  <tr>
                    {/* ******** CHECK BOX HEADER ******** */}
                    {status.some((status) => status === Mercoa.InvoiceStatus.Approved) && (
                      <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-mercoa-primary-text focus:ring-mercoa-primary"
                          ref={checkbox}
                          checked={checked}
                          onChange={toggleAll}
                        />
                      </th>
                    )}
                    <th
                      scope="col"
                      className="min-w-[12rem] py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                    >
                      <TableOrderHeader
                        title="Vendor"
                        setOrder={(direction) => {
                          setOrderBy(Mercoa.InvoiceOrderByField.VendorName)
                          setOrderDirection(direction)
                        }}
                        isSelected={orderBy === Mercoa.InvoiceOrderByField.VendorName}
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
                    {status.some(
                      (status) =>
                        status === Mercoa.InvoiceStatus.Scheduled ||
                        status === Mercoa.InvoiceStatus.Pending ||
                        status === Mercoa.InvoiceStatus.Paid,
                    ) && (
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 group inline-flex items-center"
                      >
                        Deduction Date
                      </th>
                    )}
                  </tr>
                </thead>

                {/* ******** TABLE BODY ******** */}
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={classNames(
                        'cursor-pointer hover:bg-gray-100',
                        selectedInvoices.includes(invoice) ? 'bg-gray-50' : undefined,
                      )}
                    >
                      {/* ******** CHECK BOX ******** */}
                      {status.some((status) => status === Mercoa.InvoiceStatus.Approved) && (
                        <td className="relative px-7 sm:w-12 sm:px-6">
                          {selectedInvoices.includes(invoice) && (
                            <div className="absolute inset-y-0 left-0 w-0.5 bg-mercoa-primary" />
                          )}
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-mercoa-primary-text focus:ring-mercoa-primary"
                            value={invoice.id}
                            checked={selectedInvoices.includes(invoice)}
                            onChange={(e) =>
                              setSelectedInvoices(
                                e.target.checked
                                  ? [...selectedInvoices, invoice]
                                  : selectedInvoices.filter((inv) => inv !== invoice),
                              )
                            }
                          />
                        </td>
                      )}
                      <td
                        className={classNames(
                          'whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3',
                          selectedInvoices.includes(invoice) ? 'text-mercoa-primary-text' : 'text-gray-900',
                        )}
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {invoice.vendor?.name}
                      </td>
                      <td
                        className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 hidden sm:table-cell"
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {invoice.invoiceNumber}
                      </td>
                      <td
                        className="whitespace-nowrap px-3 py-3 text-sm text-gray-900"
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {dayjs(invoice.dueDate).format('MMM DD, YYYY')}
                      </td>
                      <td
                        className="whitespace-nowrap px-3 py-3 text-sm text-gray-900"
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))}
                      </td>
                      <td
                        className="whitespace-nowrap px-3 py-3 text-sm hidden lg:table-cell"
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        <InvoiceStatusPill invoice={invoice} />
                      </td>
                      {status.some(
                        (status) =>
                          status === Mercoa.InvoiceStatus.Scheduled ||
                          status === Mercoa.InvoiceStatus.Pending ||
                          status === Mercoa.InvoiceStatus.Paid,
                      ) &&
                        invoice.deductionDate && (
                          <td
                            className="whitespace-nowrap px-3 py-3 text-sm hidden lg:table-cell"
                            onClick={() => {
                              if (onClick) onClick(invoice)
                            }}
                          >
                            {dayjs(invoice.deductionDate).format('MMM DD, YYYY')}
                          </td>
                        )}
                    </tr>
                  ))}
                </tbody>
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
          <SchedulePaymentModal show={showBatchScheduleModal} closeModal={closeModal} setDate={handleSchedulePayment} />
        </>
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}

export function InvoiceStatusPill({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
  let backgroundColor = 'bg-gray-100'
  let textColor = 'text-black'
  let message = ''
  let failureReason = ''
  if (invoice.failureType === Mercoa.InvoiceFailureType.InsufficientFunds) {
    failureReason = ' - Insufficient Funds'
  }

  if (invoice.status === Mercoa.InvoiceStatus.Draft) {
    if (!invoice.vendor || !invoice.amount || !invoice.dueDate) {
      backgroundColor = 'bg-yellow-100'
      textColor = 'text-black'
      message = 'Draft Incomplete'
    } else {
      backgroundColor = 'bg-green-100'
      textColor = 'text-green-800'
      message = 'Draft Ready'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.New) {
    if (!invoice.paymentSourceId || !invoice.vendor || !invoice.amount || !invoice.dueDate) {
      backgroundColor = 'bg-yellow-100'
      textColor = 'text-gray-800'
      message = 'Incomplete'
    } else {
      backgroundColor = 'bg-green-100'
      textColor = 'text-green-800'
      message = 'Ready for Review'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.Approved) {
    if (
      !invoice.paymentSourceId ||
      !invoice.paymentDestinationId ||
      !invoice.vendor ||
      !invoice.amount ||
      !invoice.dueDate
    ) {
      backgroundColor = 'bg-yellow-100'
      textColor = 'text-black'
      message = 'Incomplete'
    } else {
      backgroundColor = 'bg-green-100'
      textColor = 'text-green-800'
      message = 'Ready for Payment'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.Scheduled) {
    if (
      !invoice.paymentSourceId ||
      !invoice.paymentDestinationId ||
      !invoice.vendor ||
      !invoice.amount ||
      !invoice.dueDate
    ) {
      backgroundColor = 'bg-yellow-100'
      textColor = 'text-black'
      message = 'Incomplete'
    } else {
      backgroundColor = 'bg-green-100'
      textColor = 'text-green-800'
      message = 'Payment Scheduled'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.Pending) {
    backgroundColor = 'bg-yellow-100'
    textColor = 'text-black'
    message = 'Payment Processing'
  } else if (invoice.status === Mercoa.InvoiceStatus.Paid) {
    backgroundColor = 'bg-green-100'
    textColor = 'text-green-800'
    message = 'Paid'
  } else if (invoice.status === Mercoa.InvoiceStatus.Canceled) {
    backgroundColor = 'bg-red-100'
    textColor = 'text-red-800'
    message = 'Canceled'
  } else if (invoice.status === Mercoa.InvoiceStatus.Archived) {
    backgroundColor = 'bg-gray-100'
    textColor = 'text-black'
    message = 'Archived'
  } else if (invoice.status === Mercoa.InvoiceStatus.Refused) {
    backgroundColor = 'bg-red-100'
    textColor = 'text-red-800'
    message = 'Refused'
  } else if (invoice.status === Mercoa.InvoiceStatus.Failed) {
    backgroundColor = 'bg-red-100'
    textColor = 'text-red-800'
    message = 'Failed ' + failureReason
  }

  return message ? (
    <p
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium ${backgroundColor} ${textColor} md:ml-2`}
    >
      {message}
    </p>
  ) : (
    <></>
  )
}

export function InvoiceInbox({
  statuses,
  selectedStatus,
  onSelectInvoice,
  onTabChange,
  children,
}: {
  statuses?: Array<Mercoa.InvoiceStatus>
  selectedStatus?: Mercoa.InvoiceStatus
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => any
  onTabChange?: (status: Mercoa.InvoiceStatus) => any
  children?: ({
    metrics,
    statuses,
    selectedStatus,
    setSelectedStatus,
    invoices,
  }: {
    metrics: { [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse[] } | undefined
    statuses: Array<Mercoa.InvoiceStatus>
    selectedStatus: Mercoa.InvoiceStatus
    setSelectedStatus: (status: Mercoa.InvoiceStatus) => void
    invoices: Array<Mercoa.InvoiceResponse>
  }) => ReactNode
}) {
  const mercoaSession = useMercoaSession()

  const [selectedTab, setSelectedTab] = useState<Mercoa.InvoiceStatus>(selectedStatus ?? Mercoa.InvoiceStatus.Draft)
  const [search, setSearch] = useState<string>('')
  const [approvalPolicies, setApprovalPolicies] = useState<Mercoa.ApprovalPolicyResponse[]>()
  const [tabs, setTabs] = useState<Array<Mercoa.InvoiceStatus>>(
    statuses ?? [
      Mercoa.InvoiceStatus.Draft,
      Mercoa.InvoiceStatus.New,
      Mercoa.InvoiceStatus.Approved,
      Mercoa.InvoiceStatus.Scheduled,
      Mercoa.InvoiceStatus.Pending,
      Mercoa.InvoiceStatus.Paid,
      Mercoa.InvoiceStatus.Canceled,
      Mercoa.InvoiceStatus.Failed,
    ],
  )

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.approvalPolicy
      .getAll(mercoaSession.entity.id)
      .then((resp) => setApprovalPolicies(resp))
      .catch(() => setApprovalPolicies(undefined))
  }, [mercoaSession.token, mercoaSession.entity, mercoaSession.refreshId])

  useEffect(() => {
    if (onTabChange) onTabChange(selectedTab)
  }, [selectedTab])

  useEffect(() => {
    if (!Array.isArray(approvalPolicies)) return
    console.log(approvalPolicies)
    if (statuses) {
      setTabs(statuses)
    } else if (!approvalPolicies || approvalPolicies?.length < 1) {
      // Remove the "NEW" tab if there are no approval policies
      setTabs(tabs.filter((tab) => tab !== Mercoa.InvoiceStatus.New))
    }
  }, [statuses, approvalPolicies])

  const tabToName = {
    DRAFT: 'Inbox',
    NEW: 'Ready for Review',
    APPROVED: approvalPolicies?.length ? 'Approved' : 'Ready for Payment',
    SCHEDULED: 'Payment Scheduled',
    PENDING: 'Payment Processing',
    FAILED: 'Payment Failed',
    PAID: 'Paid',
    CANCELED: 'Canceled',
    REFUSED: 'Refused',
    ARCHIVED: 'Archived',
  }

  const [invoiceMetrics, setInvoiceMetrics] = useState<{
    [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse[]
  }>()

  function sumTotalCount(metrics: Mercoa.InvoiceMetricsResponse[]) {
    return metrics?.reduce((acc, e) => {
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

    async function getMetrics() {
      const results = (
        await Promise.all(
          (tabs ?? []).map(async (status) => {
            if (!mercoaSession.token || !mercoaSession.entity?.id) return
            const metrics = await mercoaSession.client?.entity.invoice.metrics(mercoaSession.entity.id, {
              search,
              status,
              excludeReceivables: true,
            })
            return [status as string, metrics]
          }),
        )
      ).filter((e) => e) as Array<Array<string | Mercoa.InvoiceMetricsResponse[]>>

      const metrics = Object.fromEntries(results) as { [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse[] }
      setInvoiceMetrics(metrics)
    }

    getMetrics()
  }, [search, statuses, mercoaSession.client, mercoaSession.entity, mercoaSession.refreshId])

  if (Object.keys(invoiceMetrics ?? {}).length < 1) return <LoadingSpinner />

  return (
    <div className="mt-8">
      <div className="grid items-center grid-cols-3">
        <div className="hidden md:block md:col-span-2" />
        <div className="mt-2 flex w-full rounded-md shadow-sm mr-2 col-span-3 md:col-span-1">
          <DebouncedSearch placeholder="Search Vendors" onSettle={setSearch} />
        </div>
      </div>

      {/* Inbox Selector Tabs */}
      <div className="md:hidden mt-2">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-1 pl-3 pr-10 text-base focus:border-mercoa-primary focus:outline-none focus:ring-mercoa-primary sm:text-sm"
          defaultValue={selectedTab}
          onChange={(e) => {
            setSelectedTab(e.target.value as Mercoa.InvoiceStatus)
          }}
        >
          {tabs.map((status) => (
            <option key={status} value={status}>
              {tabToName[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden md:block sm:border-b sm:border-gray-200">
        <nav className="-mb-px block sm:flex sm:space-x-8 overflow-auto" aria-label="Tabs">
          {tabs.map((status) => (
            <a
              onClick={() => {
                setSelectedTab(status)
              }}
              key={status}
              href="#"
              className={`${
                status == selectedTab
                  ? 'text-mercoa-primary sm:border-mercoa-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } mr-2 whitespace-nowrap py-4 px-1 text-sm font-medium sm:mr-0 sm:border-b-2`}
              aria-current={tabToName[status] == selectedTab ? 'page' : undefined}
            >
              {tabToName[status]}{' '}
              <span
                className={`${
                  status == selectedTab
                    ? 'bg-mercoa-primary text-mercoa-primary-text-invert'
                    : 'bg-gray-100 text-gray-800'
                } inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium`}
              >
                {' '}
                {sumTotalCount(invoiceMetrics?.[status] ?? [])}
              </span>
            </a>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-3 space-x-3 mt-2">
        <StatCard
          size="sm"
          title={`Total ${tabToName[selectedTab]} Invoices`}
          value={sumTotalCount(invoiceMetrics?.[selectedTab] ?? [])}
        />
        <StatCard
          size="sm"
          title={`Total ${tabToName[selectedTab]} Amount`}
          value={formatCurrencyMetrics(invoiceMetrics?.[selectedTab] ?? [], 'totalAmount')}
        />
        <StatCard
          size="sm"
          title={`Average ${tabToName[selectedTab]} Amount`}
          value={formatCurrencyMetrics(invoiceMetrics?.[selectedTab] ?? [], 'averageAmount')}
        />
      </div>
      {selectedTab === Mercoa.InvoiceStatus.New && <ApprovalsTable search={search} onClick={onSelectInvoice} />}
      <InvoiceInboxTable status={[selectedTab]} search={search} onClick={onSelectInvoice} />
    </div>
  )
}
