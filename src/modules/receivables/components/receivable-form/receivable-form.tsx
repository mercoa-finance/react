import useResizeObserver from '@react-hook/resize-observer'
import accounting from 'accounting'
import { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import {
  CounterpartiesSearch,
  InvoiceStatusPill,
  MercoaInput,
  NoSession,
  useMercoaSession,
} from '../../../../components'
import { currencyCodeToSymbol } from '../../../../lib/currency'
import { useReceivableDetails } from '../../hooks/use-receivable-details'
import { LineItems } from './components/line-items'
import { ReceivableActions } from './components/receivable-actions'
import { ReceivablePaymentDestination } from './components/receivable-payment-destination'
import { ReceivablePaymentSource } from './components/receivable-payment-source'
import { ReceivableRecurringSchedule } from './components/receivable-recurring-schedule'

export function ReceivableForm({ children }: { children?: ReactNode }) {
  const mercoaSession = useMercoaSession()
  const { formContextValue, dataContextValue, propsContextValue, displayContextValue } = useReceivableDetails()
  const { formMethods, handleFormSubmit, payerContextValue } = formContextValue
  const { invoice, invoiceType, refreshInvoice } = dataContextValue
  const { selectedPayer, setSelectedPayer } = payerContextValue
  const { config } = propsContextValue
  const { supportedCurrencies, disableCustomerCreation } = config ?? {}
  const { height } = displayContextValue
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    setFocus,
    control,
    formState: { errors },
  } = formMethods

  const useWidth = (target: any) => {
    const [width, setWidth] = useState<number>(0)

    useLayoutEffect(() => {
      if (target.current) {
        setWidth(target.current.getBoundingClientRect().width)
      }
    }, [target])

    useResizeObserver(target, (entry: any) => setWidth(entry.contentRect.width))
    return width
  }

  const wrapperDiv = useRef(null)
  const width = useWidth(wrapperDiv)

  const currency = watch('currency')
  const notDraft = !!(invoice?.status && invoice?.status !== Mercoa.InvoiceStatus.Draft)

  function isInvoiceNumberEditable(invoice?: Mercoa.InvoiceResponse) {
    if (!invoice) return true
    if (invoice.status === 'SCHEDULED' && invoice.recurringTemplateId) return true
    if (notDraft) return false
    return true
  }

  let formCols = 'mercoa-grid-cols-1'
  if (width && width > 300) {
    formCols = 'mercoa-grid-cols-2'
  }
  if (width && width > 400) {
    formCols = 'mercoa-grid-cols-3'
  }

  if (!mercoaSession.client) return <NoSession componentName="ReceivableForm" />
  return (
    <div style={{ height: `${height}px` }} className="mercoa-overflow-auto mercoa-px-0.5 mercoa-pb-32">
      <FormProvider {...formMethods}>
        <div className={`mercoa-p-2 mercoa-pb-32 mercoa-mx-4 mercoa-relative`}>
          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full mercoa-my-4" />

          {/* Receivable Form Header */}
          <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
            Edit Invoice{' '}
            <InvoiceStatusPill
              status={invoice?.status ?? 'DRAFT'}
              failureType={invoice?.failureType}
              amount={invoice?.amount}
              payerId={invoice?.payerId}
              vendorId={invoice?.vendorId}
              dueDate={invoice?.dueDate}
              paymentSourceId={invoice?.paymentSourceId}
              paymentDestinationId={invoice?.paymentDestinationId}
              type="receivable"
            />
          </h2>
          {invoice && (
            <p className="mercoa-col-span-full mercoa-text-xs mercoa-leading-6 mercoa-text-gray-400 mercoa-select-all mercoa-mt-4">
              {invoice.id}
            </p>
          )}

          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full mercoa-my-4" />

          <div className={`mercoa-grid ${formCols} mercoa-gap-4 mercoa-items-center mercoa-w-full`}>
            {/*  VENDOR SEARCH */}
            <div className="mercoa-col-span-full">
              <label
                htmlFor="vendor-name"
                className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700"
              >
                Customer
              </label>

              <div className="mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-justify-left mercoa-w-full">
                <CounterpartiesSearch
                  config={{
                    type: 'payor',
                    selectedCounterparty: selectedPayer,
                    disableCreation: disableCustomerCreation,
                    readOnly: notDraft,
                  }}
                  handlers={{
                    onCounterpartySelect: (payer) => {
                      mercoaSession.debug({ payer })
                      if (!payer || payer.id === 'new') return
                      setSelectedPayer(payer)
                      setValue('payerId', payer?.id ?? undefined, { shouldTouch: true, shouldDirty: true })
                      setValue('payerName', payer?.name ?? undefined, { shouldTouch: true, shouldDirty: true })
                      clearErrors('payerId')
                    },
                  }}
                />
              </div>
              {errors.payerId?.message && (
                <p className="mercoa-text-sm mercoa-text-red-500">{errors.payerId?.message.toString()}</p>
              )}
            </div>
          </div>

          {/* TODO: Make the ReceivableForm frontend markup match the PayableForm frontend markup */}
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {invoiceType === 'invoiceTemplate' && (
              <>
                <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full mercoa-my-6" />
                <ReceivableRecurringSchedule />
                <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full mercoa-my-6" />
              </>
            )}

            <div
              className={`mercoa-grid ${formCols} mercoa-mt-5 mercoa-items-center mercoa-gap-4 mercoa-p-0.5`}
              ref={wrapperDiv}
            >
              {/*  INVOICE DATE */}
              <MercoaInput
                name="invoiceDate"
                label="Invoice Date"
                placeholder="Invoice Date"
                type="date"
                className="md:mercoa-col-span-1 mercoa-col-span-full"
                control={control}
                errors={errors}
                readOnly={notDraft}
              />

              {/*  DUE DATE */}
              <MercoaInput
                name="dueDate"
                label="Due Date"
                placeholder="Due Date"
                type="date"
                className="md:mercoa-col-span-1 mercoa-col-span-full"
                control={control}
                errors={errors}
                readOnly={notDraft}
              />

              {/*  INVOICE NUMBER */}
              <MercoaInput
                optional
                errors={errors}
                register={register}
                name="invoiceNumber"
                label="Invoice #"
                type="text"
                className="md:mercoa-col-span-1 mercoa-col-span-full"
                readOnly={!isInvoiceNumberEditable(invoice)}
              />
            </div>

            {/*  GRAY border  */}
            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

            <LineItems
              control={control}
              register={register}
              setValue={setValue}
              watch={watch}
              notDraft={notDraft}
              currency={currency}
            />

            <div className={`mercoa-grid ${formCols} mercoa-mt-5 mercoa-gap-4 mercoa-items-start mercoa-p-0.5`}>
              <div className="mercoa-col-span-full">
                <label className="mercoa-block mercoa-text-right mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
                  Total Amount
                </label>
                <div className="mercoa-mt-1 mercoa-flex mercoa-items-center mercoa-justify-end">
                  <div className="mercoa-text-right mercoa-text-lg mercoa-font-semibold mercoa-text-gray-900">
                    {accounting.formatMoney(watch('amount') || 0, currencyCodeToSymbol(currency))}
                  </div>
                </div>
              </div>
              {/*  DESCRIPTION */}
              <div className="mercoa-col-span-full">
                <label
                  htmlFor="description"
                  className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 "
                >
                  Internal Notes
                </label>
                <div className="mercoa-mt-1">
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    className="mercoa-block mercoa-w-full mercoa-rounded-mercoa mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
                    style={{ height: '36px' }}
                    defaultValue={''}
                  />
                </div>
              </div>
            </div>

            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />
            <ReceivablePaymentSource />
            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />
            <ReceivablePaymentDestination />
            <ReceivableActions />
          </form>
        </div>
      </FormProvider>
    </div>
  )
}
