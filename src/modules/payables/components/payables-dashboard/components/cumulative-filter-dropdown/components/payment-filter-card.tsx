import { Dispatch, FC, memo, SetStateAction, useEffect } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { Popover } from '../../../../../../../lib/components'
import { CrossIcon } from '../../../../../../common/assets/icons/cross-icon'
import { useDropdownStore } from '../../../../../../common/stores/dropdown-store'
import { usePayablesFilterStore } from '../../../../../stores/payables-filter-store'

const paymentModes = [
  { id: 1, value: Mercoa.PaymentMethodType.BankAccount },
  { id: 2, value: Mercoa.PaymentMethodType.Check },
  { id: 3, value: Mercoa.PaymentMethodType.OffPlatform },
  { id: 4, value: Mercoa.PaymentMethodType.Card },
]

interface PaymentModeFilterCardDropdownProps {
  tableId: string
  setShowFilterTrigger: Dispatch<SetStateAction<Boolean>>
}

export const PaymentModeFilterCardDropdown: FC<PaymentModeFilterCardDropdownProps> = memo(
  ({ tableId, setShowFilterTrigger }) => {
    const { getFilters, setFilters } = usePayablesFilterStore()
    const { getOrCreateDropdownState, updateDropdownState } = useDropdownStore()
    const { open } = getOrCreateDropdownState(`${tableId}-paymentMethodFilterDropdown`)
    const { selectedPaymentModeFilters } = getFilters(tableId)

    const toggleSelection = (id: Mercoa.PaymentMethodType) => {
      const newFilters = selectedPaymentModeFilters.includes(id)
        ? selectedPaymentModeFilters.filter((item) => item !== id)
        : [...selectedPaymentModeFilters, id]

      setFilters(tableId, { selectedPaymentModeFilters: newFilters })
    }

    const renderTriggerContent = () => {
      const selectedLabels = paymentModes
        .filter((status) => selectedPaymentModeFilters.includes(status.value))
        .map((status) => status.value)

      const displayed = selectedLabels.slice(0, 3)
      const extraCount = selectedLabels.length - displayed.length

      return (
        <>
          {displayed.map((label, index) => (
            <span
              key={index}
              className="mercoa-bg-white mercoa-text-[13px] mercoa-px-2 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-h-[24px]"
            >
              {label}
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
        {open || selectedPaymentModeFilters.length > 0 ? (
          <Popover
            onOpenAutoFocus={(e) => {
              e.preventDefault()
            }}
            sideOffset={12}
            open={open}
            onOpenChange={(_open) => {
              updateDropdownState(`${tableId}-paymentMethodFilterDropdown`, { open: _open })
              setShowFilterTrigger(true)
            }}
            trigger={
              <button
                onClick={() => updateDropdownState(`${tableId}-paymentMethodFilterDropdown`, { open: true })}
                className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-bg-gray-100 mercoa-rounded-full mercoa-px-2 mercoa-py-1 hover:mercoa-bg-gray-200"
              >
                <div
                  onClick={(e: React.MouseEvent) => {
                    updateDropdownState(`${tableId}-paymentMethodFilterDropdown`, { open: false })
                    setFilters(tableId, { selectedPaymentModeFilters: [] })
                    e.stopPropagation()
                  }}
                  className="mercoa-bg-white mercoa-rounded-full mercoa-p-1 mercoa-opacity-[0.5] hover:mercoa-opacity-[1]"
                >
                  <CrossIcon />
                </div>
                <span className="mercoa-text-[13px]">Payment Mode</span>
                {renderTriggerContent()}
              </button>
            }
          >
            <div className="mercoa-flex mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-max-h-[calc(100vh-2rem)] mercoa-w-[24rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
              {paymentModes.map((paymentMode) => (
                <div
                  key={paymentMode.id}
                  className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-3 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                  onClick={() => toggleSelection(paymentMode.value)}
                >
                  <input
                    type="checkbox"
                    className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-none"
                    checked={selectedPaymentModeFilters.includes(paymentMode.value)}
                    readOnly
                  />
                  <span className="mercoa-text-[14px] mercoa-color-[#1A1919] mercoa-capitalize">
                    {paymentMode.value.toLocaleLowerCase()}
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

PaymentModeFilterCardDropdown.displayName = 'PaymentModeFilterCardDropdown'
