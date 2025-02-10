import { Mercoa } from '@mercoa/javascript'

export function PayableStatusPill({
  status,
  failureType,
  amount,
  payerId,
  vendorId,
  dueDate,
  paymentSourceId,
  paymentDestinationId,
  type,
}: {
  status: Mercoa.InvoiceStatus
  failureType?: Mercoa.InvoiceFailureType
  amount?: number
  payerId?: string
  vendorId?: string
  dueDate?: Date
  paymentSourceId?: string
  paymentDestinationId?: string
  type?: 'payable' | 'receivable'
}) {
  const counterparty = type === 'receivable' ? payerId : vendorId
  let backgroundColor = 'mercoa-bg-gray-100'
  let textColor = 'mercoa-text-black'
  let message = ''
  if (!status || status === Mercoa.InvoiceStatus.Draft) {
    if (!counterparty || !amount || !dueDate) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Draft Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Draft Ready'
    }
  } else if (status === Mercoa.InvoiceStatus.New) {
    if (!paymentSourceId || !counterparty || !amount || !dueDate) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-gray-800'
      message = 'Incomplete'
    } else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Ready for Review'
    }
  } else if (status === Mercoa.InvoiceStatus.Approved) {
    // AP Validation
    if (type === 'payable' && (!paymentSourceId || !paymentDestinationId || !counterparty || !amount || !dueDate)) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Incomplete'
    }
    // AR Validation (don't require paymentSourceId)
    else if (type === 'receivable' && (!paymentDestinationId || !counterparty || !amount || !dueDate)) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Incomplete'
    }
    // Fallthrough
    else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = type === 'receivable' ? 'Out for Payment' : 'Ready for Payment'
    }
  } else if (status === Mercoa.InvoiceStatus.Scheduled) {
    // AP Validation
    if (type === 'payable' && (!paymentSourceId || !paymentDestinationId || !counterparty || !amount || !dueDate)) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Incomplete'
    }
    // AR Validation (don't require paymentSourceId)
    else if (type === 'receivable' && (!paymentDestinationId || !counterparty || !amount || !dueDate)) {
      backgroundColor = 'mercoa-bg-yellow-100'
      textColor = 'mercoa-text-black'
      message = 'Incomplete'
    }
    // Fallthrough
    else {
      backgroundColor = 'mercoa-bg-green-100'
      textColor = 'mercoa-text-green-800'
      message = 'Payment Scheduled'
    }
  } else if (status === Mercoa.InvoiceStatus.Pending) {
    backgroundColor = 'mercoa-bg-yellow-100'
    textColor = 'mercoa-text-black'
    message = 'Payment Processing'
  } else if (status === Mercoa.InvoiceStatus.Paid) {
    backgroundColor = 'mercoa-bg-green-100'
    textColor = 'mercoa-text-green-800'
    message = 'Paid'
  } else if (status === Mercoa.InvoiceStatus.Canceled) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Canceled'
  } else if (status === Mercoa.InvoiceStatus.Archived) {
    backgroundColor = 'mercoa-bg-gray-100'
    textColor = 'mercoa-text-black'
    message = 'Archived'
  } else if (status === Mercoa.InvoiceStatus.Refused) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Rejected'
  } else if (status === Mercoa.InvoiceStatus.Failed) {
    backgroundColor = 'mercoa-bg-red-100'
    textColor = 'mercoa-text-red-800'
    message = 'Failed'
    if (failureType === Mercoa.InvoiceFailureType.InsufficientFunds) {
      message = 'Insufficient Funds'
    } else if (failureType === Mercoa.InvoiceFailureType.ProcessingError) {
      message = 'Processing Error'
    } else if (failureType === Mercoa.InvoiceFailureType.DestinationPaymentError) {
      message = 'Destination Payment Error'
    } else if (failureType === Mercoa.InvoiceFailureType.SourcePaymentError) {
      message = 'Source Payment Error'
    } else if (failureType === Mercoa.InvoiceFailureType.RejectedHighRisk) {
      message = 'Rejected High Risk'
    }
  }

  return message ? (
    <p
      className={`mercoa-inline-flex mercoa-items-center mercoa-whitespace-nowrap mercoa-rounded-full mercoa-px-3 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium ${backgroundColor} ${textColor} md:mercoa-ml-2`}
    >
      {message}
    </p>
  ) : (
    <></>
  )
}
