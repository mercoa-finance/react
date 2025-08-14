import { ReactNode, useState } from 'react'
import { useFormContext, UseFormReturn } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import {
  ButtonLoadingSpinner,
  EntitySelector,
  MercoaButton,
  NoSession,
  useMercoaSession,
  usePayableDetails,
} from '../../../../../../components'
import { isOffPlatformEnabled } from '../../../../../../lib/paymentMethods'
import { getInvoiceClient } from '../../../../../common/utils'
import { PayableFormAction } from '../../constants'
import { PayableFormData } from '../../types'
import { findApproverSlot } from '../payable-approvers/utils'
import { PayableFormErrors } from './payable-form-errors'
import { VoidCheckDialog } from './void-check-dialog'

export type PayableActionChildrenProps = {
  isSaving: boolean
  buttons?: ReactNode[]
  setStatus: (status: Mercoa.InvoiceStatus) => void
  submitForm: () => void
}

export function PayableActions({
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
  voidCheckButton,
  additionalActions,
  children,
}: {
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
  voidCheckButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  additionalActions?: {
    hideDefaultActions?: boolean
    position: 'left' | 'right'
    actions: (props: PayableActionChildrenProps) => JSX.Element[]
  }
  children?: (props: PayableActionChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  const { formContextValue, dataContextValue } = usePayableDetails()
  const { formMethods, handleFormAction, formActionLoading: actionLoading } = formContextValue

  const { invoiceType, refreshInvoice } = dataContextValue

  const { handleSubmit } = formMethods as UseFormReturn<PayableFormData>

  const submitForm = () => {
    handleSubmit((data: PayableFormData) => handleFormAction(data, data.formAction as PayableFormAction))()
  }

  const { userPermissionConfig } = mercoaSession

  const [isSaving, setIsSaving] = useState(false)
  const [voidCheckDialogOpen, setVoidCheckDialogOpen] = useState(false)
  const { setValue, watch, formState } = useFormContext()
  const formAction = watch('formAction')

  const paymentDestinationOptions = watch('paymentDestinationOptions')
  const paymentDestinationType = watch('paymentDestinationType')
  const paymentSourceType = watch('paymentSourceType')
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

  const buttons: ReactNode[] = []

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
        className="mercoa-whitespace-nowrap"
      >
        <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.ASSIGN_TO_ENTITY}>
          Assign to Entity
        </ButtonLoadingSpinner>
      </MercoaButton>
    </div>
  )

  const deleteButtonComponent = deleteButton ? (
    deleteButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.DELETE)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      disabled={!userPermissionConfig?.invoice?.delete && !userPermissionConfig?.invoice?.all}
      disabledTooltipText="You do not have permission to delete invoices"
      color="secondary"
      onClick={() => {
        setValue('formAction', PayableFormAction.DELETE)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.DELETE}>
        Delete Invoice
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const archiveButtonComponent = archiveButton ? (
    archiveButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.ARCHIVE)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Archived) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to archive invoices"
      color="secondary"
      onClick={() => {
        setValue('formAction', PayableFormAction.ARCHIVE)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.ARCHIVE}>
        Archive Invoice
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const recreateDraftButtonComponent = recreateDraftButton ? (
    recreateDraftButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.SAVE_AS_DRAFT)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Draft) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to save invoices as draft"
      color="green"
      onClick={() => {
        setValue('formAction', PayableFormAction.SAVE_AS_DRAFT)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.SAVE_AS_DRAFT}>
        Restore as Draft
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const cancelButtonComponent = cancelButton ? (
    cancelButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.CANCEL)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Canceled) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to cancel invoices"
      color="secondary"
      onClick={() => {
        setValue('formAction', PayableFormAction.CANCEL)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.CANCEL}>
        Cancel Payment
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const saveDraftButtonComponent = saveDraftButton ? (
    saveDraftButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.SAVE_AS_DRAFT)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes('DRAFT') &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to save invoices as draft"
      onClick={() => {
        setValue('formAction', PayableFormAction.SAVE_AS_DRAFT)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.SAVE_AS_DRAFT}>
        Save Draft
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const printCheckButtonComponent = printCheckButton ? (
    printCheckButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.PRINT_CHECK)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized
      disabled={!userPermissionConfig?.invoice?.check.print && !userPermissionConfig?.invoice?.all}
      disabledTooltipText="You do not have permission to print checks"
      onClick={() => {
        setValue('formAction', PayableFormAction.PRINT_CHECK)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.PRINT_CHECK}>
        {(paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
        Mercoa.CheckDeliveryMethod.Print
          ? 'Print Check'
          : 'View Mailed Check'}
      </ButtonLoadingSpinner>
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
      disabled={!userPermissionConfig?.invoice?.check.print && !userPermissionConfig?.invoice?.all}
      disabledTooltipText="You do not have permission to print checks"
      isEmphasized
      onClick={async () => {
        const pdf = await getInvoiceClient(mercoaSession, invoiceType)?.document.generateCheckPdf(id)
        if (pdf) {
          window.open(pdf.uri, '_blank')
        } else {
          toast.error('There was an error generating the check PDF')
        }
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.PRINT_CHECK}>
        {(paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
        Mercoa.CheckDeliveryMethod.Print
          ? 'Print Check'
          : 'View Mailed Check'}
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const voidCheckButtonComponent = voidCheckButton ? (
    voidCheckButton({
      onClick: () => setVoidCheckDialogOpen(true),
    })
  ) : (
    <MercoaButton
      type="button"
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Failed) &&
        !userPermissionConfig?.invoice?.all
      }
      disabledTooltipText="You do not have permission to void checks"
      color="red"
      onClick={() => setVoidCheckDialogOpen(true)}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.VOID_CHECK}>
        Void Check
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const createInvoiceButtonComponent = createInvoiceButton ? (
    createInvoiceButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.CREATE)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized
      disabled={
        !userPermissionConfig?.invoice?.create.statuses.includes(Mercoa.InvoiceStatus.Draft) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.create.all
      }
      disabledTooltipText="You do not have permission to create invoices"
      onClick={(e: React.MouseEvent) => {
        setValue('formAction', PayableFormAction.CREATE)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.CREATE}>
        Create Invoice
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const submitForApprovalButtonComponent = submitForApprovalButton ? (
    submitForApprovalButton({
      onClick: () => {
        if (approverSlots.every((e) => e.assignedUserId)) {
          setValue('formAction', PayableFormAction.SUBMIT_FOR_APPROVAL)
        }
      },
      approversAssigned: approverSlots.every((e) => e.assignedUserId),
    })
  ) : (
    <>
      {!approverSlots.every((e) => e.assignedUserId) ? (
        <MercoaButton type="submit" isEmphasized disabled className="mercoa-whitespace-nowrap">
          <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.SUBMIT_FOR_APPROVAL}>
            Please assign all approvers
          </ButtonLoadingSpinner>
        </MercoaButton>
      ) : (
        <MercoaButton
          isEmphasized
          disabled={
            !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.New) &&
            !userPermissionConfig?.invoice?.all &&
            !userPermissionConfig?.invoice?.update.all
          }
          disabledTooltipText="You do not have permission to submit invoices for approval"
          onClick={(e: React.MouseEvent) => {
            setValue('formAction', PayableFormAction.SUBMIT_FOR_APPROVAL)
          }}
          className="mercoa-whitespace-nowrap"
        >
          <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.SUBMIT_FOR_APPROVAL}>
            Submit for Approval
          </ButtonLoadingSpinner>
        </MercoaButton>
      )}
    </>
  )

  const nextButtonComponent = nextButton ? (
    nextButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.SUBMIT_FOR_APPROVAL)
      },
    })
  ) : (
    <MercoaButton
      type="submit"
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.New) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to submit invoices for approval"
      isEmphasized
      onClick={() => {
        setValue('formAction', PayableFormAction.SUBMIT_FOR_APPROVAL)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.SUBMIT_FOR_APPROVAL}>
        Next
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const markPaidButtonComponent = markAsPaidButton ? (
    markAsPaidButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.MARK_PAID)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={true}
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Paid) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to mark invoices as paid"
      onClick={() => {
        setValue('formAction', PayableFormAction.MARK_PAID)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.MARK_PAID}>
        Mark as Paid
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const schedulePaymentButtonComponent = schedulePaymentButton ? (
    schedulePaymentButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.SCHEDULE_PAYMENT)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={true}
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Scheduled) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to schedule invoices"
      onClick={() => {
        setValue('formAction', PayableFormAction.SCHEDULE_PAYMENT)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.SCHEDULE_PAYMENT}>
        Schedule Payment
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const retryPaymentButtonComponent = retryPaymentButton ? (
    retryPaymentButton({
      onClick: () => {
        setValue('formAction', PayableFormAction.RETRY_PAYMENT)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized
      disabled={
        !userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Scheduled) &&
        !userPermissionConfig?.invoice?.all &&
        !userPermissionConfig?.invoice?.update.all
      }
      disabledTooltipText="You do not have permission to retry payments"
      onClick={() => {
        setValue('formAction', PayableFormAction.RETRY_PAYMENT)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.RETRY_PAYMENT}>
        Retry Payment
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const nonApproverButtonComponent = nonApproverButton ? (
    nonApproverButton({ onClick: () => {} })
  ) : (
    <MercoaButton disabled color="gray" isEmphasized type="button" className="mercoa-whitespace-nowrap">
      Waiting for approval
    </MercoaButton>
  )

  const rejectButtonComponent = rejectButton ? (
    rejectButton({ onClick: () => setValue('formAction', PayableFormAction.REJECT) })
  ) : (
    <MercoaButton
      disabled={
        approverSlot?.action === Mercoa.ApproverAction.Reject ||
        (!userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Approved) &&
          !userPermissionConfig?.invoice?.all &&
          !userPermissionConfig?.invoice?.update.all)
      }
      color="secondary"
      disabledTooltipText="You do not have permission to reject invoices"
      isEmphasized
      onClick={() => setValue('formAction', PayableFormAction.REJECT)}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.REJECT}>
        Reject
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const approveButtonComponent = approveButton ? (
    approveButton({
      onClick: () => setValue('formAction', PayableFormAction.APPROVE),
    })
  ) : (
    <MercoaButton
      disabled={
        approverSlot?.action === Mercoa.ApproverAction.Approve ||
        (!userPermissionConfig?.invoice?.update.statuses.includes(Mercoa.InvoiceStatus.Approved) &&
          !userPermissionConfig?.invoice?.update.all &&
          !userPermissionConfig?.invoice?.all)
      }
      color="green"
      isEmphasized
      disabledTooltipText="You do not have permission to approve invoices"
      onClick={() => setValue('formAction', PayableFormAction.APPROVE)}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={actionLoading && formAction === PayableFormAction.APPROVE}>
        Approve
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  // Creating a brand new invoice
  if (!id) {
    buttons.push(createInvoiceButtonComponent)
  } else {
    switch (status) {
      case Mercoa.InvoiceStatus.Draft:
        let saveButton: ReactNode = <></>
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
        let nextButton: ReactNode = <></>
        if (
          paymentDestinationType === Mercoa.PaymentMethodType.Check &&
          paymentDestinationOptions?.delivery === Mercoa.CheckDeliveryMethod.Print
        ) {
          nextButton = printCheckButtonComponent
        } else {
          nextButton = schedulePaymentButtonComponent
        }
        buttons.push(nextButton, cancelButtonComponent)

        break

      case Mercoa.InvoiceStatus.Scheduled:
        if (
          paymentDestinationType === Mercoa.PaymentMethodType.Check &&
          paymentDestinationOptions?.delivery === Mercoa.CheckDeliveryMethod.Print
        ) {
          buttons.push(printCheckButtonComponent)
        }
        if (
          (paymentDestinationType === Mercoa.PaymentMethodType.OffPlatform ||
            paymentSourceType === Mercoa.PaymentMethodType.OffPlatform) &&
          isOffPlatformEnabled(mercoaSession)
        ) {
          buttons.push(markPaidButtonComponent)
        }
        buttons.push(cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Paid:
        if (paymentDestinationType === Mercoa.PaymentMethodType.Check) {
          buttons.push(viewCheckButtonComponent)
        }
        buttons.push(archiveButtonComponent)
        if (paymentDestinationType === Mercoa.PaymentMethodType.Check) {
          buttons.push(voidCheckButtonComponent)
        }
        break

      case Mercoa.InvoiceStatus.Failed:
        buttons.push(retryPaymentButtonComponent, cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Unassigned:
        buttons.push(assignToEntityComponent)
        break

      case Mercoa.InvoiceStatus.Refused:
        buttons.push(recreateDraftButtonComponent)
        break

      case Mercoa.InvoiceStatus.Canceled:
        buttons.push(recreateDraftButtonComponent, deleteButtonComponent)
        break

      case Mercoa.InvoiceStatus.Archived:
      case Mercoa.InvoiceStatus.Pending:
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
      <VoidCheckDialog
        open={voidCheckDialogOpen}
        setOpen={setVoidCheckDialogOpen}
        onConfirm={async () => {
          if (!id) return
          setValue('formAction', PayableFormAction.VOID_CHECK)
          submitForm()
          setVoidCheckDialogOpen(false)
        }}
        onCancel={() => setVoidCheckDialogOpen(false)}
        isLoading={actionLoading && formAction === PayableFormAction.VOID_CHECK}
        checkNumber={undefined} // TODO: Get check number from transaction if available
      />
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
