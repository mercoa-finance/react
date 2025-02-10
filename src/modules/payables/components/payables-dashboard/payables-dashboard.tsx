import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { FC, memo, ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../components'
import { DebouncedSearch, MercoaButton, Tooltip } from '../../../../components/generics'
import { cn } from '../../../../lib/style'
import { UsePayablesRequestOptions } from '../../api/queries'
import { FilterIcon } from '../../assets/icons/filter-icon'
import { SearchIcon } from '../../assets/icons/search-icon'
import { usePayablesTable } from '../../hooks'
import { usePayablesFilterStore } from '../../stores/payables-filter-store'
import { PayablesTableV2 } from '../payables-table/payables-table'
import { CumulativeFilterDropdown } from './components'
import { ColumnFilterDropdown } from './components/column-filter-dropdown'
import { DateTimeFilterDropdown } from './components/datetime-filter-dropdown'
import { ExportsDropdown } from './components/exports-dropdown'
import { InvoiceMetrics } from './components/invoice-metrics'
import { StatusTabs } from './components/status-tabs'

type InvoiceTableColumn = {
  title: string
  field: keyof Mercoa.InvoiceResponse | `${'metadata.'}${string}`
  orderBy?: Mercoa.InvoiceOrderByField
  format?: (value: string | number | Date | any, invoice: Mercoa.InvoiceResponse) => string | ReactElement | null
}

export interface PayablesDashboardV2Props {
  columns?: InvoiceTableColumn[]

  initialPayablesOptions?: UsePayablesRequestOptions

  statusTabsOptions?: {
    isVisible: boolean
    statuses: Mercoa.InvoiceStatus[]
  }

  readOnly?: boolean

  showInvoiceMetrics?: boolean

  onSelectInvoice?: (invoice: Mercoa.InvoiceResponse) => void

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
    searchbar?: string
  }
}

