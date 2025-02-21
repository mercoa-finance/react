import { createContext, ReactNode, useContext } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { ReceivableAction } from '../constants'
import { useReceivableDetails, UseReceivableDetailsProps } from '../hooks/use-receivable-details'

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
  handleActionClick: (action: ReceivableAction) => void
  supportedCurrencies: Mercoa.CurrencyCode[] | undefined
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  disableCustomerCreation: boolean
  paymentLink: string | undefined
} & PaymentMethodContext

const ReceivableDetailsContext = createContext<ReceivableDetailsContextValue | undefined>(undefined)

export const ReceivableDetailsProvider = ({
  children,
  receivableDetailsProps,
}: {
  children: ReactNode
  receivableDetailsProps: UseReceivableDetailsProps
}) => {
  const contextValue = useReceivableDetails(receivableDetailsProps)

  return <ReceivableDetailsContext.Provider value={contextValue}>{children}</ReceivableDetailsContext.Provider>
}

export const useReceivableDetailsContext = () => {
  const context = useContext(ReceivableDetailsContext)
  if (!context) {
    throw new Error('useReceivableDetailsContext must be used within a ReceivableDetailsProvider')
  }
  return context
}
