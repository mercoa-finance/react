import { createContext, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { ReceivableFormAction } from '../constants'
import { ReceivableDetailsProps, useReceivableDetailsInternal } from '../hooks/use-receivable-details-internal'

export type ReceivablePaymentMethodContext = {
  setMethodOnTypeChange: (paymentMethodType: Mercoa.PaymentMethodType | string, type: 'source' | 'destination') => void
  sourcePaymentMethods: Mercoa.PaymentMethodResponse[] | undefined
  destinationPaymentMethods: Mercoa.PaymentMethodResponse[] | undefined
  selectedSourcePaymentMethodId: string | undefined
  selectedDestinationPaymentMethodId: string | undefined
  setSelectedSourcePaymentMethodId: (paymentMethodId: string) => void
  setSelectedDestinationPaymentMethodId: (paymentMethodId: string) => void
  availableSourceTypes: Array<{ key: string; value: string }>
  selectedSourceType: Mercoa.PaymentMethodType | undefined
  setSelectedSourceType: (type: Mercoa.PaymentMethodType) => void
  availableDestinationTypes: Array<{ key: string; value: string }>
  selectedDestinationType: Mercoa.PaymentMethodType | undefined
  setSelectedDestinationType: (type: Mercoa.PaymentMethodType) => void
  paymentLink: string | undefined
}

export type ReceivableDetailsContextValue = {
  formContextValue: ReceivableFormContext
  dataContextValue: ReceivableDataContext
  propsContextValue: ReceivableDetailsProps
}

export type ReceivableFormContext = {
  formMethods: UseFormReturn<any>
  handleFormSubmit: (data: any) => void
  formLoading: boolean
  handleActionClick: (action: ReceivableFormAction) => void
  paymentMethodContextValue: ReceivablePaymentMethodContext
  payerContextValue: ReceivablePayerContext
}

export type ReceivableDataContext = {
  receivableData: Mercoa.InvoiceResponse | undefined
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
}

export type ReceivablePayerContext = {
  selectedPayer: Mercoa.EntityResponse | undefined
  setSelectedPayer: (payer: Mercoa.EntityResponse | undefined) => void
}

export const ReceivableDetailsContext = createContext<ReceivableDetailsContextValue | undefined>(undefined)

export const ReceivableDetailsProvider = ({
  children,
  receivableDetailsProps,
}: {
  children: ReactNode
  receivableDetailsProps: ReceivableDetailsProps
}) => {
  const contextValue = useReceivableDetailsInternal(receivableDetailsProps)

  return <ReceivableDetailsContext.Provider value={contextValue}>{children}</ReceivableDetailsContext.Provider>
}
