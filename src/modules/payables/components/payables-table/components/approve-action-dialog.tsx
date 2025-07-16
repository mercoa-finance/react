import React from 'react'
import { CommonActionDialog } from './common-action-dialog'

interface ApproveBillsDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const ApproveBillsDialog: React.FC<ApproveBillsDialogProps> = ({
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
      title={`Approve ${invoiceCount} invoice${invoiceCount > 1 ? 's' : ''}?`}
      description="Make sure you've reviewed these invoices before approving."
      confirmButtonText="Approve"
    />
  )
}
