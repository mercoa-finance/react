import React from 'react'
import { CommonActionDialog } from './common-action-dialog'

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
    <CommonActionDialog
      open={open}
      setOpen={setOpen}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      title={`Submit ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'} for approval?`}
      description="This action will submit the invoice for approval."
      confirmButtonText="Submit"
      cancelButtonText="Cancel"
    />
  )
}
