import { Bar, Container, Section } from '@column-resizer/react'
import { toast } from 'react-toastify'
import { NoSession, useMercoaSession } from '../../../../components'
import { PayableDetailsProvider } from '../../providers/payable-detail-provider'
import { PayableDetailsProps } from '../../types'
import { PayableDocument } from '../payable-document'
import { PayableForm } from '../payable-form'

export function PayableDetails({
  queryOptions,
  handlers,
  config,
  displayOptions,
  renderCustom = {
    toast: {
      success: (message: string) => {
        toast.success(message)
      },
      error: (message: string) => {
        toast.error(message)
      },
      info: (message: string) => {
        toast.info(message)
      },
    },
  },
  children,
}: PayableDetailsProps) {
  const mercoaSession = useMercoaSession()
  let { invoiceId, invoiceType, invoice } = queryOptions ?? {}
  const { heightOffset = 0, documentPosition = 'left', formLayout, paymentMethods } = displayOptions ?? {}
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
            queryOptions: { invoiceId: invoiceId ?? '', invoiceType },
            displayOptions: {
              heightOffset: heightOffset ?? mercoaSession.heightOffset,
              documentPosition: documentPosition ?? 'left',
              formLayout: formLayout,
              paymentMethods: paymentMethods,
            },
            handlers,
            config,
            renderCustom,
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
        queryOptions: { invoiceId: invoice?.id ?? invoiceId ?? '', invoiceType },
        handlers,
        renderCustom,
        config: {
          ...config,
          supportedCurrencies: supportedCurrencies,
        },
        displayOptions: {
          heightOffset: heightOffset ?? mercoaSession.heightOffset,
          documentPosition: documentPosition,
          formLayout: formLayout,
          paymentMethods: paymentMethods,
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
