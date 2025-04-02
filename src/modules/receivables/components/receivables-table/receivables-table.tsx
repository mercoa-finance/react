import {
  ArrowsUpDownIcon as ArrowUpDown,
  BarsArrowUpIcon as SortAscending,
  BarsArrowDownIcon as SortDescending,
} from '@heroicons/react/24/outline'
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
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceStatusPill, useMercoaSession } from '../../../../components'
import { SkeletonLoader } from '../../../../lib/components'
import { currencyCodeToSymbol } from '../../../../lib/currency'
import { cn } from '../../../../lib/style'
import { ResultsInfo } from '../../../common/components/results-info'
import { ResultsPerPageDropdown } from '../../../common/components/results-per-page-dropdown'
import { Pagination } from '../../../common/components/table-pagination'
import { useReceivables } from '../../hooks/use-receivables'
import { ArchiveInvoiceDialog } from './components/archive-action-dialog'
import { CancelInvoiceDialog } from './components/cancel-action-dialog'
import { DeleteInvoiceDialog } from './components/delete-action-dialog'
import { RestoreAsDraftDialog } from './components/restore-as-draft-action-dialog'
import { TableActionsBar } from './components/table-actions-bar'
import { TableActionDropdown } from './components/table-actions-dropdown'
import { ReceivablesTableAction } from './constants'
import { getAvailableActions } from './utils'

