import React from 'react'
import { CommonActionDialog } from './common-action-dialog'

interface RestoreAsDraftDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const RestoreAsDraftDialog: React.FC<RestoreAsDraftDialogProps> = ({
  onConfirm,
  onCancel,
  open,
  setOpen,
  isLoading,
  invoiceCount,
}) => {
  return (
    <CommonActionDialog
      open={open}
      setOpen={setOpen}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      title={`Restore ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'} as draft?`}
      description="This action will restore the invoice so it can be processed again."
      confirmButtonText="Restore"
      cancelButtonText="Cancel"
    />
  )
}
