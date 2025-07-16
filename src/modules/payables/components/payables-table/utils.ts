import { Mercoa } from '@mercoa/javascript'
import { RBACPermissions } from '../../../../lib/lib'
import { filterApproverOptions } from '../payable-form/components/payable-approvers/utils'
import { PayablesTableAction } from './constants'

export function getAvailableActions(params: {
  selectedInvoices: Mercoa.InvoiceResponse[]
  currentStatuses: Mercoa.InvoiceStatus[]
  currentUserId?: string
  users?: Mercoa.EntityUserResponse[]
  rolePermissions?: RBACPermissions
}): PayablesTableAction[] {
  const { selectedInvoices, currentStatuses, currentUserId, users, rolePermissions } = params
  if (!selectedInvoices.length) return []

  const actions: PayablesTableAction[] = []

  if (selectedInvoices.length > 1) {
    actions.push(PayablesTableAction.Edit)
  }

  // Add Approver & Submit/Approve for Draft status
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Draft)) {
    if (selectedInvoices.some((e) => e.approvers?.length > 0)) {
      actions.push(PayablesTableAction.AddApprover)
      if (selectedInvoices.every((e) => e.approvers.every((e) => e.assignedUserId))) {
        actions.push(PayablesTableAction.SubmitForApproval)
      }
    }
  }

  // Set Payment Date
  if (
    currentStatuses.some((e) => {
      const allowedStatuses: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.New]
      return allowedStatuses.includes(e)
    })
  ) {
    actions.push(PayablesTableAction.SetPaymentDate)
  }

  // Schedule Payment Date
  if (
    currentStatuses.some((e) => {
      const allowedStatuses: Mercoa.InvoiceStatus[] = [
        Mercoa.InvoiceStatus.Approved,
        Mercoa.InvoiceStatus.Scheduled,
        Mercoa.InvoiceStatus.Failed,
      ]
      return allowedStatuses.includes(e)
    })
  ) {
    if (
      rolePermissions?.invoice.create.statuses.includes(Mercoa.InvoiceStatus.Scheduled) ||
      rolePermissions?.invoice.create.all ||
      rolePermissions?.invoice.all
    ) {
      actions.push(PayablesTableAction.SchedulePayment)
    }
  }

  // Approve/Reject for eligible approvers
  if (currentStatuses.includes(Mercoa.InvoiceStatus.New) && currentUserId && users) {
    const hasEligibleInvoice = selectedInvoices.some((invoice) =>
      invoice.approvers.some((approver, index) => {
        if (approver.assignedUserId === currentUserId) {
          return true
        } else if (!approver.assignedUserId) {
          const eligibleApprovers = filterApproverOptions({
            approverSlotIndex: index,
            eligibleRoles: approver.eligibleRoles,
            eligibleUserIds: approver.eligibleUserIds,
            users,
            selectedApprovers: [],
          })
          return eligibleApprovers.some((e) => e.user.id === currentUserId)
        }
        return false
      }),
    )

    if (hasEligibleInvoice) {
      // if (
      //   rolePermissions?.invoice.create.statuses.includes(Mercoa.InvoiceStatus.Approved) ||
      //   rolePermissions?.invoice.create.all ||
      //   rolePermissions?.invoice.all
      // ) {
      actions.push(PayablesTableAction.Approve)
      // }
      // if (
      //   rolePermissions?.invoice.create.statuses.includes(Mercoa.InvoiceStatus.Refused) ||
      //   rolePermissions?.invoice.create.all ||
      //   rolePermissions?.invoice.all
      // ) {
      actions.push(PayablesTableAction.Reject)
      //}
    }
  }

  // Archive
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Paid)) {
    actions.push(PayablesTableAction.Archive)
  }

  // Restore as Draft
  if (
    currentStatuses.some((e) => {
      const allowedStatuses: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Canceled, Mercoa.InvoiceStatus.Failed]
      return allowedStatuses.includes(e)
    })
  ) {
    actions.push(PayablesTableAction.RestoreAsDraft)
  }

  // Cancel
  if (
    currentStatuses.some((e) => {
      const allowedStatuses: Mercoa.InvoiceStatus[] = [
        Mercoa.InvoiceStatus.New,
        Mercoa.InvoiceStatus.Approved,
        Mercoa.InvoiceStatus.Refused,
        Mercoa.InvoiceStatus.Scheduled,
        Mercoa.InvoiceStatus.Failed,
      ]
      return allowedStatuses.includes(e)
    })
  ) {
    actions.push(PayablesTableAction.Cancel)
  }

  // Delete
  if (
    currentStatuses.some((e) => {
      const allowedStatuses: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Canceled]
      return allowedStatuses.includes(e)
    })
  ) {
    if (rolePermissions?.invoice.delete || rolePermissions?.invoice.all) {
      actions.push(PayablesTableAction.Delete)
    }
  }

  return actions
}