export const ReceivablesTable = () => {
  const { dataContextValue, propsContextValue, selectionContextValue, actionsContextValue, paginationContextValue } =
    useReceivables()

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
    deleteReceivable,
    isDeleteReceivableLoading,
    bulkDeleteReceivables,
    isBulkDeleteReceivableLoading,
    restoreAsDraft,
    isRestoreAsDraftReceivableLoading,
    bulkRestoreAsDraft,
    isBulkRestoreAsDraftReceivableLoading,
    archiveReceivable,
    isArchiveReceivableLoading,
    bulkArchiveReceivables,
    isBulkArchiveReceivablesLoading,
    cancelReceivable,
    isCancelReceivableLoading,
    bulkCancelReceivables,
    isBulkCancelReceivablesLoading,
    activeInvoiceAction,
    setActiveInvoiceAction,
  } = actionsContextValue

  const { readOnly } = config ?? {}
  const { columns } = renderCustom ?? {}
  const { classNames } = displayOptions ?? {}

  const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [columnResizeDirection, setColumnResizeDirection] = useState<ColumnResizeDirection>('ltr')

  const mercoaSession = useMercoaSession()

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
              cell: ({ row }: { row: any }) => (
                <div
                  className="mercoa-flex mercoa-p-1 mercoa-justify-center mercoa-items-center"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelectRow(row.original)
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
                    checked={selectedInvoices.some((e) => e.id === row.original.id)}
                    onChange={(e) => {
                      handleSelectRow(row.original)
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
        accessorKey: 'payer',
        header: () => (
          <div
            className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-cursor-pointer"
            onClick={() => handleOrderByChange(Mercoa.InvoiceOrderByField.PayerName)}
          >
            <span>Payer</span>
            <div className="hover:mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1">
              {getSortIcon(Mercoa.InvoiceOrderByField.PayerName)}
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
                style={{ backgroundColor: generateColor(row.original.payer ?? '') }}
              >
                {getInitials(row.original.payer ?? '')}
              </div>
              <div className="mercoa-flex-col mercoa-gap-1">
                <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-800">{row.original.payer}</p>
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          return (
            <InvoiceStatusPill
              status={row.original.status}
              vendorId={row.original.vendorId}
              payerId={row.original.payerId}
              dueDate={row.original.dueDate}
              amount={row.original.amount}
              type="receivable"
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
                          action: ReceivablesTableAction.Delete,
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
    deleteReceivable,
    handleSelectAll,
    handleSelectRow,
    isAllSelected,
    selectedColumns,
    selectedInvoices,
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
              toDisplay = JSON.stringify(row.original.invoice?.metadata?.[ele.field.split('.')[1]])
            } else {
              toDisplay = row.original.invoice?.[ele.field as keyof Mercoa.InvoiceResponse]
            }
            if (ele.format && row.original.invoice) {
              toDisplay = ele.format(toDisplay, row.original.invoice)
            } else {
              if (ele.field === 'amount') {
                toDisplay = accounting.formatMoney(
                  toDisplay ?? '',
                  currencyCodeToSymbol(row.original.invoice?.currency),
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
            return <span className="mercoa-text-sm">{toDisplay}</span>
          },
        }
      }, []) ?? []
    )
  }, [columns])

  const table = useReactTable({
    data,
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
  }, [table.getState().columnSizingInfo, table.getState().columnSizing])

  const validActions = getAvailableActions({
    rolePermissions: mercoaSession.userPermissionConfig,
    selectedInvoices: allFetchedInvoices.filter((e) => selectedInvoices.map((e) => e.id).includes(e.id)),
    currentStatuses: allFetchedInvoices.map((e) => e.status),
    currentUserId: mercoaSession.user?.id,
    users: mercoaSession.users,
  })

  return (
    <div className="mercoa-relative">
      <div className="mercoa-overflow-x-auto mercoa-overflow-y-auto">
        {data.length === 0 && !isFetchingNextPage && !isDataLoading && !isFetching ? (
          <div className="mercoa-flex mercoa-flex-col mercoa-items-center mercoa-justify-center mercoa-py-12 mercoa-h-[522px]">
            <p className="mercoa-text-gray-500 mercoa-text-sm">No Receivables Found</p>
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
                className={cn('mercoa-w-full mercoa-border mercoa-border-gray-200', classNames?.table?.root)}
                style={{
                  ...columnSizeVars,
                  width: table.getTotalSize(),
                  minWidth: '100%',
                }}
              >
                <thead className={cn('mercoa-w-full mercoa-border mercoa-border-gray-200', classNames?.table?.thead)}>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className={cn('mercoa-border-b mercoa-border-gray-200', classNames?.table?.tr)}
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={cn(
                            'mercoa-bg-white hover:mercoa-bg-gray-50 mercoa-relative mercoa-font-bold mercoa-border-r mercoa-whitespace-nowrap mercoa-text-left mercoa-px-4 mercoa-py-2 mercoa-text-gray-500 mercoa-text-xs mercoa-leading-4 mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[32px]',
                            classNames?.table?.th,
                            header.id === 'action' && 'mercoa-sticky-right',
                            header.id === 'select' && 'mercoa-sticky-left',
                            header.id === 'payer' && 'mercoa-sticky-left',
                          )}
                          style={{
                            width: `calc(var(--header-${header.id}-size) * 1px)`,
                            ...(header.id === 'action' && {
                              position: 'sticky',
                              right: 0,
                              width: '50px',
                              zIndex: 1,
                              boxShadow: '-1px 0 0 0 #e5e7eb',
                              border: '1px solid #e5e7eb',
                            }),
                            ...(header.id === 'select' && {
                              position: 'sticky',
                              left: 0,
                              zIndex: 1,
                              boxShadow: '1px 0 0 0 #e5e7eb',
                              border: '1px solid #e5e7eb',
                            }),
                            ...(header.id === 'payer' && {
                              position: 'sticky',
                              ...(readOnly ? { left: '0px' } : { left: '50px' }),
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
                      onClick={() => row.original.invoice && handlers?.onSelectInvoice?.(row.original.invoice)}
                      key={row.id}
                      className={cn(
                        'mercoa-group mercoa-cursor-pointer mercoa-border-b mercoa-border-gray-200',
                        classNames?.table?.tr,
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn(
                            'mercoa-bg-white group-hover:mercoa-bg-[#fcfbfa] mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm mercoa-border-gray-200 mercoa-h-[48px] mercoa-align-middle',
                            classNames?.table?.td,
                            cell.column.id === 'action' && 'mercoa-sticky-right',
                            cell.column.id === 'select' && 'mercoa-sticky-left',
                            cell.column.id === 'payer' && 'mercoa-sticky-left',
                          )}
                          style={{
                            width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                            ...(cell.column.id === 'action' && {
                              position: 'sticky',
                              width: '50px',
                              right: 0,
                              zIndex: 1,
                              borderLeft: '1px solid #e5e7eb',
                              boxShadow: '1px 0 0 0 #e5e7eb',
                            }),
                            ...(cell.column.id === 'select' && {
                              position: 'sticky',
                              left: 0,
                              zIndex: 1,
                              borderRight: '1px solid #e5e7eb',
                              boxShadow: '-1px 0 0 0 #e5e7eb',
                            }),
                            ...(cell.column.id === 'payer' && {
                              position: 'sticky',
                              ...(readOnly ? { left: '0px' } : { left: '50px' }), // After select column
                              zIndex: 1,
                              borderRight: '1px solid #e5e7eb',
                              boxShadow: '-1px 0 0 0 #e5e7eb',
                            }),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
          isLoading={activeInvoiceAction?.mode === 'single' ? isDeleteReceivableLoading : isBulkDeleteReceivableLoading}
          onConfirm={() => {
            if (activeInvoiceAction?.invoiceId) {
              if (activeInvoiceAction.mode === 'single') {
                deleteReceivable(
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
                bulkDeleteReceivables(
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
          open={activeInvoiceAction?.action === ReceivablesTableAction.Delete}
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

        <RestoreAsDraftDialog
          open={activeInvoiceAction?.action === ReceivablesTableAction.RestoreAsDraft}
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
          isLoading={
            activeInvoiceAction?.mode === 'single'
              ? isRestoreAsDraftReceivableLoading
              : isBulkRestoreAsDraftReceivableLoading
          }
          invoiceCount={
            activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
              ? activeInvoiceAction.invoiceId.length
              : 1
          }
        />
        <ArchiveInvoiceDialog
          open={activeInvoiceAction?.action === ReceivablesTableAction.Archive}
          setOpen={(_open) => {
            if (!_open) {
              setActiveInvoiceAction(null)
            }
          }}
          onConfirm={() => {
            if (activeInvoiceAction?.invoiceId) {
              if (activeInvoiceAction.mode === 'single') {
                archiveReceivable(
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
                bulkArchiveReceivables(
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
          isLoading={
            activeInvoiceAction?.mode === 'single' ? isArchiveReceivableLoading : isBulkArchiveReceivablesLoading
          }
          invoiceCount={
            activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
              ? activeInvoiceAction.invoiceId.length
              : 1
          }
        />
        <CancelInvoiceDialog
          open={activeInvoiceAction?.action === ReceivablesTableAction.Cancel}
          setOpen={(_open) => {
            if (!_open) {
              setActiveInvoiceAction(null)
            }
          }}
          onConfirm={() => {
            if (activeInvoiceAction?.invoiceId) {
              if (activeInvoiceAction.mode === 'single') {
                cancelReceivable(
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
                bulkCancelReceivables(
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
          isLoading={
            activeInvoiceAction?.mode === 'single' ? isCancelReceivableLoading : isBulkCancelReceivablesLoading
          }
          invoiceCount={
            activeInvoiceAction && Array.isArray(activeInvoiceAction?.invoiceId)
              ? activeInvoiceAction.invoiceId.length
              : 1
          }
        />
      </div>
    </div>
  )
}

ReceivablesTable.displayName = 'ReceivablesTable'

// TODO: Hoist this to a common component that PayablesTable and ReceivablesTable can both use
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
              case 'payer':
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
