import {
  ColumnDef,
  ColumnResizeDirection,
  ColumnResizeMode,
  flexRender,
  getCoreRowModel,
  Table,
  useReactTable,
} from '@tanstack/react-table'
import accounting from 'accounting'
import dayjs from 'dayjs'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceStatusPill } from '../../../../components/Payables'
import { cn } from '../../../../lib/style'

import {
  ArrowsUpDownIcon as ArrowUpDown,
  BarsArrowUpIcon as SortAscending,
  BarsArrowDownIcon as SortDescending,
} from '@heroicons/react/24/outline'
import { toast as reactToast } from 'react-toastify'
import { currencyCodeToSymbol } from '../../../../../src/lib/currency'
import { Tooltip } from '../../../../components/generics'
import { useMercoaSession } from '../../../../components/Mercoa'
import { SkeletonLoader } from '../../../../lib/components'
import { ResultsInfo } from '../../../common/components/results-info'
import { usePayables } from '../../hooks'
import { filterApproverOptions } from '../payable-form/components/payable-approvers/utils'
import { Pagination, ResultsPerPageDropdown } from './components'
import { ApproveBillsDialog } from './components/approve-action-dialog'
import { ArchiveInvoiceDialog } from './components/archive-action-dialog'
import { AssignApproverDialog } from './components/assign-approver-dialog'
import { CancelInvoiceDialog } from './components/cancel-action-dialog'
import { DeleteInvoiceDialog } from './components/delete-action-dialog'
import { RejectBillsDialog } from './components/reject-action-dialog'
import { RestoreAsDraftDialog } from './components/restore-as-draft-action-dialog'
import { SchedulePaymentDialog } from './components/schedule-action-dialog'
import { SetPaymentDateDialog } from './components/set-payment-date-action-dialog'
import { SubmitForApprovalDialog } from './components/submit-for-approval-dialog'
import { TableActionsBar } from './components/table-actions-bar'
import { TableActionDropdown } from './components/table-actions-dropdown'
import { PayablesTableAction } from './constants'
import { getAvailableActions } from './utils'

