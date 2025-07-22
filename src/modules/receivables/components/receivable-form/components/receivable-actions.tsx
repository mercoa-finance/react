import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { ButtonLoadingSpinner, MercoaButton, useMercoaSession } from '../../../../../components'
import { isOffPlatformEnabled } from '../../../../../lib/paymentMethods'
import { useReceivableDetails } from '../../../hooks/use-receivable-details'
import { ReceivableFormAction } from '../constants'

export function ReceivableActions() {
  const mercoaSession = useMercoaSession()
  const { dataContextValue, formContextValue } = useReceivableDetails()
  const { formMethods, handleActionClick, payerContextValue } = formContextValue
  const { invoice, invoiceType } = dataContextValue
  const { selectedPayer } = payerContextValue
  const { watch } = formMethods
  const paymentSourceType = watch('paymentSourceType')
  const paymentDestinationType = watch('paymentDestinationType')
  const formAction = watch('formAction')

  const createInvoiceButton = (
    <MercoaButton
      onClick={() => handleActionClick(ReceivableFormAction.CREATE)}
      isEmphasized
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={formAction === ReceivableFormAction.CREATE}>Create</ButtonLoadingSpinner>
    </MercoaButton>
  )

  const deleteableStatuses: Mercoa.InvoiceStatus[] = [
    Mercoa.InvoiceStatus.Unassigned,
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Canceled,
  ]
  const showDeleteButton = invoice?.status && deleteableStatuses.includes(invoice?.status)
  const deleteButton = (
    <MercoaButton
      type="button"
      color="red"
      isEmphasized={false}
      onClick={(e: any) => {
        e.stopPropagation()
        handleActionClick(ReceivableFormAction.DELETE)
      }}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={formAction === ReceivableFormAction.DELETE}>Delete</ButtonLoadingSpinner>
    </MercoaButton>
  )

  const cancelableStatuses: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Approved, Mercoa.InvoiceStatus.Scheduled]
  const showCancelButton = invoice?.status && cancelableStatuses.includes(invoice?.status)
  const cancelButton = (
    <MercoaButton
      isEmphasized={false}
      onClick={() => handleActionClick(ReceivableFormAction.CANCEL)}
      type="button"
      color="secondary"
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={formAction === ReceivableFormAction.CANCEL}>Cancel</ButtonLoadingSpinner>
    </MercoaButton>
  )

  const previewableStatuses: Mercoa.InvoiceStatus[] = [
    Mercoa.InvoiceStatus.Unassigned,
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
    Mercoa.InvoiceStatus.Pending,
    Mercoa.InvoiceStatus.Paid,
  ]
  const showPreviewButton = invoice?.status && previewableStatuses.includes(invoice?.status)
  const previewButton = (
    <Menu.Item>
      {({ active }) => (
        <a
          onClick={() => handleActionClick(ReceivableFormAction.PREVIEW)}
          className={`${
            active ? 'mercoa-bg-gray-100 mercoa-text-gray-900' : 'mercoa-text-gray-700'
          } mercoa-block mercoa-px-4 mercoa-py-2 mercoa-text-sm`}
        >
          See Preview
        </a>
      )}
    </Menu.Item>
  )

  const paymentLinkableStatuses: Mercoa.InvoiceStatus[] = [
    Mercoa.InvoiceStatus.Unassigned,
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
    Mercoa.InvoiceStatus.Pending,
    Mercoa.InvoiceStatus.Paid,
  ]
  const showPaymentLinkButton =
    paymentSourceType !== 'offPlatform' &&
    paymentDestinationType !== 'offPlatform' &&
    selectedPayer &&
    invoice?.status &&
    paymentLinkableStatuses.includes(invoice?.status) &&
    invoiceType === 'invoice'
  const paymentLinkButton = (
    <Menu.Item>
      {({ active }) => (
        <a
          onClick={() => handleActionClick(ReceivableFormAction.PAYMENT_LINK)}
          className={`${
            active ? 'mercoa-bg-gray-100 mercoa-text-gray-900' : 'mercoa-text-gray-700'
          } mercoa-block mercoa-px-4 mercoa-py-2 mercoa-text-sm`}
        >
          Get Payment Link
        </a>
      )}
    </Menu.Item>
  )

  const showSaveDraftButton = invoice?.status === Mercoa.InvoiceStatus.Draft
  const saveDraftButton = (
    <MercoaButton
      onClick={() => handleActionClick(ReceivableFormAction.SAVE_DRAFT)}
      isEmphasized={false}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={formAction === ReceivableFormAction.SAVE_DRAFT}>Save Draft</ButtonLoadingSpinner>
    </MercoaButton>
  )

  const sendableStatuses: Mercoa.InvoiceStatus[] = [
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
  ]
  const showSendEmailButton = invoice?.status && sendableStatuses.includes(invoice?.status) && invoiceType === 'invoice'
  const sendEmailButton = (
    <MercoaButton
      disabled={!selectedPayer}
      isEmphasized
      onClick={() =>
        handleActionClick(
          invoice?.status === Mercoa.InvoiceStatus.Draft
            ? ReceivableFormAction.SEND_EMAIL
            : ReceivableFormAction.RESEND_EMAIL,
        )
      }
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner
        isLoading={formAction === ReceivableFormAction.SEND_EMAIL || formAction === ReceivableFormAction.RESEND_EMAIL}
      >
        {invoice?.status === Mercoa.InvoiceStatus.Draft ? 'Send Invoice' : 'Resend Invoice'}
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const showScheduleRecurringInvoiceButton =
    invoiceType === 'invoiceTemplate' && invoice?.status === Mercoa.InvoiceStatus.Draft
  const scheduleRecurringInvoiceButton = (
    <MercoaButton
      disabled={!selectedPayer}
      isEmphasized
      onClick={() => handleActionClick(ReceivableFormAction.SCHEDULE_RECURRING_INVOICE)}
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={formAction === ReceivableFormAction.SCHEDULE_RECURRING_INVOICE}>
        Schedule Invoice
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const markAsPaidStatuses: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Approved, Mercoa.InvoiceStatus.Scheduled]
  const showMarkAsPaidButton =
    invoice?.status &&
    markAsPaidStatuses.includes(invoice?.status) &&
    invoiceType === 'invoice' &&
    isOffPlatformEnabled(mercoaSession)
  const markAsPaidButton = (
    <Menu.Item>
      {({ active }) => (
        <a
          onClick={() => handleActionClick(ReceivableFormAction.MARK_AS_PAID)}
          className={`${
            active ? 'mercoa-bg-gray-100 mercoa-text-gray-900' : 'mercoa-text-gray-700'
          } mercoa-block mercoa-px-4 mercoa-py-2 mercoa-text-sm`}
        >
          Mark as Paid
        </a>
      )}
    </Menu.Item>
  )

  const showRestoreAsDraftButton = invoice?.status === Mercoa.InvoiceStatus.Canceled
  const restoreAsDraftButton = (
    <MercoaButton
      isEmphasized={false}
      color="green"
      onClick={() => handleActionClick(ReceivableFormAction.RESTORE_AS_DRAFT)}
      type="button"
      className="mercoa-whitespace-nowrap"
    >
      <ButtonLoadingSpinner isLoading={formAction === ReceivableFormAction.RESTORE_AS_DRAFT}>
        Restore as Draft
      </ButtonLoadingSpinner>
    </MercoaButton>
  )

  const menu = (
    <Menu as="div" className="mercoa-relative mercoa-inline-block mercoa-text-left">
      <div>
        <Menu.Button className="mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-bg-gray-100 hover:mercoa-bg-gray-200 mercoa-rounded-full mercoa-p-1.5">
          <EllipsisVerticalIcon className="mercoa-size-5" aria-hidden="true" />
          <span className="mercoa-sr-only">More options</span>
        </Menu.Button>
      </div>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="mercoa-absolute mercoa-right-0 mercoa-bottom-0 mercoa-z-10 mercoa-mb-10 mercoa-w-64 mercoa-origin-bottom-right mercoa-rounded-mercoa mercoa-bg-white mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none">
          <div className="mercoa-py-1">
            {showPreviewButton && previewButton}
            {showPaymentLinkButton && paymentLinkButton}
            {showMarkAsPaidButton && markAsPaidButton}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )

  return (
    <div className="mercoa-absolute mercoa-bottom-0 mercoa-right-0 mercoa-w-full mercoa-bg-white mercoa-z-10">
      <div className="mercoa-mx-auto mercoa-flex mercoa-flex-row mercoa-justify-end mercoa-items-center mercoa-gap-2 mercoa-py-3 mercoa-px-6">
        {!invoice?.id ? (
          createInvoiceButton
        ) : (
          <>
            {showDeleteButton && deleteButton}
            {showCancelButton && cancelButton}
            {showSaveDraftButton && saveDraftButton}
            {showSendEmailButton && sendEmailButton}
            {showScheduleRecurringInvoiceButton && scheduleRecurringInvoiceButton}
            {showRestoreAsDraftButton && restoreAsDraftButton}
            {menu}
          </>
        )}
      </div>
    </div>
  )
}
