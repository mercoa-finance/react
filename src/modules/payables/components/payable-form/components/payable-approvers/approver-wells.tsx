import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../../components'
import { Tooltip } from '../../../../../../components/generics'
import { usePayableDetailsContext } from '../../../../providers/payables-detail-provider'
import { filterApproverOptions } from './utils'

export function ApproverWells() {
  const mercoaSession = useMercoaSession()
  const seenUsers: string[] = []
  const { approvers, approvalPolicy: approvalPolicies } = usePayableDetailsContext()

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
      {approvers.map((slot, index) => {
        const user = mercoaSession.users.find((user) => user.id === slot.assignedUserId)
        if (!slot.assignedUserId || slot.assignedUserId === 'ANY') {
          return (
            <ApproverWell
              key={slot.approvalSlotId}
              approverSlot={slot}
              index={index}
              triggerDescription={getTriggerDescription(slot)}
              eligibleDescription={getEligibleDescription(slot)}
            />
          )
        } else if (user && !seenUsers.includes(user.id)) {
          seenUsers.push(user.id)
          return (
            <ApproverWell
              key={user.id}
              approverSlot={slot}
              approver={user}
              index={index}
              triggerDescription={getTriggerDescription(slot)}
              eligibleDescription={getEligibleDescription(slot)}
            />
          )
        }
      })}
    </>
  )
}

function ApproverWell({
  approverSlot,
  approver,
  index,
  triggerDescription,
  eligibleDescription,
}: {
  approverSlot: Mercoa.ApprovalSlot
  approver?: Mercoa.EntityUserResponse
  index: number
  triggerDescription: string
  eligibleDescription: string
}) {
  const mercoaSession = useMercoaSession()

  const [isExpanded, setIsExpanded] = useState(false)

  let bgColor = ''
  let icon
  if (approverSlot.action === Mercoa.ApproverAction.None) {
    bgColor = 'mercoa-bg-gray-50'
    icon = <></>
  } else if (approverSlot.action === Mercoa.ApproverAction.Approve) {
    bgColor = 'mercoa-bg-green-50'
    icon = <CheckCircleIcon className="mercoa-h-8 mercoa-w-8 mercoa-text-green-400" aria-hidden="true" />
  } else if (approverSlot.action === Mercoa.ApproverAction.Reject) {
    bgColor = 'mercoa-bg-red-50'
    icon = <XCircleIcon className="mercoa-h-8 mercoa-w-8 mercoa-text-red-400" aria-hidden="true" />
  }

  const approvers = filterApproverOptions({
    approverSlotIndex: index,
    eligibleRoles: approverSlot.eligibleRoles,
    eligibleUserIds: approverSlot.eligibleUserIds,
    users: mercoaSession.users,
    selectedApprovers: [],
  })

  return (
    <>
      <div className="mercoa-flex mercoa-items-center">
        <div className="mercoa-flex-auto mercoa-max-w-full">
          <div className={`mercoa-flex mercoa-items-center mercoa-rounded-mercoa ${bgColor} mercoa-max-w-full`}>
            <div className="mercoa-flex-auto mercoa-p-3 mercoa-max-w-full">
              {approver ? (
                <>
                  <div className={'mercoa-text-sm mercoa-font-medium mercoa-text-grey-900'}>{approver.name}</div>
                  <div className="mercoa-text-sm mercoa-text-gray-500">{approver.email}</div>
                </>
              ) : (
                <div
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={
                    'mercoa-text-sm mercoa-font-medium mercoa-text-grey-900 mercoa-max-w-full mercoa-overflow-hidden mercoa-whitespace-nowrap mercoa-truncate mercoa-cursor-pointer'
                  }
                >
                  Any Approver:
                  <span className="mercoa-ml-1">
                    {isExpanded ? (
                      <>
                        {approvers.map(({ user: approver }) => (
                          <div
                            key={approver.id}
                            className="mercoa-text-sm mercoa-border mercoa-p-2 mercoa-border-gray-200 mercoa-rounded-mercoa mercoa-mt-2 mercoa-mb-1"
                          >
                            <div className={'mercoa-font-medium mercoa-text-grey-900 '}>{approver.name}</div>
                            <div className="mercoa-text-gray-500 ">{approver.email}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <span className="mercoa-text-gray-500">{approvers.map((e) => e.user.name).join(', ')}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="mercoa-mx-4 mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75">
              {icon}
            </div>
            <div className="mercoa-mr-2">
              <Tooltip
                position="left"
                title={
                  <div className="mercoa-text-xs">
                    <div className="mercoa-font-medium">Trigger:</div>
                    <div>{triggerDescription}</div>
                    <div className="mercoa-font-medium mercoa-mt-2">Eligible Approvers:</div>
                    <div>{eligibleDescription}</div>
                  </div>
                }
              >
                <InformationCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
