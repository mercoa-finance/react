import { Dispatch, FC, memo, SetStateAction, useEffect } from 'react'
import { useMercoaSession } from '../../../../../../../components'
import { Popover } from '../../../../../../../lib/components'
import { useDropdownStore } from '../../../../../../../modules/common/stores/dropdown-store'
import { CrossIcon } from '../../../../../assets/icons/cross-icon'
import { usePayablesFilterStore } from '../../../../../stores/payables-filter-store'

interface ApproversFilterCardDropdownProps {
  tableId: string
  setShowFilterTrigger: Dispatch<SetStateAction<Boolean>>
}

export const ApproversFilterCardDropdown: FC<ApproversFilterCardDropdownProps> = memo(
  ({ tableId, setShowFilterTrigger }) => {
    const mercoaSession = useMercoaSession()
    const { getFilters, setFilters } = usePayablesFilterStore()
    const { getOrCreateDropdownState, updateDropdownState } = useDropdownStore()
    const { open } = getOrCreateDropdownState(`${tableId}-approversFilterDropdown`)
    const { selectedApprovers } = getFilters(tableId)

    const toggleSelection = () => {
      const newFilters = selectedApprovers.includes('current')
        ? selectedApprovers.filter((item) => item !== 'current')
        : [...selectedApprovers, 'current']

      setFilters(tableId, { selectedApprovers: newFilters as any })
    }

    const renderTriggerContent = () => {
      if (!selectedApprovers.includes('current')) return null
      return (
        <span className="mercoa-bg-white mercoa-text-[13px] mercoa-px-2 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-h-[24px]">
          Current User
        </span>
      )
    }

    useEffect(() => {
      if (open) {
        setShowFilterTrigger(false)
      }
    }, [open, setShowFilterTrigger])

    return (
      <>
        {open || selectedApprovers.includes('current') ? (
          <Popover
            onOpenAutoFocus={(e) => {
              e.preventDefault()
            }}
            sideOffset={12}
            open={open}
            onOpenChange={(_open) => {
              updateDropdownState(`${tableId}-approversFilterDropdown`, { open: _open })
              setShowFilterTrigger(true)
            }}
            trigger={
              <button
                onClick={() => updateDropdownState(`${tableId}-approversFilterDropdown`, { open: true })}
                className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-bg-gray-100 mercoa-rounded-full mercoa-px-2 mercoa-py-1 hover:mercoa-bg-gray-200"
              >
                <div
                  onClick={(e: React.MouseEvent) => {
                    updateDropdownState(`${tableId}-approversFilterDropdown`, { open: false })
                    setFilters(tableId, { selectedApprovers: [] })
                    e.stopPropagation()
                  }}
                  className="mercoa-bg-white mercoa-rounded-full mercoa-p-1 mercoa-opacity-[0.5] hover:mercoa-opacity-[1]"
                >
                  <CrossIcon />
                </div>
                <span className="mercoa-text-[13px]">Approvers</span>
                {renderTriggerContent()}
              </button>
            }
          >
            <div className="mercoa-flex mercoa-rounded-mercoa mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-overflow-scroll mercoa-max-h-[calc(100vh-2rem)] mercoa-min-w-[16rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
              <div
                className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-3 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                onClick={toggleSelection}
              >
                <input
                  type="checkbox"
                  className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-none"
                  checked={selectedApprovers.includes('current')}
                  readOnly
                />
                <span className="mercoa-text-[14px] mercoa-color-[#1A1919]">Current User</span>
              </div>
            </div>
          </Popover>
        ) : null}
      </>
    )
  },
)

ApproversFilterCardDropdown.displayName = 'ApproversFilterCardDropdown'
