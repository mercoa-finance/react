import PlusIcon from '@heroicons/react/24/outline/PlusIcon'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import React, { FC, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { capitalize } from '../../../../../src/lib/lib'
import { AddCounterpartyModal, CounterpartyDetails, useMercoaSession } from '../../../../components'
import { DebouncedSearch, MercoaButton } from '../../../../components/generics'
import { cn } from '../../../../lib/style'
import { SearchIcon } from '../../../common/assets/icons'
import { TableSkeletonBody } from '../../../common/components/table-skeleton-body'
import { Pagination, ResultsPerPageDropdown } from '../../../payables/components/payables-table/components'
import { useCounterpartiesTable } from '../../hooks/use-counterparty-table'
import { FullPageModal } from '../counterparty-detail.tsx/components/full-page-modal'

export interface CounterpartiesTableProps {
  type: 'payor' | 'payee'
  network?: Mercoa.CounterpartyNetworkType[]
  admin?: boolean
  disableCreation?: boolean
  counterpartyPreSubmit?: (
    counterparty: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>

  classNames?: {
    table?: {
      root?: string
      thead?: string
      tbody?: string
      th?: string
      tr?: string
      td?: string
    }
    searchbar?: string
  }
}

export const CounterpartiesTable: FC<CounterpartiesTableProps> = ({
  type,
  admin,
  disableCreation,
  network,
  counterpartyPreSubmit,
  classNames,
}) => {
  const { entityId, iframeOptions } = useMercoaSession()
  const [addCounterparty, setAddCounterparty] = useState(false)
  const [activeCounterpartyId, setActiveCounterpartyId] = useState('')
  const {
    data,
    dataLoading,
    isFetchingNextPage,
    goToNextPage,
    goToPreviousPage,
    isNextDisabled,
    isPrevDisabled,
    resultsPerPage,
    setResultsPerPage,
    search,
    setSearch,
    refetch,
  } = useCounterpartiesTable(entityId!, type, { networkType: network })

  const defaultTableColumns = useMemo<ColumnDef<(typeof data)[0]>[]>(() => {
    const cols: ColumnDef<(typeof data)[0]>[] = [
      {
        accessorKey: 'vendor',
        header: 'Vendor / Owner',
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
                style={{ backgroundColor: generateColor(row.original.name ?? '') }}
              >
                {getInitials(row.original.name ?? '')}
              </div>
              <div className="mercoa-flex-col mercoa-gap-1">
                <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-800">{row.original.name}</p>
              </div>
            </div>
          )
        },
        enableResizing: true,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
        enableResizing: true,
      },
      {
        accessorKey: 'type',
        header: 'Account Type',
        cell: ({ row }) => <span className="text-sm">{capitalize(row.original.type)}</span>,
        enableResizing: true,
      },
    ]

    return cols
  }, [])

  const table = useReactTable({
    data: data,
    columns: defaultTableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
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

  return (
    <>
      {!activeCounterpartyId ? (
        <>
          <div className="mercoa-flex mercoa-w-full mercoa-justify-between mercoa-mb-2">
            <DebouncedSearch onSettle={setSearch}>
              {({ onChange }) => (
                <div className="mercoa-flex mercoa-items-center mercoa-w-[50%] mercoa-bg-transparent mercoa-relative">
                  <div className="mercoa-left-[8px] mercoa-top-[50%] mercoa-translate-y-[-50%] mercoa-absolute">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    onChange={onChange}
                    className={cn(
                      'mercoa-pl-8 mercoa-w-full mercoa-bg-transparent mercoa-outline-none mercoa-border-gray-200  focus:mercoa-ring-gray-200 focus:mercoa-border-transparent mercoa-text-sm mercoa-placeholder-gray-500 mercoa-text-[13px]',
                      classNames?.searchbar,
                    )}
                  />
                </div>
              )}
            </DebouncedSearch>
            {(admin || (!iframeOptions?.options?.vendors?.disableCreation && !disableCreation)) && (
              <MercoaButton
                isEmphasized
                type="button"
                className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
                onClick={() => {
                  setAddCounterparty(true)
                }}
              >
                <PlusIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
                <span className="mercoa-hidden md:mercoa-inline-block mercoa-whitespace-nowrap">
                  Add {type === 'payee' ? 'Vendor' : 'Customer'}
                </span>
              </MercoaButton>
            )}
          </div>
          <div className="mercoa-overflow-x-auto mercoa-overflow-y-auto">
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
                          'mercoa-relative mercoa-font-bold mercoa-border-r mercoa-whitespace-nowrap mercoa-text-left mercoa-px-4 mercoa-py-2 mercoa-text-gray-500  mercoa-text-xs mercoa-leading-4 mercoa-font-Inter  mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[32px]',
                          classNames?.table?.th,
                        )}
                        style={{
                          width: `calc(var(--header-${header.id}-size) * 1px)`,
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
                    onClick={() => {
                      setActiveCounterpartyId(row.original.id)
                    }}
                    key={row.id}
                    className={cn(
                      'mercoa-cursor-pointer mercoa-border-b mercoa-border-gray-200 hover:mercoa-bg-[#fcfbfa]',
                      classNames?.table?.tr,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        style={{
                          width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                        }}
                        key={cell.id}
                        className={cn(
                          'mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm  mercoa-border-gray-200 last:mercoa-border-r-0 mercoa-h-[48px] mercoa-align-middle',
                          classNames?.table?.td,
                        )}
                      >
                        <CellRenderer cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {(dataLoading || isFetchingNextPage) && <TableSkeletonBody table={table} />}
            </table>

            <div className="mercoa-flex mercoa-gap-4 mercoa-justify-between mercoa-mt-4">
              <ResultsPerPageDropdown resultsPerPage={resultsPerPage} setResultsPerPage={setResultsPerPage} />
              <Pagination
                goToNextPage={goToNextPage}
                goToPrevPage={goToPreviousPage}
                isNextDisabled={isNextDisabled}
                isPrevDisabled={isPrevDisabled}
              />
            </div>
          </div>{' '}
        </>
      ) : (
        <>
          <FullPageModal
            open={!!activeCounterpartyId}
            onClose={() => {
              setActiveCounterpartyId('')
            }}
          >
            <CounterpartyDetails type={'payee'} counterpartyId={activeCounterpartyId} refetch={refetch} />
          </FullPageModal>
        </>
      )}
      <AddCounterpartyModal
        type={type}
        show={addCounterparty}
        setShow={setAddCounterparty}
        counterpartyPreSubmit={counterpartyPreSubmit}
      />
    </>
  )
}

const CellRenderer = React.memo(({ cell }: { cell: any }) => {
  return <>{flexRender(cell.column.columnDef.cell, cell.getContext())}</>
}) as any

CellRenderer.displayName = 'CellRenderer'
