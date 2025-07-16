import { DialogTitle } from '@radix-ui/react-dialog'
import React, { ReactNode } from 'react'
import { ButtonLoadingSpinner, MercoaButton } from '../../../../../components/generics'
import { Dialog } from '../../../../../lib/components'

interface CommonActionDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
  isLoading: boolean
  title: string
  description: string
  confirmButtonText: string
  cancelButtonText?: string
  confirmButtonColor?: 'red' | 'green' | 'blue' | 'indigo' | 'yellow' | 'gray' | 'secondary'
  width?: string
  children?: ReactNode
  disabled?: boolean
}

export const CommonActionDialog: React.FC<CommonActionDialogProps> = ({
  open,
  setOpen,
  onConfirm,
  onCancel,
  isLoading,
  title,
  description,
  confirmButtonText,
  cancelButtonText = 'Never mind',
  confirmButtonColor,
  width = 'mercoa-w-[320px]',
  children,
  disabled = false,
}) => {
  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(_open) => setOpen(_open)}>
      <div
        className={`${width} mercoa-flex mercoa-flex-col mercoa-relative mercoa-bg-white mercoa-text-[#1A1919] mercoa-p-[1rem] mercoa-rounded-[8px]`}
      >
        <div className="mercoa-text-left">
          <DialogTitle>
            <h3 className="mercoa-text-[16px] mercoa-font-semibold mercoa-text-[#1A1919]">{title}</h3>
          </DialogTitle>
          <p className="mercoa-mt-[8px] mercoa-text-[14px] mercoa-text-[#6E6A68]">{description}</p>
        </div>

        {children && <div className="mercoa-mt-4">{children}</div>}

        <div className="mercoa-flex mercoa-justify-end mercoa-gap-[12px] mercoa-mt-[16px]">
          <MercoaButton
            isEmphasized={false}
            hideOutline={true}
            color="gray"
            onClick={handleCancel}
            className="mercoa-whitespace-nowrap"
          >
            {cancelButtonText}
          </MercoaButton>
          <MercoaButton
            onClick={handleConfirm}
            color={confirmButtonColor}
            isEmphasized={true}
            disabled={disabled || isLoading}
            className="mercoa-whitespace-nowrap"
          >
            <ButtonLoadingSpinner isLoading={isLoading}>{confirmButtonText}</ButtonLoadingSpinner>
          </MercoaButton>
        </div>
      </div>
    </Dialog>
  )
}
