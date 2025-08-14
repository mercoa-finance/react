import React from 'react'
import { CommonActionDialog } from '../../../payables-table/components/common-action-dialog'

interface VoidCheckDialogProps {
  onConfirm: () => void
  onCancel: () => void
  open: boolean
  setOpen: (open: boolean) => void
  isLoading: boolean
  checkNumber?: string
}

export const VoidCheckDialog: React.FC<VoidCheckDialogProps> = ({
  onConfirm,
  onCancel,
  open,
  setOpen,
  isLoading,
  checkNumber,
}) => {
  return (
    <CommonActionDialog
      open={open}
      setOpen={setOpen}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      title="Void Check?"
      description="This will mark the invoice as failed and void the associated check transaction. You cannot undo this action."
      confirmButtonText="Void Check"
      confirmButtonColor="red"
      cancelButtonText="Cancel"
      width="mercoa-w-[400px]"
    >
      <div className="mercoa-bg-yellow-50 mercoa-border mercoa-border-yellow-200 mercoa-rounded-md mercoa-p-3">
        <div className="mercoa-flex">
          <div className="mercoa-flex-shrink-0">
            <svg
              className="mercoa-h-5 mercoa-w-5 mercoa-text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="mercoa-ml-3">
            <h3 className="mercoa-text-sm mercoa-font-medium mercoa-text-yellow-800">Important Instructions</h3>
            <div className="mercoa-mt-2 mercoa-text-sm mercoa-text-yellow-700">
              <p className="mercoa-mb-2">
                To complete the void process, you must also contact your bank with the following information:
              </p>
              {checkNumber && <p className="mercoa-font-semibold mercoa-mb-2">Check Number: {checkNumber}</p>}
              <ul className="mercoa-list-disc mercoa-list-inside mercoa-space-y-1">
                <li>Provide the check number to your bank</li>
                <li>Request that the check be voided/stopped</li>
                <li>Confirm the void has been processed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </CommonActionDialog>
  )
}
