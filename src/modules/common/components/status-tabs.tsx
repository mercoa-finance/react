import { useEffect, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { invoiceStatusToName, NoSession, useMercoaSession } from '../../../components'
import { CountPill } from '../../../components/generics'

interface StatusTabsProps {
  invoiceType?: 'invoice' | 'invoiceTemplate'
  statuses?: Array<Mercoa.InvoiceStatus>
  customStatuses?: {
    statuses: Mercoa.InvoiceStatus[]
    label: string
  }[]
  onStatusChange?: (status: Mercoa.InvoiceStatus[]) => any
  excludePayables?: boolean
  selectedStatuses: Mercoa.InvoiceStatus[]
  approvalPolicies?: Mercoa.ApprovalPolicyResponse[]
  invoiceMetrics?: {
    [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse
  }
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
  invoiceType = 'invoice',
  statuses,
  customStatuses,
  onStatusChange,
  excludePayables,
  selectedStatuses,
  approvalPolicies,
  invoiceMetrics,
}) => {
  const mercoaSession = useMercoaSession()

  const [tabs, setTabs] = useState<Array<{ statuses: Mercoa.InvoiceStatus[]; label: string }>>(() => {
    if (customStatuses) {
      return customStatuses
    } else if (statuses) {
      return statuses.map((status) => ({
        statuses: [status],
        label: invoiceStatusToName({ status, approvalPolicies, excludePayables, invoiceType }),
      }))
    } else {
      return [
        Mercoa.InvoiceStatus.Draft,
        Mercoa.InvoiceStatus.New,
        Mercoa.InvoiceStatus.Approved,
        Mercoa.InvoiceStatus.Scheduled,
        Mercoa.InvoiceStatus.Pending,
        Mercoa.InvoiceStatus.Paid,
        Mercoa.InvoiceStatus.Canceled,
        Mercoa.InvoiceStatus.Refused,
        Mercoa.InvoiceStatus.Failed,
        Mercoa.InvoiceStatus.Archived,
      ].map((status) => ({
        statuses: [status],
        label: invoiceStatusToName({ status, approvalPolicies, excludePayables, invoiceType }),
      }))
    }
  })

  useEffect(() => {
    if (!Array.isArray(approvalPolicies)) return
    if (customStatuses) {
      setTabs(customStatuses)
    } else if (statuses) {
      setTabs(
        statuses.map((status) => ({
          statuses: [status],
          label: invoiceStatusToName({ status, approvalPolicies, excludePayables, invoiceType }),
        })),
      )
    } else if (!approvalPolicies || approvalPolicies?.length < 1) {
      setTabs(tabs.filter((tab) => !tab.statuses.every((status) => status === Mercoa.InvoiceStatus.New)))
    }
  }, [statuses, approvalPolicies, customStatuses, excludePayables, invoiceType])

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
            if (onStatusChange) onStatusChange([e.target.value as Mercoa.InvoiceStatus])
          }}
        >
          {tabs.map((status) => (
            <option key={status.statuses.join(',')} value={status.statuses.join(',')}>
              {status.label}
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
            <button
              onClick={() => {
                if (onStatusChange) onStatusChange(status.statuses)
              }}
              key={status.statuses.join(',')}
              type="button"
              className={`${
                selectedStatuses.every((selectedStatus) => status.statuses.includes(selectedStatus))
                  ? 'mercoa-text-mercoa-primary sm:mercoa-border-mercoa-primary'
                  : 'mercoa-border-transparent mercoa-text-gray-500 hover:mercoa-border-gray-300 hover:mercoa-text-gray-700'
              } mercoa-mr-2 mercoa-whitespace-nowrap mercoa-py-4 mercoa-px-1 mercoa-text-sm mercoa-font-medium sm:mercoa-mr-0 sm:mercoa-border-b-2`}
              aria-current={
                selectedStatuses.every((selectedStatus) => status.statuses.includes(selectedStatus))
                  ? 'page'
                  : undefined
              }
            >
              {status.label}{' '}
              {invoiceType === 'invoice' && (
                <CountPill
                  count={status.statuses.reduce((acc, status) => acc + (invoiceMetrics?.[status]?.totalCount ?? 0), 0)}
                  selected={selectedStatuses.every((selectedStatus) => status.statuses.includes(selectedStatus))}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
