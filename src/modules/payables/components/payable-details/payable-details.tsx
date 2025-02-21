import { Bar, Container, Section } from '@column-resizer/react'
import { ReactNode } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { NoSession, useMercoaSession } from '../../../../components'
import { PayableDetailsViewMode } from '../../hooks/use-payable-details'
import { PayableDetailsProvider } from '../../providers/payables-detail-provider'
import { PayableDocument } from '../payable-document'
import { PayableForm } from '../payable-form'

export type PayableDetailsHandlers = {
  onInvoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  onCounterpartyPreSubmit?: (
    counterparty: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onInvoiceUpdate?: (invoice: Mercoa.InvoiceResponse | undefined) => void
  onInvoiceSubmit?: (resp: Mercoa.InvoiceResponse) => void
  onOcrComplete?: (ocr: Mercoa.OcrResponse) => void
}

//data options
export type PayableDetailsQueryOptions = {
  invoiceId: string
  invoice?: Mercoa.InvoiceResponse
  invoiceType: 'invoice' | 'invoiceTemplate'
}

// functional options
export type PayableDetailsConfig = {
  supportedCurrencies?: Mercoa.CurrencyCode[]
}

// display options
export type PayableDetailsDisplayOptions = {
  heightOffset?: number
  documentPosition?: 'right' | 'left' | 'none'
}

export type PayableDetailsRenderCustom = {
  toast?: {
    success: (message: string) => void
    error: (message: string) => void
  }
}

export type PayableDetailsProps = {
  queryOptions?: PayableDetailsQueryOptions
  handlers?: PayableDetailsHandlers
  config?: PayableDetailsConfig
  displayOptions?: PayableDetailsDisplayOptions
  renderCustom?: PayableDetailsRenderCustom
  children?: ReactNode
}

export function PayableDetails({
  queryOptions,
  handlers,
  config,
  displayOptions,
  renderCustom,
  children,
}: {
  queryOptions?: PayableDetailsQueryOptions
  handlers?: PayableDetailsHandlers
  config?: PayableDetailsConfig
  displayOptions?: PayableDetailsDisplayOptions
  renderCustom?: {
    toast?: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
  children?: JSX.Element | JSX.Element[]
}) {
  const mercoaSession = useMercoaSession()
  const { onInvoicePreSubmit, onCounterpartyPreSubmit, onInvoiceUpdate, onInvoiceSubmit, onOcrComplete } =
    handlers ?? {}
  let { invoiceId, invoiceType, invoice } = queryOptions ?? {}
  const { heightOffset, documentPosition = 'left' } = displayOptions ?? {}
  const { toast } = renderCustom ?? {}
  const { supportedCurrencies } = config ?? {}

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
              onInvoicePreSubmit: onInvoicePreSubmit,
              onCounterpartyPreSubmit: onCounterpartyPreSubmit,
              onInvoiceUpdate: onInvoiceUpdate,
              onInvoiceSubmit: onInvoiceSubmit,
              onOcrComplete: onOcrComplete,
            },
            toast: renderCustom?.toast ?? toast,
            supportedCurrencies: supportedCurrencies,
            layoutConfig: {
              heightOffset: heightOffset ?? mercoaSession.heightOffset,
              documentPosition: documentPosition ?? 'left',
            },
          }}
        >
          {children}
        </PayableDetailsProvider>
      )
    }
  } else {
    leftComponent = <PayableDocument />
    rightComponent = <PayableForm />
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
          onInvoicePreSubmit: onInvoicePreSubmit,
          onCounterpartyPreSubmit: onCounterpartyPreSubmit,
          onInvoiceUpdate: onInvoiceUpdate,
          onInvoiceSubmit: onInvoiceSubmit,
          onOcrComplete: onOcrComplete,
        },
        toast: renderCustom?.toast ?? toast,
        supportedCurrencies: supportedCurrencies,
        layoutConfig: {
          heightOffset: heightOffset ?? mercoaSession.heightOffset,
          documentPosition: documentPosition ?? 'left',
        },
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
