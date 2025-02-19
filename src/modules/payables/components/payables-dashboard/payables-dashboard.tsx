import { ArrowPathIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FC, memo, ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { EntityInboxEmail, useMercoaSession } from '../../../../components'
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
import { RecurringPayablesList } from './components/recurring-payables-list'
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

  onCreateInvoice?: () => void

  onCreateRecurringInvoice?: () => void

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
    onCreateInvoice,
    onCreateRecurringInvoice,
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
    const [showRecurringInvoices, setShowRecurringInvoices] = useState(false)
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
      recurringPayablesData,
      isRecurringPayablesLoading,
      metricsData,
      isMetricsLoading,
      approvalPolicies,
      isApprovalPoliciesLoading,
      statusTabsMetrics,
      isStatusTabsMetricsLoading,
    } = queryData

    return (
      <div className="mercoa-relative mercoa-pt-1">
        <div className="mercoa-flex mercoa-justify-end mercoa-items-center mercoa-gap-2">
          <div className="mercoa-flex mercoa-flex-col mercoa-mr-2">
            <span className="mercoa-text-xs mercoa-text-gray-500">Forward invoices to:</span>
            <EntityInboxEmail />
          </div>
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
                  <RecurringPayablesList
                    recurringPayablesData={recurringPayablesData}
                    isRecurringPayablesLoading={isRecurringPayablesLoading}
                    onSelectInvoice={onSelectInvoice}
                  />
                </div>

                <div className="mercoa-w-full mercoa-h-[1px] mercoa-bg-gray-200" />

                <div className="mercoa-my-4 mercoa-flex mercoa-justify-end mercoa-px-6">
                  <MercoaButton
                    isEmphasized={true}
                    className={'mercoa-inline-flex mercoa-text-sm'}
                    onClick={onCreateRecurringInvoice}
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
  },
)

PayablesDashboardV2.displayName = 'PayablesDashboardV2'
