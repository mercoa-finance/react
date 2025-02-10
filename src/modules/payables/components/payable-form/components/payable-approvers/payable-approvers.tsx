import { Mercoa } from '@mercoa/javascript'
import { usePayableDetailsContext } from '../../../../providers/payables-detail-provider'
import { ApproversSelection } from './approver-selection'
import { ApproverWells } from './approver-wells'

export function PayableApprovers({ readOnly }: { readOnly?: boolean }) {
  const { approvers, formMethods } = usePayableDetailsContext()
  const {
    formState: { errors },
    watch,
  } = formMethods

  const status = watch('status') as Mercoa.InvoiceStatus

  return (
    <div className="mercoa-col-span-full mercoa-space-y-4">
      {approvers?.length > 0 && (
        <>
          <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900 mercoa-mt-5">
            Approvals
          </h2>
          {status === Mercoa.InvoiceStatus.Draft && !readOnly ? <ApproversSelection /> : <ApproverWells />}
          {errors.approvers && <p className="mercoa-text-sm mercoa-text-red-500">Please select all approvers</p>}
        </>
      )}
    </div>
  )
}
