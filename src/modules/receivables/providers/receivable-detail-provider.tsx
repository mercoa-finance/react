import { createContext, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { ReceivableFormAction } from '../constants'
import { useReceivableDetailsInternal, UseReceivableDetailsProps } from '../hooks/use-receivable-details-internal'

export type PaymentMethodContext = {
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
}

export type ReceivableDetailsContextValue = {
  receivableData: Mercoa.InvoiceResponse | undefined
  selectedPayer: Mercoa.EntityResponse | undefined
  setSelectedPayer: (payer: Mercoa.EntityResponse | undefined) => void
  formMethods: UseFormReturn<any>
  handleFormSubmit: (data: any) => void
  formLoading: boolean
  handleActionClick: (action: ReceivableFormAction) => void
  supportedCurrencies: Mercoa.CurrencyCode[] | undefined
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  disableCustomerCreation: boolean
  paymentLink: string | undefined
} & PaymentMethodContext

export const ReceivableDetailsContext = createContext<ReceivableDetailsContextValue | undefined>(undefined)

export const ReceivableDetailsProvider = ({
  children,
  receivableDetailsProps,
}: {
  children: ReactNode
  receivableDetailsProps: UseReceivableDetailsProps
}) => {
  const contextValue = useReceivableDetailsInternal(receivableDetailsProps)

  return <ReceivableDetailsContext.Provider value={contextValue}>{children}</ReceivableDetailsContext.Provider>
}
