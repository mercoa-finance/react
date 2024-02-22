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
    let isCurrent = true
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
        if (resp && isCurrent) {
          const invoicesThatRequireReview = resp.data.filter((invoice) => {
            return invoice.approvers?.some(
              (approver) =>
                approver.assignedUserId === mercoaSession.user?.id && approver.action === Mercoa.ApproverAction.None,
            )
          })
          setHasMore(resp.hasMore)
          setCount(resp.count)
          setInvoices(invoicesThatRequireReview)
          setShowTable(invoicesThatRequireReview.length > 0)
        }
      })
    return () => {
      isCurrent = false
    }
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
              <div className="mercoa-mt-7 ">
                {/* ******** TITLE ******** */}
                <div className="sm:mercoa-flex sm:mercoa-items-center">
                  <div className="sm:mercoa-flex-auto">
                    <h1 className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900">
                      Assigned to Me
                    </h1>
                    <p className="mercoa-mt-2 mercoa-text-sm mercoa-text-gray-700">
                      A list of all invoices that require your review
                    </p>
                  </div>
                </div>
                <div className="mercoa-flow-root">
                  <div className="-mercoa-mx-4 -mercoa-my-2 mercoa-overflow-x-auto sm:-mercoa-mx-6 lg:-mercoa-mx-8">
                    <div className="mercoa-inline-block mercoa-min-w-full mercoa-py-2 mercoa-align-middle sm:mercoa-px-6 lg:mercoa-px-8">
                      <div className="mercoa-relative">
                        {/* ******** BULK ACTIONS ******** */}
                        {selectedInvoices.length > 0 && (
                          <div className="mercoa-absolute mercoa-left-14 mercoa-top-0 mercoa-flex mercoa-h-12 mercoa-items-center mercoa-space-x-3 mercoa-bg-white sm:mercoa-left-12">
                            <button
                              type="button"
                              className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                              onClick={handleApprove}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                              onClick={handleReject}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {/* ******** TABLE ******** */}
                        <table className="mercoa-min-w-full table-mercoa-fixed mercoa-divide-y mercoa-divide-gray-300 mercoa-mt-5">
                          {/* ******** COLUMN HEADERS ******** */}
                          <thead>
                            <tr>
                              <th scope="col" className="mercoa-relative mercoa-px-7 sm:mercoa-w-12 sm:mercoa-px-6">
                                <input
                                  type="checkbox"
                                  className="mercoa-absolute mercoa-left-4 mercoa-top-1/2 -mercoa-mt-2 mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
                                  ref={checkbox}
                                  checked={checked}
                                  onChange={toggleAll}
                                />
                              </th>
                              <th
                                scope="col"
                                className="mercoa-min-w-[12rem] mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-3"
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

                          {/* ******** TABLE BODY ******** */}
                          <tbody className="mercoa-divide-y mercoa-divide-gray-200 mercoa-bg-white">
                            {invoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                className={classNames(
                                  'mercoa-cursor-pointer  hover:mercoa-bg-gray-100',
                                  selectedInvoices.includes(invoice) ? 'mercoa-bg-gray-50' : undefined,
                                )}
                              >
                                <td className="mercoa-relative mercoa-px-7 sm:mercoa-w-12 sm:mercoa-px-6">
                                  {selectedInvoices.includes(invoice) && (
                                    <div className="mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-w-0.5 mercoa-bg-mercoa-primary" />
                                  )}
                                  <input
                                    type="checkbox"
                                    className="mercoa-absolute mercoa-left-4 mercoa-top-1/2 -mercoa-mt-2 mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
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
                                    'mercoa-whitespace-nowrap mercoa-py-3 mercoa-pl-4 mercoa-pr-3 mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 sm:mercoa-pl-3',
                                    selectedInvoices.includes(invoice)
                                      ? 'mercoa-text-mercoa-primary-text'
                                      : 'mercoa-text-gray-900',
                                  )}
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {invoice.vendor?.name}
                                </td>
                                <td
                                  className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900 mercoa-hidden sm:mercoa-table-cell"
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {invoice.invoiceNumber}
                                </td>
                                <td
                                  className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900"
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {dayjs(invoice.dueDate).format('MMM DD, YYYY')}
                                </td>
                                <td
                                  className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900"
                                  onClick={() => {
                                    if (onClick) onClick(invoice)
                                  }}
                                >
                                  {accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))}
                                </td>
                                <td
                                  className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-hidden lg:mercoa-table-cell"
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
              <div className="mercoa-mt-10 sm:mercoa-flex sm:mercoa-items-center">
                <div className="sm:mercoa-flex-auto">
                  <h1 className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900">
                    All invoices
                  </h1>
                  <p className="mercoa-mt-2 mercoa-text-sm mercoa-text-gray-700">
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
    <Dialog as="div" open={show} onClose={closeModal} className="mercoa-relative mercoa-z-10">
      {/* Backdrop */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-black/30" aria-hidden="true" />
      {/* Full-screen  mercoa-container to center the panel */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-overflow-y-auto">
        <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
          <DatePickerPanel closeModal={closeModal} setDate={setDate} />
        </div>
      </div>
    </Dialog>
  )
}

