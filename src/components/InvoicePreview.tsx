import accounting from 'accounting'
import { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../lib/currency'
import { ReceivableFormValues, ReceivablePaymentPdf, ReceivablePaymentPortal, useMercoaSession } from './index'

type PreviewType = 'pdf' | 'email' | 'paymentPage'

export default function InvoicePreview({
  selectedPayer,
  paymentDestination,
}: {
  selectedPayer?: Mercoa.CounterpartyResponse
  paymentDestination?: Mercoa.PaymentMethodResponse
}) {
  const [previewType, setPreviewType] = useState<PreviewType>('pdf')
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const mercoaSession = useMercoaSession()

  const { watch } = useFormContext()
  const fieldValues: ReceivableFormValues = watch()
  const paymentSourceType = watch('paymentSourceType')
  const paymentDestinationType = watch('paymentDestinationType')

  const invoice: Mercoa.InvoiceResponse = {
    id: fieldValues.id ?? '',
    status: fieldValues.status ?? 'DRAFT',
    invoiceNumber: fieldValues.invoiceNumber,
    amount: fieldValues.amount,
    currency: fieldValues.currency ?? 'USD',
    payerId: fieldValues.payerId,
    payer: selectedPayer,
    vendor: mercoaSession.entity,
    invoiceDate: fieldValues.invoiceDate,
    dueDate: fieldValues.dueDate,
    lineItems: fieldValues.lineItems,
    deductionDate: fieldValues.deductionDate,
    paymentDestination: paymentDestination,
    paymentDestinationId: fieldValues.paymentDestinationId,
    paymentDestinationOptions: fieldValues.paymentDestinationOptions,
    paymentSourceId: fieldValues.paymentSourceId,
    noteToSelf: fieldValues.description,
    hasDocuments: fieldValues.hasDocuments ?? false,
    metadata: fieldValues.metadata ?? {},
    comments: fieldValues.comments ?? [],
    creatorUser: fieldValues.creatorUser,
    // Hardcoded defaults for preview
    paymentDestinationConfirmed: false,
    hasSourceEmail: false,
    approvers: [],
    approvalPolicy: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const showPaymentPage = paymentSourceType !== 'offPlatform' && paymentDestinationType !== 'offPlatform'
  const tabs: Array<{
    name: string
    action: PreviewType
  }> = showPaymentPage
    ? [
        {
          name: 'Invoice PDF',
          action: 'pdf',
        },
        {
          name: 'Payment Page',
          action: 'paymentPage',
        },
      ]
    : [
        {
          name: 'Invoice PDF',
          action: 'pdf',
        },
      ]

  const scalePreview = () => {
    const container = containerRef.current
    const preview = previewRef.current
    if (!container || !preview) return
    const containerWidth = container.offsetWidth
    const previewWidth = preview.offsetWidth
    const scaleFactor = (0.75 * containerWidth) / previewWidth
    preview.style.transform = `scale(${scaleFactor})`
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(scalePreview)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="mercoa-h-full mercoa-w-full mercoa-flex mercoa-flex-col mercoa-justify-center mercoa-items-center"
    >
      <nav className="-mercoa-mb-px mercoa-flex mercoa-space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setPreviewType(tab.action)}
            className={`${
              tab.action === previewType
                ? 'mercoa-border-mercoa-primary mercoa-text-mercoa-primary'
                : 'mercoa-border-transparent mercoa-text-gray-500 hover:mercoa-border-gray-300 hover:mercoa-text-gray-700'
            } mercoa-whitespace-nowrap mercoa-border-b-2 mercoa-px-1 mercoa-pb-4 mercoa-text-sm mercoa-font-medium`}
          >
            {tab.name}
          </button>
        ))}
      </nav>
      <div
        ref={previewRef}
        className="mercoa-h-[880px] mercoa-w-[680px] mercoa-grow mercoa-border mercoa-rounded-mercoa mercoa-shadow-md mercoa-p-10"
      >
        {previewType === 'pdf' && <InvoicePreviewPdf invoice={invoice} />}
        {previewType === 'paymentPage' && <InvoicePreviewPaymentPage invoice={invoice} />}
      </div>
    </div>
  )
}

export function InvoicePreviewPdf({ invoice, hideQR }: { invoice: Mercoa.InvoiceResponse; hideQR?: boolean }) {
  return <ReceivablePaymentPdf invoice={invoice} hideQR={hideQR} />
}

export function InvoicePreviewPaymentPage({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
  const mercoaSession = useMercoaSession()

  const supportEmail = mercoaSession.organization?.supportEmail ?? 'support@mercoa.com'
  const totalDisplay = accounting.formatMoney(invoice.amount ?? '', currencyCodeToSymbol(invoice.currency))

  return (
    <ReceivablePaymentPortal
      invoice={invoice}
      supportEmail={supportEmail}
      totalDisplay={totalDisplay}
      updateInvoice={() => {}}
    />
  )
}
