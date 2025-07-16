import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { usePayableDetails } from '../../../../hooks'

export function PayableFailureReason() {
  const { dataContextValue } = usePayableDetails()
  const { invoice } = dataContextValue

  const status = invoice?.status as Mercoa.InvoiceStatus
  const failureType = invoice?.failureType as Mercoa.InvoiceFailureType
  const transaction = invoice?.transactions?.find((t) => t.status === Mercoa.TransactionStatus.Failed)
  const failureReason = transaction && 'failureReason' in transaction ? transaction.failureReason : undefined

  // Only show if the invoice has failed and has a failure type
  if (status !== Mercoa.InvoiceStatus.Failed) {
    return null
  }

  const getFailureMessage = (failureType: Mercoa.InvoiceFailureType): string => {
    switch (failureType) {
      case Mercoa.InvoiceFailureType.InsufficientFunds:
        return 'Insufficient funds in the payment source account'
      case Mercoa.InvoiceFailureType.ProcessingError:
        return 'A processing error occurred during payment'
      case Mercoa.InvoiceFailureType.DestinationPaymentError:
        return 'Error occurred with the payment destination'
      case Mercoa.InvoiceFailureType.SourcePaymentError:
        return 'Error occurred with the payment source'
      case Mercoa.InvoiceFailureType.RejectedHighRisk:
        return 'Payment was rejected due to high risk detection'
      default:
        return 'Payment failed due to an unknown error'
    }
  }

  const getFailureTitle = (failureType: Mercoa.InvoiceFailureType): string => {
    switch (failureType) {
      case Mercoa.InvoiceFailureType.InsufficientFunds:
        return 'Insufficient Funds'
      case Mercoa.InvoiceFailureType.ProcessingError:
        return 'Processing Error'
      case Mercoa.InvoiceFailureType.DestinationPaymentError:
        return 'Destination Payment Error'
      case Mercoa.InvoiceFailureType.SourcePaymentError:
        return 'Source Payment Error'
      case Mercoa.InvoiceFailureType.RejectedHighRisk:
        return 'Rejected - High Risk'
      default:
        return 'Payment Failed'
    }
  }

  return (
    <div className="mercoa-col-span-full mercoa-mt-4">
      <div className="mercoa-rounded-mercoa mercoa-bg-red-50 mercoa-border mercoa-border-red-200 mercoa-p-4">
        <div className="mercoa-flex">
          <div className="mercoa-flex-shrink-0">
            <ExclamationTriangleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-red-400" aria-hidden="true" />
          </div>
          <div className="mercoa-ml-3">
            <h3 className="mercoa-text-sm mercoa-font-medium mercoa-text-red-800">{getFailureTitle(failureType)}</h3>
            <div className="mercoa-mt-2 mercoa-text-sm mercoa-text-red-700">
              {failureReason ? (
                <p>
                  {failureReason.code}: {failureReason.description}
                </p>
              ) : (
                <p>{getFailureMessage(failureType)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
