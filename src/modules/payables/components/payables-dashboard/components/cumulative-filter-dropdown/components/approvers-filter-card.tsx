import { Dispatch, FC, memo, SetStateAction, useEffect, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../../../components'
import { Popover } from '../../../../../../../lib/components'
import { CrossIcon } from '../../../../../../common/assets/icons/cross-icon'
import { useDropdownStore } from '../../../../../../common/stores/dropdown-store'
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
    const [searchTerm, setSearchTerm] = useState('')

    const toggleSelection = (id: Mercoa.EntityUserResponse) => {
      const newFilters = selectedApprovers.includes(id)
        ? selectedApprovers.filter((item) => item !== id)
        : [...selectedApprovers, id]

      setFilters(tableId, {
        selectedApprovers: newFilters as any,
        selectedApproverActions: [Mercoa.ApproverAction.None], // By default, we want to only show invoices that have not been actioned
      })
    }

    const filteredUsers = mercoaSession.users.filter(
      (user) =>
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
    )

    const renderTriggerContent = () => {
      if (!selectedApprovers.length) return null
      return (
        <>
          {selectedApprovers.map((approver) => {
            return (
              <span
                key={approver.id}
                className="mercoa-bg-white mercoa-text-[13px] mercoa-px-2 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-h-[24px]"
              >
                {approver.email}
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
                    setFilters(tableId, { selectedApprovers: [], selectedApproverActions: [] })
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
            <div className="mercoa-flex mercoa-rounded-mercoa mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-overflow-scroll mercoa-max-h-[400px] mercoa-min-w-[16rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
              <div className="mercoa-p-2 mercoa-border-b mercoa-border-gray-200">
                <input
                  type="text"
                  placeholder="Search approvers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mercoa-w-full mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-border mercoa-border-gray-300 mercoa-rounded-md focus:mercoa-outline-none focus:mercoa-ring-1 focus:mercoa-ring-mercoa-primary focus:mercoa-border-mercoa-primary"
                />
              </div>
              {mercoaSession.user && (
                <div
                  className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-3 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                  onClick={() => {
                    if (mercoaSession.user) {
                      toggleSelection(mercoaSession.user)
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-none"
                    checked={selectedApprovers.find((approver) => approver.id === mercoaSession.user?.id) !== undefined}
                    readOnly
                  />
                  <span className="mercoa-text-[14px] mercoa-color-[#1A1919]">Assigned to me</span>
                </div>
              )}
              {filteredUsers
                .filter((user) => user.id !== mercoaSession.user?.id)
                ?.map((user) => (
                  <div
                    key={user.id}
                    className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-3 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                    onClick={() => toggleSelection(user)}
                  >
                    <input
                      type="checkbox"
                      className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-none"
                      checked={selectedApprovers.find((approver) => approver.id === user.id) !== undefined}
                      readOnly
                    />
                    <span className="mercoa-text-[14px] mercoa-color-[#1A1919]">
                      {user.name} - {user.email}
                    </span>
                  </div>
                ))}
            </div>
          </Popover>
        ) : null}
      </>
    )
  },
)

ApproversFilterCardDropdown.displayName = 'ApproversFilterCardDropdown'
