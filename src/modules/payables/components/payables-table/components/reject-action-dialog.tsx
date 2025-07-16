import React from 'react'
import { CommonActionDialog } from './common-action-dialog'

interface RejectBillsDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const RejectBillsDialog: React.FC<RejectBillsDialogProps> = ({
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
      title={`Reject ${invoiceCount} invoice${invoiceCount > 1 ? 's' : ''}?`}
      description="Make sure you've thoroughly reviewed these invoices prior to rejecting."
      confirmButtonText="Reject"
      confirmButtonColor="secondary"
    />
  )
}