export const PayablesTable: FC = memo(() => {
  const { dataContextValue, propsContextValue, selectionContextValue, actionsContextValue, paginationContextValue } =
    usePayables()

  const { tableData: data, isDataLoading, isFetching, isFetchingNextPage, allFetchedInvoices } = dataContextValue

  const { handlers, config, renderCustom, displayOptions } = propsContextValue

  const {
    orderBy,
    setOrderBy,
    orderDirection,
    handleOrderByChange,
    resultsPerPage,
    setResultsPerPage,
    page,
    totalEntries,
    goToNextPage,
    goToPreviousPage,
    isNextDisabled,
    isPrevDisabled,
  } = paginationContextValue

  const { isAllSelected, selectedInvoices, selectedColumns, setSelectedInvoices, handleSelectRow, handleSelectAll } =
    selectionContextValue

  const {
    submitForApproval,
    isSubmitForApprovalLoading,
    bulkSubmitForApproval,
    isBulkSubmitForApprovalLoading,
    schedulePayment,
    isSchedulePaymentLoading,
    bulkSchedulePayment,
    isBulkSchedulePaymentLoading,
    approvePayable,
    isApprovePayableLoading,
    bulkApprovePayables,
    isBulkApprovePayablesLoading,
    rejectPayable,
    isRejectPayableLoading,
    bulkRejectPayables,
    isBulkRejectPayablesLoading,
    deletePayable,
    isDeletePayableLoading,
    bulkDeletePayables,
    isBulkDeletePayableLoading,
    restoreAsDraft,
    isRestoreAsDraftLoading,
    bulkRestoreAsDraft,
    isBulkRestoreAsDraftLoading,
    activeInvoiceAction,
    setActiveInvoiceAction,
    assignApprover,
    isAssignApproverLoading,
    bulkAssignApprover,
    isBulkAssignApproverLoading,
    archivePayable,
    isArchivePayableLoading,
    bulkArchivePayables,
    isBulkArchivePayablesLoading,
    cancelPayable,
    isCancelPayableLoading,
    bulkCancelPayables,
    isBulkCancelPayablesLoading,
  } = actionsContextValue

  const { readOnly } = config ?? {}
  const { columns, toast: customToast } = renderCustom ?? {}
  const { classNames } = displayOptions ?? {}

  const toast = customToast ?? reactToast

  const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [columnResizeDirection, setColumnResizeDirection] = useState<ColumnResizeDirection>('ltr')

  const mercoaSession = useMercoaSession()

  const getSortIcon = useCallback(
    (field: Mercoa.InvoiceOrderByField) => {
      if (orderBy === field) {
        return orderDirection === Mercoa.OrderDirection.Asc ? (
          <SortAscending className="mercoa-h-4 mercoa-w-4" />
        ) : (
          <SortDescending className="mercoa-h-4 mercoa-w-4" />
        )
      }
      return <ArrowUpDown className="mercoa-h-4 mercoa-w-4" />
    },
    [orderBy, orderDirection],
  )

  const defaultTableColumns = useMemo<ColumnDef<(typeof data)[0]>[]>(() => {
    const cols: ColumnDef<(typeof data)[0]>[] = [
      ...(readOnly
        ? []
        : [
            {
              accessorKey: 'select',
              header: () => (
                <div
                  className="mercoa-flex mercoa-p-1 mercoa-justify-center mercoa-items-center mercoa-cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelectAll()
                  }}
                >
                  <input
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    type="checkbox"
                    className={cn(
                      'mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-transparent mercoa-cursor-pointer',
                      classNames?.checkbox,
                    )}
                    checked={isAllSelected}
                    onChange={(e) => {
                      handleSelectAll()
                      e.stopPropagation()
                    }}
                  />
                </div>
              ),
              cell: ({
                row,
              }: {
                row: {
                  original: {
                    invoice?: Mercoa.InvoiceResponse
                  }
                }
              }) => (
                <div
                  className="mercoa-flex mercoa-p-1 mercoa-justify-center mercoa-items-center"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (row.original.invoice) {
                      handleSelectRow(row.original.invoice)
                    }
                  }}
                >
                  <input
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    type="checkbox"
                    className={cn(
                      'mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-transparent mercoa-cursor-pointer',
                      classNames?.checkbox,
                    )}
                    checked={selectedInvoices.some((e) => row.original.invoice && e.id === row.original.invoice.id)}
                    onChange={(e) => {
                      if (row.original.invoice) {
                        handleSelectRow(row.original.invoice)
                      }
                      e.stopPropagation()
                    }}
                  />
                </div>
              ),
              size: 10,
              maxSize: 10,
              meta: { align: 'center' },
              enableResizing: false,
            },
          ]),
      {
        accessorKey: 'vendor',
        header: () => (
          <div
            className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
            onClick={() => handleOrderByChange(Mercoa.InvoiceOrderByField.VendorName)}
          >
            <span>Vendor / Owner</span>
            <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
              {getSortIcon(Mercoa.InvoiceOrderByField.VendorName)}
            </div>
          </div>
        ),
        cell: ({ row }) => {
          const generateColor = (name: string) => {
            if (!name) return '#E8E1D9'

            let hash = 0
            for (let i = 0; i < name.length; i++) {
              hash = name.charCodeAt(i) + ((hash << 5) - hash)
            }

            const color = `hsl(${hash % 360}, 60%, 70%)`
            return color
          }

          const getInitials = (name: string) => {
            return name
              ? name
                  .split(' ', 2)
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase()
              : ''
          }

          return (
            <div className="mercoa-flex mercoa-items-center mercoa-gap-2 mercoa-py-[8px]">
              <div
                className="mercoa-w-6 mercoa-h-6 mercoa-rounded-full mercoa-flex mercoa-items-center mercoa-justify-center mercoa-text-[11px]"
                style={{ backgroundColor: generateColor(row.original.vendor?.name ?? '') }}
              >
                {getInitials(row.original.vendor?.name ?? '')}
              </div>
              <div className="mercoa-flex-col mercoa-gap-1">
                <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-800">{row.original.vendor?.name}</p>
              </div>
            </div>
          )
        },
        enableResizing: true,
      },
      {
        accessorKey: 'invoiceNumber',
        header: () => (
          <div
            className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
            onClick={() => handleOrderByChange(Mercoa.InvoiceOrderByField.InvoiceNumber)}
          >
            <span>Invoice #</span>
            <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
              {getSortIcon(Mercoa.InvoiceOrderByField.InvoiceNumber)}
            </div>
          </div>
        ),
        cell: ({ row }) => <span className="mercoa-text-sm">{row.original.invoiceNumber}</span>,
        enableResizing: true,
      },
      {
        accessorKey: 'dueDate',
        header: () => (
          <div
            className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
            onClick={() => handleOrderByChange(Mercoa.InvoiceOrderByField.DueDate)}
          >
            <span>Due Date</span>
            <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
              {getSortIcon(Mercoa.InvoiceOrderByField.DueDate)}
            </div>
          </div>
        ),
        cell: ({ row }) => (
          <span className="mercoa-text-sm">
            {row.original.dueDate ? dayjs(row.original.dueDate).format('MMM DD, YYYY') : '-'}
          </span>
        ),
        enableResizing: true,
      },
      {
        accessorKey: 'invoiceDate',
        header: () => (
          <div
            className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
            onClick={() => handleOrderByChange(Mercoa.InvoiceOrderByField.InvoiceDate)}
          >
            <span>Invoice Date</span>
            <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
              {getSortIcon(Mercoa.InvoiceOrderByField.InvoiceDate)}
            </div>
          </div>
        ),
        cell: ({ row }) => (
          <span className="mercoa-text-sm">
            {row.original.invoiceDate ? dayjs(row.original.invoiceDate).format('MMM DD, YYYY') : '-'}
          </span>
        ),
        enableResizing: true,
      },
      {
        accessorKey: 'deductionDate',
        header: () => (
          <div
            className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
            onClick={() => handleOrderByChange(Mercoa.InvoiceOrderByField.DeductionDate)}
          >
            <span>Deduction Date</span>
            <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
              {getSortIcon(Mercoa.InvoiceOrderByField.DeductionDate)}
            </div>
          </div>
        ),
        cell: ({ row }) => (
          <span className="mercoa-text-sm">
            {row.original.deductionDate ? dayjs(row.original.deductionDate).format('MMM DD, YYYY') : '-'}
          </span>
        ),
        enableResizing: true,
      },
      {
        accessorKey: 'amount',
        header: () => (
          <div
            className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
            onClick={() => handleOrderByChange(Mercoa.InvoiceOrderByField.Amount)}
          >
            <span>Amount</span>
            <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
              {getSortIcon(Mercoa.InvoiceOrderByField.Amount)}
            </div>
          </div>
        ),
        cell: ({ row }) => (
          <span className="mercoa-text-sm">
            {accounting.formatMoney(row.original.amount ?? '', currencyCodeToSymbol(row.original.currencyCode))}
          </span>
        ),
        enableResizing: true,
      },
      {
        accessorKey: 'approvers',
        header: 'Approvers',
        cell: ({ row }) => {
          if (row.original.approvers?.length === 0) {
            return null
          }
          return (
            // TODO: Handle many approvers in a better way
            // <div className="mercoa-gap-1 mercoa-grid mercoa-max-h-[32px] mercoa-overflow-y-auto">
            <div className="mercoa-gap-1 mercoa-grid mercoa-my-1">
              {row.original.approvers?.map((approver, index) => {
                if (!approver.assignedUserId) {
                  const eligibleApprovers = filterApproverOptions({
                    approverSlotIndex: index,
                    eligibleRoles: approver.eligibleRoles,
                    eligibleUserIds: approver.eligibleUserIds,
                    users: mercoaSession.users,
                    selectedApprovers: [],
                  })
                  return (
                    <Tooltip
                      title={eligibleApprovers.map((e) => e.user.email).join(', ')}
                      key={approver.approvalSlotId}
                    >
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
        enableResizing: true,
      },
      {
        accessorKey: 'paymentDestination',
        header: 'Payment Destination',
        cell: ({ row }) => {
          const pm = row.original.paymentDestination as Mercoa.PaymentMethodResponse

          if (!pm || !pm.type) return null

          switch (pm.type) {
            case Mercoa.PaymentMethodType.BankAccount:
              return (
                <span>
                  {pm.bankName} ••••{String(pm.accountNumber).slice(-4)}
                </span>
              )

            case Mercoa.PaymentMethodType.Check:
              return <span>Check • {String(pm.addressLine1).slice(0, 15)}</span>

            case Mercoa.PaymentMethodType.Custom:
              return (
                <span>
                  {pm.accountName} ••••{String(pm.accountNumber).slice(-4)}
                </span>
              )

            default:
              return null
          }
        },
        enableResizing: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          return (
            <InvoiceStatusPill
              failureType={row.original.failureType}
              status={row.original.status}
              vendorId={row.original.vendorId}
              payerId={row.original.payerId}
              paymentDestinationId={row.original.paymentDestinationId}
              paymentSourceId={row.original.paymentSourceId}
              dueDate={row.original.dueDate}
              amount={row.original.amount}
              type="payable"
            />
          )
        },
        enableResizing: true,
      },
      ...(readOnly
        ? []
        : [
            {
              accessorKey: 'action',
              header: 'Actions',
              size: 10,
              maxSize: 10,
              meta: { align: 'center' },
              cell: ({ row }: { row: any }) => {
                return (
                  <TableActionDropdown
                    isDisabled={selectedInvoices.length > 0}
                    validActions={getAvailableActions({
                      rolePermissions: mercoaSession.userPermissionConfig,
                      selectedInvoices: [row.original.invoice],
                      currentStatuses: [row.original.status],
                      currentUserId: mercoaSession.user?.id,
                      users: mercoaSession.users,
                    })}
                    onAction={(actionKey) => {
                      if (actionKey === PayablesTableAction.Delete) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Delete,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Approve) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Approve,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.SchedulePayment) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.SchedulePayment,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.SetPaymentDate) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.SetPaymentDate,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.SubmitForApproval) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.SubmitForApproval,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.AddApprover) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.AddApprover,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Archive) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Archive,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Cancel) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Cancel,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Reject) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Reject,
                          mode: 'single',
                        })
                      }
                    }}
                  />
                )
              },
              enableResizing: false,
            },
          ]),
    ]

    return cols.filter((col: any) => {
      return (
        selectedColumns.map((scol) => scol.field).includes(col.accessorKey) ||
        ['select', 'action'].includes(col.accessorKey)
      )
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    classNames?.checkbox,
    deletePayable,
    handleSelectAll,
    handleSelectRow,
    isAllSelected,
    selectedColumns,
    selectedInvoices,
    orderBy,
    orderDirection,
    setOrderBy,
    columns,
  ])

  const tableColumns = useMemo<ColumnDef<(typeof data)[0]>[]>(() => {
    const cols: ColumnDef<(typeof data)[0]>[] = [
      ...(readOnly
        ? []
        : [
            {
              id: 'select',
              accessorKey: 'select',
              header: () => (
                <div
                  className="mercoa-flex mercoa-p-1 mercoa-justify-center mercoa-items-center mercoa-cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelectAll()
                  }}
                >
                  <input
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    type="checkbox"
                    className={cn(
                      'mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-transparent mercoa-cursor-pointer',
                      classNames?.checkbox,
                    )}
                    checked={isAllSelected}
                    onChange={(e) => {
                      handleSelectAll()
                      e.stopPropagation()
                    }}
                  />
                </div>
              ),
              cell: ({
                row,
              }: {
                row: {
                  original: {
                    invoice?: Mercoa.InvoiceResponse
                  }
                }
              }) => (
                <div
                  className="mercoa-flex mercoa-p-1 mercoa-justify-center mercoa-items-center"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (row.original.invoice) {
                      handleSelectRow(row.original.invoice)
                    }
                  }}
                >
                  <input
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    type="checkbox"
                    className={cn(
                      'mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-transparent mercoa-cursor-pointer',
                      classNames?.checkbox,
                    )}
                    checked={selectedInvoices.some((e) => row.original.invoice && e.id === row.original.invoice.id)}
                    onChange={(e) => {
                      if (row.original.invoice) {
                        handleSelectRow(row.original.invoice)
                      }
                      e.stopPropagation()
                    }}
                  />
                </div>
              ),
              size: 10,
              maxSize: 10,
              meta: { align: 'center' },
              enableResizing: false,
            },
          ]),
      ...(columns?.map((ele) => {
        return {
          id: ele.field,
          accessorKey: ele.field,
          header: () => {
            return (
              <>
                {ele.orderBy ? (
                  <div
                    className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
                    onClick={() => handleOrderByChange(ele.orderBy as Mercoa.InvoiceOrderByField)}
                  >
                    <span>{ele.header}</span>
                    <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
                      {getSortIcon(ele.orderBy)}
                    </div>
                  </div>
                ) : (
                  <>{ele.header}</>
                )}
              </>
            )
          },
          cell: ({ row }: { row: any }) => {
            let toDisplay: any = ''
            if (ele.field.startsWith('metadata.')) {
              toDisplay = JSON.stringify(row.original.invoice?.metadata?.[ele.field.split('.')[1]])
            } else {
              toDisplay = row.original.invoice?.[ele.field as keyof Mercoa.InvoiceResponse]
            }
            if (ele.cell && row.original.invoice) {
              toDisplay = ele.cell(toDisplay, row.original.invoice)
            } else {
              if (ele.field === 'amount') {
                toDisplay = accounting.formatMoney(
                  toDisplay ?? '',
                  currencyCodeToSymbol(row.original.invoice?.currency ?? ''),
                )
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
              if (ele.field === 'approvers') {
                return (
                  <div className="mercoa-gap-1 mercoa-grid mercoa-my-1">
                    {row.original.approvers?.map((approver: any, index: number) => {
                      if (!approver.assignedUserId) {
                        const eligibleApprovers = filterApproverOptions({
                          approverSlotIndex: index,
                          eligibleRoles: approver.eligibleRoles,
                          eligibleUserIds: approver.eligibleUserIds,
                          users: mercoaSession.users,
                          selectedApprovers: [],
                        })
                        return (
                          <Tooltip
                            title={eligibleApprovers.map((e) => e.user.email).join(', ')}
                            key={approver.approvalSlotId}
                          >
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
                              approver.action === Mercoa.ApproverAction.Reject
                                ? 'mercoa-bg-red-100 mercoa-text-red-800'
                                : ''
                            } ${
                              approver.action === Mercoa.ApproverAction.None
                                ? 'mercoa-bg-gray-50 mercoa-text-gray-800'
                                : ''
                            } mercoa-py-1 mercoa-px-2`}
                          >
                            {user?.name}
                          </div>
                        </Tooltip>
                      )
                    })}
                  </div>
                )
              }
              if (ele.field === 'status') {
                return (
                  <InvoiceStatusPill
                    failureType={row.original.failureType}
                    status={row.original.status}
                    vendorId={row.original.vendorId}
                    payerId={row.original.payerId}
                    paymentDestinationId={row.original.paymentDestinationId}
                    paymentSourceId={row.original.paymentSourceId}
                    dueDate={row.original.dueDate}
                    amount={row.original.amount}
                    type="payable"
                  />
                )
              }
              if (ele.field === 'paymentDestination' || ele.field === 'paymentSource') {
                const pm = row.original.invoice[
                  ele.field as keyof Mercoa.InvoiceResponse
                ] as Mercoa.PaymentMethodResponse
                if (!pm || !pm.type) return null

                switch (pm.type) {
                  case Mercoa.PaymentMethodType.BankAccount:
                    return (
                      <span>
                        {pm.bankName} ••••{String(pm.accountNumber).slice(-4)}
                      </span>
                    )

                  case Mercoa.PaymentMethodType.Check:
                    return <span>Check • {String(pm.addressLine1).slice(0, 15)}</span>

                  case Mercoa.PaymentMethodType.Custom:
                    return (
                      <span>
                        {pm.accountName} ••••{String(pm.accountNumber).slice(-4)}
                      </span>
                    )

                  default:
                    return null
                }
              }
            }

            return <span className="mercoa-text-sm">{toDisplay}</span>
          },
        }
      }, []) ?? []),
      ...(readOnly
        ? []
        : [
            {
              id: 'action',
              accessorKey: 'action',
              header: 'Actions',
              size: 10,
              maxSize: 10,
              meta: { align: 'center' },
              cell: ({ row }: { row: any }) => {
                return (
                  <TableActionDropdown
                    isDisabled={selectedInvoices.length > 0}
                    validActions={getAvailableActions({
                      rolePermissions: mercoaSession.userPermissionConfig,
                      selectedInvoices: [row.original.invoice],
                      currentStatuses: [row.original.status],
                      currentUserId: mercoaSession.user?.id,
                      users: mercoaSession.users,
                    })}
                    onAction={(actionKey) => {
                      if (actionKey === PayablesTableAction.Delete) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Delete,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Approve) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Approve,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.SchedulePayment) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.SchedulePayment,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.SetPaymentDate) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.SetPaymentDate,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.SubmitForApproval) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.SubmitForApproval,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.AddApprover) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.AddApprover,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Archive) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Archive,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Cancel) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Cancel,
                          mode: 'single',
                        })
                      } else if (actionKey === PayablesTableAction.Reject) {
                        setActiveInvoiceAction({
                          invoiceId: row.original.invoiceId,
                          action: PayablesTableAction.Reject,
                          mode: 'single',
                        })
                      }
                    }}
                  />
                )
              },
              enableResizing: false,
            },
          ]),
    ]

    return cols.filter((col: any) => {
      return (
        selectedColumns.map((scol) => scol.field).includes(col.accessorKey) ||
        ['select', 'action'].includes(col.accessorKey)
      )
    })
  }, [
    classNames?.checkbox,
    deletePayable,
    handleSelectAll,
    handleSelectRow,
    isAllSelected,
    selectedColumns,
    selectedInvoices,
    orderBy,
    orderDirection,
    setOrderBy,
    columns,
  ])

  const table = useReactTable({
    data: data,
    columns: columns ? tableColumns : defaultTableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    columnResizeDirection,
  })

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders()
    const colSizes: { [key: string]: number } = {}
    headers.forEach((header) => {
      colSizes[`--header-${header.id}-size`] = header.getSize()
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize()
    })
    return colSizes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnSizingInfo, table.getState().columnSizing])

  const validActions = getAvailableActions({
    rolePermissions: mercoaSession.userPermissionConfig,
    selectedInvoices,
    currentStatuses: allFetchedInvoices.map((e) => e.status),
    currentUserId: mercoaSession.user?.id,
    users: mercoaSession.users,
  })

  return (
    <div className="mercoa-relative">
      {data.length === 0 && !isFetchingNextPage && !isDataLoading && !isFetching ? (
        <div className="mercoa-flex mercoa-flex-col mercoa-items-center mercoa-justify-center mercoa-py-12 mercoa-h-[522px]">
          <p className="mercoa-text-gray-500 mercoa-text-sm">No Payables Found</p>
        </div>
      ) : (
        <>
          {/* Selected Invoices Overlay */}
          <TableActionsBar
            selectedInvoices={selectedInvoices}
            setSelectedInvoices={setSelectedInvoices}
            validActions={validActions}
            setActiveInvoiceAction={setActiveInvoiceAction}
          />

          {/* Table Content */}
          <div className="mercoa-overflow-x-auto mercoa-overflow-y-auto mercoa-h-[522px]">
            <table
              className={cn('mercoa-w-full mercoa-border mercoa-border-gray-200 ', classNames?.table?.root)}
              style={{
                ...columnSizeVars,
                width: table.getTotalSize(),
                minWidth: '100%',
              }}
            >
              <thead className={cn('mercoa-w-full mercoa-border mercoa-border-gray-200 ', classNames?.table?.thead)}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className={cn('mercoa-border-b mercoa-border-gray-200', classNames?.table?.tr)}
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(
                          'mercoa-bg-white hover:mercoa-bg-gray-50 mercoa-cursor-pointer mercoa-relative mercoa-font-bold mercoa-border-r mercoa-whitespace-nowrap mercoa-text-left mercoa-px-4 mercoa-py-2 mercoa-text-gray-500 mercoa-text-xs mercoa-leading-4 mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[32px]',
                          classNames?.table?.th,
                          header.id === 'action' && 'mercoa-sticky-right',
                          header.id === 'vendor' && 'mercoa-sticky-left',
                          header.id === 'select' && 'mercoa-sticky-left',
                        )}
                        style={{
                          width: `calc(var(--header-${header.id}-size) * 1px)`,
                          ...(header.id === 'action' && {
                            position: 'sticky',
                            right: 0,
                            width: '50px',
                            zIndex: 1,
                          }),
                          ...(header.id === 'select' && {
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                          }),
                          ...(header.id === 'vendor' && {
                            position: 'sticky',
                            ...(readOnly ? { left: '0px' } : { left: '50px' }),
                            zIndex: 1,
                          }),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanResize() && (
                          <div
                            {...{
                              onDoubleClick: () => header.column.resetSize(),
                              onMouseDown: header.getResizeHandler(),
                              onTouchStart: header.getResizeHandler(),
                              className: cn(
                                'mercoa-absolute mercoa-top-0 mercoa-h-full mercoa-w-[5px] mercoa-right-0 hover:mercoa-border-r-[3px] hover:mercoa-border-r-[#000] hover:mercoa-border-dashed mercoa-cursor-col-resize mercoa-user-select-none mercoa-touch-action-none',
                                header.column.getIsResizing()
                                  ? 'mercoa-border-r-[3px] mercoa-border-r-[#000] mercoa-border-dashed mercoa-opacity-100 mercoa-cursor-col-resize'
                                  : '',
                              ),
                            }}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className={cn('', classNames?.table?.tbody)}>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    onClick={() => row.original.invoice && handlers?.onSelectInvoice?.(row.original.invoice)}
                    key={row.id}
                    className={cn(
                      'mercoa-group mercoa-cursor-pointer mercoa-border-b mercoa-border-gray-200',
                      selectedInvoices.map((e) => e.id).includes(row.original.invoiceId) && 'mercoa-bg-[#fcfbfa]',
                      classNames?.table?.tr,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                      <td
                        onClick={(e: React.MouseEvent) => {
                          if (cell.column.id === 'select') {
                            row.original.invoice && handlers?.onSelectInvoice?.(row.original.invoice)
                            e.stopPropagation()
                          }
                          if (cell.column.id === 'action') {
                            e.stopPropagation()
                          }
                        }}
                        style={{
                          maxHeight: '50px !important',
                          width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                          ...(cell.column.id === 'action' && {
                            position: 'sticky',
                            width: '50px',
                            right: 0,
                            zIndex: 1,
                          }),
                          ...(cell.column.id === 'select' && {
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                          }),
                          ...(cell.column.id === 'vendor' && {
                            position: 'sticky',
                            ...(readOnly ? { left: '0px' } : { left: '50px' }), // After select column
                            zIndex: 1,
                          }),
                        }}
                        key={cell.id}
                        className={cn(
                          'mercoa-bg-white group-hover:mercoa-bg-[#fcfbfa] mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm  mercoa-border-gray-200  mercoa-h-[48px] mercoa-align-middle',
                          classNames?.table?.td,
                          cell.column.id === 'action' && 'mercoa-sticky-right',
                          cell.column.id === 'select' && 'mercoa-sticky-left',
                          cell.column.id === 'vendor' && 'mercoa-sticky-left',
                        )}
                      >
                        <CellRenderer cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {(isDataLoading || isFetchingNextPage) && <TableSkeletonBody table={table} />}
            </table>
          </div>
        </>
      )}

      {/* Table Footer */}
      <div className="mercoa-flex mercoa-gap-4 mercoa-justify-between mercoa-items-center mercoa-mt-4">
        <div className="mercoa-flex mercoa-gap-4 mercoa-items-center">
          <ResultsPerPageDropdown resultsPerPage={resultsPerPage} setResultsPerPage={setResultsPerPage} />
          <ResultsInfo currentPage={page + 1} resultsPerPage={resultsPerPage} totalEntries={totalEntries} />
        </div>
        <div className="mercoa-flex mercoa-gap-4 mercoa-items-center">
          <Pagination
            goToNextPage={goToNextPage}
            goToPrevPage={goToPreviousPage}
            isNextDisabled={isNextDisabled}
            isPrevDisabled={isPrevDisabled}
          />
        </div>
      </div>

      <DeleteInvoiceDialog
        isLoading={activeInvoiceAction?.mode === 'single' ? isDeletePayableLoading : isBulkDeletePayableLoading}
        onConfirm={() => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              deletePayable(
                { invoiceId: activeInvoiceAction.invoiceId as string },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice deleted successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkDeletePayables(
                { invoiceIds: activeInvoiceAction.invoiceId as string[] },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Invoices deleted successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        open={activeInvoiceAction?.action === PayablesTableAction.Delete}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <ApproveBillsDialog
        open={activeInvoiceAction?.action === PayablesTableAction.Approve}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={() => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              approvePayable(
                {
                  invoice: data.find((d) => d.id === activeInvoiceAction.invoiceId)?.invoice!,
                  invoiceType: 'invoice',
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice approved successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkApprovePayables(
                {
                  invoiceIds: activeInvoiceAction.invoiceId as string[],
                  invoiceType: 'invoice',
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Invoices approved successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isApprovePayableLoading : isBulkApprovePayablesLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <RejectBillsDialog
        open={activeInvoiceAction?.action === PayablesTableAction.Reject}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={() => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              rejectPayable(
                {
                  invoice: data.find((d) => d.id === activeInvoiceAction.invoiceId)?.invoice!,
                  invoiceType: 'invoice',
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice rejected successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkRejectPayables(
                {
                  invoiceIds: activeInvoiceAction.invoiceId as string[],
                  invoiceType: 'invoice',
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Invoices rejected successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isRejectPayableLoading : isBulkRejectPayablesLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <SchedulePaymentDialog
        open={activeInvoiceAction?.action === PayablesTableAction.SchedulePayment}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={(date) => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              schedulePayment(
                {
                  invoice: data.find((d) => d.id === activeInvoiceAction.invoiceId)?.invoice!,
                  deductionDate: date,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice scheduled successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkSchedulePayment(
                {
                  invoices: data.filter((d) => activeInvoiceAction.invoiceId.includes(d.id)).map((d) => d.invoice!),
                  deductionDate: date,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                  },
                },
              )
            }
          }
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isSchedulePaymentLoading : isBulkSchedulePaymentLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <SetPaymentDateDialog
        open={activeInvoiceAction?.action === PayablesTableAction.SetPaymentDate}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={(date) => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              schedulePayment(
                {
                  invoice: data.find((d) => d.id === activeInvoiceAction.invoiceId)?.invoice!,
                  deductionDate: date,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice scheduled successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkSchedulePayment(
                {
                  invoices: data.filter((d) => activeInvoiceAction.invoiceId.includes(d.id)).map((d) => d.invoice!),
                  deductionDate: date,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                  },
                },
              )
            }
          }
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isSchedulePaymentLoading : isBulkSchedulePaymentLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <RestoreAsDraftDialog
        open={activeInvoiceAction?.action === PayablesTableAction.RestoreAsDraft}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={() => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              restoreAsDraft(
                {
                  invoice: data.find((d) => d.id === activeInvoiceAction.invoiceId)?.invoice!,
                  invoiceType: 'invoice',
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice restored as draft successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkRestoreAsDraft(
                {
                  invoiceIds: activeInvoiceAction.invoiceId as string[],
                  invoiceType: 'invoice',
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Invoices restored as draft successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isRestoreAsDraftLoading : isBulkRestoreAsDraftLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <SubmitForApprovalDialog
        open={activeInvoiceAction?.action === PayablesTableAction.SubmitForApproval}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={() => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              submitForApproval(
                {
                  invoice: data.find((d) => d.id === activeInvoiceAction.invoiceId)?.invoice!,
                  invoiceType: 'invoice',
                  toast,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice submitted for approval successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkSubmitForApproval(
                {
                  invoiceIds: activeInvoiceAction.invoiceId as string[],
                  invoiceType: 'invoice',
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Invoices submitted for approval successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isSubmitForApprovalLoading : isBulkSubmitForApprovalLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <AssignApproverDialog
        open={activeInvoiceAction?.action === PayablesTableAction.AddApprover}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={(userId) => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              assignApprover(
                {
                  invoice: data.find((d) => d.id === activeInvoiceAction.invoiceId)?.invoice!,
                  userId,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Approver assigned successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkAssignApprover(
                {
                  invoices: data.filter((d) => activeInvoiceAction.invoiceId.includes(d.id)).map((d) => d.invoice!),
                  userId,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Approver assigned successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isAssignApproverLoading : isBulkAssignApproverLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <ArchiveInvoiceDialog
        open={activeInvoiceAction?.action === PayablesTableAction.Archive}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={() => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              archivePayable(
                {
                  invoiceId: activeInvoiceAction.invoiceId as string,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice archived successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkArchivePayables(
                {
                  invoiceIds: activeInvoiceAction.invoiceId as string[],
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Invoices archived successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isArchivePayableLoading : isBulkArchivePayablesLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
      <CancelInvoiceDialog
        open={activeInvoiceAction?.action === PayablesTableAction.Cancel}
        setOpen={(_open) => {
          if (!_open) {
            setActiveInvoiceAction(null)
          }
        }}
        onConfirm={() => {
          if (activeInvoiceAction?.invoiceId) {
            if (activeInvoiceAction.mode === 'single') {
              cancelPayable(
                {
                  invoiceId: activeInvoiceAction.invoiceId as string,
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    toast.success('Invoice canceled successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    toast.error(error.message)
                  },
                },
              )
            } else {
              bulkCancelPayables(
                {
                  invoiceIds: activeInvoiceAction.invoiceId as string[],
                },
                {
                  onSuccess: () => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.success('Invoices canceled successfully')
                  },
                  onError: (error) => {
                    setActiveInvoiceAction(null)
                    setSelectedInvoices([])
                    toast.error(error.message)
                  },
                },
              )
            }
          }
        }}
        onCancel={() => {
          setActiveInvoiceAction(null)
        }}
        isLoading={activeInvoiceAction?.mode === 'single' ? isCancelPayableLoading : isBulkCancelPayablesLoading}
        invoiceCount={
          activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
            ? activeInvoiceAction.invoiceId.length
            : 1
        }
      />
    </div>
  )
})

PayablesTable.displayName = 'PayablesTable'

const CellRenderer = React.memo(({ cell }: { cell: any }) => {
  return <>{flexRender(cell.column.columnDef.cell, cell.getContext())}</>
}) as any

CellRenderer.displayName = 'CellRenderer'

const TableSkeletonBody: React.FC<{ table: Table<any> }> = ({ table }) => {
  const headers = table.getFlatHeaders()

  return (
    <tbody>
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="mercoa-border-b mercoa-border-gray-200">
          {headers.map((header) => {
            const cellStyle = {
              width: `calc(var(--col-${header.column.id}-size) * 1px)`,
            }

            switch (header.column.id) {
              case 'select':
                return (
                  <td
                    key={header.id}
                    style={cellStyle}
                    className="mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[48px]"
                  >
                    <div className="mercoa-flex mercoa-p-1 mercoa-justify-center mercoa-items-center">
                      <SkeletonLoader width="16px" height="16px" className="mercoa-rounded" />
                    </div>
                  </td>
                )
              case 'vendor':
                return (
                  <td
                    key={header.id}
                    style={cellStyle}
                    className="mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[48px]"
                  >
                    <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                      <SkeletonLoader className="mercoa-rounded-full" width="24px" height="24px" />
                      <SkeletonLoader width="120px" height="20px" />
                    </div>
                  </td>
                )
              case 'approvers':
                return (
                  <td
                    key={header.id}
                    style={cellStyle}
                    className="mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[48px]"
                  >
                    <div className="mercoa-flex mercoa-gap-1">
                      <SkeletonLoader width="80px" height="20px" />
                      <SkeletonLoader width="80px" height="20px" />
                    </div>
                  </td>
                )
              default:
                return (
                  <td
                    key={header.id}
                    style={cellStyle}
                    className="mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[48px]"
                  >
                    <SkeletonLoader width="100px" height="20px" />
                  </td>
                )
            }
          })}
        </tr>
      ))}
    </tbody>
  )
}
