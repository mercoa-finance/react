import { FC, ReactElement, useState } from 'react'
import { Popover } from '../../../../../lib/components'
import { cn } from '../../../../../lib/style'
import { ThreeDotIcon } from '../../../../common/assets/icons'
import { ReceivablesTableAction } from '../constants'

interface TableActionDropdownProps {
  validActions: ReceivablesTableAction[]
  onAction: (actionKey: ReceivablesTableAction) => void
  trigger?: ReactElement
  isDisabled?: boolean
}

export const TableActionDropdown: FC<TableActionDropdownProps> = ({ validActions, onAction, trigger, isDisabled }) => {
  const [open, setOpen] = useState(false)

  const tableActions = [
    // {
    //   label: 'Send Invoice',
    //   actionKey: ReceivablesTableAction.SendInvoice,
    //   disabled: !validActions.includes(ReceivablesTableAction.SendInvoice),
    // },
    {
      label: 'Cancel Invoice',
      actionKey: ReceivablesTableAction.Cancel,
      disabled: !validActions.includes(ReceivablesTableAction.Cancel),
    },
    {
      label: 'Archive Invoice',
      actionKey: ReceivablesTableAction.Archive,
      disabled: !validActions.includes(ReceivablesTableAction.Archive),
    },
    {
      label: 'Restore as Draft',
      actionKey: ReceivablesTableAction.RestoreAsDraft,
      disabled: !validActions.includes(ReceivablesTableAction.RestoreAsDraft),
    },
    {
      label: 'Delete Invoice',
      actionKey: ReceivablesTableAction.Delete,
      disabled: !validActions.includes(ReceivablesTableAction.Delete),
    },
  ]

  if (validActions.length === 0 || tableActions.every((action) => action.disabled)) {
    return null
  }

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
            className={cn(
              'mercoa-flex mercoa-justify-center mercoa-items-center mercoa-w-[32px] mercoa-h-[32px] mercoa-rounded-full hover:mercoa-bg-[#E9E5E2]',
              isDisabled && 'mercoa-opacity-50 mercoa-pointer-events-none',
            )}
          >
            <ThreeDotIcon />
          </div>
        )
      }
    >
      <div className="mercoa-translate-x-[-15px] mercoa-flex mercoa-flex-col mercoa-w-[12rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
        {tableActions
          .filter((action) => !action.disabled)
          .map((action, index) => (
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
