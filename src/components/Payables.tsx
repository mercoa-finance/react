import { Dialog } from '@headlessui/react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import accounting from 'accounting'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../lib/currency'
import { classNames } from '../lib/lib'
import { isWeekday } from '../lib/scheduling'
import {
  CountPill,
  DebouncedSearch,
  EntitySelector,
  filterApproverOptions,
  getInvoiceClient,
  MercoaButton,
  MercoaCombobox,
  NoSession,
  Skeleton,
  StatCard,
  TableNavigation,
  TableOrderHeader,
  Tooltip,
  useMercoaSession,
} from './index'

export function invoiceStatusToName({
  status,
  approvalPolicies,
  excludePayables,
  invoiceType = 'invoice',
}: {
  status: Mercoa.InvoiceStatus
  approvalPolicies?: Mercoa.ApprovalPolicyResponse[]
  excludePayables?: boolean
  invoiceType?: 'invoice' | 'invoiceTemplate'
}) {
  // Receivables
  if (excludePayables) {
    return invoiceStatusToReceivableName(status, approvalPolicies)
  }

  // Payables
  if (invoiceType === 'invoice') {
    return invoiceStatusToPayableName(status, approvalPolicies)
  } else {
    return invoiceTemplateStatusToPayableName(status)
  }
}

