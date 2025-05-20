import { Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { PayablesTableAction } from '../constants'

import { MercoaButton } from '../../../../../components/generics'
import { CrossIcon } from '../../../../common/assets/icons/cross-icon'
import { PayablesTableActionProps } from '../../../types'
export const TableActionsBar = ({
  selectedInvoices,
  setSelectedInvoices,
  validActions,
  setActiveInvoiceAction,
}: {
  selectedInvoices: Mercoa.InvoiceResponse[]
  setSelectedInvoices: (invoices: Mercoa.InvoiceResponse[]) => void
  validActions: PayablesTableAction[]
  setActiveInvoiceAction: (action: PayablesTableActionProps) => void
}) => {
  return (
    <Transition
      as={Fragment}
      show={selectedInvoices.length > 0}
      enter="mercoa-transition mercoa-ease-out mercoa-duration-100"
      enterFrom="mercoa-opacity-0 mercoa-translate-y-4"
      enterTo="mercoa-opacity-100 mercoa-translate-y-0"
      leave="mercoa-transition mercoa-ease-in mercoa-duration-100"
      leaveFrom="mercoa-opacity-100 mercoa-translate-y-0"
      leaveTo="mercoa-opacity-0 mercoa-translate-y-4"
    >
      <div className="mercoa-flex mercoa-gap-4 mercoa-items-center mercoa-justify-between mercoa-px-3 mercoa-h-[48px] mercoa-bg-white mercoa-rounded-lg mercoa-absolute -mercoa-top-14 mercoa-left-[50%] mercoa-translate-x-[-50%] mercoa-w-[800px] mercoa-shadow-[0_8px_24px_rgba(0,0,0,0.15)] mercoa-z-50 mercoa-border mercoa-border-2 mercoa-border-mercoa-primary-light">
        <div className="mercoa-flex mercoa-justify-start mercoa-gap-6 mercoa-items-center">
          <div
            onClick={(e: React.MouseEvent) => {
              setSelectedInvoices([])
              e.stopPropagation()
            }}
            className="mercoa-bg-white mercoa-border mercoa-rounded-full mercoa-p-1 mercoa-opacity-[0.5] hover:mercoa-opacity-[1] mercoa-cursor-pointer"
          >
            <CrossIcon />
          </div>
          <p className="mercoa-text-[13px] mercoa-text-[#1A1919] mercoa-font-medium mercoa-whitespace-nowrap">
            {selectedInvoices.length} Invoice{selectedInvoices.length > 1 ? 's' : ''} Selected
          </p>
        </div>
        <div className="mercoa-flex mercoa-w-full mercoa-justify-end mercoa-gap-2 mercoa-items-center">
          {validActions.length < 1 && (
            <MercoaButton
              isEmphasized={false}
              color="gray"
              hideOutline
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
            >
              No Actions Available
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.Edit) && (
            <MercoaButton
              isEmphasized
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.Edit,
                  mode: 'multiple',
                })
              }}
            >
              Edit
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.AddApprover) && (
            <MercoaButton
              isEmphasized
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.AddApprover,
                  mode: 'multiple',
                })
              }}
            >
              Add Approver
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.SubmitForApproval) && (
            <MercoaButton
              isEmphasized
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.SubmitForApproval,
                  mode: 'multiple',
                })
              }}
            >
              Submit for Approval
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.Approve) && (
            <MercoaButton
              isEmphasized
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.Approve,
                  mode: 'multiple',
                })
              }}
            >
              Approve
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.Reject) && (
            <MercoaButton
              isEmphasized
              color="secondary"
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.Reject,
                  mode: 'multiple',
                })
              }}
            >
              Reject
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.SetPaymentDate) && (
            <MercoaButton
              isEmphasized={false}
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.SetPaymentDate,
                  mode: 'multiple',
                })
              }}
            >
              Set Payment Date
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.SchedulePayment) && (
            <MercoaButton
              isEmphasized
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.SchedulePayment,
                  mode: 'multiple',
                })
              }}
            >
              {selectedInvoices.some((e) => e.status === Mercoa.InvoiceStatus.Scheduled) ? 'Reschedule' : 'Schedule'}{' '}
              Payment
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.Archive) && (
            <MercoaButton
              isEmphasized
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.Archive,
                  mode: 'multiple',
                })
              }}
            >
              Archive
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.Cancel) && (
            <MercoaButton
              isEmphasized={false}
              color="secondary"
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.Cancel,
                  mode: 'multiple',
                })
              }}
            >
              Cancel Invoice
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.RestoreAsDraft) && (
            <MercoaButton
              isEmphasized
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.RestoreAsDraft,
                  mode: 'multiple',
                })
              }}
            >
              Restore as Draft
            </MercoaButton>
          )}
          {validActions.includes(PayablesTableAction.Delete) && (
            <MercoaButton
              isEmphasized
              color="secondary"
              className="mercoa-text-[13px] mercoa-px-2 mercoa-py-1 mercoa-h-[32px] mercoa-w-fit mercoa-flex mercoa-items-center mercoa-justify-center"
              onClick={() => {
                setActiveInvoiceAction({
                  invoiceId: selectedInvoices.map((e) => e.id),
                  action: PayablesTableAction.Delete,
                  mode: 'multiple',
                })
              }}
            >
              Delete
            </MercoaButton>
          )}
        </div>
      </div>
    </Transition>
  )
}
