import { FC, useState } from 'react'
import { MercoaButton } from '../../../../../../components/generics'
import { Popover } from '../../../../../../lib/components'
import { PlusIcon, RightArrowIcon } from '../../../../../common/assets/icons'
import { useDropdownStore } from '../../../../../common/stores/dropdown-store'
import { ApproverActionFilterCardDropdown } from './components/approvers-action-card'
import { ApproversFilterCardDropdown } from './components/approvers-filter-card'
import { StatusFilterCardDropdown } from './components/status-filter-card'

const filters = [
  { name: 'Vendor', count: 2 },
  { name: 'Vendor owner', count: null },
  { name: 'Status', count: null },
  { name: 'Amount', count: 1 },
  { name: 'Payment method', count: null },
  { name: 'Bill type', count: null },
  { name: 'Next approver', count: null },
]

export const CumulativeFilterDropdown: FC = () => {
  const { getOrCreateDropdownState, updateDropdownState } = useDropdownStore()
  const { open: primaryFilterOpen } = getOrCreateDropdownState('primaryFilter')
  const [showFilterTrigger, setShowFilterTrigger] = useState<Boolean>(true)
  const tableId = 'payables'

  const filterOptions = [
    { label: 'Status', dropdownKey: 'statusFilterDropdown' },
    { label: 'Approvers', dropdownKey: 'approversFilterDropdown' },
    // { label: 'Payment Method', dropdownKey: 'paymentMethodFilterDropdown' },
  ]

  return (
    <div className="mercoa-flex mercoa-items-center mercoa-mb-4 mercoa-gap-4">
      <StatusFilterCardDropdown tableId="payables" setShowFilterTrigger={setShowFilterTrigger} />
      {/* <PaymentModeFilterCardDropdown tableId="payables" setShowFilterTrigger={setShowFilterTrigger} /> */}
      <ApproversFilterCardDropdown tableId="payables" setShowFilterTrigger={setShowFilterTrigger} />
      <ApproverActionFilterCardDropdown tableId="payables" setShowFilterTrigger={setShowFilterTrigger} />

      {showFilterTrigger && (
        <Popover
          sideOffset={12}
          trigger={
            <MercoaButton
              isEmphasized={true}
              className="mercoa-h-[32px] mercoa-w-[64px] mercoa-flex mercoa-items-center mercoa-justify-center"
            >
              <div className="mercoa-stroke-[#FFF]">
                <PlusIcon />
              </div>
              <span className="mercoa-text-[0.75rem] mercoa-leading-[1rem] mercoa-text-mercoa-primary-text-invert">
                Filter
              </span>
            </MercoaButton>
          }
          open={primaryFilterOpen}
          onOpenChange={(open) => updateDropdownState('primaryFilter', { open: open })}
        >
          <div className="mercoa-flex mercoa-rounded-mercoa mercoa-flex-col  mercoa-relative mercoa-max-w-[calc(50vw-4rem)] mercoa-max-h-[calc(100vh-2rem)] mercoa-w-[18rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
            {filterOptions.map((option, index) => (
              <div
                onClick={() => {
                  updateDropdownState('primaryFilter', { open: false })
                  updateDropdownState(`${tableId}-${option.dropdownKey}`, { open: true })
                }}
                key={index}
                className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-between mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
              >
                {option.label}
                <RightArrowIcon />
              </div>
            ))}
          </div>
        </Popover>
      )}
    </div>
  )
}
