import { Fragment } from 'react'
import { MercoaCombobox, usePayableDetailsContext } from '../../../../../../components'
import { isUpstreamPolicyAssigned } from './utils'

export function ApproversSelection() {
  const {
    approvers,
    approvalPolicy: approvalPolicies,
    setApproverBySlot,
    selectedApproverBySlot,
    getApprovalSlotOptions,
  } = usePayableDetailsContext()

  if (!approvalPolicies) return <></>

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
            />
          )}
        </Fragment>
      ))}
    </>
  )
}
