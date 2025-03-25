import { FC, ReactElement, useState } from 'react'
import { Popover } from '../../../../../lib/components'
import { ThreeDotIcon } from '../../../../common/assets/icons'

interface TableActionDropdownProps {
  validActions: string[]
  onAction: (actionKey: string) => void
  trigger?: ReactElement
}

// TODO: Refactor code duplication between this component and `PayablesTable`'s `TableActionDropdown`
export const TableActionDropdown: FC<TableActionDropdownProps> = ({ validActions, onAction, trigger }) => {
  const [open, setOpen] = useState(false)

  const tableActions = [{ label: 'Delete', actionKey: 'delete', disabled: !validActions.includes('delete') }]

  return (
    <Popover
      onOpenAutoFocus={(e) => {
        e.preventDefault()
      }}
      open={open}
      onOpenChange={setOpen}
      align="end"
      trigger={
        trigger ? (
          trigger
        ) : (
          <div
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
            }}
            className="mercoa-flex mercoa-justify-center mercoa-items-center mercoa-w-[32px] mercoa-h-[32px] mercoa-rounded-full hover:mercoa-bg-[#E9E5E2]"
          >
            <ThreeDotIcon />
          </div>
        )
      }
    >
      <div className="mercoa-translate-x-[-15px] mercoa-flex mercoa-flex-col mercoa-w-[12rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
        {tableActions.map((action, index) => (
          <div
            key={index}
            onClick={(e: React.MouseEvent) => {
              if (!action.disabled) {
                setOpen(false)
                onAction(action.actionKey)
                e.stopPropagation()
              }
            }}
            className={`mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-start mercoa-h-[44px] mercoa-px-[0.75rem] mercoa-py-[0.5rem] ${
              action.disabled
                ? 'mercoa-opacity-50 mercoa-pointer-events-none'
                : 'mercoa-cursor-pointer hover:mercoa-bg-[#F4F2F0]'
            }`}
          >
            {action.label}
          </div>
        ))}
      </div>
    </Popover>
  )
}
