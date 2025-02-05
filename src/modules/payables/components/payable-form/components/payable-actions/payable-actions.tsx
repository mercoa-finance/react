import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { EntitySelector, MercoaButton, NoSession, useMercoaSession } from '../../../../../../components'
import { getInvoiceClient } from '../../../payable-details/utils'
import { PayableAction } from '../../constants'
import { findApproverSlot } from '../payable-approvers/utils'
import { PayableFormErrors } from './payable-form-errors'

export type PayableActionChildrenProps = {
  isSaving: boolean
  buttons?: JSX.Element[]
  setStatus: (status: Mercoa.InvoiceStatus) => void
  submitForm?: () => void
}

export function PayableActions({
  invoiceType = 'invoice',
  refreshInvoice,
  approveButton,
  rejectButton,
  nonApproverButton,
  recreateDraftButton,
  deleteButton,
  archiveButton,
  cancelButton,
  saveDraftButton,
  printCheckButton,
  viewCheckButton,
  createInvoiceButton,
  submitForApprovalButton,
  nextButton,
  markAsPaidButton,
  schedulePaymentButton,
  retryPaymentButton,
  submitForm,
  additionalActions,
  actionLoading,
  children,
}: {
  invoiceType?: 'invoice' | 'invoiceTemplate'
  refreshInvoice?: (invoiceId: string) => void
  approveButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  rejectButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  nonApproverButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  recreateDraftButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  deleteButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  archiveButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  cancelButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  saveDraftButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  printCheckButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  viewCheckButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  createInvoiceButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  submitForm?: () => void
  submitForApprovalButton?: ({
    onClick,
    approversAssigned,
  }: {
    onClick: () => void
    approversAssigned: boolean
  }) => JSX.Element
  nextButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  markAsPaidButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  schedulePaymentButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  retryPaymentButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  additionalActions?: {
    hideDefaultActions?: boolean
    position: 'left' | 'right'
    actions: (props: PayableActionChildrenProps) => JSX.Element[]
  }
  actionLoading?: boolean
  children?: (props: PayableActionChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()
  const [isSaving, setIsSaving] = useState(false)
  const { setValue, watch, formState } = useFormContext()
  const formAction = watch('formAction')

  const paymentDestinationOptions = watch('paymentDestinationOptions')
  const paymentDestinationType = watch('paymentDestinationType')
  const id = watch('id')
  const status = watch('status') as Mercoa.InvoiceStatus | undefined
  const approverSlots = watch('approvers') as Mercoa.ApprovalSlot[]
  const approverSlot = mercoaSession.user?.id
    ? findApproverSlot({
        approverSlots,
        userId: mercoaSession.user?.id,
        users: mercoaSession.users,
      })
    : undefined
  const [selectedEntity, setSelectedEntity] = useState<Mercoa.EntityResponse>()

  const buttons: JSX.Element[] = []

  if (!mercoaSession.client) return <NoSession componentName="PayableActions" />

  const assignToEntityComponent = (
    <div className="mercoa-flex mercoa-space-x-2">
      <EntitySelector onSelect={setSelectedEntity} direction="up" />
      <MercoaButton
        isEmphasized={true}
        disabled={!id || !selectedEntity}
        onClick={async () => {
          if (!id || !selectedEntity) return
          await getInvoiceClient(mercoaSession, invoiceType)?.update(id, {
            status: Mercoa.InvoiceStatus.Draft,
            creatorEntityId: selectedEntity.id,
            payerId: selectedEntity.id,
          })
          if (refreshInvoice) {
            refreshInvoice(id)
            mercoaSession.setEntity(selectedEntity)
          }
        }}
      >
        <div className="mercoa-w-20 mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
          {actionLoading ? (
            <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
          ) : (
            'Assign to Entity'
          )}
        </div>
      </MercoaButton>
    </div>
  )

  const deleteButtonComponent = deleteButton ? (
    deleteButton({
      onClick: () => {
        setValue('formAction', PayableAction.DELETE)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="secondary"
      onClick={() => {
        setValue('formAction', PayableAction.DELETE)
      }}
    >
      <div className="mercoa-w-[110px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.DELETE ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Delete Invoice'
        )}
      </div>
    </MercoaButton>
  )

  const archiveButtonComponent = archiveButton ? (
    archiveButton({
      onClick: () => {
        setValue('formAction', PayableAction.ARCHIVE)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="secondary"
      onClick={() => {
        setValue('formAction', PayableAction.ARCHIVE)
      }}
    >
      <div className="mercoa-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.ARCHIVE ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Archive Invoice'
        )}
      </div>
    </MercoaButton>
  )

  const recreateDraftButtonComponent = recreateDraftButton ? (
    recreateDraftButton({
      onClick: () => {
        setValue('formAction', PayableAction.SAVE_AS_DRAFT)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="green"
      onClick={() => {
        setValue('formAction', PayableAction.SAVE_AS_DRAFT)
      }}
    >
      <div className="mercoa-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.SAVE_AS_DRAFT ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Restore as Draft'
        )}
      </div>
    </MercoaButton>
  )

  const cancelButtonComponent = cancelButton ? (
    cancelButton({
      onClick: () => {
        setValue('formAction', PayableAction.CANCEL)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="secondary"
      onClick={() => {
        setValue('formAction', PayableAction.CANCEL)
      }}
    >
      <div className="mercoa-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.CANCEL ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Cancel Payment'
        )}
      </div>
    </MercoaButton>
  )

  const saveDraftButtonComponent = saveDraftButton ? (
    saveDraftButton({
      onClick: () => {
        setValue('formAction', PayableAction.SAVE_AS_DRAFT)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      onClick={() => {
        setValue('formAction', PayableAction.SAVE_AS_DRAFT)
      }}
    >
      <div className="mercoa-w-20 mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.SAVE_AS_DRAFT ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Save Draft'
        )}
      </div>
    </MercoaButton>
  )

  const printCheckButtonComponent = printCheckButton ? (
    printCheckButton({
      onClick: () => {
        setValue('formAction', PayableAction.PRINT_CHECK)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized
      onClick={() => {
        setValue('formAction', PayableAction.PRINT_CHECK)
      }}
    >
      <div className="mercoa-w-fit mercoa-min-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center  mercoa-whitespace-nowrap">
        {actionLoading && formAction === PayableAction.PRINT_CHECK ? (
          <div className="mercoa-whitespace-nowrap mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
          Mercoa.CheckDeliveryMethod.Print ? (
          'Print Check'
        ) : (
          'View Mailed Check'
        )}
      </div>
    </MercoaButton>
  )

  const viewCheckButtonComponent = viewCheckButton ? (
    viewCheckButton({
      onClick: async () => {
        const pdf = await getInvoiceClient(mercoaSession, invoiceType)?.document.generateCheckPdf(id)
        if (pdf) {
          window.open(pdf.uri, '_blank')
        } else {
          toast.error('There was an error generating the check PDF')
        }
      },
    })
  ) : (
    <MercoaButton
      type="button"
      isEmphasized
      onClick={async () => {
        const pdf = await getInvoiceClient(mercoaSession, invoiceType)?.document.generateCheckPdf(id)
        if (pdf) {
          window.open(pdf.uri, '_blank')
        } else {
          toast.error('There was an error generating the check PDF')
        }
      }}
    >
      <div className="mercoa-w-fit mercoa-min-w-[120px] mercoa-flex mercoa-items-center mercoa-justify-center mercoa-whitespace-nowrap">
        {actionLoading && formAction === PayableAction.GENERATE_CHECK ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
          Mercoa.CheckDeliveryMethod.Print ? (
          'Print Check'
        ) : (
          'View Mailed Check'
        )}
      </div>
    </MercoaButton>
  )

  const createInvoiceButtonComponent = createInvoiceButton ? (
    createInvoiceButton({
      onClick: () => {
        setValue('formAction', PayableAction.CREATE)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized
      onClick={(e: React.MouseEvent) => {
        setValue('formAction', PayableAction.CREATE)
      }}
    >
      <div className="mercoa-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.CREATE ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Create Invoice'
        )}
      </div>
    </MercoaButton>
  )

  const submitForApprovalButtonComponent = submitForApprovalButton ? (
    submitForApprovalButton({
      onClick: () => {
        if (approverSlots.every((e) => e.assignedUserId)) {
          setValue('formAction', PayableAction.SUBMIT_FOR_APPROVAL)
        }
      },
      approversAssigned: approverSlots.every((e) => e.assignedUserId),
    })
  ) : (
    <>
      {!approverSlots.every((e) => e.assignedUserId) ? (
        <MercoaButton type="submit" isEmphasized disabled>
          <div className="mercoa-w-[200px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
            Please assign all approvers
          </div>
        </MercoaButton>
      ) : (
        <MercoaButton
          isEmphasized
          onClick={(e: React.MouseEvent) => {
            setValue('formAction', PayableAction.SUBMIT_FOR_APPROVAL)
          }}
        >
          <div className="mercoa-w-[160px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
            {actionLoading && formAction === PayableAction.SUBMIT_FOR_APPROVAL ? (
              <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
            ) : (
              'Submit for Approval'
            )}
          </div>
        </MercoaButton>
      )}
    </>
  )

  const nextButtonComponent = nextButton ? (
    nextButton({
      onClick: () => {
        setValue('formAction', PayableAction.SUBMIT_FOR_APPROVAL)
      },
    })
  ) : (
    <MercoaButton
      type="submit"
      isEmphasized
      onClick={() => {
        setValue('formAction', PayableAction.SUBMIT_FOR_APPROVAL)
      }}
    >
      <div className="mercoa-w-20 mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.SUBMIT_FOR_APPROVAL ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Next'
        )}
      </div>
    </MercoaButton>
  )

  const markPaidButtonComponent = markAsPaidButton ? (
    markAsPaidButton({
      onClick: () => {
        setValue('formAction', PayableAction.MARK_PAID)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={true}
      onClick={() => {
        setValue('formAction', PayableAction.MARK_PAID)
      }}
    >
      <div className="mercoa-w-[140px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.MARK_PAID ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Mark as Paid'
        )}
      </div>
    </MercoaButton>
  )

  const schedulePaymentButtonComponent = schedulePaymentButton ? (
    schedulePaymentButton({
      onClick: () => {
        setValue('formAction', PayableAction.SCHEDULE_PAYMENT)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={true}
      onClick={() => {
        setValue('formAction', PayableAction.SCHEDULE_PAYMENT)
      }}
    >
      <div className="mercoa-w-[140px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.SCHEDULE_PAYMENT ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Schedule Payment'
        )}
      </div>
    </MercoaButton>
  )

  const retryPaymentButtonComponent = retryPaymentButton ? (
    retryPaymentButton({
      onClick: () => {
        setValue('formAction', PayableAction.RETRY_PAYMENT)
      },
    })
  ) : (
    <MercoaButton
      type="submit"
      isEmphasized
      onClick={() => {
        setValue('formAction', PayableAction.RETRY_PAYMENT)
      }}
    >
      <div className="mercoa-w-20 mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.RETRY_PAYMENT ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Retry Payment'
        )}
      </div>
    </MercoaButton>
  )

  const nonApproverButtonComponent = nonApproverButton ? (
    nonApproverButton({ onClick: () => {} })
  ) : (
    <MercoaButton disabled color="gray" isEmphasized type="button">
      <div className="mercoa-w-[150px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        Waiting for approval
      </div>
    </MercoaButton>
  )

  const rejectButtonComponent = rejectButton ? (
    rejectButton({ onClick: () => setValue('formAction', PayableAction.REJECT) })
  ) : (
    <MercoaButton
      disabled={approverSlot?.action === Mercoa.ApproverAction.Reject}
      color="secondary"
      isEmphasized
      onClick={() => setValue('formAction', PayableAction.REJECT)}
    >
      <div className="mercoa-w-20 mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.REJECT ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Reject'
        )}
      </div>
    </MercoaButton>
  )

  const approveButtonComponent = approveButton ? (
    approveButton({
      onClick: () => setValue('formAction', PayableAction.APPROVE),
    })
  ) : (
    <MercoaButton
      disabled={approverSlot?.action === Mercoa.ApproverAction.Approve}
      color="green"
      isEmphasized
      onClick={() => setValue('formAction', PayableAction.APPROVE)}
    >
      <div className="mercoa-w-20 mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {actionLoading && formAction === PayableAction.APPROVE ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Approve'
        )}
      </div>
    </MercoaButton>
  )

  // Creating a brand new invoice
  if (!id) {
    buttons.push(createInvoiceButtonComponent)
  } else {
    switch (status) {
      case Mercoa.InvoiceStatus.Draft:
        let saveButton = <></>
        if (approverSlots && approverSlots.length > 0) {
          saveButton = submitForApprovalButtonComponent
        } else {
          saveButton = nextButtonComponent
        }
        buttons.push(saveButton, saveDraftButtonComponent, deleteButtonComponent)
        break

      case Mercoa.InvoiceStatus.New:
        if (!approverSlot) {
          buttons.push(nonApproverButtonComponent)
        } else {
          buttons.push(approveButtonComponent, rejectButtonComponent)
        }

        buttons.push(cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Approved:
        let nextButton = <></>
        if (
          paymentDestinationType === Mercoa.PaymentMethodType.Check &&
          (paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
            Mercoa.CheckDeliveryMethod.Print
        ) {
          nextButton = printCheckButtonComponent
        } else {
          nextButton = schedulePaymentButtonComponent
        }
        buttons.push(nextButton, cancelButtonComponent)

        break

      case Mercoa.InvoiceStatus.Scheduled:
        if (paymentDestinationType === Mercoa.PaymentMethodType.OffPlatform) {
          buttons.push(markPaidButtonComponent)
        }
        buttons.push(cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Paid:
        if (paymentDestinationType === Mercoa.PaymentMethodType.Check) {
          buttons.push(viewCheckButtonComponent)
        }
        buttons.push(archiveButtonComponent)
        break

      case Mercoa.InvoiceStatus.Failed:
        buttons.push(retryPaymentButtonComponent, cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Unassigned:
        buttons.push(assignToEntityComponent)
        break

      case Mercoa.InvoiceStatus.Canceled:
        buttons.push(recreateDraftButtonComponent, deleteButtonComponent)
        break

      case Mercoa.InvoiceStatus.Archived:
      case Mercoa.InvoiceStatus.Pending:
      case Mercoa.InvoiceStatus.Refused:
      default:
        break
    }
  }

  if (children) {
    return children({ isSaving, buttons, setStatus: (status) => setValue('saveAsStatus', status), submitForm })
  }

  const additionalActionButtons = (
    <>
      {additionalActions?.actions &&
        additionalActions.actions({
          isSaving,
          buttons,
          setStatus: (status) => setValue('saveAsStatus', status),
          submitForm,
        })}
    </>
  )

  return (
    <>
      <div className="mercoa-col-span-full" style={{ visibility: 'hidden' }}>
        <PayableFormErrors />
      </div>
      <div className="mercoa-absolute mercoa-bottom-0 mercoa-right-0 mercoa-w-full mercoa-bg-white mercoa-z-10">
        <>
          <PayableFormErrors />
          <div className="mercoa-mx-auto mercoa-flex mercoa-flex-row-reverse mercoa-items-center mercoa-gap-2 mercoa-py-3 mercoa-px-6">
            {additionalActions?.position !== 'left' && additionalActionButtons}
            {!additionalActions?.hideDefaultActions && buttons.map((button, index) => <div key={index}>{button}</div>)}
            {additionalActions?.position === 'left' && additionalActionButtons}
          </div>
        </>
      </div>
    </>
  )
}
