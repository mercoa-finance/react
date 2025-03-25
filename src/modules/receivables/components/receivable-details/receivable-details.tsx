import { Bar, Container, Section } from '@column-resizer/react'
import { FC, PropsWithChildren } from 'react'
import { toast } from 'react-toastify'
import { NoSession, useMercoaSession } from '../../../../components'
import { ReceivableDetailsProvider } from '../../providers/receivable-detail-provider'
import { ReceivableDetailsProps } from '../../types'
import { ReceivableForm } from '../receivable-form/receivable-form'
import InvoicePreview from '../receivable-preview/receivable-preview'

export const ReceivableDetails: FC<PropsWithChildren<ReceivableDetailsProps>> = ({
  queryOptions,
  config,
  handlers,
  displayOptions = {
    documentPosition: 'left',
  },
  renderCustom = {
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
  },
  children,
}) => {
  const { documentPosition = 'left', heightOffset = 0 } = displayOptions ?? {}
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
        queryOptions,
        config,
        handlers,
        renderCustom,
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
