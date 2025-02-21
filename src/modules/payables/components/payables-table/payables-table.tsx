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
import React, { FC, memo, ReactElement, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceStatusPill } from '../../../../components/Payables'
import { cn } from '../../../../lib/style'

import {
  ArrowsUpDownIcon as ArrowUpDown,
  BarsArrowUpIcon as SortAscending,
  BarsArrowDownIcon as SortDescending,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { currencyCodeToSymbol } from '../../../../../src/lib/currency'
import { MercoaButton, Tooltip } from '../../../../components/generics'
import { useMercoaSession } from '../../../../components/Mercoa'
import { filterApproverOptionsV1 } from '../../../../components/PayableDetails'
import { SkeletonLoader } from '../../../../lib/components'
import { UsePayablesRequestOptions } from '../../api/queries'
import { CrossIcon } from '../../assets/icons/cross-icon'
import { usePayablesTable } from '../../hooks'
import { Pagination, ResultsPerPageDropdown } from './components'
import { ApproveBillsDialog } from './components/approve-action-dialog'
import { DeleteInvoiceDialog } from './components/delete-action-dialog'
import { EntriesInfo } from './components/entries-info'
import { EditPaymentDateDialog } from './components/schedule-action-dialog'
import { TableActionDropdown } from './components/table-actions-dropdown'
import { PayableAction } from './constants'
import { getAvailableActions } from './utils'

type InvoiceTableColumn = {
  title: string
  field: keyof Mercoa.InvoiceResponse | `${'metadata.'}${string}`
  orderBy?: Mercoa.InvoiceOrderByField
  format?: (value: string | number | Date | any, invoice: Mercoa.InvoiceResponse) => string | ReactElement | null
}

export interface PayablesTableProps {
  columns?: InvoiceTableColumn[]

  currentPayablesOptions?: UsePayablesRequestOptions

  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => void

  readOnly?: boolean

  payableData?: ReturnType<typeof usePayablesTable>

  classNames?: {
    table?: {
      root?: string
      thead?: string
      tbody?: string
      th?: string
      tr?: string
      td?: string
    }
    checkbox?: string
  }
}

export const PayablesTable: FC<PayablesTableProps> = memo(
  ({ onSelectInvoice, columns, currentPayablesOptions, classNames, payableData, readOnly = false }) => {
    const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange')
    const [columnResizeDirection, setColumnResizeDirection] = useState<ColumnResizeDirection>('ltr')
    const queryData = usePayablesTable({ currentQueryOptions: currentPayablesOptions })

    const mercoaSession = useMercoaSession()

    const {
      data,
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      infiniteData,
      handleOrderByChange,
      isDataLoading,
      isFetchingNextPage,
      selectedInvoiceIds,
      handleSelectRow,
      handleSelectAll,
      isAllSelected,
      selectedColumns,
      totalEntries,
      resultsPerPage,
      page,
      setResultsPerPage,
      isNextDisabled,
      isPrevDisabled,
      goToNextPage,
      goToPreviousPage,
      deletePayable,
      isDeletePayableLoading,
      setSelectedInvoiceIds,
      bulkDeletePayables,
      isBulkDeletePayableLoading,
      activeInvoiceAction,
      setActiveInvoiceAction,
      approvePayable,
      isApprovePayableLoading,
      bulkApprovePayables,
      isBulkApprovePayablesLoading,
      handleRefresh,
      isRefreshLoading,
      schedulePayment,
      isSchedulePaymentLoading,
      bulkSchedulePayment,
      isBulkSchedulePaymentLoading,
      allFetchedInvoices,
    } = payableData ?? queryData

    const defaultTableColumns = useMemo<ColumnDef<(typeof data)[0]>[]>(() => {
      const getSortIcon = (field: Mercoa.InvoiceOrderByField) => {
        if (orderBy === field) {
          return orderDirection === Mercoa.OrderDirection.Asc ? (
            <SortAscending className="mercoa-h-4 mercoa-w-4" />
          ) : (
            <SortDescending className="mercoa-h-4 mercoa-w-4" />
          )
        }
        return <ArrowUpDown className="mercoa-h-4 mercoa-w-4" />
      }

      const cols: ColumnDef<(typeof data)[0]>[] = [
        {
          accessorKey: 'select',
          header: () =>
            readOnly ? null : (
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
          cell: ({ row }) =>
            readOnly ? null : (
              <div
                className="mercoa-flex mercoa-p-1 mercoa-justify-center mercoa-items-center"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelectRow(row.original.id)
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
                  checked={selectedInvoiceIds.includes(row.original.id)}
                  onChange={(e) => {
                    handleSelectRow(row.original.id)
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
                  style={{ backgroundColor: generateColor(row.original.vendorName ?? '') }}
                >
                  {getInitials(row.original.vendorName ?? '')}
                </div>
                <div className="mercoa-flex-col mercoa-gap-1">
                  <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-800">{row.original.vendorName}</p>
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
          cell: ({ row }) => <span className="text-sm">{row.original.invoiceNumber}</span>,
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
            <span className="text-sm">
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
            <span className="text-sm">
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
            <span className="text-sm">
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
            <span className="text-sm font-medium">
              {accounting.formatMoney(row.original.amount ?? '', currencyCodeToSymbol(row.original.currencyCode))}
            </span>
          ),
          enableResizing: true,
        },

        {
          accessorKey: 'approvers',
          header: 'Approvers',
          cell: ({ row }) => {
            if (row.original.approvers.length === 0) {
              return null
            }
            return (
              <div className="mercoa-gap-1 mercoa-grid">
                {row.original.approvers?.map((approver, index) => {
                  if (!approver.assignedUserId) {
                    const eligibleApprovers = filterApproverOptionsV1({
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
        {
          accessorKey: 'action',
          header: 'Actions',
          size: 10,
          maxSize: 10,
          meta: { align: 'center' },
          cell: ({ row }) => {
            if (readOnly) return null
            return (
              <TableActionDropdown
                validActions={getAvailableActions({
                  rolePermissions: mercoaSession.userPermissionConfig,
                  selectedInvoices: [row.original.invoice],
                  currentStatuses: [row.original.status],
                  currentUserId: mercoaSession.user?.id,
                  users: mercoaSession.users,
                })}
                onAction={(actionKey) => {
                  if (actionKey === 'delete') {
                    setActiveInvoiceAction({
                      invoiceId: row.original.invoiceId,
                      action: PayableAction.Delete,
                      mode: 'single',
                    })
                  } else if (actionKey === 'approve') {
                    setActiveInvoiceAction({
                      invoiceId: row.original.invoiceId,
                      action: PayableAction.Approve,
                      mode: 'single',
                    })
                  } else if (actionKey === 'schedulePayment') {
                    setActiveInvoiceAction({
                      invoiceId: row.original.invoiceId,
                      action: PayableAction.SchedulePayment,
                      mode: 'single',
                    })
                  }
                }}
              />
            )
          },
          enableResizing: false,
        },
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
      selectedInvoiceIds,
      orderBy,
      orderDirection,
      setOrderBy,
    ])

    const tableColumns = useMemo<ColumnDef<(typeof data)[0]>[]>(() => {
      return (
        columns?.map((ele) => {
          return {
            accessorKey: ele.field,
            header: ele.title,
            cell: ({ row }) => {
              let toDisplay: any = ''
              if (ele.field.startsWith('metadata.')) {
                toDisplay = JSON.stringify(row.original.invoice.metadata?.[ele.field.split('.')[1]])
              } else {
                toDisplay = row.original.invoice?.[ele.field as keyof Mercoa.InvoiceResponse]
              }
              if (ele.format) {
                toDisplay = ele.format(toDisplay, row.original.invoice)
              } else {
                if (ele.field === 'amount') {
                  toDisplay = accounting.formatMoney(
                    toDisplay ?? '',
                    currencyCodeToSymbol(row.original.invoice.currency),
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
              }
              return <span className="text-sm">{toDisplay}</span>
            },
          }
        }, []) ?? []
      )
    }, [columns])

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
      selectedInvoices: allFetchedInvoices.filter((e) => selectedInvoiceIds.includes(e.id)),
      currentStatuses: allFetchedInvoices.map((e) => e.status),
      currentUserId: mercoaSession.user?.id,
      users: mercoaSession.users,
    })

    return (
      <div className="mercoa-relative">
        {selectedInvoiceIds.length > 0 && (
          <div
            className={cn(
              'mercoa-h-[48px] mercoa-rounded-lg mercoa-opacity-50 mercoa-pointer-events-none mercoa-fixed mercoa-bottom-8 mercoa-left-[55%] mercoa-translate-x-[-50%] mercoa-w-[800px] mercoa-shadow-[0_8px_24px_rgba(0,0,0,0.15)] mercoa-z-50',
              selectedInvoiceIds.length > 0 && 'mercoa-opacity-[100] mercoa-pointer-events-auto',
            )}
          >
            <div
              className={`mercoa-z-[400]  mercoa-rounded-lg mercoa-py-2 mercoa-px-3 mercoa-bg-white mercoa-flex  mercoa-gap-4 mercoa-items-center mercoa-justify-between mercoa-left-0 mercoa-right-0 mercoa-min-h-[24px] mercoa-box-border`}
            >
              <div className="mercoa-flex mercoa-justify-start mercoa-gap-6  mercoa-items-center mercoa-pl-[11px]">
                <div
                  onClick={(e: React.MouseEvent) => {
                    setSelectedInvoiceIds([])
                    e.stopPropagation()
                  }}
                  className="mercoa-bg-white mercoa-border mercoa-rounded-full mercoa-p-1 mercoa-opacity-[0.5] hover:mercoa-opacity-[1]"
                >
                  <CrossIcon />
                </div>
                <p className="mercoa-text-[13px] mercoa-text-[#1A1919] mercoa-font-medium mercoa-whitespace-nowrap">
                  {selectedInvoiceIds.length} Payable{selectedInvoiceIds.length > 1 ? 's' : ''} Selected
                </p>
              </div>

              <div className="mercoa-flex mercoa-w-full mercoa-justify-end mercoa-gap-2  mercoa-items-center">
                {validActions.includes('schedulePayment') && (
                  <MercoaButton
                    isEmphasized
                    className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
                    onClick={() => {
                      setActiveInvoiceAction({
                        invoiceId: selectedInvoiceIds,
                        action: PayableAction.SchedulePayment,
                        mode: 'multiple',
                      })
                    }}
                  >
                    Schedule
                  </MercoaButton>
                )}
                {validActions.includes('delete') && (
                  <MercoaButton
                    isEmphasized
                    className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
                    onClick={() => {
                      setActiveInvoiceAction({
                        invoiceId: selectedInvoiceIds,
                        action: PayableAction.Delete,
                        mode: 'multiple',
                      })
                    }}
                  >
                    Delete
                  </MercoaButton>
                )}
                {validActions.includes('approve') && (
                  <MercoaButton
                    isEmphasized
                    className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
                    onClick={() => {
                      setActiveInvoiceAction({
                        invoiceId: selectedInvoiceIds,
                        action: PayableAction.Approve,
                        mode: 'multiple',
                      })
                    }}
                  >
                    Approve
                  </MercoaButton>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mercoa-overflow-x-auto mercoa-overflow-y-auto">
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
                          'hover:mercoa-bg-gray-100 mercoa-cursor-pointer mercoa-relative mercoa-font-bold mercoa-border-r mercoa-whitespace-nowrap mercoa-text-left mercoa-px-4 mercoa-py-2 mercoa-text-gray-500  mercoa-text-xs mercoa-leading-4 mercoa-font-Inter  mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[32px]',
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
                            backgroundColor: 'white', // To ensure content doesn't show through
                            zIndex: 1,
                            boxShadow: '-1px 0 0 0 #e5e7eb',
                            border: '1px solid #e5e7eb',
                          }),
                          ...(header.id === 'select' && {
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'white',
                            zIndex: 1,
                            boxShadow: '1px 0 0 0 #e5e7eb',
                            border: '1px solid #e5e7eb',
                          }),
                          ...(header.id === 'vendor' && {
                            position: 'sticky',
                            left: '50px', // After select column
                            backgroundColor: 'white',
                            zIndex: 1,
                            borderRight: '1px solid #e5e7eb',
                            boxShadow: '-1px 0 0 0 #e5e7eb',
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
                    onClick={() => onSelectInvoice?.(row.original.invoice)}
                    key={row.id}
                    className={cn(
                      'mercoa-cursor-pointer mercoa-border-b mercoa-border-gray-200 hover:mercoa-bg-[#fcfbfa]',
                      selectedInvoiceIds.includes(row.original.invoiceId) && 'mercoa-bg-[#fcfbfa]',
                      classNames?.table?.tr,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                      <td
                        onClick={(e: React.MouseEvent) => {
                          if (cell.column.id === 'select') {
                            handleSelectRow(row.original.invoiceId)
                            e.stopPropagation()
                          }
                          if (cell.column.id === 'action') {
                            e.stopPropagation()
                          }
                        }}
                        style={{
                          width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                          ...(cell.column.id === 'action' && {
                            position: 'sticky',
                            width: '50px',
                            right: 0,
                            backgroundColor: 'white', // To ensure content doesn't show through
                            zIndex: 1,
                            borderLeft: '1px solid #e5e7eb',
                            boxShadow: '1px 0 0 0 #e5e7eb',
                          }),
                          ...(cell.column.id === 'select' && {
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'white',
                            zIndex: 1,
                            borderRight: '1px solid #e5e7eb',
                            boxShadow: '-1px 0 0 0 #e5e7eb',
                          }),
                          ...(cell.column.id === 'vendor' && {
                            position: 'sticky',
                            left: '50px', // After select column
                            backgroundColor: 'white',
                            zIndex: 1,
                            borderRight: '1px solid #e5e7eb',
                            boxShadow: '-1px 0 0 0 #e5e7eb',
                          }),
                        }}
                        key={cell.id}
                        className={cn(
                          'mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm  mercoa-border-gray-200  mercoa-h-[48px] mercoa-align-middle',
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

          <div className="mercoa-flex mercoa-gap-4 mercoa-justify-between mercoa-items-center mercoa-mt-4">
            <div className="mercoa-flex mercoa-gap-4 mercoa-items-center">
              <ResultsPerPageDropdown resultsPerPage={resultsPerPage} setResultsPerPage={setResultsPerPage} />
              <EntriesInfo currentPage={page + 1} resultsPerPage={resultsPerPage} totalEntries={totalEntries} />
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
                      setSelectedInvoiceIds([])
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
          open={activeInvoiceAction?.action === PayableAction.Delete}
          setOpen={(_open) => {
            if (!_open) {
              setActiveInvoiceAction(null)
            }
          }}
        />
        {activeInvoiceAction?.action === PayableAction.Approve && (
          <ApproveBillsDialog
            open={activeInvoiceAction?.action === PayableAction.Approve}
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
                      invoiceId: activeInvoiceAction.invoiceId as string,
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
                        setSelectedInvoiceIds([])
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
            billsCount={Array.isArray(activeInvoiceAction?.invoiceId) ? activeInvoiceAction.invoiceId.length : 1}
          />
        )}
        {activeInvoiceAction?.action === PayableAction.SchedulePayment && (
          <EditPaymentDateDialog
            open={activeInvoiceAction?.action === PayableAction.SchedulePayment}
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
                      invoiceIds: activeInvoiceAction.invoiceId as string[],
                      invoices: data.filter((d) => activeInvoiceAction.invoiceId.includes(d.id)).map((d) => d.invoice!),
                      deductionDate: date,
                    },
                    {
                      onSuccess: () => {
                        setActiveInvoiceAction(null)
                        setSelectedInvoiceIds([])
                      },
                      onError: (error) => {
                        setActiveInvoiceAction(null)
                        setSelectedInvoiceIds([])
                      },
                    },
                  )
                }
              }
            }}
            isLoading={activeInvoiceAction?.mode === 'single' ? isSchedulePaymentLoading : isBulkSchedulePaymentLoading}
            numberOfBills={Array.isArray(activeInvoiceAction?.invoiceId) ? activeInvoiceAction.invoiceId.length : 1}
          />
        )}
      </div>
    )
  },
)

PayablesTable.displayName = 'PayablesTableV2'

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
            switch (header.column.id) {
              case 'select':
                return (
                  <td
                    key={header.id}
                    style={{
                      width: `calc(var(--col-${header.column.id}-size) * 1px)`,
                    }}
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
                    style={{
                      width: `calc(var(--col-${header.column.id}-size) * 1px)`,
                    }}
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
                    style={{
                      width: `calc(var(--col-${header.column.id}-size) * 1px)`,
                    }}
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
                    style={{
                      width: `calc(var(--col-${header.column.id}-size) * 1px)`,
                    }}
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