function DatePickerPanel({ closeModal, setDate }: { closeModal: () => void; setDate: Function }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>()

  return (
    <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-px-4 mercoa-pb-4 mercoa-pt-5 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-sm sm:mercoa-p-6">
      <div>
        <div className="mercoa-mt-3 mercoa-text-center sm:mercoa-mt-5">
          <Dialog.Title as="h3" className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900">
            When should these payments be scheduled?
          </Dialog.Title>
          <div className="mercoa-mt-2">
            <DatePicker
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              placeholderText="Select deduction date"
              onChange={(date) => setSelectedDate(date)}
              selected={selectedDate}
              minDate={dayjs().add(1, 'day').toDate()}
              filterDate={isWeekday}
            />
          </div>
        </div>
      </div>
      <div className="mercoa-mt-5 sm:mercoa-mt-6">
        <MercoaButton
          type="button"
          className="mercoa-inline-flex mercoa-w-full mercoa-justify-center "
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
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let isCurrent = true
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
      <div className="mercoa-mt-7">
        <Skeleton rows={10} />
      </div>
    )
  }

  return (
    <>
      {mercoaSession.entity && !!invoices ? (
        <>
          <div className="mercoa-min-h-[600px]">
            <div className="mercoa-relative">
              {/* ******** BULK ACTIONS ******** */}
              {status.some((status) => status === Mercoa.InvoiceStatus.Approved) && selectedInvoices.length > 0 && (
                <div className="mercoa-absolute mercoa-left-14 mercoa-top-0 mercoa-flex mercoa-h-12 mercoa-items-center mercoa-space-x-3 mercoa-bg-white sm:mercoa-left-12">
                  <button
                    type="button"
                    className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                    onClick={showModal}
                  >
                    Schedule Payment
                  </button>
                </div>
              )}
              {/* ******** TABLE ******** */}
              <table className="mercoa-min-w-full table-mercoa-fixed mercoa-divide-y mercoa-divide-gray-300 mercoa-mt-5">
                {/* ******** COLUMN HEADERS ******** */}
                <thead>
                  <tr>
                    {/* ******** CHECK BOX HEADER ******** */}
                    {status.some((status) => status === Mercoa.InvoiceStatus.Approved) && (
                      <th scope="col" className="mercoa-relative mercoa-px-7 sm:mercoa-w-12 sm:mercoa-px-6">
                        <input
                          type="checkbox"
                          className="mercoa-absolute mercoa-left-4 mercoa-top-1/2 -mercoa-mt-2 mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
                          ref={checkbox}
                          checked={checked}
                          onChange={toggleAll}
                        />
                      </th>
                    )}
                    <th
                      scope="col"
                      className="mercoa-min-w-[12rem] mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-3"
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
                    {status.some(
                      (status) =>
                        status === Mercoa.InvoiceStatus.Scheduled ||
                        status === Mercoa.InvoiceStatus.Pending ||
                        status === Mercoa.InvoiceStatus.Paid,
                    ) && (
                      <th
                        scope="col"
                        className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 group mercoa-inline-flex mercoa-items-center"
                      >
                        Deduction Date
                      </th>
                    )}
                  </tr>
                </thead>

                {/* ******** TABLE BODY ******** */}
                <tbody className="mercoa-divide-y mercoa-divide-gray-200 mercoa-bg-white">
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={classNames(
                        'mercoa-cursor-pointer  hover:mercoa-bg-gray-100',
                        selectedInvoices.includes(invoice) ? 'mercoa-bg-gray-50' : undefined,
                      )}
                    >
                      {/* ******** CHECK BOX ******** */}
                      {status.some((status) => status === Mercoa.InvoiceStatus.Approved) && (
                        <td className="mercoa-relative mercoa-px-7 sm:mercoa-w-12 sm:mercoa-px-6">
                          {selectedInvoices.includes(invoice) && (
                            <div className="mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-w-0.5 mercoa-bg-mercoa-primary" />
                          )}
                          <input
                            type="checkbox"
                            className="mercoa-absolute mercoa-left-4 mercoa-top-1/2 -mercoa-mt-2 mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
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
                          'mercoa-whitespace-nowrap mercoa-py-3 mercoa-pl-4 mercoa-pr-3 mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 sm:mercoa-pl-3',
                          selectedInvoices.includes(invoice)
                            ? 'mercoa-text-mercoa-primary-text'
                            : 'mercoa-text-gray-900',
                        )}
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {invoice.vendor?.name}
                      </td>
                      <td
                        className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900 mercoa-hidden sm:mercoa-table-cell"
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {invoice.invoiceNumber}
                      </td>
                      <td
                        className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900"
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {dayjs(invoice.dueDate).format('MMM DD, YYYY')}
                      </td>
                      <td
                        className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-text-gray-900"
                        onClick={() => {
                          if (onClick) onClick(invoice)
                        }}
                      >
                        {accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))}
                      </td>
                      <td
                        className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-hidden lg:mercoa-table-cell"
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
                            className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-3 mercoa-text-sm mercoa-hidden lg:mercoa-table-cell"
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
  let backgroundColor = 'mercoa-bg-gray-100'
  let textColor = 'mercoa-text-black'
  let message = ''
  let failureReason = ''
  if (invoice.failureType === Mercoa.InvoiceFailureType.InsufficientFunds) {
    failureReason = ' - Insufficient Funds'
  }

  if (invoice.status === Mercoa.InvoiceStatus.Draft) {
    if (!invoice.vendor || !invoice.amount || !invoice.dueDate) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Draft Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Draft Ready'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.New) {
    if (!invoice.paymentSourceId || !invoice.vendor || !invoice.amount || !invoice.dueDate) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
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
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
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
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Payment Scheduled'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.Pending) {
    backgroundColor = 'mercoa-bg-yellow-100'
    textColor = 'mercoa-text-black'
    message = 'Payment Processing'
  } else if (invoice.status === Mercoa.InvoiceStatus.Paid) {
    backgroundColor = 'mercoa-bg-green-100'
    textColor = 'mercoa-text-green-800'
    message = 'Paid'
  } else if (invoice.status === Mercoa.InvoiceStatus.Canceled) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Canceled'
  } else if (invoice.status === Mercoa.InvoiceStatus.Archived) {
    backgroundColor = 'mercoa-bg-gray-100'
    textColor = 'mercoa-text-black'
    message = 'Archived'
  } else if (invoice.status === Mercoa.InvoiceStatus.Refused) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Rejected'
  } else if (invoice.status === Mercoa.InvoiceStatus.Failed) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Failed ' + failureReason
  }

  return message ? (
    <p
      className={`mercoa-inline-flex mercoa-items-center mercoa-whitespace-nowrap mercoa-rounded-full mercoa-px-3 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium ${backgroundColor} ${textColor} md:mercoa-ml-2`}
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
      Mercoa.InvoiceStatus.Refused,
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
    REFUSED: 'Rejected',
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
            <span className="mercoa-text-gray-500 mercoa-text-xs"> {metric.currency}</span>
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
    <div className="mercoa-mt-8">
      <div className="mercoa-grid mercoa-items-center mercoa-grid-cols-3">
        <div className="mercoa-hidden md:mercoa-block md:mercoa-col-span-2" />
        <div className="mercoa-mt-2 mercoa-flex mercoa-w-full mercoa-rounded-md mercoa-shadow-sm mercoa-mr-2 mercoa-col-span-3 md:mercoa-col-span-1">
          <DebouncedSearch placeholder="Search Vendors" onSettle={setSearch} />
        </div>
      </div>

      {/* Inbox Selector Tabs */}
      <div className="md:mercoa-hidden mercoa-mt-2">
        <label htmlFor="tabs" className="mercoa-sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-py-1 mercoa-pl-3 mercoa-pr-10 mercoa-text-base focus:mercoa-border-mercoa-primary focus:mercoa-outline-none focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
      <div className="mercoa-hidden md:mercoa-block sm:mercoa-border-b sm:mercoa-border-gray-200">
        <nav
          className="-mercoa-mb-px mercoa-block sm:mercoa-flex sm:mercoa-space-x-6 mercoa-overflow-auto"
          aria-label="Tabs"
        >
          {tabs.map((status) => (
            <a
              onClick={() => {
                setSelectedTab(status)
              }}
              key={status}
              href="#"
              className={`${
                status == selectedTab
                  ? 'mercoa-text-mercoa-primary sm:mercoa-border-mercoa-primary'
                  : 'mercoa-border-transparent mercoa-text-gray-500 hover:mercoa-border-gray-300 hover:mercoa-text-gray-700'
              } mercoa-mr-2 mercoa-whitespace-nowrap mercoa-py-4 mercoa-px-1 mercoa-text-sm mercoa-font-medium sm:mercoa-mr-0 sm:mercoa-border-b-2`}
              aria-current={tabToName[status] == selectedTab ? 'page' : undefined}
            >
              {tabToName[status]}{' '}
              <span
                className={`${
                  status == selectedTab
                    ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
                    : 'mercoa-bg-gray-100 mercoa-text-gray-800'
                } mercoa-inline-flex mercoa-items-center mercoa-rounded-full  mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium`}
              >
                {' '}
                {sumTotalCount(invoiceMetrics?.[status] ?? [])}
              </span>
            </a>
          ))}
        </nav>
      </div>

      <div className="mercoa-grid mercoa-grid-cols-3 mercoa-space-x-3 mercoa-mt-2">
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
