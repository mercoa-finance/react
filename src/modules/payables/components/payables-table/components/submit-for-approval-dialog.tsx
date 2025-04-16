import { DialogTitle } from '@radix-ui/react-dialog'
import React from 'react'
import { ButtonLoadingSpinner, MercoaButton } from '../../../../../components/generics'
import { Dialog } from '../../../../../lib/components'

interface SubmitForApprovalDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const SubmitForApprovalDialog: React.FC<SubmitForApprovalDialogProps> = ({
  onConfirm,
  onCancel,
  open,
  setOpen,
  isLoading,
  invoiceCount,
}) => {
  return (
    <Dialog open={open} onOpenChange={(_open) => setOpen(_open)}>
      <div className="mercoa-w-[320px] mercoa-flex mercoa-flex-col mercoa-relative mercoa-bg-white mercoa-text-[#1A1919] mercoa-p-[1rem] mercoa-rounded-[8px]">
        <div className="mercoa-text-left">
          <DialogTitle>
            <h3 className="mercoa-text-[16px] mercoa-font-semibold mercoa-text-[#1A1919]">
              Submit {invoiceCount} invoice{invoiceCount === 1 ? '' : 's'} for approval?
            </h3>
          </DialogTitle>
          <p className="mercoa-mt-[8px] mercoa-text-[14px] mercoa-text-[#6E6A68]">
            This action will submit the invoice for approval.
          </p>
        </div>
        <div className="mercoa-flex mercoa-justify-end mercoa-gap-[12px] mercoa-mt-[16px]">
          <MercoaButton
            onClick={() => {
              onCancel()
              setOpen(false)
            }}
            isEmphasized={false}
            hideOutline={true}
            color="gray"
            className="mercoa-text-[14px] mercoa-font-medium mercoa-text-[#1A1919] hover:mercoa-underline"
          >
            Cancel
          </MercoaButton>
          <MercoaButton
            onClick={() => {
              onConfirm()
            }}
            isEmphasized={true}
            className="mercoa-whitespace-nowrap"
          >
            <ButtonLoadingSpinner isLoading={isLoading}>Submit</ButtonLoadingSpinner>
          </MercoaButton>
        </div>
      </div>
    </Dialog>
  )
}
