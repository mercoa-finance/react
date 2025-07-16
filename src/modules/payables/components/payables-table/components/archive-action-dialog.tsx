import React from 'react'
import { CommonActionDialog } from './common-action-dialog'

interface ArchiveInvoiceDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const ArchiveInvoiceDialog: React.FC<ArchiveInvoiceDialogProps> = ({
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
      title={`Archive ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'}?`}
      description="This action will move these invoices to the archived state."
      confirmButtonText="Archive"
      cancelButtonText="Cancel"
    />
  )
}
