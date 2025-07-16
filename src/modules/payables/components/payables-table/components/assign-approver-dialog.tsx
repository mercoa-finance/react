import React, { useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../components/Mercoa'
import { MercoaCombobox } from '../../../../../components/generics'
import { CommonActionDialog } from './common-action-dialog'

interface AssignApproverDialogProps {
  onConfirm: (userId: string) => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  invoiceCount: number
}

export const AssignApproverDialog: React.FC<AssignApproverDialogProps> = ({
  onConfirm,
  onCancel,
  open,
  setOpen,
  isLoading,
  invoiceCount,
}) => {
  const mercoaSession = useMercoaSession()
  const [selectedUser, setSelectedUser] = useState<Mercoa.EntityUserResponse>()

  const handleConfirm = () => {
    if (selectedUser) {
      onConfirm(selectedUser.id)
    }
  }

  return (
    <CommonActionDialog
      open={open}
      setOpen={setOpen}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      title={`Assign Approver to ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'}`}
      description="Select a user to assign as an approver."
      confirmButtonText="Assign"
      width="mercoa-w-[400px]"
      disabled={!selectedUser}
    >
      <MercoaCombobox
        options={mercoaSession.users.map((user) => ({
          disabled: false,
          value: user,
        }))}
        displayIndex="name"
        secondaryDisplayIndex="email"
        onChange={(e) => {
          mercoaSession.debug(e)
          setSelectedUser(e)
        }}
        value={selectedUser}
        displaySelectedAs="pill"
        showAllOptions
      />
    </CommonActionDialog>
  )
}
