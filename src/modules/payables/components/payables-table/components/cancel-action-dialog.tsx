import React from 'react'
import { CommonActionDialog } from './common-action-dialog'

interface CancelInvoiceDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const CancelInvoiceDialog: React.FC<CancelInvoiceDialogProps> = ({
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
      title={`Cancel ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'}?`}
      description="You can't undo this action."
      confirmButtonText="Cancel Invoice"
      confirmButtonColor="secondary"
      cancelButtonText="Never Mind"
    />
  )
}
