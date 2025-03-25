import accounting from 'accounting'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../../components'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'
import { ReceivablePaymentPortal } from './components/receivable-payment-portal/receivable-payment-portal'

export function ReceivablePreviewPaymentPage({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
  const mercoaSession = useMercoaSession()

  const supportEmail = mercoaSession.organization?.supportEmail ?? 'support@mercoa.com'
  const totalDisplay = accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))

  return (
    <ReceivablePaymentPortal
      isPreview
      invoice={invoice}
      supportEmail={supportEmail}
      totalDisplay={totalDisplay}
      updateInvoice={() => Promise.resolve()}
    />
  )
}
