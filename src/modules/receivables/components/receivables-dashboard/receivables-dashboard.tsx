import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { DebouncedSearch, MercoaButton, Tooltip } from '../../../../components'
import { useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { cn } from '../../../../lib/style'
import { FilterIcon, SearchIcon } from '../../../common/assets/icons'
import { InvoiceMetrics } from '../../../common/components'
import { DateTimeFilterDropdown } from '../../../common/components/datetime-filter-dropdown'
import { StatusTabs } from '../../../common/components/status-tabs'
import { useReceivables } from '../../hooks/use-receivables'
import { ReceivablesTable } from '../receivables-table'

export const ReceivablesDashboard = () => {
  const {
    setSearch,
    displayOptions,
    metricsData,
    isMetricsLoading,
    statusTabsMetrics,
    isStatusTabsMetricsLoading,
    handleRefresh,
    isRefreshLoading,
    currentStatuses,
    setCurrentStatuses,
  } = useReceivables()

  const [showCumulativeFilter, setShowCumulativeFilter] = useState(true)
  const { classNames, showInvoiceMetrics = true, statusTabsOptions } = displayOptions ?? {}
  return (
    <div className="mercoa-relative mercoa-pt-1">
      <div className="mercoa-mt-2 mercoa-flex mercoa-justify-between mercoa-items-center mercoa-mb-4 mercoa-gap-5">
        <div className="mercoa-flex mercoa-w-[50%] mercoa-mr-2 mercoa-rounded-mercoa">
          <DebouncedSearch onSettle={setSearch}>
            {({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
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
          <DateTimeFilterDropdown tableId="receivables" />
          {/* <div className="mercoa-flex mercoa-gap-2" onClick={downloadInvoicesAsCSV}>
            <ExportsDropdown />
          </div> */}
        </div>
      </div>
      <div className="mercoa-mb-4 mercoa-mt-[-12px]">
        {!statusTabsOptions || statusTabsOptions.isVisible ? (
          <StatusTabs
            selectedStatuses={currentStatuses}
            statuses={
              statusTabsOptions?.statuses ?? [
                Mercoa.InvoiceStatus.Draft,
                Mercoa.InvoiceStatus.Approved,
                Mercoa.InvoiceStatus.Scheduled,
                Mercoa.InvoiceStatus.Pending,
                Mercoa.InvoiceStatus.Paid,
              ]
            }
            onStatusChange={(status) => {
              setCurrentStatuses(status)
            }}
            invoiceMetrics={statusTabsMetrics}
            excludePayables
          />
        ) : null}
      </div>
      <ReceivablesTable />
    </div>
  )
}
