import classNames from 'classnames'
import { ReactElement } from 'react'
import { FormProvider, UseFormReturn } from 'react-hook-form'
import { NoSession, useMercoaSession } from '../../../../components'
import { usePayableDetailsContext } from '../../providers/payables-detail-provider'
import { PayableActions } from './components/payable-actions'
import { PayableApprovers } from './components/payable-approvers'
import { PayableComments } from './components/payable-comments'
import { PayableCounterpartySearch } from './components/payable-counterparty-search/payable-counterparty-search'
import { PayableFormHeader } from './components/payable-form-header'
import { PayableLineItems } from './components/payable-line-items/payable-line-items'
import { PayableMetadata } from './components/payable-metadata'
import { PayableOverview } from './components/payable-overview/payable-overview'
import {
  PayableFees,
  PayablePaymentDestination,
  PayablePaymentSource,
  PaymentDestinationProcessingTime,
} from './components/payable-payment'
import { PayableRecurringSchedule } from './components/payable-recurring-schedule'
import { PayableTaxAndShipping } from './components/payable-tax-and-shipping/payable-tax-and-shipping'
import { PayableAction } from './constants'
import { PayableFormData } from './types'

export function PayableFormV2({ children }: { children?: ReactElement }) {
  const mercoaSession = useMercoaSession()
  const {
    invoiceType,
    height,
    formMethods,
    handleFormAction,
    selectedVendor,
    setSelectedVendor,
    formActionLoading,
    refreshInvoice,
  } = usePayableDetailsContext()

  const { handleSubmit } = formMethods as UseFormReturn<any>

  if (!mercoaSession.client) return <NoSession componentName="PayableForm" />

  return (
    <div style={{ height: `${height}px` }} className="mercoa-overflow-auto mercoa-pr-2 mercoa-pb-32">
      <FormProvider {...formMethods}>
        <form
          id="payable-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit((data: PayableFormData) => handleFormAction(data, data.formAction as PayableAction))()
          }}
          className={classNames(
            `mercoa-grid-cols-3 mercoa-mt-6 mercoa-grid md:mercoa-gap-x-6 md:mercoa-gap-y-4 mercoa-gap-2 mercoa-p-0.5`,
          )}
        >
          {children ? (
            <>{children}</>
          ) : (
            <>
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableFormHeader /> <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableCounterpartySearch onSelect={setSelectedVendor} counterparty={selectedVendor} />{' '}
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableOverview />
              <PayableLineItems />
              {mercoaSession.entityCustomizations?.ocr &&
                !mercoaSession.entityCustomizations?.ocr.taxAndShippingAsLineItems && <PayableTaxAndShipping />}
              <PayableMetadata /> <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              {mercoaSession.entity?.id && (
                <>
                  <PayablePaymentSource />
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                  <PayablePaymentDestination />
                  <PaymentDestinationProcessingTime />
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                  <PayableFees />
                  {invoiceType === 'invoiceTemplate' && <PayableRecurringSchedule />}
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                  <PayableApprovers />
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                </>
              )}
              <PayableComments />
              <PayableActions
                submitForm={() =>
                  handleSubmit((data: PayableFormData) => handleFormAction(data, data.formAction as PayableAction))()
                }
                refreshInvoice={refreshInvoice}
                invoiceType={invoiceType}
                actionLoading={formActionLoading}
              />
            </>
          )}
        </form>
      </FormProvider>
    </div>
  )
}
