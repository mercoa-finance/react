import { useEffect, useRef, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { ReceivableFormValues, useMercoaSession } from '../../../../components'
import { useReceivableDetails } from '../../hooks/use-receivable-details'
import { ReceivablePreviewPaymentPage } from './components/receivable-preview-payment-page/receivable-preview-payment-page'
import { ReceivablePreviewPdf } from './components/receivable-preview-pdf/receivable-preview-pdf'

type PreviewType = 'pdf' | 'email' | 'paymentPage'

export default function InvoicePreview() {
  const mercoaSession = useMercoaSession()
  const { formContextValue } = useReceivableDetails()
  const { formMethods, payerContextValue } = formContextValue
  const { selectedPayer } = payerContextValue

  const { watch } = formMethods
  const fieldValues: ReceivableFormValues = watch()
  const paymentDestination = watch('paymentDestination')
  const paymentSourceType = watch('paymentSourceType')
  const paymentDestinationType = watch('paymentDestinationType')

  const [previewType, setPreviewType] = useState<PreviewType>('pdf')

  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

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
        {previewType === 'pdf' && <ReceivablePreviewPdf invoice={invoice} />}
        {previewType === 'paymentPage' && <ReceivablePreviewPaymentPage invoice={invoice} />}
      </div>
    </div>
  )
}
