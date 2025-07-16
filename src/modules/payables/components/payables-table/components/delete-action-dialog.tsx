import React from 'react'
import { CommonActionDialog } from './common-action-dialog'

interface DeleteInvoiceDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
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
      title={`Delete ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'}?`}
      description="You can't undo this action."
      confirmButtonText="Delete"
      confirmButtonColor="secondary"
      cancelButtonText="Cancel"
    />
  )
}
