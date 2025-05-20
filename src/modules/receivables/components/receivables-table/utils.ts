import { Mercoa } from '@mercoa/javascript'
import { RBACPermissions } from '../../../../lib/lib'
import { ReceivablesTableAction } from './constants'

// TODO: Refactor code duplication between this file and Payables' `getAvailableActions`
export function getAvailableActions(params: {
  selectedInvoices: Mercoa.InvoiceResponse[]
  currentStatuses: Mercoa.InvoiceStatus[]
  currentUserId?: string
  users?: Mercoa.EntityUserResponse[]
  rolePermissions?: RBACPermissions
}): ReceivablesTableAction[] {
  const { selectedInvoices, currentStatuses, rolePermissions } = params
  if (!selectedInvoices.length) return []

  const actions: ReceivablesTableAction[] = []

  if (selectedInvoices.length > 1) {
    actions.push(ReceivablesTableAction.Edit)
  }

  // Send Invoice
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Draft)) {
    actions.push(ReceivablesTableAction.SendInvoice)
  }

  // Delete
  if (
    currentStatuses.some((e) => {
      const allowedStatuses: Mercoa.InvoiceStatus[] = [Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Canceled]
      return allowedStatuses.includes(e)
    })
  ) {
    if (rolePermissions?.invoice.delete || rolePermissions?.invoice.all) {
      actions.push(ReceivablesTableAction.Delete)
    }
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
    actions.push(ReceivablesTableAction.Cancel)
  }

  // Archive
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Paid)) {
    actions.push(ReceivablesTableAction.Archive)
  }

  // Restore as Draft
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Canceled)) {
    actions.push(ReceivablesTableAction.RestoreAsDraft)
  }

  return actions
}
