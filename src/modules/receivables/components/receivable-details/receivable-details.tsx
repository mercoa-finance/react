import { Bar, Container, Section } from '@column-resizer/react'
import { ReactNode } from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { NoSession, useMercoaSession } from '../../../../components'
import { ReceivableDetailsProvider } from '../../providers/receivable-detail-provider'
import { ReceivableForm } from '../receivable-form/receivable-form'
import InvoicePreview from '../receivable-preview/receivable-preview'

export function ReceivableDetails({
  invoiceId,
  onUpdate,
  documentPosition = 'left',
  supportedCurrencies,
  disableCustomerCreation,
  children,
}: {
  invoiceId?: Mercoa.InvoiceId
  onUpdate: (invoice: Mercoa.InvoiceResponse | undefined) => void
  documentPosition?: 'right' | 'left' | 'none'
  supportedCurrencies?: Mercoa.CurrencyCode[]
  disableCustomerCreation?: boolean
  children?: ReactNode
}) {
  const mercoaSession = useMercoaSession()

  if (!mercoaSession.client) return <NoSession componentName="ReceivableDetails" />

  if (documentPosition === 'none') {
    return <ReceivableForm>{children}</ReceivableForm>
  }

  const invoicePreview = (
    <Section minSize={300} maxSize={800}>
      <InvoicePreview />
    </Section>
  )
  const invoiceDetails = (
    <Section className={`mercoa-relative ${documentPosition === 'left' ? 'mercoa-pl-5' : 'mercoa-pr-5'}`} minSize={400}>
      <ReceivableForm>{children}</ReceivableForm>
    </Section>
  )

  return (
    <ReceivableDetailsProvider
      receivableDetailsProps={{
        queryParams: { invoiceId },
        config: {
          supportedCurrencies,
          disableCustomerCreation,
        },
        handlers: {
          onUpdate: (invoice: Mercoa.InvoiceResponse | undefined) => {
            if (onUpdate) {
              onUpdate(invoice)
            }
          },
        },
        toast: {
          error: (message: string) => {
            toast.error(message)
          },
          success: (message: string) => {
            toast.success(message)
          },
          info: (message: string) => {
            toast.info(message)
          },
        },
      }}
    >
      <Container>
        {documentPosition === 'left' ? invoicePreview : invoiceDetails}
        <Bar
          size={10}
          className="mercoa-cursor-col-resize mercoa-invisible min-[450px]:mercoa-visible"
          style={{
            background:
              'linear-gradient(180deg, rgba(229,231,235,1) 48%, rgba(145,145,145,1) 48%, rgba(145,145,145,1) 52%, rgba(229,231,235,1) 52%)',
          }}
        />
        {documentPosition === 'right' ? invoicePreview : invoiceDetails}
      </Container>
    </ReceivableDetailsProvider>
  )
}
