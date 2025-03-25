import { DialogTitle } from '@radix-ui/react-dialog'
import React, { useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../components/Mercoa'
import { MercoaButton, MercoaCombobox } from '../../../../../components/generics'
import { Dialog } from '../../../../../lib/components'

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

  return (
    <Dialog open={open} onOpenChange={(_open) => setOpen(_open)}>
      <div className="mercoa-w-[400px] mercoa-flex mercoa-flex-col mercoa-relative mercoa-bg-white mercoa-text-[#1A1919] mercoa-p-[1rem] mercoa-rounded-[8px]">
        <div className="mercoa-text-left">
          <DialogTitle>
            <h3 className="mercoa-text-[16px] mercoa-font-semibold mercoa-text-[#1A1919]">
              Assign Approver to {invoiceCount} invoice{invoiceCount === 1 ? '' : 's'}
            </h3>
          </DialogTitle>
          <p className="mercoa-mt-[8px] mercoa-text-[14px] mercoa-text-[#6E6A68]">
            Select a user to assign as an approver.
          </p>
        </div>

        <div className="mercoa-mt-4">
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
              if (selectedUser) {
                onConfirm(selectedUser.id)
              }
            }}
            isEmphasized={true}
            disabled={!selectedUser}
            className="mercoa-w-[80px] mercoa-text-sm mercoa-justify-center mercoa-flex"
          >
            <div className="mercoa-w-20 mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
              {isLoading ? (
                <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
              ) : (
                'Assign'
              )}
            </div>
          </MercoaButton>
        </div>
      </div>
    </Dialog>
  )
}
