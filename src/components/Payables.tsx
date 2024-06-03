import { Dialog } from '@headlessui/react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import { toast } from 'react-toastify'
import {
  CountPill,
  MercoaCombobox,
  MercoaContext,
  TableNavigation,
  TableOrderHeader,
  Tooltip,
  useMercoaSession,
} from '.'
import { currencyCodeToSymbol } from '../lib/currency'
import { classNames } from '../lib/lib'
import { isWeekday } from '../lib/scheduling'
import { DebouncedSearch, MercoaButton, Skeleton, StatCard } from './index'

function invoiceStatusToName(
  name: Mercoa.InvoiceStatus,
  approvalPolicies?: Mercoa.ApprovalPolicyResponse[],
  excludePayables?: boolean,
) {
  if (excludePayables) {
    return invoiceStatusToReceivableName(name, approvalPolicies)
  } else {
    return invoiceStatusToPayableName(name, approvalPolicies)
  }
}

function invoiceStatusToPayableName(name: Mercoa.InvoiceStatus, approvalPolicies?: Mercoa.ApprovalPolicyResponse[]) {
  const out = {
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
  return out[name]
}

function invoiceStatusToReceivableName(name: Mercoa.InvoiceStatus, approvalPolicies?: Mercoa.ApprovalPolicyResponse[]) {
  const out = {
    DRAFT: 'Draft',
    NEW: 'Ready for Review',
    APPROVED: 'Awaiting Payment',
    SCHEDULED: 'Payment Scheduled',
    PENDING: 'Payment Processing',
    FAILED: 'Payment Failed',
    PAID: 'Paid',
    CANCELED: 'Canceled',
    REFUSED: 'Rejected',
    ARCHIVED: 'Archived',
  }
  return out[name]
}

async function getMetrics({
  statuses,
  search,
  mercoaSession,
  setMetrics,
  returnByDate,
  excludeReceivables,
  excludePayables,
}: {
  statuses: Mercoa.InvoiceStatus[]
  search?: string
  mercoaSession: MercoaContext
  setMetrics: (metrics: { [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse }) => void
  returnByDate?: Mercoa.InvoiceMetricsPerDateGroupBy
  excludeReceivables: boolean
  excludePayables: boolean
}) {
  const results = (
    await Promise.all(
      (statuses ?? []).map(async (status) => {
        if (!mercoaSession.token || !mercoaSession.entity?.id) return
        const metrics = await mercoaSession.client?.entity.invoice.metrics(mercoaSession.entity.id, {
          search,
          status,
          returnByDate,
          excludeReceivables,
          excludePayables,
        })
        return [status as string, metrics?.[0] ?? { totalAmount: 0, totalInvoices: 0, totalCount: 0, currency: 'USD' }]
      }),
    )
  ).filter((e) => e) as Array<Array<string | Mercoa.InvoiceMetricsResponse>>

  const metrics = Object.fromEntries(results) as {
    [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
  }
  setMetrics(metrics)
}

function SchedulePaymentModal({
  open,
  onClose,
  setDate,
}: {
  open: boolean
  onClose: () => void
  setDate: (date: Date) => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>()

  return (
    <Dialog as="div" open={open} onClose={onClose} className="mercoa-relative mercoa-z-10">
      {/* Backdrop */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-black/30" aria-hidden="true" />
      {/* Full-screen  mercoa-container to center the panel */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-overflow-y-auto">
        <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
          <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-shadow-xl mercoa-transition-all sm:mercoa-p-6">
            <Dialog.Title className="mercoa-text-lg mercoa-font-semibold">
              When should these payments be scheduled?
            </Dialog.Title>
            <div className="mercoa-flex mercoa-mt-5">
              <DatePicker
                className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                placeholderText="Select Payment Date"
                onChange={(date) => setSelectedDate(date)}
                selected={selectedDate}
                minDate={dayjs().add(1, 'day').toDate()}
                filterDate={isWeekday}
              />

              <MercoaButton
                type="button"
                className="mercoa-ml-2"
                isEmphasized
                onClick={() => {
                  if (selectedDate) setDate(selectedDate)
                  onClose()
                }}
                disabled={!selectedDate}
              >
                Schedule Payments
              </MercoaButton>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}

function AddApproverModal({
  open,
  onClose,
  setApprover,
}: {
  open: boolean
  onClose: () => void
  setApprover: (userId: Mercoa.EntityUserId) => void
}) {
  const mercoaSession = useMercoaSession()

  const [users, setUsers] = useState<Mercoa.EntityUserResponse[]>([])
  const [selectedUser, setSelectedUser] = useState<Mercoa.EntityUserResponse>()

  useEffect(() => {
    if (!mercoaSession.entityId) return
    mercoaSession.client?.entity.user
      .getAll(mercoaSession.entityId)
      .then((resp) => {
        setUsers(resp)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [mercoaSession.token, mercoaSession.entityId])

  return (
    <Dialog as="div" open={open} onClose={onClose} className="mercoa-relative mercoa-z-10">
      {/* Backdrop */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-black/30" aria-hidden="true" />
      {/* Full-screen  mercoa-container to center the panel */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-overflow-y-auto">
        <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
          <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-shadow-xl mercoa-transition-all sm:mercoa-p-6">
            <Tooltip title="User will be added to the first available approval slot they are eligible for">
              <Dialog.Title className="mercoa-text-lg mercoa-font-semibold mercoa-flex mercoa-items-center mercoa-justify-center">
                Select Approver To Add
                <QuestionMarkCircleIcon className="mercoa-size-5 mercoa-ml-2" />
              </Dialog.Title>
            </Tooltip>
            <div className="mercoa-flex mercoa-mt-5">
              <MercoaCombobox
                options={users.map((user) => ({
                  disabled: false,
                  value: user,
                }))}
                displayIndex="name"
                secondaryDisplayIndex="email"
                onChange={(e) => {
                  console.log(e)
                  setSelectedUser(e)
                }}
                value={selectedUser}
                displaySelectedAs="pill"
              />

              <MercoaButton
                type="button"
                className="mercoa-ml-2"
                isEmphasized
                onClick={() => {
                  if (selectedUser) setApprover(selectedUser.id)
                  onClose()
                }}
                disabled={!selectedUser}
              >
                Add Approver
              </MercoaButton>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}

export type InvoiceTableColumn = {
  title: string
  field: keyof Mercoa.InvoiceResponse | `${'metadata.'}${string}`
  orderBy?: Mercoa.InvoiceOrderByField
  format?: (value: string | number | Date, invoice: Mercoa.InvoiceResponse) => string | ReactElement | null
}

export function PayablesTable({
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
  const [invoicesThatNeedMyApprovalCount, setInvoicesThatNeedMyApprovalCount] = useState<number>(0)
  const [orderBy, setOrderBy] = useState<Mercoa.InvoiceOrderByField>(Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState<Mercoa.OrderDirection>(Mercoa.OrderDirection.Asc)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [count, setCount] = useState<number>(0)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)
  const [currentStatuses, setCurrentStatuses] = useState<Mercoa.InvoiceStatus[]>(statuses)

  const [startingAfter, setStartingAfter] = useState<string[]>([])
  const [resultsPerPage, setResultsPerPage] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  const checkbox = useRef<HTMLInputElement>(null)
  const [checked, setChecked] = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<Array<Mercoa.InvoiceResponse>>([])

  const [showBatchScheduleModal, setShowBatchScheduleModal] = useState(false)
  const [showAddApproverModal, setShowAddApproverModal] = useState(false)

  const [showOnlyInvoicesThatUserNeedsToApprove, setShowOnlyInvoicesThatUserNeedsToApprove] = useState(false)

  useLayoutEffect(() => {
    const isIndeterminate = selectedInvoices.length > 0 && selectedInvoices.length < (invoices ? invoices.length : 0)
    setChecked(selectedInvoices.length === (invoices ? invoices.length : 0))
    setIndeterminate(isIndeterminate)
    if (checkbox.current) {
      checkbox.current.indeterminate = isIndeterminate
    }
  }, [selectedInvoices, invoices])

  function toggleAll() {
    setSelectedInvoices(checked || indeterminate ? [] : invoices ?? [])
    setChecked(!checked && !indeterminate)
    setIndeterminate(false)
  }

  async function handleSchedulePayment(deductionDate: Date) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    setDataLoaded(false)
    let anySuccessFlag = false
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.update(invoice.id, {
            ...((invoice.status === Mercoa.InvoiceStatus.Approved ||
              invoice.status === Mercoa.InvoiceStatus.Failed) && { status: Mercoa.InvoiceStatus.Scheduled }),
            deductionDate: deductionDate,
          })
          anySuccessFlag = true
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

  async function handleSetApprover(approverId: Mercoa.EntityUserId) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.approval.addApprover(invoice.id, {
            userId: approverId,
          })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error adding approver to invoice ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Approver Added')
    } else {
      toast.error('Error adding approver')
    }
    mercoaSession.refresh()
  }

  function getNewOrApprovedStatus(invoice: Mercoa.InvoiceResponse) {
    let status: Mercoa.InvoiceStatus = Mercoa.InvoiceStatus.Approved
    const approvalPolicy = invoice.approvalPolicy
    if (!!approvalPolicy && approvalPolicy.length > 0) {
      status = Mercoa.InvoiceStatus.New
    }
    return status
  }

  async function handleSubmitNew() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.update(invoice.id, {
            status: getNewOrApprovedStatus(invoice),
          })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error submitting invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Invoice Submitted for Approval')
    } else {
      toast.error('Error submitting invoice')
    }
    mercoaSession.refresh()
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

  async function handleArchive() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.update(invoice.id, {
            status: Mercoa.InvoiceStatus.Archived,
          })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error archiving invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Invoices Archived')
    } else {
      toast.error('Error archiving invoices')
    }
    mercoaSession.refresh()
  }

  async function handleCancel() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await mercoaSession.client?.invoice.update(invoice.id, {
            status: Mercoa.InvoiceStatus.Canceled,
          })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error cancelling invoice: ', e)
          console.log('Errored invoice: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Payments Cancelled')
    } else {
      toast.error('Error cancelling payments')
    }
    mercoaSession.refresh()
  }

  async function handleApprove() {
    if (!mercoaSession.token || !mercoaSession.entity?.id || !mercoaSession.user) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          const resp = await mercoaSession.client?.invoice.get(invoice.id)
          if (resp?.status != Mercoa.InvoiceStatus.New) {
            anySuccessFlag = true
            return
          }
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
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          const resp = await mercoaSession.client?.invoice.get(invoice.id)
          if (resp?.status != Mercoa.InvoiceStatus.New) {
            anySuccessFlag = true
            return
          }
          await mercoaSession.client?.invoice.approval.reject(invoice.id, { userId: mercoaSession.user?.id! })
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
        ...(showOnlyInvoicesThatUserNeedsToApprove && {
          approverId: mercoaSession.user?.id,
          approverAction: Mercoa.ApproverAction.None,
        }),
        limit: 100,
        startingAfter,
        excludeReceivables: true,
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
      ...(showOnlyInvoicesThatUserNeedsToApprove && {
        approverId: mercoaSession.user?.id,
        approverAction: Mercoa.ApproverAction.None,
      }),
      limit: resultsPerPage,
      startingAfter: startingAfter[startingAfter.length - 1],
      excludeReceivables: true,
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
    if (currentStatuses.includes(Mercoa.InvoiceStatus.New)) {
      mercoaSession.client?.entity.invoice
        .find(mercoaSession.entity.id, {
          ...filter,
          approverId: mercoaSession.user?.id,
          approverAction: Mercoa.ApproverAction.None,
        })
        .then((resp) => {
          if (resp && isCurrent) {
            setInvoicesThatNeedMyApprovalCount(resp.count)
          }
        })
    }
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
    showOnlyInvoicesThatUserNeedsToApprove,
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
      setShowOnlyInvoicesThatUserNeedsToApprove(false)
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

  if (!dataLoaded || !mercoaSession.entity || !invoices) {
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
    {
      title: 'Approvers',
      field: 'approvers',
      format: (_, invoice) => {
        if (invoice.approvers.every((approver) => !approver.assignedUserId)) {
          return null
        }
        return (
          <div className="mercoa-gap-1 mercoa-grid">
            {invoice.approvers?.map((approver) => {
              if (!approver.assignedUserId) return null
              const user = mercoaSession.users.find((e) => e.id === approver.assignedUserId)
              return (
                <Tooltip title={user?.email} key={approver.approvalSlotId}>
                  <div
                    key={approver.approvalSlotId}
                    className={`mercoa-flex mercoa-items-center mercoa-rounded-md mercoa-text-xs ${
                      approver.action === Mercoa.ApproverAction.Approve
                        ? 'mercoa-bg-green-100 mercoa-text-green-800'
                        : ''
                    } ${
                      approver.action === Mercoa.ApproverAction.Reject ? 'mercoa-bg-red-100 mercoa-text-red-800' : ''
                    } ${
                      approver.action === Mercoa.ApproverAction.None ? 'mercoa-bg-gray-50 mercoa-text-gray-800' : ''
                    } mercoa-py-1 mercoa-px-2`}
                  >
                    {user?.name}
                  </div>
                </Tooltip>
              )
            })}
          </div>
        )
      },
    },
    {
      title: 'Status',
      field: 'status',
      format: (_, invoice) => {
        return <InvoiceStatusPill invoice={invoice} />
      },
    },
    {
      title: 'Deduction Date',
      field: 'deductionDate',
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

  return (
    <>
      <div className="mercoa-min-h-[600px]">
        {/* create checkbox that toggles invoices assigned to me */}
        {currentStatuses.includes(Mercoa.InvoiceStatus.New) && invoicesThatNeedMyApprovalCount > 0 && (
          <div className="mercoa-flex mercoa-items-center mercoa-justify-start mercoa-my-4 mercoa-ml-4">
            <div className="mercoa-flex mercoa-items-center mercoa-font-bold mercoa-font-xl mercoa-text-gray-600">
              <input
                id="showOnlyInvoicesThatUserNeedsToApprove"
                type="checkbox"
                className="mercoa-mr-2 mercoa-size-4 mercoa-rounded mercoa-border-gray-300 focus:mercoa-ring-mercoa-primary mercoa-text-mercoa-primary-text mercoa-cursor-pointer"
                checked={showOnlyInvoicesThatUserNeedsToApprove}
                onChange={() => setShowOnlyInvoicesThatUserNeedsToApprove(!showOnlyInvoicesThatUserNeedsToApprove)}
              />
              <label htmlFor="showOnlyInvoicesThatUserNeedsToApprove" className="mercoa-cursor-pointer">
                Only show invoices that need my approval <CountPill count={invoicesThatNeedMyApprovalCount} selected />
              </label>
            </div>
          </div>
        )}
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
            {currentStatuses.includes(Mercoa.InvoiceStatus.Draft) && selectedInvoices.length > 0 && (
              <>
                {getNewOrApprovedStatus(selectedInvoices[0]) === Mercoa.InvoiceStatus.New && (
                  <button
                    type="button"
                    className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                    onClick={() => setShowAddApproverModal(true)}
                  >
                    Add Approver
                  </button>
                )}
                <button
                  type="button"
                  className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                  onClick={handleSubmitNew}
                >
                  {getNewOrApprovedStatus(selectedInvoices[0]) === Mercoa.InvoiceStatus.New
                    ? 'Submit for Approval'
                    : 'Approve'}
                </button>
                <AddApproverModal
                  open={showAddApproverModal}
                  onClose={() => setShowAddApproverModal(false)}
                  setApprover={handleSetApprover}
                />
              </>
            )}
            {currentStatuses.some((e) =>
              [
                Mercoa.InvoiceStatus.Draft,
                Mercoa.InvoiceStatus.New,
                Mercoa.InvoiceStatus.Approved,
                Mercoa.InvoiceStatus.Failed,
              ].includes(e as any),
            ) &&
              selectedInvoices.length > 0 && (
                <>
                  <button
                    type="button"
                    className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                    onClick={() => setShowBatchScheduleModal(true)}
                  >
                    {currentStatuses.some((e) =>
                      [Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.New].includes(e as any),
                    )
                      ? 'Set Payment Date'
                      : 'Schedule Payment'}
                  </button>
                  <SchedulePaymentModal
                    open={showBatchScheduleModal}
                    onClose={() => setShowBatchScheduleModal(false)}
                    setDate={handleSchedulePayment}
                  />
                </>
              )}
            {currentStatuses.includes(Mercoa.InvoiceStatus.New) &&
              selectedInvoices.length > 0 &&
              selectedInvoices.some((e) => e.approvers.some((e) => e.assignedUserId === mercoaSession.user?.id)) && (
                <>
                  <button
                    type="button"
                    className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
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
                </>
              )}
            {currentStatuses.includes(Mercoa.InvoiceStatus.Draft) && selectedInvoices.length > 0 && (
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
            )}
            {currentStatuses.includes(Mercoa.InvoiceStatus.Scheduled) && selectedInvoices.length > 0 && (
              <button
                type="button"
                className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel these payments? This action cannot be undone.')) {
                    handleCancel()
                  }
                }}
              >
                Cancel Payment
              </button>
            )}
            {currentStatuses.some((e) =>
              [
                Mercoa.InvoiceStatus.Pending,
                Mercoa.InvoiceStatus.Paid,
                Mercoa.InvoiceStatus.Canceled,
                Mercoa.InvoiceStatus.Refused,
                Mercoa.InvoiceStatus.Failed,
                Mercoa.InvoiceStatus.New,
                Mercoa.InvoiceStatus.Approved,
              ].includes(e as any),
            ) &&
              selectedInvoices.length > 0 && (
                <button
                  type="button"
                  className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                  onClick={() => {
                    if (confirm('Are you sure you want to archive these invoices? This action cannot be undone.')) {
                      handleArchive()
                    }
                  }}
                >
                  Archive
                </button>
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
    </>
  )
}

export function InvoiceStatusPill({
  invoice,
  type,
}: {
  invoice: Mercoa.InvoiceResponse
  type?: 'payable' | 'receivable'
}) {
  const counterparty = type === 'receivable' ? invoice.payer : invoice.vendor
  let backgroundColor = 'mercoa-bg-gray-100'
  let textColor = 'mercoa-text-black'
  let message = ''
  let failureReason = ''
  if (invoice.failureType === Mercoa.InvoiceFailureType.InsufficientFunds) {
    failureReason = ' - Insufficient Funds'
  }
  if (invoice.status === Mercoa.InvoiceStatus.Draft) {
    if (!counterparty || !invoice.amount || !invoice.dueDate) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Draft Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Draft Ready'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.New) {
    if (!invoice.paymentSourceId || !counterparty || !invoice.amount || !invoice.dueDate) {
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
      !counterparty ||
      !invoice.amount ||
      !invoice.dueDate
    ) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = type === 'receivable' ? 'Out for Payment' : 'Ready for Payment'
    }
  } else if (invoice.status === Mercoa.InvoiceStatus.Scheduled) {
    if (
      !invoice.paymentSourceId ||
      !invoice.paymentDestinationId ||
      !counterparty ||
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

export function InvoiceMetrics({
  statuses,
  search,
  returnByDate,
  excludePayables,
  excludeReceivables,
  children,
}: {
  statuses: Mercoa.InvoiceStatus[]
  search?: string
  returnByDate?: Mercoa.InvoiceMetricsPerDateGroupBy
  excludePayables?: boolean
  excludeReceivables?: boolean
  children?: ({
    metrics,
  }: {
    metrics?: {
      [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
    }
  }) => JSX.Element
}) {
  // default to AP
  if (typeof excludePayables === 'undefined' && typeof excludeReceivables === 'undefined') {
    excludeReceivables = true
  }

  const mercoaSession = useMercoaSession()

  const [invoiceMetrics, setInvoiceMetrics] = useState<{
    [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
  }>()

  function sumTotalCount(metricsObject: {
    [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
  }) {
    const metrics = Object.entries(metricsObject).filter(
      ([status]) => statuses.indexOf(status as Mercoa.InvoiceStatus) > -1,
    )
    return metrics?.reduce((acc, [, metric]) => {
      acc += metric.totalCount
      return acc
    }, 0)
  }

  function formatCurrencyMetrics(
    metricsObject: {
      [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
    },
    key: 'totalAmount' | 'averageAmount',
  ) {
    const metrics = Object.entries(metricsObject).filter(
      ([status]) => statuses.indexOf(status as Mercoa.InvoiceStatus) > -1,
    )
    if (!metrics || metrics.length < 1) return accounting.formatMoney(0, currencyCodeToSymbol('USD'))
    if (metrics.length < 2)
      return accounting.formatMoney(metrics[0][1][key] ?? 0 ?? '', currencyCodeToSymbol(metrics[0][1].currency))
    return (
      <div>
        {metrics.map(([status, metric]) => (
          <p key={metric.currency} className="mercoa-text-xs">
            <span className="mercoa-text-gray-600">{status}: </span>
            <span className="mercoa-text-gray-900">
              {accounting.formatMoney(metric[key] ?? 0 ?? '', currencyCodeToSymbol(metric.currency))}
            </span>
            <span className="mercoa-text-gray-500"> {metric.currency}</span>
          </p>
        ))}
      </div>
    )
  }

  useEffect(() => {
    setInvoiceMetrics(undefined)
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    getMetrics({
      statuses,
      search,
      mercoaSession,
      setMetrics: setInvoiceMetrics,
      returnByDate,
      excludePayables: excludePayables ?? false,
      excludeReceivables: excludeReceivables ?? false,
    })
  }, [search, statuses, mercoaSession.token, mercoaSession.entity, mercoaSession.refreshId])

  if (children) return children({ metrics: invoiceMetrics })

  return (
    <div className="mercoa-grid mercoa-grid-cols-3 mercoa-space-x-3 mercoa-mt-2 mercoa-mb-1 mercoa-min-h-[60px]">
      {!invoiceMetrics ? (
        <>
          <Skeleton rows={2} />
          <Skeleton rows={2} />
          <Skeleton rows={2} />
        </>
      ) : (
        <>
          <StatCard size="sm" title={`Number of Invoices`} value={sumTotalCount(invoiceMetrics)} />
          <StatCard size="sm" title={`Total Amount`} value={formatCurrencyMetrics(invoiceMetrics, 'totalAmount')} />
          <StatCard size="sm" title={`Average Amount`} value={formatCurrencyMetrics(invoiceMetrics, 'averageAmount')} />
        </>
      )}
    </div>
  )
}

export function StatusTabs({
  statuses,
  selectedStatus,
  search,
  onStatusChange,
  excludePayables,
  excludeReceivables,
}: {
  statuses?: Array<Mercoa.InvoiceStatus>
  selectedStatus?: Mercoa.InvoiceStatus
  search?: string
  onStatusChange?: (status: Mercoa.InvoiceStatus[]) => any
  excludePayables?: boolean
  excludeReceivables?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [selectedStatuses, setSelectedStatuses] = useState<Mercoa.InvoiceStatus[]>([
    selectedStatus ?? Mercoa.InvoiceStatus.Draft,
  ])
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
    if (onStatusChange) onStatusChange(selectedStatuses)
  }, [selectedStatuses])

  useEffect(() => {
    if (!Array.isArray(approvalPolicies)) return
    if (statuses) {
      setTabs(statuses)
    } else if (!approvalPolicies || approvalPolicies?.length < 1) {
      // Remove the "NEW" tab if there are no approval policies
      setTabs(tabs.filter((tab) => tab !== Mercoa.InvoiceStatus.New))
    }
  }, [statuses, approvalPolicies])

  const [invoiceMetrics, setInvoiceMetrics] = useState<{
    [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
  }>()

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    getMetrics({
      statuses: tabs,
      search,
      mercoaSession,
      setMetrics: setInvoiceMetrics,
      excludePayables: excludePayables ?? false,
      excludeReceivables: excludeReceivables ?? false,
    })
  }, [search, tabs, mercoaSession.client, mercoaSession.entity, mercoaSession.refreshId])

  return (
    <>
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
          defaultValue={selectedStatuses}
          onChange={(e) => {
            setSelectedStatuses([e.target.value as Mercoa.InvoiceStatus])
          }}
        >
          {tabs.map((status) => (
            <option key={status} value={status}>
              {invoiceStatusToName(status, approvalPolicies, excludePayables)}
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
                setSelectedStatuses([status])
              }}
              key={status}
              href="#"
              className={`${
                status == selectedStatuses[0]
                  ? 'mercoa-text-mercoa-primary sm:mercoa-border-mercoa-primary'
                  : 'mercoa-border-transparent mercoa-text-gray-500 hover:mercoa-border-gray-300 hover:mercoa-text-gray-700'
              } mercoa-mr-2 mercoa-whitespace-nowrap mercoa-py-4 mercoa-px-1 mercoa-text-sm mercoa-font-medium sm:mercoa-mr-0 sm:mercoa-border-b-2`}
              aria-current={
                invoiceStatusToName(status, approvalPolicies, excludePayables) == selectedStatuses[0]
                  ? 'page'
                  : undefined
              }
            >
              {invoiceStatusToName(status, approvalPolicies, excludePayables)}{' '}
              <CountPill count={invoiceMetrics?.[status]?.totalCount ?? 0} selected={status == selectedStatuses[0]} />
            </a>
          ))}
        </nav>
      </div>
    </>
  )
}

export function StatusDropdown({
  availableStatuses,
  currentStatuses,
  onStatusChange,
  placeholder,
  label,
  className,
  multiple,
}: {
  availableStatuses?: Array<Mercoa.InvoiceStatus>
  currentStatuses?: Array<Mercoa.InvoiceStatus>
  onStatusChange?: (status: Mercoa.InvoiceStatus[]) => any
  placeholder?: string
  label?: string
  className?: string
  multiple?: boolean
}) {
  const [selectedStatuses, setSelectedStatuses] = useState<Mercoa.InvoiceStatus[] | Mercoa.InvoiceStatus>(
    currentStatuses ?? [Mercoa.InvoiceStatus.Draft],
  )
  const tabs = availableStatuses ?? [
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
    Mercoa.InvoiceStatus.Pending,
    Mercoa.InvoiceStatus.Paid,
    Mercoa.InvoiceStatus.Canceled,
    Mercoa.InvoiceStatus.Refused,
    Mercoa.InvoiceStatus.Failed,
  ]

  const tabToColor = {
    DRAFT: '#E0E7FF',
    NEW: '#E0F2FE',
    APPROVED: '#BEF264',
    SCHEDULED: '#D1FAE5',
    PENDING: '#FDE68A',
    FAILED: '#FCA5A5',
    PAID: '#ECFCCB',
    CANCELED: '#E5E7EB',
    REFUSED: '#FEE2E2',
    ARCHIVED: '#E5E7EB',
  }

  useEffect(() => {
    if (onStatusChange) {
      if (Array.isArray(selectedStatuses)) {
        onStatusChange(selectedStatuses)
      } else {
        onStatusChange([selectedStatuses])
      }
    }
  }, [selectedStatuses])
  return (
    <>
      <MercoaCombobox
        options={tabs.map((status) => ({
          value: status,
          disabled: false,
          color: tabToColor[status],
        }))}
        onChange={(e) => {
          setSelectedStatuses(e)
        }}
        value={selectedStatuses}
        multiple={multiple}
        displaySelectedAs="pill"
        placeholder={placeholder ?? 'All Invoices'}
        label={label}
        inputClassName={className}
      />
    </>
  )
}

export function Payables({
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

  return (
    <div className="mercoa-mt-8">
      <div className="mercoa-grid mercoa-items-center mercoa-grid-cols-3">
        <div className="mercoa-hidden md:mercoa-block md:mercoa-col-span-2">
          {statusSelectionStyle == 'dropdown' && (
            <div className="mercoa-grid mercoa-grid-cols-2">
              <StatusDropdown availableStatuses={statuses} onStatusChange={setSelectedStatuses} multiple />
            </div>
          )}
        </div>
        <div className="mercoa-flex mercoa-w-full mercoa-rounded-md mercoa-shadow-sm mercoa-mr-2 mercoa-col-span-3 md:mercoa-col-span-1">
          <DebouncedSearch placeholder="Search Vendors, Invoice #, Amount" onSettle={setSearch} />
        </div>
      </div>
      {statusSelectionStyle != 'dropdown' && (
        <StatusTabs statuses={statuses} search={search} onStatusChange={setSelectedStatuses} excludeReceivables />
      )}
      <InvoiceMetrics statuses={selectedStatuses} search={search} excludeReceivables />
      <PayablesTable statuses={selectedStatuses} search={search} onSelectInvoice={onSelectInvoice} />
    </div>
  )
}
