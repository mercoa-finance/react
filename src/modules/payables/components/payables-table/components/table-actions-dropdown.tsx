import { FC, ReactElement, useState } from 'react'
import { Popover } from '../../../../../lib/components'
import { ThreeDotIcon } from '../../../../common/assets/icons'
import { PayablesTableAction } from '../constants'

interface TableActionDropdownProps {
  validActions: PayablesTableAction[]
  onAction: (actionKey: PayablesTableAction) => void
  trigger?: ReactElement
}

export const TableActionDropdown: FC<TableActionDropdownProps> = ({ validActions, onAction, trigger }) => {
  const [open, setOpen] = useState(false)

  const tableActions = [
    {
      label: 'Add Approver',
      actionKey: PayablesTableAction.AddApprover,
      disabled: !validActions.includes(PayablesTableAction.AddApprover),
    },
    {
      label: 'Submit for Approval',
      actionKey: PayablesTableAction.SubmitForApproval,
      disabled: !validActions.includes(PayablesTableAction.SubmitForApproval),
    },
    {
      label: 'Approve',
      actionKey: PayablesTableAction.Approve,
      disabled: !validActions.includes(PayablesTableAction.Approve),
    },
    {
      label: 'Reject',
      actionKey: PayablesTableAction.Reject,
      disabled: !validActions.includes(PayablesTableAction.Reject),
    },
    {
      label: 'Set Payment Date',
      actionKey: PayablesTableAction.SetPaymentDate,
      disabled: !validActions.includes(PayablesTableAction.SetPaymentDate),
    },
    {
      label: 'Schedule Payment',
      actionKey: PayablesTableAction.SchedulePayment,
      disabled: !validActions.includes(PayablesTableAction.SchedulePayment),
    },
    {
      label: 'Cancel Invoice',
      actionKey: PayablesTableAction.Cancel,
      disabled: !validActions.includes(PayablesTableAction.Cancel),
    },
    {
      label: 'Archive Invoice',
      actionKey: PayablesTableAction.Archive,
      disabled: !validActions.includes(PayablesTableAction.Archive),
    },
    {
      label: 'Restore as Draft',
      actionKey: PayablesTableAction.RestoreAsDraft,
      disabled: !validActions.includes(PayablesTableAction.RestoreAsDraft),
    },
    {
      label: 'Delete Invoice',
      actionKey: PayablesTableAction.Delete,
      disabled: !validActions.includes(PayablesTableAction.Delete),
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
            className="mercoa-flex mercoa-justify-center mercoa-items-center mercoa-w-[32px] mercoa-h-[32px] mercoa-rounded-full hover:mercoa-bg-[#E9E5E2]"
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
