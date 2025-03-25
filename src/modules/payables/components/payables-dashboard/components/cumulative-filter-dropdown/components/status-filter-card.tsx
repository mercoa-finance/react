import { Dispatch, FC, memo, SetStateAction, useEffect, useMemo } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { invoiceStatusToName, useMercoaSession } from '../../../../../../../components'
import { Popover } from '../../../../../../../lib/components'
import { CrossIcon } from '../../../../../../common/assets/icons/cross-icon'
import { useDropdownStore } from '../../../../../../common/stores/dropdown-store'
import { usePayablesFilterStore } from '../../../../../stores/payables-filter-store'

const statuses = Object.values(Mercoa.InvoiceStatus)

interface StatusFilterCardDropdownProps {
  tableId: string
  setShowFilterTrigger: Dispatch<SetStateAction<Boolean>>
}

export const StatusFilterCardDropdown: FC<StatusFilterCardDropdownProps> = memo(({ tableId, setShowFilterTrigger }) => {
  const { userPermissionConfig } = useMercoaSession()
  const { getFilters, setFilters } = usePayablesFilterStore()
  const { getOrCreateDropdownState, updateDropdownState } = useDropdownStore()
  const { open } = getOrCreateDropdownState(`${tableId}-statusFilterDropdown`)
  const { selectedStatusFilters } = getFilters(tableId)

  const toggleSelection = (id: Mercoa.InvoiceStatus) => {
    const newFilters = selectedStatusFilters.includes(id)
      ? selectedStatusFilters.filter((item) => item !== id) // Remove filter
      : [...selectedStatusFilters, id] // Add filter

    setFilters(tableId, { selectedStatusFilters: newFilters })
  }

  const statusesByUser = useMemo(() => {
    return userPermissionConfig
      ? statuses.filter(
          (status) =>
            userPermissionConfig?.invoice.view.statuses.includes(status) ||
            userPermissionConfig?.invoice.view.all ||
            userPermissionConfig?.invoice.all,
        )
      : statuses
  }, [userPermissionConfig])

  const renderTriggerContent = () => {
    const selectedLabels = statusesByUser
      .filter((status) => selectedStatusFilters.includes(status))
      .map((status) => status)

    const displayed = [...selectedLabels].reverse().slice(0, 3)
    const extraCount = selectedLabels.length - displayed.length

    return (
      <>
        {displayed.map((label, index) => (
          <span
            key={index}
            className="mercoa-bg-white mercoa-text-[13px] mercoa-px-2 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-h-[24px]"
          >
            {invoiceStatusToName({ status: label as Mercoa.InvoiceStatus })}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="mercoa-bg-gray-200 mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-w-[24px] mercoa-h-[24px]">
            +{extraCount}
          </span>
        )}
      </>
    )
  }

  useEffect(() => {
    if (open) {
      setShowFilterTrigger(false)
    }
  }, [open, setShowFilterTrigger])

  return (
    <>
      {open || selectedStatusFilters.length > 0 ? (
        <Popover
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          sideOffset={12}
          open={open}
          onOpenChange={(_open) => {
            updateDropdownState(`${tableId}-statusFilterDropdown`, { open: _open })
            setShowFilterTrigger(true)
          }}
          trigger={
            <button
              onClick={() => updateDropdownState(`${tableId}-statusFilterDropdown`, { open: true })}
              className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-bg-gray-100 mercoa-rounded-full mercoa-px-2 mercoa-py-1 hover:mercoa-bg-gray-200"
            >
              <div
                onClick={(e: React.MouseEvent) => {
                  updateDropdownState(`${tableId}-statusFilterDropdown`, { open: false })
                  setFilters(tableId, { selectedStatusFilters: [] })
                  e.stopPropagation()
                }}
                className="mercoa-bg-white mercoa-rounded-full mercoa-p-1 mercoa-opacity-[0.5] hover:mercoa-opacity-[1]"
              >
                <CrossIcon />
              </div>
              <span className="mercoa-text-[13px]">Status</span>
              {renderTriggerContent()}
            </button>
          }
        >
          <div className="mercoa-flex mercoa-rounded-mercoa mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-max-h-[250px] mercoa-overflow-scroll mercoa-h-fit mercoa-min-w-[16rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
            {statusesByUser.map((status) => (
              <div
                key={status}
                className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-3 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                onClick={() => toggleSelection(status)}
              >
                <input
                  type="checkbox"
                  className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-none"
                  checked={selectedStatusFilters.includes(status)}
                  readOnly
                />
                <span className="mercoa-text-[14px] mercoa-color-[#1A1919] mercoa-capitalize">
                  {invoiceStatusToName({ status })}
                </span>
              </div>
            ))}
          </div>
        </Popover>
      ) : null}
    </>
  )
})

StatusFilterCardDropdown.displayName = 'StatusFilterCardDropdown'