function invoiceStatusToPayableName(status: Mercoa.InvoiceStatus, approvalPolicies?: Mercoa.ApprovalPolicyResponse[]) {
  const out = {
    UNASSIGNED: 'Unassigned',
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
  return out[status]
}

function invoiceTemplateStatusToPayableName(status: Mercoa.InvoiceStatus) {
  const out = {
    UNASSIGNED: 'Unassigned',
    DRAFT: 'Draft',
    NEW: 'Ready for Review',
    APPROVED: 'Approved',
    SCHEDULED: 'Active',
    PENDING: 'Payment Processing', // unused
    FAILED: 'Payment Failed', // unused
    PAID: 'Paid', // unused
    CANCELED: 'Canceled',
    REFUSED: 'Rejected', // unused
    ARCHIVED: 'Archived', // unused
  }
  return out[status]
}

function invoiceStatusToReceivableName(
  status: Mercoa.InvoiceStatus,
  approvalPolicies?: Mercoa.ApprovalPolicyResponse[],
) {
  const out = {
    UNASSIGNED: 'Unassigned',
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
  return out[status]
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
          <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-shadow-xl mercoa-transition-all sm:mercoa-p-6">
            <Dialog.Title className="mercoa-text-lg mercoa-font-semibold">
              When should these payments be scheduled?
            </Dialog.Title>
            <div className="mercoa-flex mercoa-mt-5">
              <DatePicker
                className="mercoa-block mercoa-w-full mercoa-rounded-mercoa mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                placeholderText="Select Payment Date"
                onChange={(date) => setSelectedDate(date)}
                selected={selectedDate}
                minDate={dayjs().add(1, 'day').toDate()}
                filterDate={isWeekday}
                peekNextMonth
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
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

export function AssignEntityModal({
  open,
  onClose,
  setEntity,
}: {
  open: boolean
  onClose: () => void
  setEntity: (entityId: string) => void
}) {
  const [selectedEntity, setSelectedEntity] = useState<Mercoa.EntityResponse>()

  return (
    <Dialog as="div" open={open} onClose={onClose} className="mercoa-relative mercoa-z-10">
      {/* Backdrop */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-black/30" aria-hidden="true" />
      {/* Full-screen  mercoa-container to center the panel */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-overflow-y-auto">
        <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
          <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-shadow-xl mercoa-transition-all sm:mercoa-p-6">
            <Dialog.Title className="mercoa-text-lg mercoa-font-semibold">Assign to Entity</Dialog.Title>
            <div className="mercoa-flex mercoa-mt-5">
              <EntitySelector onSelect={setSelectedEntity} />
              <MercoaButton
                type="button"
                className="mercoa-ml-2"
                isEmphasized
                onClick={() => {
                  if (selectedEntity) setEntity(selectedEntity.id)
                  onClose()
                }}
                disabled={!selectedEntity}
              >
                Assign
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

  const [selectedUser, setSelectedUser] = useState<Mercoa.EntityUserResponse>()

  return (
    <Dialog as="div" open={open} onClose={onClose} className="mercoa-relative mercoa-z-10">
      {/* Backdrop */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-black/30" aria-hidden="true" />
      {/* Full-screen  mercoa-container to center the panel */}
      <div className="mercoa-fixed mercoa-inset-0 mercoa-overflow-y-auto">
        <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
          <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-shadow-xl mercoa-transition-all sm:mercoa-p-6">
            <Tooltip title="User will be added to the first available approval slot they are eligible for">
              <Dialog.Title className="mercoa-text-lg mercoa-font-semibold mercoa-flex mercoa-items-center mercoa-justify-center">
                Select Approver To Add
                <QuestionMarkCircleIcon className="mercoa-size-5 mercoa-ml-2" />
              </Dialog.Title>
            </Tooltip>
            <div className="mercoa-flex mercoa-mt-5">
              <MercoaCombobox
                options={mercoaSession.users.map((user) => ({
                  disabled: false,
                  value: user,
                }))}
                displayIndex="name"
                secondaryDisplayIndex="email"
                onChange={(e) => {
                  mercoaSession.debug(e)
                  setSelectedUser(e)
                }}
                value={selectedUser}
                displaySelectedAs="pill"
                showAllOptions
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
  format?: (value: string | number | Date | any, invoice: Mercoa.InvoiceResponse) => string | ReactElement | null
}

export type PayablesTableV1ChildrenProps = {
  dataLoaded: boolean
  invoices: Mercoa.InvoiceResponse[]
  hasNext: boolean
  getNext: () => void
  hasPrevious: boolean
  getPrevious: () => void
  resultsPerPage: number
  setResultsPerPage: (value: number) => void
  page: number
  setPage: (value: number) => void
  count: number
  orderBy: Mercoa.InvoiceOrderByField
  setOrderBy: (value: Mercoa.InvoiceOrderByField) => void
  orderDirection: Mercoa.OrderDirection
  setOrderDirection: (value: Mercoa.OrderDirection) => void
  selectedInvoiceStatuses: Mercoa.InvoiceStatus[]
  setSelectedInvoiceStatues: (statuses: Mercoa.InvoiceStatus[]) => void
  downloadCSV: () => void
}

export function PayablesTableV1({
  invoiceType = 'invoice',
  statuses,
  search,
  metadata,
  startDate,
  endDate,
  onSelectInvoice,
  columns,
  children,
}: {
  invoiceType?: 'invoice' | 'invoiceTemplate'
  statuses: Mercoa.InvoiceStatus[]
  search?: string
  metadata?: Mercoa.MetadataFilter[]
  startDate?: Date
  endDate?: Date
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse, isMiddleClick?: boolean) => any
  columns?: InvoiceTableColumn[]
  children?: (props: PayablesTableV1ChildrenProps) => ReactElement | null
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
    setSelectedInvoices(checked || indeterminate ? [] : (invoices ?? []))
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
          await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, {
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
          await getInvoiceClient(mercoaSession, invoiceType)?.approval.addApprover(invoice.id, {
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

  function needsApproval(invoice: Mercoa.InvoiceResponse) {
    if (invoice.approvers.length > 0) {
      return true
    }
    return false
  }

  async function handleSubmitNew() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, {
            status: Mercoa.InvoiceStatus.New,
          })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error submitting invoice: ', e)
          console.log('Errored invoice: ', { invoice })
          await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, {
            status: Mercoa.InvoiceStatus.Draft,
          })
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
          await getInvoiceClient(mercoaSession, invoiceType)?.delete(invoice.id)
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
          await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, {
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

  async function handleRestoreAsDraft() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let anySuccessFlag = false
    setDataLoaded(false)
    await Promise.all(
      selectedInvoices.map(async (invoice) => {
        try {
          await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, {
            status: Mercoa.InvoiceStatus.Draft,
          })
          anySuccessFlag = true
        } catch (e) {
          console.error('Error restoring invoice: ', e)
          console.log('Errored restoring: ', { invoice })
        }
      }),
    )
    if (anySuccessFlag) {
      toast.success('Invoices Restored as Draft')
    } else {
      toast.error('Error restoring invoices')
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
          await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, {
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
          const resp = await getInvoiceClient(mercoaSession, invoiceType)?.get(invoice.id)
          if (resp?.status != Mercoa.InvoiceStatus.New) {
            anySuccessFlag = true
            return
          }
          await getInvoiceClient(mercoaSession, invoiceType)?.approval.approve(invoice.id, {
            userId: mercoaSession.user?.id!,
          })
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
          const resp = await getInvoiceClient(mercoaSession, invoiceType)?.get(invoice.id)
          if (resp?.status != Mercoa.InvoiceStatus.New) {
            anySuccessFlag = true
            return
          }
          await getInvoiceClient(mercoaSession, invoiceType)?.approval.reject(invoice.id, {
            userId: mercoaSession.user?.id!,
          })
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

      const response =
        invoiceType === 'invoice'
          ? await mercoaSession.client?.entity.invoice.find(mercoaSession.entity.id, filter)
          : await mercoaSession.client?.invoiceTemplate.find({
              ...filter,
              entityId: mercoaSession.entity.id,
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

    if (invoiceType === 'invoice') {
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
    } else {
      mercoaSession.client?.invoiceTemplate
        .find({
          ...filter,
          entityId: mercoaSession.entity.id,
        })
        .then((resp) => {
          if (resp && isCurrent) {
            setHasMore(resp.hasMore)
            setCount(resp.count)
            setInvoices(resp.data)
            setDataLoaded(true)
          }
        })
      if (currentStatuses.includes(Mercoa.InvoiceStatus.New)) {
        mercoaSession.client?.invoiceTemplate
          .find({
            ...filter,
            entityId: mercoaSession.entity.id,
            approverId: mercoaSession.user?.id,
            approverAction: Mercoa.ApproverAction.None,
          })
          .then((resp) => {
            if (resp && isCurrent) {
              setInvoicesThatNeedMyApprovalCount(resp.count)
            }
          })
      }
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
    invoiceType,
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
      page,
      setPage: (page: number) => {
        if (!invoices) return
        setPage(page)
      },
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      selectedInvoiceStatuses: currentStatuses,
      setSelectedInvoiceStatues: setCurrentStatuses,
      downloadCSV: downloadAsCSV,
      count,
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
        if (invoice.approvers.length === 0) {
          return null
        }
        return (
          <div className="mercoa-gap-1 mercoa-grid">
            {invoice.approvers?.map((approver, index) => {
              if (!approver.assignedUserId) {
                const eligibleApprovers = filterApproverOptions({
                  approverSlotIndex: index,
                  eligibleRoles: approver.eligibleRoles,
                  eligibleUserIds: approver.eligibleUserIds,
                  users: mercoaSession.users,
                  selectedApprovers: [],
                })
                return (
                  <Tooltip title={eligibleApprovers.map((e) => e.user.email).join(', ')} key={approver.approvalSlotId}>
                    <div
                      key={approver.approvalSlotId}
                      className={`mercoa-flex mercoa-items-center mercoa-rounded-mercoa mercoa-text-xs mercoa-bg-gray-50 mercoa-text-gray-800 mercoa-py-1 mercoa-px-2`}
                    >
                      Any Eligible Approver
                    </div>
                  </Tooltip>
                )
              }
              const user = mercoaSession.users.find((e) => e.id === approver.assignedUserId)
              return (
                <Tooltip title={user?.email} key={approver.approvalSlotId}>
                  <div
                    key={approver.approvalSlotId}
                    className={`mercoa-flex mercoa-items-center mercoa-rounded-mercoa mercoa-text-xs ${
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
      title: 'Payment Destination',
      field: 'paymentDestination',
      format: (pm) => {
        pm = pm as Mercoa.PaymentMethodResponse
        if (!pm || !pm.type) return null
        if (pm.type === Mercoa.PaymentMethodType.BankAccount) {
          return `${pm?.bankName} ••••${String(pm?.accountNumber).slice(-4)}`
        } else if (pm.type === Mercoa.PaymentMethodType.Check) {
          return `Check • ${String(pm?.addressLine1).slice(-10)}`
        } else if (pm.type === Mercoa.PaymentMethodType.Custom) {
          return `${pm?.accountName} ••••${String(pm?.accountNumber).slice(-4)}`
        }
        return null
      },
    },
    {
      title: 'Status',
      field: 'status',
      format: (_, invoice) => {
        return (
          <InvoiceStatusPill
            failureType={invoice.failureType}
            status={invoice.status}
            vendorId={invoice.vendorId}
            payerId={invoice.payerId}
            paymentDestinationId={invoice.paymentDestinationId}
            paymentSourceId={invoice.paymentSourceId}
            dueDate={invoice.dueDate}
            amount={invoice.amount}
            type="payable"
          />
        )
      },
    },
    {
      title: 'Deduction Date',
      field: 'deductionDate',
      orderBy: Mercoa.InvoiceOrderByField.DeductionDate,
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
                onMouseDown={(event) => {
                  if (onSelectInvoice) onSelectInvoice(invoice, event.button === 1)
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

  if (!mercoaSession.client) return <NoSession componentName="PayablesTable" />
  return (
    <div>
      <div className="mercoa-min-h-[600px]">
        {/* create checkbox that toggles invoices assigned to me */}
        {currentStatuses.includes(Mercoa.InvoiceStatus.New) && mercoaSession.user?.id && (
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
                {needsApproval(selectedInvoices[0]) && (
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
                  {needsApproval(selectedInvoices[0]) ? 'Submit for Approval' : 'Approve'}
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
            {currentStatuses.includes(Mercoa.InvoiceStatus.Scheduled) && selectedInvoices.length > 0 && (
              <>
                <button
                  type="button"
                  className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                  onClick={() => setShowBatchScheduleModal(true)}
                >
                  Reschedule Payment
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
              selectedInvoices.some((e) =>
                e.approvers.some((approver, index) => {
                  if (approver.assignedUserId === mercoaSession.user?.id) {
                    return true
                  } else if (!approver.assignedUserId) {
                    const eligibleApprovers = filterApproverOptions({
                      approverSlotIndex: index,
                      eligibleRoles: approver.eligibleRoles,
                      eligibleUserIds: approver.eligibleUserIds,
                      users: mercoaSession.users,
                      selectedApprovers: [],
                    })
                    if (eligibleApprovers.find((e) => e.user.id === mercoaSession.user?.id)) {
                      return true
                    }
                  }
                }),
              ) && (
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
            {currentStatuses.some((e) =>
              [Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Canceled].includes(e as any),
            ) &&
              selectedInvoices.length > 0 && (
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
            {currentStatuses.some((e) =>
              [
                Mercoa.InvoiceStatus.New,
                Mercoa.InvoiceStatus.Approved,
                Mercoa.InvoiceStatus.Refused,
                Mercoa.InvoiceStatus.Scheduled,
                Mercoa.InvoiceStatus.Failed,
              ].includes(e as any),
            ) &&
              selectedInvoices.length > 0 && (
                <button
                  type="button"
                  className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel these invoices? This action cannot be undone.')) {
                      handleCancel()
                    }
                  }}
                >
                  Cancel
                </button>
              )}
            {currentStatuses.includes(Mercoa.InvoiceStatus.Paid) && selectedInvoices.length > 0 && (
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
            {currentStatuses.includes(Mercoa.InvoiceStatus.Canceled) && selectedInvoices.length > 0 && (
              <button
                type="button"
                className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 disabled:mercoa-cursor-not-allowed disabled:mercoa-opacity-30 disabled:hover:mercoa-bg-white"
                onClick={() => {
                  handleRestoreAsDraft()
                }}
              >
                Restore as Draft
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
    </div>
  )
}

export function GroupPayablesTable({
  search,
  metadata,
  startDate,
  endDate,
  onSelectInvoice,
  columns,
  children,
}: {
  search?: string
  metadata?: Mercoa.MetadataFilter[]
  startDate?: Date
  endDate?: Date
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => any
  columns?: InvoiceTableColumn[]
  children?: (props: PayablesTableV1ChildrenProps) => ReactElement | null
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
    if (!mercoaSession.token) return
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
            payerId: entityId,
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
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    let startingAfter = ''
    let invoices: Mercoa.InvoiceResponse[] = []

    getNextPage()

    async function getNextPage() {
      if (!mercoaSession.token || !mercoaSession.entityGroup?.id) return

      const filter = {
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        limit: 100,
        startingAfter,
        excludeReceivables: true,
        metadata: metadata as any,
      }

      const response = await mercoaSession.client?.entityGroup.invoice.find(mercoaSession.entityGroup.id, filter)

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
      excludeReceivables: true,
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
      page,
      setPage: (page: number) => {
        if (!invoices) return
        setPage(page)
      },
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      selectedInvoiceStatuses: currentStatuses,
      setSelectedInvoiceStatues: setCurrentStatuses,
      downloadCSV: downloadAsCSV,
      count,
    })
  }

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
    // Return false if invoices is undefined or is an empty array
    if (!invoices || invoices.length === 0) return false
    return invoices.some((invoice) => {
      if (column.field.startsWith('metadata.')) return true
      if (invoice.hasOwnProperty(`${column.field}` as keyof Mercoa.InvoiceResponse) && column.format) {
        return column.format(invoice[`${column.field}` as keyof Mercoa.InvoiceResponse] as any, invoice)
      }
      return invoice.hasOwnProperty(`${column.field}` as keyof Mercoa.InvoiceResponse)
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
                toDisplay = !!toDisplay
                  ? accounting.formatMoney(toDisplay ?? '', currencyCodeToSymbol(invoice.currency))
                  : '-'
              } else if (toDisplay instanceof Date) {
                toDisplay = dayjs(toDisplay).format('MMM DD, YYYY')
              } else if (typeof toDisplay === 'object') {
                if (toDisplay.name) {
                  toDisplay = toDisplay.name
                } else {
                  toDisplay = JSON.stringify(toDisplay)
                }
              } else {
                toDisplay = toDisplay?.toString() ?? '-'
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

export function InvoiceStatusPill({
  status,
  failureType,
  amount,
  payerId,
  vendorId,
  dueDate,
  paymentSourceId,
  paymentDestinationId,
  type,
  skipValidation,
}: {
  status: Mercoa.InvoiceStatus
  failureType?: Mercoa.InvoiceFailureType
  amount?: number
  payerId?: string
  vendorId?: string
  dueDate?: Date
  paymentSourceId?: string
  paymentDestinationId?: string
  type?: 'payable' | 'receivable'
  skipValidation?: boolean
}) {
  const counterparty = type === 'receivable' ? payerId : vendorId
  let backgroundColor = 'mercoa-bg-gray-100'
  let textColor = 'mercoa-text-black'
  let message = ''
  if (!status || status === Mercoa.InvoiceStatus.Draft) {
    if (skipValidation) {
      backgroundColor = 'mercoa-bg-gray-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Draft'
    } else if (!counterparty || !amount || !dueDate) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Draft Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Draft Ready'
    }
  } else if (status === Mercoa.InvoiceStatus.New) {
    if (skipValidation) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Ready for Review'
    } else if (!paymentSourceId || !counterparty || !amount || !dueDate) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Ready for Review'
    }
  } else if (status === Mercoa.InvoiceStatus.Approved) {
    if (skipValidation) {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Approved'
    }
    // AP Validation
    else if (
      type === 'payable' &&
      (!paymentSourceId || !paymentDestinationId || !counterparty || !amount || !dueDate)
    ) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Incomplete'
    }
    // AR Validation (don't require paymentSourceId)
    else if (type === 'receivable' && (!paymentDestinationId || !counterparty || !amount || !dueDate)) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Incomplete'
    }
    // Fallthrough
    else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = type === 'receivable' ? 'Out for Payment' : 'Ready for Payment'
    }
  } else if (status === Mercoa.InvoiceStatus.Scheduled) {
    if (skipValidation) {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Payment Scheduled'
    }
    // AP Validation
    else if (
      type === 'payable' &&
      (!paymentSourceId || !paymentDestinationId || !counterparty || !amount || !dueDate)
    ) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Incomplete'
    }
    // AR Validation (don't require paymentSourceId)
    else if (type === 'receivable' && (!paymentDestinationId || !counterparty || !amount || !dueDate)) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Incomplete'
    }
    // Fallthrough
    else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Payment Scheduled'
    }
  } else if (status === Mercoa.InvoiceStatus.Pending) {
    backgroundColor = 'mercoa-bg-yellow-100'
    textColor = 'mercoa-text-gray-800'
    message = 'Payment Processing'
  } else if (status === Mercoa.InvoiceStatus.Paid) {
    backgroundColor = 'mercoa-bg-green-100'
    textColor = 'mercoa-text-green-800'
    message = 'Paid'
  } else if (status === Mercoa.InvoiceStatus.Canceled) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Canceled'
  } else if (status === Mercoa.InvoiceStatus.Archived) {
    backgroundColor = 'mercoa-bg-gray-100'
    textColor = 'mercoa-text-black'
    message = 'Archived'
  } else if (status === Mercoa.InvoiceStatus.Refused) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Rejected'
  } else if (status === Mercoa.InvoiceStatus.Failed) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Failed'
    if (failureType === Mercoa.InvoiceFailureType.InsufficientFunds) {
      message = 'Insufficient Funds'
    } else if (failureType === Mercoa.InvoiceFailureType.ProcessingError) {
      message = 'Processing Error'
    } else if (failureType === Mercoa.InvoiceFailureType.DestinationPaymentError) {
      message = 'Destination Payment Error'
    } else if (failureType === Mercoa.InvoiceFailureType.SourcePaymentError) {
      message = 'Source Payment Error'
    } else if (failureType === Mercoa.InvoiceFailureType.RejectedHighRisk) {
      message = 'Rejected High Risk'
    }
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
  children?: ({ metrics }: { metrics?: Mercoa.InvoiceMetricsResponse[] }) => JSX.Element
}) {
  // default to AP
  if (typeof excludePayables === 'undefined' && typeof excludeReceivables === 'undefined') {
    excludeReceivables = true
  }

  const mercoaSession = useMercoaSession()

  const [invoiceMetrics, setInvoiceMetrics] = useState<Mercoa.InvoiceMetricsResponse[]>()

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
    if (metrics.length < 2) {
      return accounting.formatMoney(metrics[0][key] ?? 0 ?? '', currencyCodeToSymbol(metrics[0].currency))
    }
    return (
      <div>
        {metrics.map((metric, index) => {
          const statuses = metric.group?.map((e) => e.status) ?? []
          return (
            <p key={metric.currency + metric.group?.join('-')} className="mercoa-text-xs">
              {statuses.length > 1 && <span className="mercoa-text-gray-600">{statuses.join(', ')}: </span>}
              <span className="mercoa-text-gray-900">
                {accounting.formatMoney(metric[key] ?? 0 ?? '', currencyCodeToSymbol(metric.currency))}
              </span>
              <span className="mercoa-text-gray-500"> {metric.currency}</span>
            </p>
          )
        })}
      </div>
    )
  }

  useEffect(() => {
    setInvoiceMetrics(undefined)
    if (!mercoaSession.token || !mercoaSession.entity?.id) return

    // TODO: Make this work for invoices vs. invoice templates
    mercoaSession.client?.entity.invoice
      .metrics(mercoaSession.entity.id, {
        search,
        status: statuses,
        returnByDate,
        excludeReceivables,
        excludePayables,
        groupBy: ['STATUS'],
      })
      .then((metrics) => {
        setInvoiceMetrics(metrics)
      })
  }, [search, statuses, mercoaSession.token, mercoaSession.entity, mercoaSession.refreshId])

  if (children) return children({ metrics: invoiceMetrics })

  if (!mercoaSession.client) return <NoSession componentName="InvoiceMetrics" />
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
  invoiceType = 'invoice',
  statuses,
  selectedStatus,
  search,
  onStatusChange,
  excludePayables,
  excludeReceivables,
}: {
  invoiceType?: 'invoice' | 'invoiceTemplate'
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
    mercoaSession.client?.entity.invoice
      .metrics(mercoaSession.entity.id, {
        search,
        status: tabs,
        excludeReceivables,
        excludePayables,
        groupBy: ['STATUS'],
      })
      .then((metrics) => {
        const results = (statuses ?? Object.keys(Mercoa.InvoiceStatus)).map((status) => {
          const metric: Mercoa.InvoiceMetricsResponse = {
            totalAmount: 0,
            totalCount: 0,
            averageAmount: 0,
            currency: 'USD',
          }
          metrics.forEach((e) => {
            if (e.group?.some((e) => e.status === status.toUpperCase())) {
              metric.totalAmount += Number(e.totalAmount)
              metric.totalCount += Number(e.totalCount)
            }
          })
          return [status.toUpperCase() as string, metric]
        })
        const out = Object.fromEntries(results) as {
          [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
        }
        setInvoiceMetrics(out)
      })
  }, [search, tabs, mercoaSession.client, mercoaSession.entity, mercoaSession.refreshId])

  if (!mercoaSession.client) return <NoSession componentName="StatusTabs" />
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
          className="mercoa-block mercoa-w-full mercoa-rounded-mercoa mercoa-border-gray-300 mercoa-py-1 mercoa-pl-3 mercoa-pr-10 mercoa-text-base focus:mercoa-border-mercoa-primary focus:mercoa-outline-none focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
          defaultValue={selectedStatuses}
          multiple
          onChange={(e) => {
            setSelectedStatuses([e.target.value as Mercoa.InvoiceStatus])
          }}
        >
          {tabs.map((status) => (
            <option key={status} value={status}>
              {invoiceStatusToName({ status, approvalPolicies, excludePayables, invoiceType })}
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
                invoiceStatusToName({ status, approvalPolicies, excludePayables, invoiceType }) == selectedStatuses[0]
                  ? 'page'
                  : undefined
              }
            >
              {invoiceStatusToName({ status, approvalPolicies, excludePayables, invoiceType })}{' '}
              {invoiceType === 'invoice' && (
                <CountPill count={invoiceMetrics?.[status]?.totalCount ?? 0} selected={status == selectedStatuses[0]} />
              )}
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
    UNASSIGNED: '#E0E7FF',
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
        showAllOptions
      />
    </>
  )
}

export function PayablesV1({
  statuses,
  onSelectInvoice,
  onSelectInvoiceType,
  statusSelectionStyle,
  columns,
  showRecurringTemplates,
}: {
  statuses?: Array<Mercoa.InvoiceStatus>
  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse, isMiddleClick?: boolean) => any
  onSelectInvoiceType?: (invoiceType: 'invoice' | 'invoiceTemplate') => any
  statusSelectionStyle?: 'tabs' | 'dropdown'
  columns?: InvoiceTableColumn[]
  showRecurringTemplates?: boolean
}) {
  const mercoaSession = useMercoaSession()
  const [selectedStatuses, setSelectedStatuses] = useState<Mercoa.InvoiceStatus[]>([Mercoa.InvoiceStatus.Draft])
  const [search, setSearch] = useState<string>('')
  const [invoiceType, setInvoiceType] = useState<'invoice' | 'invoiceTemplate'>('invoice')

  // Filter unavailable statuses for invoice templates
  const invoiceTemplateStatuses: Mercoa.InvoiceStatus[] = [
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
  ]
  const availableStatuses =
    invoiceType === 'invoiceTemplate'
      ? statuses?.filter((status) => invoiceTemplateStatuses.includes(status))
      : statuses

  const handleInvoiceTypeChange = (invoiceType: 'invoice' | 'invoiceTemplate') => {
    if (onSelectInvoiceType) {
      onSelectInvoiceType(invoiceType)
    }
    setInvoiceType(invoiceType)
  }

  return (
    <div className="mercoa-mt-8">
      {mercoaSession.entityGroup && !mercoaSession.entity ? (
        <GroupPayablesTable search={search} onSelectInvoice={onSelectInvoice} columns={columns} />
      ) : (
        <>
          <div className="mercoa-grid mercoa-items-center mercoa-grid-cols-3">
            <div className="mercoa-col-span-2 mercoa-grid mercoa-grid-cols-2">
              {/* Status Dropdown */}
              {statusSelectionStyle === 'dropdown' && (
                <div className="mercoa-hidden md:mercoa-block">
                  <StatusDropdown availableStatuses={availableStatuses} onStatusChange={setSelectedStatuses} multiple />
                </div>
              )}
              {/* Invoice Type Selector */}
              {showRecurringTemplates && (
                <div
                  className={`mercoa-flex ${
                    statusSelectionStyle === 'dropdown' ? 'mercoa-justify-center' : 'mercoa-justify-left'
                  }`}
                >
                  <div className="mercoa-border mercoa-border-gray-300 mercoa-rounded-lg mercoa-overflow-hidden">
                    <MercoaButton
                      hideOutline
                      isEmphasized={invoiceType === 'invoice'}
                      size="md"
                      onClick={() => handleInvoiceTypeChange('invoice')}
                    >
                      Invoices
                    </MercoaButton>
                    <MercoaButton
                      hideOutline
                      isEmphasized={invoiceType === 'invoiceTemplate'}
                      size="md"
                      onClick={() => handleInvoiceTypeChange('invoiceTemplate')}
                    >
                      Recurring Invoices
                    </MercoaButton>
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="mercoa-flex mercoa-w-full mercoa-rounded-mercoa mercoa-shadow-sm mercoa-border-mercoa-primary mercoa-mr-2 mercoa-col-span-3 md:mercoa-col-span-1">
              <DebouncedSearch placeholder="Search Vendors, Invoice #, Amount" onSettle={setSearch} />
            </div>
          </div>

          {/* Status Tabs */}
          {statusSelectionStyle !== 'dropdown' && (
            <StatusTabs
              invoiceType={invoiceType}
              statuses={availableStatuses}
              search={search}
              onStatusChange={setSelectedStatuses}
              excludeReceivables
            />
          )}
          {invoiceType === 'invoice' && (
            <InvoiceMetrics statuses={selectedStatuses} search={search} excludeReceivables />
          )}
          <PayablesTableV1
            invoiceType={invoiceType}
            statuses={selectedStatuses}
            search={search}
            onSelectInvoice={onSelectInvoice}
            columns={columns}
          />
        </>
      )}
    </div>
  )
}
