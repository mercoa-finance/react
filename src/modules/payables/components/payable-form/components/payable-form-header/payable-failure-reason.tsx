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

  const getRCodeMessage = (code: string): { title: string; message: string } => {
    switch (code) {
      case 'R01':
        return {
          title: 'Insufficient Funds',
          message:
            'The source bank account does not have sufficient funds to complete this payment. Please add funds to the account or use a different payment method.',
        }
      case 'R02':
        return {
          title: 'Account Closed',
          message:
            'The bank account has been closed by the account holder or the bank. Please update your payment method with an active account.',
        }
      case 'R03':
        return {
          title: 'Account Not Found',
          message:
            'The account number is valid but does not correspond to an active account. Please verify the account information and try again.',
        }
      case 'R04':
        return {
          title: 'Invalid Account Number',
          message:
            'The account number format is invalid or contains incorrect digits. Please check the account number and routing number.',
        }
      case 'R05':
        return {
          title: 'Unauthorized Debit',
          message:
            'The account holder has not authorized this type of debit transaction. Please contact the account holder to authorize ACH debits.',
        }
      case 'R06':
        return {
          title: 'Account Frozen',
          message:
            'The bank account has been frozen by the bank or account holder. Please contact the bank to resolve this issue.',
        }
      case 'R07':
        return {
          title: 'Authorization Revoked',
          message:
            'The authorization for this type of transaction has been revoked. Please obtain new authorization from the account holder.',
        }
      case 'R08':
        return {
          title: 'Payment Stopped',
          message:
            'A stop payment order has been placed on this transaction. Please contact the account holder to resolve this issue.',
        }
      case 'R09':
        return {
          title: 'Uncollected Funds',
          message:
            'The account has uncollected funds that are not available for immediate withdrawal. Please try again later.',
        }
      case 'R10':
        return {
          title: 'Customer Advises Not Authorized',
          message:
            'The account holder has advised that this transaction is not authorized. Please verify the transaction details.',
        }
      case 'R11':
        return {
          title: 'Check Truncation Entry Return',
          message: 'This transaction cannot be processed as an ACH entry. Please use a different payment method.',
        }
      case 'R12':
        return {
          title: 'Branch Sold to Another DFI',
          message: 'The bank branch has been sold to another financial institution. Please update the routing number.',
        }
      case 'R13':
        return {
          title: 'RDFI Not Qualified to Participate',
          message:
            'The receiving bank is not qualified to participate in ACH transactions. Please use a different bank account.',
        }
      case 'R14':
        return {
          title: 'Representative Payee Deceased',
          message:
            'The representative payee for this account is deceased. Please contact the bank to update account information.',
        }
      case 'R15':
        return {
          title: 'Beneficiary or Account Holder Deceased',
          message: 'The account holder is deceased. Please contact the bank to resolve this issue.',
        }
      case 'R16':
        return {
          title: 'Account Frozen',
          message: 'The account has been frozen due to legal action. Please contact the bank to resolve this issue.',
        }
      case 'R17':
        return {
          title: 'File Record Edit Criteria',
          message:
            'The transaction does not meet the file record edit criteria. Please verify all transaction details.',
        }
      case 'R18':
        return {
          title: 'Improper Effective Entry Date',
          message: 'The effective date for this transaction is invalid. Please check the payment date.',
        }
      case 'R19':
        return {
          title: 'Amount Field Error',
          message: 'There is an error in the amount field. Please verify the payment amount.',
        }
      case 'R20':
        return {
          title: 'Non-Transaction Account',
          message: 'This account cannot be used for ACH transactions. Please use a different account type.',
        }
      case 'R21':
        return {
          title: 'Invalid Company Identification',
          message: 'The company identification is invalid. Please contact support for assistance.',
        }
      case 'R22':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R23':
        return {
          title: 'Credit Entry Refused by Receiver',
          message: 'The account holder has refused this credit entry. Please contact the account holder.',
        }
      case 'R24':
        return {
          title: 'Duplicate Entry',
          message: 'This transaction is a duplicate of a previous entry. Please check for duplicate payments.',
        }
      case 'R25':
        return {
          title: 'Addenda Error',
          message: 'There is an error in the addenda record. Please contact support for assistance.',
        }
      case 'R26':
        return {
          title: 'Mandatory Field Error',
          message: 'A required field is missing or invalid. Please verify all transaction information.',
        }
      case 'R27':
        return {
          title: 'Trace Number Error',
          message: 'There is an error in the trace number. Please contact support for assistance.',
        }
      case 'R28':
        return {
          title: 'Routing Number Check Digit Error',
          message: 'The routing number is invalid. Please verify the bank routing number.',
        }
      case 'R29':
        return {
          title: 'Corporate Customer Advises Not Authorized',
          message:
            'The corporate account holder has advised that this transaction is not authorized. Please obtain proper authorization.',
        }
      case 'R30':
        return {
          title: 'RDFI Not Participant in Check Truncation Program',
          message:
            'The receiving bank does not participate in check truncation. Please use a different payment method.',
        }
      case 'R31':
        return {
          title: 'Permissible Return Entry Not Accomplished',
          message: 'The return entry could not be accomplished. Please contact support for assistance.',
        }
      case 'R32':
        return {
          title: 'Return of XCK Entry',
          message: 'This transaction cannot be processed as an XCK entry. Please use a different payment method.',
        }
      case 'R33':
        return {
          title: 'Limited Participation DFI',
          message:
            'The receiving bank has limited participation in ACH transactions. Please use a different bank account.',
        }
      case 'R34':
        return {
          title: 'Return of Improper Debit Entry',
          message: 'This debit entry is improper and cannot be processed. Please verify the transaction type.',
        }
      case 'R35':
        return {
          title: 'Return of Improper Credit Entry',
          message: 'This credit entry is improper and cannot be processed. Please verify the transaction type.',
        }
      case 'R36':
        return {
          title: 'Return of XCK Entry',
          message: 'This transaction cannot be processed as an XCK entry. Please use a different payment method.',
        }
      case 'R37':
        return {
          title: 'Source Document Presented for Payment',
          message: 'The source document has been presented for payment. Please use a different payment method.',
        }
      case 'R38':
        return {
          title: 'Stop Payment on Source Document',
          message: 'A stop payment has been placed on the source document. Please use a different payment method.',
        }
      case 'R39':
        return {
          title: 'Improper Source Document',
          message: 'The source document is improper and cannot be processed. Please use a different payment method.',
        }
      case 'R40':
        return {
          title: 'Return of ENR Entry by Federal Government Agency',
          message:
            'This transaction has been returned by a federal government agency. Please contact support for assistance.',
        }
      case 'R41':
        return {
          title: 'Invalid Transaction Code',
          message: 'The transaction code is invalid. Please contact support for assistance.',
        }
      case 'R42':
        return {
          title: 'Routing Number/Check Digit Error',
          message: 'There is an error in the routing number or check digit. Please verify the bank routing number.',
        }
      case 'R43':
        return {
          title: 'Invalid DFI Account Number',
          message: 'The DFI account number is invalid. Please contact support for assistance.',
        }
      case 'R44':
        return {
          title: 'Duplicate Entry',
          message: 'This transaction is a duplicate of a previous entry. Please check for duplicate payments.',
        }
      case 'R45':
        return {
          title: 'High Dollar Amount Return',
          message: 'This transaction exceeds the high dollar amount limit. Please contact support for assistance.',
        }
      case 'R46':
        return {
          title: 'Field Error',
          message: 'There is an error in one or more fields. Please verify all transaction information.',
        }
      case 'R47':
        return {
          title: 'Enr Entry Not Accepted',
          message: 'This ENR entry is not accepted. Please contact support for assistance.',
        }
      case 'R48':
        return {
          title: 'Invalid File Format',
          message: 'The file format is invalid. Please contact support for assistance.',
        }
      case 'R49':
        return {
          title: 'Invalid Company Identification',
          message: 'The company identification is invalid. Please contact support for assistance.',
        }
      case 'R50':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R51':
        return {
          title: 'Invalid Representative Payee Indicator',
          message: 'The representative payee indicator is invalid. Please contact support for assistance.',
        }
      case 'R52':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R53':
        return {
          title: 'Invalid Company Name',
          message: 'The company name is invalid. Please verify the company information.',
        }
      case 'R54':
        return {
          title: 'Invalid Discretionary Data',
          message: 'The discretionary data is invalid. Please contact support for assistance.',
        }
      case 'R55':
        return {
          title: 'Invalid Identification Number',
          message: 'The identification number is invalid. Please verify the account holder information.',
        }
      case 'R56':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R57':
        return {
          title: 'Invalid Addenda Record Indicator',
          message: 'The addenda record indicator is invalid. Please contact support for assistance.',
        }
      case 'R58':
        return {
          title: 'Invalid Trace Number',
          message: 'The trace number is invalid. Please contact support for assistance.',
        }
      case 'R59':
        return {
          title: 'Invalid Transaction Code',
          message: 'The transaction code is invalid. Please contact support for assistance.',
        }
      case 'R60':
        return {
          title: 'Invalid Amount',
          message: 'The amount is invalid. Please verify the payment amount.',
        }
      case 'R61':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R62':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R63':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R64':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R65':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R66':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R67':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R68':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R69':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R70':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R71':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R72':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R73':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R74':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R75':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R76':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R77':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R78':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R79':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R80':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R81':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R82':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R83':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R84':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R85':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R86':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R87':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R88':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R89':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R90':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R91':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R92':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R93':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R94':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R95':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R96':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      case 'R97':
        return {
          title: 'Invalid Individual ID Number',
          message: 'The individual identification number is invalid. Please verify the account holder information.',
        }
      case 'R98':
        return {
          title: 'Invalid Individual Name',
          message: 'The individual name is invalid. Please verify the account holder information.',
        }
      case 'R99':
        return {
          title: 'Invalid Representative Payee Name',
          message: 'The representative payee name is invalid. Please contact support for assistance.',
        }
      default:
        return {
          title: 'Payment Failed',
          message: 'Payment failed due to an unknown error. Please contact support for assistance.',
        }
    }
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

  // Get specific R code message if available, otherwise fall back to failure type
  const rCodeMessage = failureReason?.code ? getRCodeMessage(failureReason.code) : null
  const displayTitle = rCodeMessage?.title || getFailureTitle(failureType)
  const displayMessage = rCodeMessage?.message || failureReason?.description || getFailureMessage(failureType)

  return (
    <div className="mercoa-col-span-full mercoa-mt-4">
      <div className="mercoa-rounded-mercoa mercoa-bg-red-50 mercoa-border mercoa-border-red-200 mercoa-p-4">
        <div className="mercoa-flex">
          <div className="mercoa-flex-shrink-0">
            <ExclamationTriangleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-red-400" aria-hidden="true" />
          </div>
          <div className="mercoa-ml-3">
            <h3 className="mercoa-text-sm mercoa-font-medium mercoa-text-red-800">{displayTitle}</h3>
            <div className="mercoa-mt-2 mercoa-text-sm mercoa-text-red-700">
              <p>{displayMessage}</p>
              {failureReason?.code && !rCodeMessage && (
                <p className="mercoa-mt-1 mercoa-text-xs mercoa-text-red-600">Error Code: {failureReason.code}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
