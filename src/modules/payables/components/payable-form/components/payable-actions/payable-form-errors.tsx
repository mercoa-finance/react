import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useFormContext } from 'react-hook-form'

export function PayableFormErrors() {
  const {
    formState: { errors },
    clearErrors,
  } = useFormContext()

  const errorKeys = Object.keys(errors)
  if (errorKeys.length === 0) return null

  const keyToField = {
    invoiceNumber: 'Invoice Number:',
    amount: 'Amount:',
    invoiceDate: 'Invoice Date:',
    dueDate: 'Due Date:',
    deductionDate: 'Scheduled Payment Date:',
    currency: 'Currency:',
    vendorId: 'Vendor:',
    paymentSourceId: 'Payment Source:',
    paymentDestinationId: 'Payment Destination:',
    approvers: 'Approvers:',
    lineItems: 'Line Items:',
    vendor: 'Vendor:',
    '~cpm~~': 'Payment Destination:',
  } as Record<string, string>

  const errorMessages = {
    approvers: 'Please select all approvers',
    lineItems: 'Please make sure all line items have a description and amount',
    vendor: 'Details incomplete',
    newBankAccount: 'Invalid Bank Account Data',
    newCheck: 'Invalid Check Data',
  } as Record<string, string>

  return (
    <div className="mercoa-bg-red-50 mercoa-border-l-4 mercoa-border-red-400 mercoa-p-4 mercoa-relative">
      {/* close button */}
      <button
        type="button"
        className="mercoa-absolute mercoa-top-1 mercoa-right-1 mercoa-p-1 mercoa-rounded-mercoa hover:mercoa-bg-red-100 focus:mercoa-outline-none focus:mercoa-bg-red-100"
        onClick={() => clearErrors()}
      >
        <span className="mercoa-sr-only">Close</span>
        <XMarkIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
      </button>
      <div className="mercoa-flex">
        <div className="mercoa-flex-shrink-0">
          <ExclamationCircleIcon className="mercoa-size-5 mercoa-text-red-400" aria-hidden="true" />
        </div>
        <div className="mercoa-ml-3">
          <h3 className="mercoa-text-sm mercoa-font-medium mercoa-text-red-800">
            There were errors with your submission
          </h3>
          <div className="mercoa-mt-2 mercoa-text-sm mercoa-text-red-700">
            <ul className="mercoa-list-disc mercoa-pl-5 mercoa-space-y-1">
              {errorKeys.map((key) => (
                <li key={key}>{`${keyToField[key] ?? ''} ${errors[key]?.message ?? errorMessages[key] ?? ''}`}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
