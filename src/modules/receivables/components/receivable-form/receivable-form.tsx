import { XCircleIcon } from '@heroicons/react/24/outline'
import { ReactNode } from 'react'
import { FieldErrors, FormProvider, useFieldArray, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import {
  CounterpartySearch,
  InvoiceStatusPill,
  MercoaButton,
  MercoaInput,
  NoSession,
  useMercoaSession,
} from '../../../../components'
import { currencyCodeToSymbol } from '../../../../lib/currency'
import { useReceivableDetails } from '../../hooks/use-receivable-details'
import { ReceivableActions } from './components/receivable-actions'
import { ReceivablePaymentDestination } from './components/receivable-payment-destination'
import { ReceivablePaymentSource } from './components/receivable-payment-source'

export type ReceivableFormChildrenProps = {
  invoice?: Mercoa.InvoiceResponse
  refreshInvoice?: (invoiceId: Mercoa.InvoiceId) => void
  setSelectedPayer: (e?: Mercoa.CounterpartyResponse) => void
  selectedPayer?: Mercoa.CounterpartyResponse
  setValue: UseFormSetValue<Mercoa.InvoiceCreationRequest>
  watch: UseFormWatch<Mercoa.InvoiceCreationRequest>
  errors: FieldErrors<Mercoa.InvoiceCreationRequest>
}

export function ReceivableForm({ children }: { children?: ReactNode }) {
  const mercoaSession = useMercoaSession()
  const { formContextValue, dataContextValue, propsContextValue } = useReceivableDetails()
  const { formMethods, handleFormSubmit, payerContextValue } = formContextValue
  const { receivableData: invoice } = dataContextValue
  const { selectedPayer, setSelectedPayer } = payerContextValue
  const { config } = propsContextValue
  const { supportedCurrencies, disableCustomerCreation } = config ?? {}

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const currency = watch('currency')
  const notDraft = invoice?.status && invoice?.status !== Mercoa.InvoiceStatus.Draft

  // Reset currency dropdown

  if (!mercoaSession.client) return <NoSession componentName="ReceivableForm" />
  return (
    <FormProvider {...formMethods}>
      <div className={`mercoa-p-2 mercoa-pb-32 mercoa-mx-4 mercoa-relative`}>
        <h2 className="mercoa-text-lg mercoa-font-bold mercoa-leading-7 mercoa-text-gray-900">
          Edit Invoice{' '}
          {invoice && (
            <InvoiceStatusPill
              status={invoice.status ?? 'DRAFT'}
              failureType={invoice.failureType}
              amount={invoice.amount}
              payerId={invoice.payerId}
              vendorId={invoice.vendorId}
              dueDate={invoice.dueDate}
              paymentSourceId={invoice.paymentSourceId}
              paymentDestinationId={invoice.paymentDestinationId}
              type="receivable"
            />
          )}
        </h2>
        <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-4 mercoa-items-center mercoa-mt-10 mercoa-w-full">
          {/*  VENDOR SEARCH */}
          <div className="sm:mercoa-col-span-3">
            <label
              htmlFor="vendor-name"
              className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700"
            >
              Customer
            </label>

            <div className="mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-justify-left mercoa-w-full">
              <CounterpartySearch
                type="payor"
                onSelect={(payer) => {
                  mercoaSession.debug({ payer })
                  if (!payer || payer.id === 'new') return
                  setSelectedPayer(payer)
                  setValue('payerId', payer?.id ?? undefined, { shouldTouch: true, shouldDirty: true })
                  setValue('payerName', payer?.name ?? undefined, { shouldTouch: true, shouldDirty: true })
                  clearErrors('payerId')
                }}
                counterparty={selectedPayer}
                disableCreation={disableCustomerCreation}
                readOnly={notDraft}
              />
            </div>
            {errors.payerId?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors.payerId?.message.toString()}</p>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="mercoa-mt-5 mercoa-grid mercoa-grid-cols-3 mercoa-items-center mercoa-gap-4 mercoa-p-0.5">
            {/*  INVOICE DATE */}
            <MercoaInput
              name="invoiceDate"
              label="Invoice Date"
              placeholder="Invoice Date"
              type="date"
              className="sm:mercoa-col-span-1"
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
              className="sm:mercoa-col-span-1"
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
              className="sm:mercoa-col-span-1"
              readOnly={notDraft}
            />
          </div>

          {/*  GRAY border  */}
          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

          <div>
            <p className="mercoa-mt-6 mercoa-text-lg">Line Items</p>
            <div className="mercoa-min-w-full">
              <div className="mercoa-mt-2 mercoa-grid mercoa-grid-cols-1 mercoa-gap-4">
                {/* Line Items */}
                {fields.map((field, index) => (
                  <div key={field.id}>
                    <div className="mercoa-grid mercoa-grid-cols-[2fr_1fr_1fr_1fr_18px] mercoa-gap-2 mercoa-mb-1">
                      <div>
                        <MercoaInput
                          label="Name"
                          name={`lineItems.${index}.name`}
                          errors={errors}
                          register={register}
                          placeholder="Item Name"
                          readOnly={notDraft}
                        />
                      </div>
                      <div>
                        <MercoaInput
                          label="Quantity"
                          name={`lineItems.${index}.quantity`}
                          errors={errors}
                          register={register}
                          placeholder="Quantity"
                          type="number"
                          readOnly={notDraft}
                        />
                      </div>
                      <div>
                        <MercoaInput
                          label="Unit Price"
                          name={`lineItems.${index}.unitPrice`}
                          errors={errors}
                          control={control}
                          placeholder="Unit Price"
                          type="currency"
                          leadingIcon={
                            <span className="mercoa-text-gray-500 sm:mercoa-text-sm">
                              {currencyCodeToSymbol(currency)}
                            </span>
                          }
                          readOnly={notDraft}
                        />
                      </div>
                      <div>
                        <MercoaInput
                          label="Total Amount"
                          name={`lineItems.${index}.amount`}
                          errors={errors}
                          control={control}
                          placeholder="Total Amount"
                          readOnly
                          type="currency"
                          leadingIcon={
                            <span className="mercoa-text-gray-500 sm:mercoa-text-sm">
                              {currencyCodeToSymbol(currency)}
                            </span>
                          }
                        />
                      </div>
                      {!notDraft && (
                        <div className="mercoa-flex mercoa-items-center">
                          <XCircleIcon
                            className="mercoa-size-5 mercoa-cursor-pointer mercoa-text-gray-500 mercoa-mt-[28px]"
                            onClick={() => remove(index)}
                          />
                        </div>
                      )}
                    </div>
                    {watch(`lineItems.${index}.showDescription`) ? (
                      <>
                        <div className="mercoa-grid mercoa-grid-cols-[1fr_18px] mercoa-gap-2">
                          <MercoaInput
                            label="Description"
                            name={`lineItems.${index}.description`}
                            errors={errors}
                            register={register}
                            placeholder="Description"
                            type="text"
                          />
                        </div>
                        {!notDraft && (
                          <div
                            className="mercoa-text-sm mercoa-text-gray-500 mercoa-cursor-pointer mercoa-mt-1 hover:mercoa-text-gray-700"
                            onClick={() => {
                              setValue(`lineItems.${index}.showDescription`, false)
                              setValue(`lineItems.${index}.description`, '')
                            }}
                          >
                            - Remove description
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {!notDraft && (
                          <div
                            className="mercoa-text-sm mercoa-text-gray-500 mercoa-cursor-pointer mercoa-mt-1 hover:mercoa-text-gray-700"
                            onClick={() => setValue(`lineItems.${index}.showDescription`, true)}
                          >
                            + Add description (optional)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Line Item Button */}
              <div className={`${fields.length > 0 ? 'mercoa-mt-4' : ''}`}>
                {!notDraft && (
                  <MercoaButton
                    type="button"
                    isEmphasized
                    size="md"
                    onClick={() =>
                      append({
                        id: 'new',
                        description: '',
                        quantity: 1,
                        unitPrice: 0,
                        amount: 0,
                        currency: 'USD',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        showDescription: false,
                      })
                    }
                  >
                    + Add Line Item
                  </MercoaButton>
                )}
              </div>
            </div>
            <div className="mercoa-mt-5 mercoa-flex mercoa-gap-4 mercoa-items-start mercoa-p-0.5">
              <div className="mercoa-max-w-[150px] mercoa-flex-1">
                <MercoaInput
                  name="amount"
                  label="Total Amount"
                  type="currency"
                  readOnly
                  errors={errors}
                  control={control}
                  leadingIcon={
                    <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
                  }
                  trailingIcon={
                    <>
                      <label htmlFor="currency" className="mercoa-sr-only">
                        Currency
                      </label>
                      <select
                        {...register('currency')}
                        disabled={notDraft}
                        className="mercoa-h-full mercoa-rounded-mercoa mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                      >
                        {supportedCurrencies?.map((option: Mercoa.CurrencyCode, index: number) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  }
                />
              </div>
              {/*  DESCRIPTION */}
              <div className="mercoa-flex-1">
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
          </div>

          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />
          <ReceivablePaymentSource />
          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />
          <ReceivablePaymentDestination />
          <ReceivableActions />
        </form>
      </div>
    </FormProvider>
  )
}
