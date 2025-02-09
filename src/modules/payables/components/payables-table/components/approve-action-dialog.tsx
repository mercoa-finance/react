import React from 'react'
import { MercoaButton } from '../../../../../components/generics'
import { Dialog } from '../../../../../lib/components'

interface ApproveBillsDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  billsCount: number
}

export const ApproveBillsDialog: React.FC<ApproveBillsDialogProps> = ({
  onConfirm,
  onCancel,
  open,
  setOpen,
  isLoading,
  billsCount,
}) => {
  return (
    <Dialog open={open} onOpenChange={(_open) => setOpen(_open)}>
      <div className="mercoa-w-[320px] mercoa-flex mercoa-flex-col mercoa-relative mercoa-bg-white mercoa-text-[#1A1919] mercoa-p-[1rem] mercoa-rounded-[8px]">
        <div className="mercoa-text-left">
          <h3 className="mercoa-text-[16px] mercoa-font-semibold mercoa-text-[#1A1919]">
            Approve {billsCount} bill{billsCount > 1 ? 's' : ''}?
          </h3>
          <p className="mercoa-mt-[8px] mercoa-text-[14px] mercoa-text-[#6E6A68]">
            Make sure you’ve thoroughly reviewed these bills prior to approving.
          </p>
        </div>
        <div className="mercoa-flex mercoa-justify-end mercoa-gap-[12px] mercoa-mt-[16px]">
          <MercoaButton
            isEmphasized={false}
            hideOutline={true}
            color="gray"
            onClick={() => {
              onCancel()
              setOpen(false)
            }}
            className="mercoa-text-[14px] mercoa-font-medium mercoa-text-[#1A1919] hover:mercoa-underline"
          >
            Never mind
          </MercoaButton>
          <MercoaButton
            onClick={() => {
              onConfirm()
            }}
            isEmphasized={true}
            className="mercoa-w-[80px] mercoa-text-sm mercoa-justify-center mercoa-flex"
          >
            <div className="mercoa-w-[80px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
              {isLoading ? (
                <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
              ) : (
                'Approve'
              )}
            </div>
          </MercoaButton>
        </div>
      </div>
    </Dialog>
  )
}
