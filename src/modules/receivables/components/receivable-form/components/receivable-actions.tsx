import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton } from '../../../../../components'
import { ReceivableAction } from '../../../constants'
import { useReceivableDetailsContext } from '../../../providers/receivable-detail-provider'

export function ReceivableActions() {
  const {
    formMethods,
    handleActionClick,

    receivableData: invoice,
    selectedPayer,
  } = useReceivableDetailsContext()
  const { watch } = formMethods
  const paymentSourceType = watch('paymentSourceType')
  const paymentDestinationType = watch('paymentDestinationType')
  const formAction = watch('formAction')

  const createInvoiceButton = (
    <MercoaButton onClick={() => handleActionClick(ReceivableAction.Create)} className="mercoa-mt-5" isEmphasized>
      <div className="mercoa-w-[80px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {formAction === ReceivableAction.Create ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Create'
        )}
      </div>
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
        handleActionClick(ReceivableAction.Delete)
      }}
    >
      <div className="mercoa-w-[80px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {formAction === ReceivableAction.Delete ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Delete'
        )}
      </div>
    </MercoaButton>
  )

  const cancelableStatuses: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Approved, Mercoa.InvoiceStatus.Scheduled]
  const showCancelButton = invoice?.status && cancelableStatuses.includes(invoice?.status)
  const cancelButton = (
    <MercoaButton
      isEmphasized={false}
      onClick={() => handleActionClick(ReceivableAction.Cancel)}
      type="button"
      color="secondary"
    >
      <div className="mercoa-w-[80px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {formAction === ReceivableAction.Cancel ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Cancel'
        )}
      </div>
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
          onClick={() => handleActionClick(ReceivableAction.Preview)}
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
    paymentLinkableStatuses.includes(invoice?.status)
  const paymentLinkButton = (
    <Menu.Item>
      {({ active }) => (
        <a
          onClick={() => handleActionClick(ReceivableAction.PaymentLink)}
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
    <MercoaButton onClick={() => handleActionClick(ReceivableAction.SaveDraft)} isEmphasized={false}>
      <div className="mercoa-w-[100px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {formAction === ReceivableAction.SaveDraft ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Save Draft'
        )}
      </div>
    </MercoaButton>
  )

  const sendableStatuses: Mercoa.InvoiceStatus[] = [
    Mercoa.InvoiceStatus.Draft,
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
  ]
  const showSendEmailButton = invoice?.status && sendableStatuses.includes(invoice?.status)
  const sendEmailButton = (
    <MercoaButton
      disabled={!selectedPayer}
      isEmphasized
      onClick={() =>
        handleActionClick(
          invoice?.status === Mercoa.InvoiceStatus.Draft ? ReceivableAction.SendEmail : ReceivableAction.ResendEmail,
        )
      }
      // type="button"
    >
      <div className="mercoa-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {(
          invoice?.status === Mercoa.InvoiceStatus.Draft
            ? formAction === ReceivableAction.SendEmail
            : formAction === ReceivableAction.ResendEmail
        ) ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : invoice?.status === Mercoa.InvoiceStatus.Draft ? (
          'Send Invoice'
        ) : (
          'Resend Invoice'
        )}
      </div>
    </MercoaButton>
  )

  const showMarkAsPaidButton =
    invoice?.status === Mercoa.InvoiceStatus.Approved &&
    (paymentDestinationType === 'offPlatform' || paymentSourceType === 'offPlatform')
  const markAsPaidButton = (
    <MercoaButton isEmphasized={true} onClick={() => handleActionClick(ReceivableAction.MarkAsPaid)} type="button">
      <div className="mercoa-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {formAction === ReceivableAction.MarkAsPaid ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Mark as Paid'
        )}
      </div>
    </MercoaButton>
  )

  // const showSchedulePaymentButton =
  //   invoice?.status === Mercoa.InvoiceStatus.Approved &&
  //   (paymentDestinationType === 'offPlatform' || paymentSourceType === 'offPlatform')
  // const schedulePaymentButton = (
  //   <MercoaButton isEmphasized={true} onClick={() => handleActionClick(ReceivableAction.SchedulePayment)} type="button">
  //     <div className="mercoa-w-[140px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
  //       {formAction === ReceivableAction.SchedulePayment ? (
  //         <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
  //       ) : (
  //         'Schedule Payment'
  //       )}
  //     </div>
  //   </MercoaButton>
  // )

  const showRestoreAsDraftButton = invoice?.status === Mercoa.InvoiceStatus.Canceled
  const restoreAsDraftButton = (
    <MercoaButton
      isEmphasized={false}
      color="green"
      onClick={() => handleActionClick(ReceivableAction.RestoreAsDraft)}
      type="button"
    >
      <div className="mercoa-w-[120px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
        {formAction === ReceivableAction.RestoreAsDraft ? (
          <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
        ) : (
          'Restore as Draft'
        )}
      </div>
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
            {/* {showSchedulePaymentButton && schedulePaymentButton} */}
            {showMarkAsPaidButton && markAsPaidButton}
            {showRestoreAsDraftButton && restoreAsDraftButton}
            {menu}
          </>
        )}
      </div>
    </div>
  )
}
