import {
  ColumnDef,
  ColumnResizeDirection,
  ColumnResizeMode,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import accounting from 'accounting'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { InvoiceStatusPill } from '../../../../components'
import { currencyCodeToSymbol } from '../../../../lib/currency'
import { cn } from '../../../../lib/style'
import { EntriesInfo } from '../../../common/components/entries-info'
import { ResultsPerPageDropdown } from '../../../common/components/results-per-page-dropdown'
import { Pagination } from '../../../common/components/table-pagination'
import { TableSkeletonBody } from '../../../common/components/table-skeleton-body'
import { useReceivables } from '../../hooks/use-receivables'

export const ReceivablesTable = () => {
  const { dataContextValue, propsContextValue, paginationContextValue } = useReceivables()

  const { tableData: data, isDataLoading, isFetchingNextPage, isFetching } = dataContextValue

  const {
    page,
    totalEntries,
    resultsPerPage,
    setResultsPerPage,
    isNextDisabled,
    isPrevDisabled,
    goToNextPage,
    goToPreviousPage,
  } = paginationContextValue

  const { displayOptions, handlers } = propsContextValue

  const { classNames } = displayOptions ?? {}

  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')
  const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr')

  const defaultTableColumns = useMemo<ColumnDef<(typeof data)[0]>[]>(() => {
    const cols: ColumnDef<(typeof data)[0]>[] = [
      {
        accessorKey: 'payer',
        header: 'Payer',
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
      },
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: ({ row }) => <span className="text-sm">{row.original.invoiceNumber}</span>,
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.dueDate ? dayjs(row.original.dueDate).format('MMM DD, YYYY') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Invoice Date',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.invoiceDate ? dayjs(row.original.invoiceDate).format('MMM DD, YYYY') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {accounting.formatMoney(row.original.amount ?? '', currencyCodeToSymbol(row.original.currencyCode))}
          </span>
        ),
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
      },
    ]
    return cols
  }, [])

  const table = useReactTable({
    data,
    columns: defaultTableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    columnResizeDirection,
  })

  return (
    <div className="mercoa-relative">
      <div className="mercoa-overflow-x-auto mercoa-overflow-y-auto ">
        {data.length === 0 && !isFetchingNextPage && !isDataLoading && !isFetching ? (
          <div className="mercoa-flex mercoa-flex-col mercoa-items-center mercoa-justify-center mercoa-py-12 mercoa-h-[522px]">
            <p className="mercoa-text-gray-500 mercoa-text-sm">No Receivables found</p>
          </div>
        ) : (
          <div className="mercoa-overflow-x-auto mercoa-overflow-y-auto mercoa-h-[522px]">
            <table className={cn('mercoa-w-full mercoa-border mercoa-border-gray-200', classNames?.table?.root)}>
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
                          'mercoa-relative mercoa-font-bold mercoa-border-r mercoa-whitespace-nowrap mercoa-text-left mercoa-px-4 mercoa-py-2 mercoa-text-gray-500 mercoa-text-xs mercoa-leading-4 mercoa-font-Inter mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[32px]',
                          classNames?.table?.th,
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className={cn('', classNames?.table?.tbody)}>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    onClick={() => handlers?.onSelectInvoice?.(row.original.invoice)}
                    key={row.id}
                    className={cn(
                      'mercoa-cursor-pointer mercoa-border-b mercoa-border-gray-200 hover:mercoa-bg-[#fcfbfa]',
                      classNames?.table?.tr,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm mercoa-border-gray-200 mercoa-h-[48px] mercoa-align-middle',
                          classNames?.table?.td,
                        )}
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
        )}

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
    </div>
  )
}