export const PayablesDashboardV2: FC<PayablesDashboardV2Props> = memo(
  ({
    onSelectInvoice,
    statusTabsOptions,
    columns,
    initialPayablesOptions,
    showInvoiceMetrics = true,
    classNames,
    readOnly,
  }) => {
    const mercoaSession = useMercoaSession()
    const { userPermissionConfig } = mercoaSession
    const useOnce = useRef(false)

    const { setFilters, getFilters } = usePayablesFilterStore()
    const { selectedStatusFilters } = getFilters('payables')
    const [currentTabStatus, setCurrentTabStatus] = useState<Mercoa.InvoiceStatus[]>()
    const [showCumulativeFilter, setShowCumulativeFilter] = useState(true)
    const queryData = usePayablesTable({ initialQueryOptions: initialPayablesOptions })

    const statusTabOptionsByUser = useMemo(() => {
      return (
        statusTabsOptions?.statuses?.filter(
          (status) =>
            userPermissionConfig?.invoice.view.all ||
            userPermissionConfig?.invoice.view.statuses.includes(status) ||
            userPermissionConfig?.invoice.all,
        ) ?? []
      )
    }, [userPermissionConfig, statusTabsOptions])

    useEffect(() => {
      if (userPermissionConfig && statusTabOptionsByUser.length > 0 && !useOnce.current) {
        setFilters('payables', {
          selectedStatusFilters: [statusTabOptionsByUser[0]],
        })
        setCurrentTabStatus([statusTabOptionsByUser[0]])
        useOnce.current = true
      }
    }, [userPermissionConfig, statusTabOptionsByUser, setFilters])

    const {
      toggleSelectedColumn,
      setSelectedColumns,
      selectedColumns,
      setSearch,
      currentStatuses,
      search,
      downloadInvoicesAsCSV,
      handleRefresh,
      isRefreshLoading,
      metricsData,
      isMetricsLoading,
      approvalPolicies,
      isApprovalPoliciesLoading,
      statusTabsMetrics,
      isStatusTabsMetricsLoading,
    } = queryData

    return (
      <>
        <div className="mercoa-mt-2 mercoa-flex mercoa-justify-between mercoa-items-center mercoa-mb-4 mercoa-gap-5">
          <div className="mercoa-flex mercoa-w-[50%] mercoa-mr-2 mercoa-rounded-mercoa">
            <DebouncedSearch onSettle={setSearch}>
              {({ onChange }) => (
                <div className="mercoa-flex mercoa-items-center mercoa-w-full mercoa-bg-transparent mercoa-relative mercoa-rounded-mercoa">
                  <div className="mercoa-left-[8px] mercoa-top-[50%] mercoa-translate-y-[-50%] mercoa-absolute">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    onChange={onChange}
                    className={cn(
                      'mercoa-pl-8 mercoa-w-full mercoa-bg-transparent  mercoa-rounded-mercoa mercoa-outline-none mercoa-border-gray-200  focus:mercoa-ring-gray-200 focus:mercoa-border-transparent mercoa-text-sm mercoa-placeholder-gray-500 mercoa-text-[13px]',
                      classNames?.searchbar,
                    )}
                  />
                </div>
              )}
            </DebouncedSearch>
          </div>
          {showInvoiceMetrics ? (
            <div className="mercoa-w-[60%]">
              <InvoiceMetrics metrics={metricsData} isLoading={isMetricsLoading} />
            </div>
          ) : null}
          <div className="mercoa-flex mercoa-justify-end mercoa-gap-2 ">
            <Tooltip title="Refresh">
              <MercoaButton
                onClick={handleRefresh}
                isEmphasized={true}
                className="mercoa-h-[32px] mercoa-w-[32px] mercoa-rounded-full mercoa-flex mercoa-items-center mercoa-justify-center"
              >
                <div className="mercoa-stroke-white">
                  <ArrowPathIcon
                    color="#FFF"
                    className={cn('mercoa-h-4 mercoa-w-4', isRefreshLoading && 'mercoa-animate-spin')}
                  />
                </div>
              </MercoaButton>
            </Tooltip>
            <Tooltip title={showCumulativeFilter ? 'Hide filters' : 'Show filters'}>
              <MercoaButton
                onClick={() => {
                  setShowCumulativeFilter((prev) => !prev)
                }}
                isEmphasized={true}
                className="mercoa-h-[32px] mercoa-w-[32px] mercoa-rounded-full mercoa-flex mercoa-items-center mercoa-justify-center"
              >
                <div className="mercoa-stroke-[#FFF]">
                  <FilterIcon />
                </div>
              </MercoaButton>
            </Tooltip>
            <DateTimeFilterDropdown tableId="payables" />
            <ColumnFilterDropdown
              allColumns={columns}
              selectedColumns={selectedColumns}
              handleToggleSelectedColumn={toggleSelectedColumn}
              setSelectedColumns={setSelectedColumns}
            />
            <div className="mercoa-flex mercoa-gap-2" onClick={downloadInvoicesAsCSV}>
              <ExportsDropdown />
            </div>
          </div>
        </div>

        <div className="mercoa-mb-4 mercoa-mt-[-12px]">
          {!statusTabsOptions || statusTabsOptions.isVisible ? (
            <StatusTabs
              selectedStatuses={selectedStatusFilters.length ? selectedStatusFilters : [statusTabOptionsByUser[0]]}
              statuses={statusTabOptionsByUser}
              onStatusChange={(status) => {
                setCurrentTabStatus(status)
                setFilters('payables', {
                  selectedStatusFilters: Array.isArray(status) ? status : [status],
                })
              }}
              approvalPolicies={approvalPolicies}
              invoiceMetrics={statusTabsMetrics}
            />
          ) : null}
        </div>

        <div className="mercoa-mb-4">{showCumulativeFilter ? <CumulativeFilterDropdown /> : null}</div>

        <PayablesTableV2
          columns={columns}
          payableData={queryData}
          classNames={classNames}
          onSelectInvoice={onSelectInvoice}
        />
      </>
    )
  },
)

PayablesDashboardV2.displayName = 'PayablesDashboardV2'
