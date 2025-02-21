import accounting from 'accounting'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../../components'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'
import { ReceivablePaymentPortalV2 } from './components/receivable-payment-portal/receivable-payment-portal'

export function ReceivablePreviewPaymentPageV2({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
  const mercoaSession = useMercoaSession()

  const supportEmail = mercoaSession.organization?.supportEmail ?? 'support@mercoa.com'
  const totalDisplay = accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))

  return (
    <ReceivablePaymentPortalV2
      isPreview
      invoice={invoice}
      supportEmail={supportEmail}
      totalDisplay={totalDisplay}
      updateInvoice={() => Promise.resolve()}
    />
  )
}
