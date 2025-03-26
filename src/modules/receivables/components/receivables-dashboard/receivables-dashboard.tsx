import { ArrowPathIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { DebouncedSearch, MercoaButton, Tooltip } from '../../../../components'
import { cn } from '../../../../lib/style'
import { SearchIcon } from '../../../common/assets/icons'
import { InvoiceMetrics } from '../../../common/components'
import { DateTimeFilterDropdown } from '../../../common/components/datetime-filter-dropdown'
import { ExportsDropdown } from '../../../common/components/exports-dropdown'
import { StatusTabs } from '../../../common/components/status-tabs'
import { useReceivables } from '../../hooks/use-receivables'
import { ReceivablesTable } from '../receivables-table'
import { RecurringReceivablesList } from './components/recurring-receivables-list'

export const ReceivablesDashboard = () => {
  const { dataContextValue, propsContextValue, filtersContextValue, selectionContextValue, actionsContextValue } =
    useReceivables()

  const {
    handleRefresh,
    isRefreshLoading,
    recurringReceivablesData,
    isRecurringReceivablesLoading,
    metricsData,
    isMetricsLoading,
    statusTabsMetrics,
  } = dataContextValue

  const { setSearch, currentStatuses, setCurrentStatuses } = filtersContextValue
  // TODO: Use this to implement "Filter by column"
  // const { toggleSelectedColumn, setSelectedColumns, selectedColumns } = selectionContextValue
  const { downloadInvoicesAsCSV } = actionsContextValue

  const { renderCustom, displayOptions, handlers } = propsContextValue

  // TODO: Use this to implement "Filter by column"
  // const { columns } = renderCustom ?? {}

  // TODO: Use this to implement cumulative filtering
  // const { setFilters, getFilters } = useReceivablesFilterStore()
  // const { selectedStatusFilters } = getFilters('receivables')

  const { statusTabsOptions, showInvoiceMetrics = true, classNames } = displayOptions ?? {}
  const { onCreateInvoice, onCreateInvoiceTemplate, onSelectInvoiceTemplate } = handlers ?? {}

  // const [showCumulativeFilter, setShowCumulativeFilter] = useState(true)
  const [showRecurringInvoices, setShowRecurringInvoices] = useState(false)

  return (
    // NOTE: The pt-1 is to ensure the recurring invoices button is hidden by the recurring invoices panel
    <div className="mercoa-relative mercoa-pt-1">
      <div className="mercoa-flex mercoa-justify-end mercoa-items-center mercoa-gap-2">
        {/* TODO: To be reviewed */}
        <MercoaButton
          isEmphasized={false}
          className={'mercoa-inline-flex mercoa-text-sm'}
          type="button"
          onClick={() => setShowRecurringInvoices((prev) => !prev)}
        >
          <span className="mercoa-hidden md:mercoa-inline-block">Recurring Invoices</span>
        </MercoaButton>
        <MercoaButton
          isEmphasized={true}
          className={'mercoa-inline-flex mercoa-text-sm'}
          onClick={onCreateInvoice}
          type="button"
        >
          <PlusIcon className="-mercoa-ml-1 mercoa-size-5 md:mercoa-mr-2" aria-hidden="true" />
          <span className="mercoa-hidden md:mercoa-inline-block">Add Invoice</span>
        </MercoaButton>
      </div>

      <div className="mercoa-mt-2 mercoa-flex mercoa-justify-between mercoa-items-center mercoa-mb-4 mercoa-gap-5">
        <div className="mercoa-flex mercoa-w-[50%] mercoa-mr-2 mercoa-rounded-mercoa">
          <DebouncedSearch onSettle={setSearch}>
            {({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
              <div className="mercoa-flex mercoa-items-center mercoa-w-full mercoa-bg-transparent mercoa-relative mercoa-rounded-mercoa mercoa-border mercoa-h-[36px] mercoa-border-gray-200">
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
        {showInvoiceMetrics && (
          <div className="mercoa-w-[60%]">
            <InvoiceMetrics metrics={metricsData} isLoading={isMetricsLoading} />
          </div>
        )}
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

          {/* TODO: Add ReceivablesDashboard cumulative filter component before adding this back */}
          {/* <Tooltip title={showCumulativeFilter ? 'Hide filters' : 'Show filters'}>
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
          </Tooltip> */}

          <DateTimeFilterDropdown tableId="receivables" />
          <div className="mercoa-flex mercoa-gap-2" onClick={downloadInvoicesAsCSV}>
            <ExportsDropdown />
          </div>
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
                Mercoa.InvoiceStatus.Failed,
                Mercoa.InvoiceStatus.Canceled,
                Mercoa.InvoiceStatus.Archived,
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

      {/* TODO: Add cumulative filter component for receivables */}
      {/* {showCumulativeFilter ? (
        <div className="mercoa-mb-4">
          <CumulativeFilterDropdown />
        </div>
      ) : null} */}

      <ReceivablesTable />

      {/* TODO: Figure out how to correctly animate the slide in and out & the blur */}
      {showRecurringInvoices && (
        <>
          {/* Recurring Invoices Panel */}
          <div
            className={cn(
              'mercoa-absolute mercoa-top-0 mercoa-right-0 mercoa-h-full mercoa-w-1/2 mercoa-bg-white mercoa-transform mercoa-overflow-hidden mercoa-shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.1)]',
              showRecurringInvoices
                ? 'mercoa-translate-x-0 mercoa-transition-all mercoa-duration-300 mercoa-cubic-bezier-[0.2,1,0.5,0.95] mercoa-opacity-100'
                : 'mercoa-translate-x-full mercoa-transition-all mercoa-duration-300 mercoa-cubic-bezier-[0.2,1,0.5,0.95] mercoa-opacity-0',
              'mercoa-z-[2]',
            )}
          >
            <div className="mercoa-h-full mercoa-overflow-y-auto mercoa-flex mercoa-flex-col">
              <div className="mercoa-flex mercoa-justify-between mercoa-items-start mercoa-p-6">
                <div className="mercoa-flex mercoa-flex-col mercoa-gap-2">
                  <h2 className="mercoa-text-2xl mercoa-font-semibold mercoa-text-gray-900">Recurring Invoices</h2>
                  <p className="mercoa-text-sm mercoa-text-gray-500">Create and manage recurring invoices</p>
                </div>
                <button
                  onClick={() => setShowRecurringInvoices(false)}
                  className="mercoa-p-2 mercoa-rounded-full hover:mercoa-bg-gray-100 mercoa-text-gray-500"
                >
                  <XMarkIcon className="mercoa-h-5 mercoa-w-5" />
                </button>
              </div>

              <div className="mercoa-w-full mercoa-h-[1px] mercoa-bg-gray-200" />

              <div className="mercoa-space-y-6 mercoa-p-6 mercoa-flex-1 mercoa-overflow-y-auto">
                <RecurringReceivablesList
                  recurringReceivablesData={recurringReceivablesData}
                  isRecurringReceivablesLoading={isRecurringReceivablesLoading}
                  onSelectInvoice={onSelectInvoiceTemplate}
                />
              </div>

              <div className="mercoa-w-full mercoa-h-[1px] mercoa-bg-gray-200" />

              <div className="mercoa-my-4 mercoa-flex mercoa-justify-end mercoa-px-6">
                <MercoaButton
                  isEmphasized={true}
                  className={'mercoa-inline-flex mercoa-text-sm'}
                  onClick={onCreateInvoiceTemplate}
                  type="button"
                >
                  <PlusIcon className="-mercoa-ml-1 mercoa-size-5 md:mercoa-mr-2" aria-hidden="true" />
                  <span className="mercoa-hidden md:mercoa-inline-block">Add recurring invoice</span>
                </MercoaButton>
              </div>
            </div>
          </div>

          {/* Blur */}
          <div
            className={cn(
              'mercoa-absolute mercoa-inset-0 mercoa-z-[1]',
              showRecurringInvoices
                ? 'mercoa-opacity-100 mercoa-backdrop-blur-[3px]'
                : 'mercoa-opacity-0 mercoa-backdrop-blur-0',
            )}
            onClick={() => setShowRecurringInvoices(false)}
          />
        </>
      )}
    </div>
  )
}
