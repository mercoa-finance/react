import { Mercoa } from '@mercoa/javascript'
import { Dispatch, FC, memo, SetStateAction, useEffect } from 'react'
import { Popover } from '../../../../../../../lib/components'
import { CrossIcon } from '../../../../../../common/assets/icons/cross-icon'
import { useDropdownStore } from '../../../../../../common/stores/dropdown-store'
import { usePayablesFilterStore } from '../../../../../stores/payables-filter-store'
interface ApproverActionFilterCardDropdown {
  tableId: string
  setShowFilterTrigger: Dispatch<SetStateAction<Boolean>>
}

const approverActions: Record<Mercoa.ApproverAction, string> = {
  [Mercoa.ApproverAction.None]: 'Not Approved',
  [Mercoa.ApproverAction.Approve]: 'Approved',
  [Mercoa.ApproverAction.Reject]: 'Rejected',
}

export const ApproverActionFilterCardDropdown: FC<ApproverActionFilterCardDropdown> = memo(
  ({ tableId, setShowFilterTrigger }) => {
    const { getFilters, setFilters } = usePayablesFilterStore()
    const { getOrCreateDropdownState, updateDropdownState } = useDropdownStore()
    const { open } = getOrCreateDropdownState(`${tableId}-approverActionFilterDropdown`)
    const { selectedApproverActions, selectedApprovers } = getFilters(tableId)

    const toggleSelection = (action: Mercoa.ApproverAction) => {
      const newFilters = selectedApproverActions.includes(action)
        ? selectedApproverActions.filter((item) => item !== action)
        : [...selectedApproverActions, action]

      setFilters(tableId, { selectedApproverActions: newFilters })
    }

    const renderTriggerContent = () => {
      if (!selectedApproverActions.length) return null
      return (
        <>
          {selectedApproverActions.map((approverAction) => {
            return (
              <span
                key={approverAction}
                className="mercoa-bg-white mercoa-text-[13px] mercoa-px-2 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-h-[24px]"
              >
                {approverActions[approverAction]}
              </span>
            )
          })}
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
        {open || selectedApprovers.length > 0 ? (
          <Popover
            onOpenAutoFocus={(e) => {
              e.preventDefault()
            }}
            sideOffset={12}
            open={open}
            onOpenChange={(_open) => {
              updateDropdownState(`${tableId}-approverActionFilterDropdown`, { open: _open })
              setShowFilterTrigger(true)
            }}
            trigger={
              <button
                onClick={() => updateDropdownState(`${tableId}-approverActionFilterDropdown`, { open: true })}
                className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-bg-gray-100 mercoa-rounded-full mercoa-px-2 mercoa-py-1 hover:mercoa-bg-gray-200"
              >
                <div
                  onClick={(e: React.MouseEvent) => {
                    updateDropdownState(`${tableId}-approverActionFilterDropdown`, { open: false })
                    setFilters(tableId, { selectedApproverActions: [], selectedApprovers: [] })
                    e.stopPropagation()
                  }}
                  className="mercoa-bg-white mercoa-rounded-full mercoa-p-1 mercoa-opacity-[0.5] hover:mercoa-opacity-[1]"
                >
                  <CrossIcon />
                </div>
                <span className="mercoa-text-[13px]">Approver Action</span>
                {renderTriggerContent()}
              </button>
            }
          >
            <div className="mercoa-flex mercoa-rounded-mercoa mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-overflow-scroll mercoa-max-h-[400px] mercoa-min-w-[16rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
              {Object.entries(approverActions).map(([key, value]) => (
                <div
                  key={key}
                  className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-3 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                  onClick={() => toggleSelection(key as Mercoa.ApproverAction)}
                >
                  <input
                    type="checkbox"
                    className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-none"
                    checked={selectedApproverActions.includes(key as Mercoa.ApproverAction)}
                    readOnly
                  />
                  <span className="mercoa-text-[14px] mercoa-color-[#1A1919]">{value}</span>
                </div>
              ))}
            </div>
          </Popover>
        ) : null}
      </>
    )
  },
)

ApproverActionFilterCardDropdown.displayName = 'ApproverActionFilterCardDropdown'
