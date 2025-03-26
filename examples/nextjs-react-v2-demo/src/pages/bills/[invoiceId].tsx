import * as React from 'react'
import {
  MercoaButton,
  PayableLineItems,
  PayableDetails,
  PayableDocument,
  PayableFormHeader,
  PayableForm,
  PayableCounterpartySearch,
  PayableOverview,
  PayableTaxAndShipping,
  PayableMetadata,
  PayableActions,
  PayableApprovers,
  PayableComments,
  PayableFees,
  PayablePaymentDestination,
  PayablePaymentSource,
  PaymentDestinationProcessingTime,
  useMercoaSession,
} from '@mercoa/react'
import { useRouter } from 'next/router'

export default function Bills() {
  const router = useRouter()
  const mercoaSession = useMercoaSession()

  const invoiceIdParam = router.query.invoiceId as string

  let invoiceId: string | undefined = invoiceIdParam

  // If the page router is set to "new", we should set the invoiceId to undefined
  // so that the component renders a blank invoice creation page
  if (invoiceIdParam === 'new') {
    invoiceId = undefined
  }

  return (
    <div className="container m-auto mt-10">
      <MercoaButton
        isEmphasized={false}
        type="button"
        className="ml-2 inline-flex text-sm"
        onClick={() => {
          router.push(`/bills`)
        }}
      >
        Back
      </MercoaButton>
      <PayableDetails
        queryOptions={{
          invoiceId: invoiceId,
          invoiceType: 'invoice',
        }}
        handlers={{
          onInvoiceUpdate: (invoice) => {
            if (!invoice) {
              router.push(`/dashboard/payers/${entityId}`)
              return
            }
          },
          onCounterpartyPreSubmit: async (counterparty, counterpartyId) => {
            console.log('counterparty', counterparty)
            return counterparty
          },
          onInvoicePreSubmit: async (invoice) => {
            console.log('invoice', invoice)
            return invoice
          },
          onOcrComplete: (ocr) => {
            console.log('ocr', ocr)
            return ocr
          },
        }}
        config={{
          supportedCurrencies: ['USD'],
          disableCounterpartyCreation: false,
        }}
        displayOptions={{
          heightOffset: 250,
          documentPosition: 'left',
        }}
        // a single custom component which internally uses both document and form can also be passed
        children={[
          <PayableDocument key="document" />,
          <PayableForm key="form">
            <div className="border-b border-gray-900/10 col-span-full" />
            <PayableFormHeader /> <div className="border-b border-gray-900/10 col-span-full" />
            <PayableCounterpartySearch />
            <PayableOverview />
            <PayableLineItems />
            {mercoaSession.entityCustomizations?.ocr &&
              !mercoaSession.entityCustomizations?.ocr.taxAndShippingAsLineItems && <PayableTaxAndShipping />}
            <PayableMetadata /> <div className="border-b border-gray-900/10 col-span-full" />
            {mercoaSession.entity?.id && (
              <>
                <PayablePaymentSource />
                <div className="border-b border-gray-900/10 col-span-full" />
                <PayablePaymentDestination />
                <PaymentDestinationProcessingTime />
                <div className="border-b border-gray-900/10 col-span-full" />
                <PayableFees />
                <div className="border-b border-gray-900/10 col-span-full" />
                <PayableApprovers />
                <div className="border-b border-gray-900/10 col-span-full" />
              </>
            )}
            <PayableComments />
            <PayableActions /> // additional actions can be added
          </PayableForm>,
        ]}
      />
    </div>
  )
}
