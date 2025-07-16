import useResizeObserver from '@react-hook/resize-observer'
import dayjs from 'dayjs'
import { useLayoutEffect, useRef, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../../../../../../../src/lib/currency'
import { MercoaInput, usePayableDetails } from '../../../../../../components'
import { isSupportedScheduleDate, isWeekday } from '../../../../../../lib/scheduling'
import { afterApprovedStatus, afterScheduledStatus } from '../../constants'
import { PrintDescriptionOnCheckRemittanceSwitch } from './print-description-on-check-remittance-switch'

// export type PayableOverviewChildrenProps = {
//   readOnly?: boolean
//   amount?: number
//   setAmount?: (amount: number) => void
//   supportedCurrencies?: Array<Mercoa.CurrencyCode>
//   currency?: Mercoa.CurrencyCode
//   setCurrency?: (currency: Mercoa.CurrencyCode) => void
//   dueDate?: Date
//   setDueDate?: (dueDate: Date) => void
//   invoiceDate?: Date
//   setInvoiceDate?: (invoiceDate: Date) => void
//   supportedSchedulePaymentDates?: Array<'Weekend' | 'Past' | 'Holiday'>
//   schedulePaymentDate?: Date
//   setSchedulePaymentDate?: (schedulePaymentDate: Date) => void
//   invoiceNumber?: string
//   setInvoiceNumber?: (invoiceNumber: string) => void
//   description?: string
//   setDescription?: (description: string) => void
// }

export function PayableOverview({
  readOnly,
  supportedSchedulePaymentDates,
}: {
  readOnly?: boolean
  supportedSchedulePaymentDates?: Array<'Weekend' | 'Past' | 'Holiday'>
}) {
  const { formContextValue, dataContextValue } = usePayableDetails()
  const { formMethods, overviewContextValue, lineItemsContextValue } = formContextValue
  const { currency, supportedCurrencies: finalSupportedCurrencies } = overviewContextValue
  const { lineItems } = lineItemsContextValue
  const { invoice } = dataContextValue

  const {
    register,
    control,
    formState: { errors },
    watch,
  } = formMethods

  const status = watch('status')
  const paymentDestinationType = watch('paymentDestinationType')
  const paymentSourceType = watch('paymentSourceType')

  const notDraft = !!status && status !== Mercoa.InvoiceStatus.Draft

  function isInvoiceNumberEditable(invoice?: Mercoa.InvoiceResponse) {
    if (!invoice) return true
    if (invoice.status === 'SCHEDULED' && invoice.recurringTemplateId) return true
    if (notDraft) return false
    return true
  }

  const useWidth = (target: any) => {
    const [width, setWidth] = useState<number>(0)

    useLayoutEffect(() => {
      if (target.current) {
        setWidth(target.current.getBoundingClientRect().width)
      }
    }, [target])

    useResizeObserver(target, (entry) => setWidth(entry.contentRect.width))
    return width
  }

  const wrapperDiv = useRef(null)
  const width = useWidth(wrapperDiv)

  let formCols = 'mercoa-grid-cols-1'
  if (width && width > 300) {
    formCols = 'mercoa-grid-cols-2'
  }
  if (width && width > 500) {
    formCols = 'mercoa-grid-cols-3'
  }
  if (width && width > 700) {
    formCols = 'mercoa-grid-cols-4'
  }
  if (width && width > 900) {
    formCols = 'mercoa-grid-cols-5'
  }
  return (
    <div className={`mercoa-grid ${formCols} mercoa-col-span-full md:mercoa-gap-4 mercoa-gap-2`} ref={wrapperDiv}>
      <label
        htmlFor="vendor-name"
        className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mb-2 mercoa-col-span-full"
      >
        Invoice Details
      </label>

      {/*  INVOICE NUMBER */}
      <MercoaInput
        optional
        register={register}
        name="invoiceNumber"
        label="Invoice #"
        type="text"
        readOnly={readOnly || !isInvoiceNumberEditable(invoice)}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
      />

      <MercoaInput
        control={control}
        name="amount"
        label="Amount"
        type="currency"
        readOnly={readOnly || notDraft || lineItems.length > 0}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>}
        trailingIcon={
          <>
            <label htmlFor="currency" className="mercoa-sr-only">
              Currency
            </label>
            <select
              {...register('currency')}
              className="mercoa-h-full mercoa-rounded-mercoa mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            >
              {finalSupportedCurrencies.map((option: Mercoa.CurrencyCode, index: number) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </>
        }
        errors={lineItems.length > 0 ? undefined : errors}
      />

      {/*  INVOICE DATE */}
      <MercoaInput
        name="invoiceDate"
        label="Invoice Date"
        placeholder="Invoice Date"
        type="date"
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        control={control}
        errors={errors}
      />

      {/*  DUE DATE */}
      <MercoaInput
        name="dueDate"
        label="Due Date"
        placeholder="Due Date"
        type="date"
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        control={control}
        errors={errors}
      />

      {/*  SCHEDULED PAYMENT DATE */}
      <MercoaInput
        name="deductionDate"
        label="Scheduled Payment Date"
        placeholder="Scheduled Payment Date"
        type="date"
        readOnly={readOnly || (!!status && afterScheduledStatus.includes(status))}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        control={control}
        errors={errors}
        dateOptions={
          paymentDestinationType === Mercoa.PaymentMethodType.OffPlatform ||
          paymentSourceType === Mercoa.PaymentMethodType.OffPlatform
            ? undefined
            : {
                minDate: !supportedSchedulePaymentDates?.includes('Past') ? dayjs().toDate() : undefined,
                filterDate: supportedSchedulePaymentDates
                  ? isSupportedScheduleDate(supportedSchedulePaymentDates)
                  : isWeekday,
              }
        }
      />

      {/*  DESCRIPTION */}
      <div className="mercoa-col-span-full">
        <label
          htmlFor="description"
          className="mercoa-flex mercoa-justify-between mercoa-items-center mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 "
        >
          Description
          <PrintDescriptionOnCheckRemittanceSwitch />
        </label>
        <div className="mercoa-mt-2">
          <textarea
            id="description"
            readOnly={readOnly || (!!status && afterApprovedStatus.includes(status))}
            {...register('description')}
            rows={3}
            className="mercoa-block mercoa-w-full mercoa-rounded-mercoa mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
            defaultValue={''}
          />
        </div>
      </div>
    </div>
  )
}
