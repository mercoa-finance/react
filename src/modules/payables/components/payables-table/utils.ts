import { Mercoa } from '@mercoa/javascript'
import { RBACPermissions } from '../../../../lib/lib'

export function filterApproverOptions({
  approverSlotIndex,
  eligibleRoles,
  eligibleUserIds,
  users,
  selectedApprovers,
}: {
  approverSlotIndex: number
  eligibleRoles: string[]
  eligibleUserIds: Mercoa.EntityUserId[]
  users: Mercoa.EntityUserResponse[]
  selectedApprovers: Mercoa.ApprovalSlot[]
}) {
  if (!Array.isArray(eligibleRoles) && !Array.isArray(eligibleUserIds)) return []

  const usersFiltered: Mercoa.EntityUserResponse[] = users.filter((user) => {
    if (user.roles.some((role) => eligibleRoles.includes(role))) return true
    if (eligibleUserIds.some((eligibleId) => user.id === eligibleId)) return true
  })

  const options = usersFiltered.map((user) => {
    let disabled: boolean = false
    // if this user is already a selectedApprover elsewhere in a different approverSlot, they should not be selectable
    if (
      selectedApprovers.find((e) => e?.assignedUserId === user.id) &&
      selectedApprovers[approverSlotIndex]?.assignedUserId !== user.id
    ) {
      disabled = true
    }

    return { user: user, disabled: disabled }
  })

  const enabledOptions = options.filter((option) => !option.disabled)
  const disabledOptions = options.filter((option) => option.disabled)
  return enabledOptions.concat(disabledOptions)
}
export function getAvailableActions(params: {
  selectedInvoices: Mercoa.InvoiceResponse[]
  currentStatuses: Mercoa.InvoiceStatus[]
  currentUserId?: string
  users?: Mercoa.EntityUserResponse[]
  rolePermissions?: RBACPermissions
}): string[] {
  const { selectedInvoices, currentStatuses, currentUserId, users, rolePermissions } = params
  if (!selectedInvoices.length) return []

  const actions: string[] = []

  // Add Approver & Submit/Approve for Draft status
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Draft)) {
    const firstInvoice = selectedInvoices[0]
    if (firstInvoice.approvers.length > 0) {
      actions.push('addApprover')
    }
    actions.push('submitNew')
  }

  // Schedule/Set Payment Date
  if (
    currentStatuses.some((e) =>
      [
        Mercoa.InvoiceStatus.Draft,
        Mercoa.InvoiceStatus.New,
        Mercoa.InvoiceStatus.Approved,
        Mercoa.InvoiceStatus.Failed,
        //@ts-ignore
      ].includes(e),
    )
  ) {
    if (
      rolePermissions?.invoice.create.statuses.includes(Mercoa.InvoiceStatus.Scheduled) ||
      rolePermissions?.invoice.create.all ||
      rolePermissions?.invoice.all
    ) {
      actions.push('schedulePayment')
    }
  }

  // Reschedule Payment
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Scheduled)) {
    if (
      rolePermissions?.invoice.create.statuses.includes(Mercoa.InvoiceStatus.Scheduled) ||
      rolePermissions?.invoice.create.all ||
      rolePermissions?.invoice.all
    ) {
      actions.push('schedulePayment')
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
      if (
        rolePermissions?.invoice.create.statuses.includes(Mercoa.InvoiceStatus.Approved) ||
        rolePermissions?.invoice.create.all ||
        rolePermissions?.invoice.all
      ) {
        actions.push('approve')
      }
      if (
        rolePermissions?.invoice.create.statuses.includes(Mercoa.InvoiceStatus.Refused) ||
        rolePermissions?.invoice.create.all ||
        rolePermissions?.invoice.all
      ) {
        actions.push('reject')
      }
    }
  }

  //@ts-ignore
  if (currentStatuses.some((e) => [Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Canceled].includes(e))) {
    if (rolePermissions?.invoice.delete || rolePermissions?.invoice.all) {
      actions.push('delete')
    }
  }

  // Cancel
  if (
    currentStatuses.some((e) =>
      [
        Mercoa.InvoiceStatus.New,
        Mercoa.InvoiceStatus.Approved,
        Mercoa.InvoiceStatus.Refused,
        Mercoa.InvoiceStatus.Scheduled,
        Mercoa.InvoiceStatus.Failed,
        //@ts-ignore
      ].includes(e),
    )
  ) {
    actions.push('cancel')
  }

  // Archive
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Paid)) {
    actions.push('archive')
  }

  // Restore as Draft
  if (currentStatuses.includes(Mercoa.InvoiceStatus.Canceled)) {
    actions.push('restoreAsDraft')
  }

  return actions
}
