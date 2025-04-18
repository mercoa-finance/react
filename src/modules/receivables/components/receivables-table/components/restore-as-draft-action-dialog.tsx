import { DialogTitle } from '@radix-ui/react-dialog'
import React from 'react'
import { ButtonLoadingSpinner, MercoaButton } from '../../../../../components/generics'
import { Dialog } from '../../../../../lib/components'

interface RestoreAsDraftDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

// TODO: Refactor code duplication between this component and `PayablesTable`'s `RestoreAsDraftDialog`
// This is a perfect copy of `PayablesTable`'s `RestoreAsDraftDialog`!
export const RestoreAsDraftDialog: React.FC<RestoreAsDraftDialogProps> = ({
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
              Restore {invoiceCount} invoice{invoiceCount === 1 ? '' : 's'} as draft?
            </h3>
          </DialogTitle>
          <p className="mercoa-mt-[8px] mercoa-text-[14px] mercoa-text-[#6E6A68]">
            This action will restore the invoice so it can be processed again.
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
            <ButtonLoadingSpinner isLoading={isLoading}>Restore</ButtonLoadingSpinner>
          </MercoaButton>
        </div>
      </div>
    </Dialog>
  )
}
