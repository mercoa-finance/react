import { Bar, Container, Section } from '@column-resizer/react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { NoSession, useMercoaSession } from '../../../../components'
import { PayableDetailsViewMode } from '../../hooks/use-payable-details'
import { PayableDetailsProvider } from '../../providers/payables-detail-provider'
import { PayableDocumentV2 } from '../payable-document'
import { PayableFormV2 } from '../payable-form'

export function PayableDetailsV2({
  invoiceType,
  invoiceId,
  invoice,
  onUpdate,
  heightOffset,
  admin,
  documentPosition = 'left',
  invoicePreSubmit,
  counterpartyPreSubmit,
  onInvoiceSubmit,
  renderCustom,
  children,
}: {
  invoiceType?: 'invoice' | 'invoiceTemplate'
  invoiceId?: Mercoa.InvoiceId | Mercoa.InvoiceTemplateId
  invoice?: Mercoa.InvoiceResponse
  onUpdate?: (invoice: Mercoa.InvoiceResponse | undefined) => void
  heightOffset?: number
  admin?: boolean
  documentPosition?: 'right' | 'left' | 'none'
  invoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  counterpartyPreSubmit?: (
    counterparty: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onInvoiceSubmit?: (resp: Mercoa.InvoiceResponse) => void
  renderCustom?: {
    toast?: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
  children?: JSX.Element | JSX.Element[]
}) {
  const mercoaSession = useMercoaSession()

  if (!mercoaSession.client) return <NoSession componentName="PayableDetails" />

  // Try to infer invoiceType when not provided, defaulting to 'invoice' when unable to infer
  if (!invoiceType) {
    if (invoiceId) {
      invoiceType = invoiceId.startsWith('invt_') ? 'invoiceTemplate' : 'invoice'
    } else {
      invoiceType = 'invoice'
    }
  }

  // Handle children prop
  let leftComponent: JSX.Element | undefined
  let rightComponent: JSX.Element | undefined

  if (children) {
    if (Array.isArray(children)) {
      // If children is an array, use first two elements as left/right components
      leftComponent = children[0] as JSX.Element
      rightComponent = children[1] as JSX.Element
    } else {
      return (
        <PayableDetailsProvider
          payableDetailsProps={{
            queryParams: { invoiceId: invoiceId ?? '', invoiceType },
            viewMode: PayableDetailsViewMode.Document,
            handlers: {
              onInvoicePreSubmit: invoicePreSubmit,
              onCounterpartyPreSubmit: counterpartyPreSubmit,
              onInvoiceUpdate: onUpdate,
              onInvoiceSubmit: onInvoiceSubmit,
            },
            toast: renderCustom?.toast ?? toast,
            layoutConfig: {
              heightOffset: heightOffset ?? mercoaSession.heightOffset,
              documentPosition: documentPosition,
            },
          }}
        >
          {children}
        </PayableDetailsProvider>
      )
    }
  } else {
    leftComponent = <PayableDocumentV2 />
    rightComponent = <PayableFormV2 />
  }

  if (documentPosition === 'none') {
    return rightComponent ?? leftComponent ?? <></>
  }

  return (
    <PayableDetailsProvider
      payableDetailsProps={{
        queryParams: { invoiceId: invoice?.id ?? invoiceId ?? '', invoiceType },
        viewMode: PayableDetailsViewMode.Document,
        handlers: {
          onInvoicePreSubmit: invoicePreSubmit,
          onCounterpartyPreSubmit: counterpartyPreSubmit,
          onInvoiceUpdate: onUpdate,
          onInvoiceSubmit: onInvoiceSubmit,
        },
        toast: renderCustom?.toast ?? toast,
        layoutConfig: { heightOffset: heightOffset ?? mercoaSession.heightOffset, documentPosition: documentPosition },
      }}
    >
      <Container>
        <Section className={`mercoa-relative mercoa-px-5`} minSize={0}>
          {documentPosition === 'left' ? leftComponent : rightComponent}
        </Section>
        <Bar
          size={10}
          className="mercoa-cursor-col-resize mercoa-invisible min-[450px]:mercoa-visible"
          style={{
            background:
              'linear-gradient(180deg, rgba(229,231,235,1) 48%, rgba(145,145,145,1) 48%, rgba(145,145,145,1) 52%, rgba(229,231,235,1) 52%)',
          }}
        />
        <Section className={`mercoa-relative mercoa-px-5`} minSize={400}>
          {documentPosition === 'right' ? leftComponent : rightComponent}
        </Section>
      </Container>
    </PayableDetailsProvider>
  )
}
