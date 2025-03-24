import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { MercoaCombobox, Tooltip, useMercoaSession, usePayableDetails } from '../../../../../../components'
import { isUpstreamPolicyAssigned } from './utils'

export function ApproversSelection() {
  const { formContextValue } = usePayableDetails()
  const { approversContextValue } = formContextValue
  const {
    approvers,
    approvalPolicy: approvalPolicies,
    setApproverBySlot,
    selectedApproverBySlot,
    getApprovalSlotOptions,
  } = approversContextValue
  const mercoaSession = useMercoaSession()

  if (!approvalPolicies) return <></>

  const getTriggerDescription = (slot: Mercoa.ApprovalSlot) => {
    const policy = approvalPolicies?.find((p) => p.id === slot.approvalPolicyId)
    if (!policy?.trigger || policy.trigger.length === 0) {
      return 'Rule applies to all invoices'
    }

    return policy.trigger
      .map((trigger) => {
        if (trigger.type === 'amount') {
          return `Amount >= ${trigger.amount} ${trigger.currency}`
        } else if (trigger.type === 'vendor') {
          return `Specific vendors`
        } else if (trigger.type === 'metadata') {
          return `${trigger.key} = ${trigger.value}`
        }
        return ''
      })
      .join(' AND ')
  }

  const getEligibleDescription = (slot: Mercoa.ApprovalSlot) => {
    const policy = approvalPolicies?.find((p) => p.id === slot.approvalPolicyId)
    if (!policy?.rule) return ''

    if (policy.rule.type === 'approver') {
      if (policy.rule.identifierList.type === 'rolesList') {
        return `Eligible roles: ${policy.rule.identifierList.value.join(', ')}`
      } else {
        const eligibleUsers = policy.rule.identifierList.value
          .map((id) => mercoaSession.users.find((u) => u.id === id)?.name)
          .filter(Boolean)
        return `Eligible users: ${eligibleUsers.join(', ')}`
      }
    }
    return ''
  }

  return (
    <>
      {/* doubt: what is upstream policy assigned for */}
      {approvers.map((slot, index) => (
        <Fragment key={index}>
          {isUpstreamPolicyAssigned({
            policyId: slot.approvalPolicyId,
            approvalPolicies,
            approverSlots: approvers,
            selectedApprovers: approvers,
          }) && (
            <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
              <MercoaCombobox
                label={'Assigned to'}
                showAllOptions
                onChange={(e) => {
                  setApproverBySlot(slot.approvalSlotId, e.id)
                }}
                value={selectedApproverBySlot(slot.approvalSlotId)}
                options={getApprovalSlotOptions(slot.approvalSlotId)}
                displayIndex="name"
                secondaryDisplayIndex="email"
                disabledText="Already assigned"
                displaySelectedAs="pill"
                className="mercoa-w-full"
              />
              <Tooltip
                position="left"
                title={
                  <div className="mercoa-text-xs">
                    <div className="mercoa-font-medium">Trigger:</div>
                    <div>{getTriggerDescription(slot)}</div>
                    <div className="mercoa-font-medium mercoa-mt-2">Eligible Approvers:</div>
                    <div>{getEligibleDescription(slot)}</div>
                  </div>
                }
              >
                <InformationCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" />
              </Tooltip>
            </div>
          )}
        </Fragment>
      ))}
    </>
  )
}
