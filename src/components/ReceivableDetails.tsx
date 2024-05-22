import { DocumentDuplicateIcon, EnvelopeIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import {
  CounterpartySearch,
  InvoiceStatusPill,
  MercoaButton,
  MercoaInput,
  SelectPaymentSource,
  useMercoaSession,
} from './index'

dayjs.extend(utc)

export function ReceivableDetails({
  invoiceId,
  invoice,
  onRedirect,
  admin,
  layout = 'left',
}: {
  invoiceId?: Mercoa.InvoiceId
  invoice?: Mercoa.InvoiceResponse
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  admin?: boolean
  layout?: 'right' | 'left'
}) {
  const mercoaSession = useMercoaSession()

  const [paymentMethodSchemas, setPaymentMethodSchemas] = useState<Array<Mercoa.CustomPaymentMethodSchemaResponse>>([])
  const [destinationPaymentMethods, setDestinationPaymentMethods] = useState<
    Mercoa.PaymentMethodResponse.BankAccount[]
  >([])
  const [sourcePaymentMethods, setSourcePaymentMethods] = useState<Mercoa.PaymentMethodResponse[]>([])
  const [invoiceLocal, setInvoice] = useState<Mercoa.InvoiceResponse | undefined>(invoice)
  const [selectedPayer, setSelectedPayer] = useState<Mercoa.EntityResponse | undefined>(invoice?.payer)
  const [supportedCurrencies, setSupportedCurrencies] = useState<Array<Mercoa.CurrencyCode>>([])

  const schema = yup
    .object({
      status: yup.string(),
      amount: yup.number().positive().required().typeError('Please enter a valid number'),
      invoiceNumber: yup.string(),
      description: yup.string(),
      dueDate: yup.date().required('Please select a due date').typeError('Please select a due date'),
      deductionDate: yup.date().typeError('Please select a deduction date'),
      invoiceDate: yup.date().required('Please select an invoice date').typeError('Please select an invoice date'),
      approvers: yup.mixed(),
      lineItems: yup.array().of(
        yup.object({
          id: yup.string(),
          description: yup.string().required(),
          amount: yup.number().required().typeError('Please enter a valid number'),
          currency: yup.string(),
          quantity: yup.number().required().typeError('Please enter a valid number'),
          unitPrice: yup.number().required().typeError('Please enter a valid number'),
          metadata: yup.mixed().nullable(),
          glAccountId: yup.string(),
          createdAt: yup.date(),
          updatedAt: yup.date(),
        }),
      ),
      currency: yup.string().required(),
      payerId: yup.string(),
      payerName: yup.string(),
      paymentDestinationId: yup.string(),
      paymentMethodDestinationType: yup.string(),
      paymentDestinationOptions: yup.mixed().nullable(),
      paymentSourceId: yup.string(),
      paymentMethodSourceType: yup.string(),
      saveAsDraft: yup.boolean(),
      saveAsAdmin: yup.boolean(),
      metadata: yup.mixed().nullable(),
      newBankAccount: yup.mixed().nullable(),
      newCheck: yup.mixed().nullable(),
    })
    .required()

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
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      status: invoice?.status,
      invoiceNumber: invoice?.invoiceNumber,
      amount: invoice?.amount,
      currency: invoice?.currency ?? 'USD',
      payerId: invoice?.payer?.id,
      payerName: invoice?.payer?.name,
      invoiceDate: invoice?.invoiceDate ? dayjs(invoice?.invoiceDate).toDate() : undefined,
      dueDate: invoice?.dueDate ? dayjs(invoice?.dueDate).toDate() : undefined,
      deductionDate: invoice?.deductionDate ? dayjs(invoice?.deductionDate).toDate() : undefined,
      lineItems: invoice?.lineItems ?? [],
      paymentDestinationId: invoice?.paymentDestination?.id,
      paymentMethodDestinationType: '',
      paymentDestinationOptions: invoice?.paymentDestinationOptions,
      paymentSourceId: invoice?.paymentSource?.id,
      paymentMethodSourceType: '',
      description: invoice?.noteToSelf ?? '',
      saveAsDraft: false,
      saveAsAdmin: false,
      metadata: JSON.stringify(invoice?.metadata ?? {}),
    },
  })

  useEffect(() => {
    if (!invoiceLocal?.id) return
    setValue('status', invoiceLocal?.status)
    setValue('invoiceNumber', invoiceLocal?.invoiceNumber)
    if (invoiceLocal?.amount) setValue('amount', invoiceLocal.amount)
    setValue('currency', invoiceLocal?.currency ?? 'USD')
    setValue('payerId', invoiceLocal?.payer?.id)
    setValue('payerName', invoiceLocal?.payer?.name)
    if (invoiceLocal?.invoiceDate) setValue('invoiceDate', dayjs(invoiceLocal.invoiceDate).toDate())
    if (invoiceLocal?.dueDate) setValue('dueDate', dayjs(invoiceLocal?.dueDate).toDate())
    setValue('deductionDate', invoiceLocal?.deductionDate ? dayjs(invoiceLocal?.deductionDate).toDate() : undefined)
    setValue(
      'lineItems',
      invoiceLocal?.lineItems?.map((lineItem) => ({
        description: lineItem.description ?? '',
        currency: lineItem.currency ?? 'USD',
        amount: lineItem.amount ?? 0,
        quantity: lineItem.quantity ?? 0,
        unitPrice: lineItem.unitPrice ?? 0,
        name: lineItem.name ?? '',
        metadata: lineItem.metadata ?? {},
        glAccountId: lineItem.glAccountId ?? '',
        id: lineItem.id ?? '',
        createdAt: lineItem.createdAt ?? new Date(),
        updatedAt: lineItem.updatedAt ?? new Date(),
      })) ?? [],
    )
    setValue('paymentDestinationId', invoiceLocal?.paymentDestination?.id)
    setValue('paymentMethodDestinationType', '')
    setValue('paymentDestinationOptions', invoiceLocal?.paymentDestinationOptions)
    setValue('paymentSourceId', invoiceLocal?.paymentSource?.id)
    setValue('paymentMethodSourceType', '')
    setValue('description', invoiceLocal?.noteToSelf ?? '')
  }, [invoiceLocal, setValue])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  })

  watch((data, { name, type }) => {
    if (name === 'currency') {
      const lineItems = data.lineItems as Mercoa.InvoiceLineItemRequest[]
      lineItems.forEach((lineItem, index) => {
        setValue(`lineItems.${index}.currency`, data.currency ?? 'USD')
      })
    }

    if (!name?.startsWith('lineItems')) return
    if (name.endsWith('amount')) return

    const lineItems = data.lineItems as Mercoa.InvoiceLineItemRequest[]
    let amount = lineItems.reduce((acc, lineItem, index) => {
      // TODO: Use a library to handle rounding
      lineItem.amount = Math.floor((lineItem.quantity ?? 1) * (lineItem.unitPrice ?? 1) * 100) / 100
      setValue(`lineItems.${index}.amount`, lineItem.amount)
      return acc + lineItem.amount
    }, 0)

    // TODO: Use a library to handle rounding
    amount = Math.floor(amount * 100) / 100

    setValue('amount', amount)
  })

  const payerId = watch('payerId')
  const payerName = watch('payerName')
  const currency = watch('currency')

  async function refreshInvoice(invoiceId: Mercoa.InvoiceId) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.invoice.get(invoiceId)
    if (resp) {
      setInvoice(resp)
      setSelectedPayer(resp.payer)
    }
  }

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    if (!invoice && invoiceId) {
      refreshInvoice(invoiceId)
    }
  }, [invoice, invoiceId, mercoaSession.token, mercoaSession.entity?.id])

  function refreshVendorPaymentMethods() {
    if (!mercoaSession.entityId) return
    mercoaSession.client?.entity.paymentMethod
      .getAll(mercoaSession.entityId, {
        type: 'bankAccount',
      })
      .then((response) => {
        setDestinationPaymentMethods(response as Mercoa.PaymentMethodResponse.BankAccount[])
      })
  }

  async function refreshPayerPaymentMethods() {
    if (!mercoaSession.token || !payerId) return
    const resp = await mercoaSession.client?.entity.paymentMethod.getAll(payerId)
    if (resp) {
      setSourcePaymentMethods(resp)
    }
  }

  useEffect(() => {
    refreshVendorPaymentMethods()
  }, [mercoaSession.entityId])

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id || !mercoaSession.client) return
    refreshPayerPaymentMethods()
    mercoaSession.client?.customPaymentMethodSchema
      .getAll()
      .then((resp: Mercoa.CustomPaymentMethodSchemaResponse[]) => {
        if (resp) {
          setPaymentMethodSchemas(resp)

          // Figure out what currencies are supported by C1 -------------------------------
          let supportedCurrencies: Mercoa.CurrencyCode[] = []

          const hasMercoaPaymentRails = mercoaSession.organization?.paymentMethods?.payerPayments.some(
            (p) => p.active && (p.type === 'bankAccount' || p.type === 'card'),
          )

          // dedupe and add supported currencies
          if (hasMercoaPaymentRails) {
            supportedCurrencies.push('USD')
          }
          resp.forEach((p) => {
            if (p.supportedCurrencies) {
              supportedCurrencies = [...new Set([...supportedCurrencies, ...p.supportedCurrencies])]
            }
          })
          setSupportedCurrencies(supportedCurrencies)
          // ------------------------------------------------------------------------------
        }
      })
  }, [mercoaSession.client, payerId, mercoaSession.token])

  // Reset currency dropdown
  useEffect(() => {
    if (supportedCurrencies.length > 0) {
      setValue('currency', invoice?.currency ?? supportedCurrencies[0])
    }
  }, [supportedCurrencies])

  async function getPDFLink() {
    if (!invoiceLocal?.id) return
    const pdfLink = await mercoaSession.client?.invoice.document.generateInvoicePdf(invoiceLocal.id)
    if (pdfLink?.uri) {
      // open in new window
      window.open(pdfLink.uri, '_blank')
    } else {
      toast.error('There was an issue generating thePDF. Please refresh and try again.')
    }
  }

  async function sendEmail() {
    if (!invoiceLocal?.id) return
    if (!invoiceLocal.payer?.email) {
      toast.error('There is no payer email address for this invoice.')
      return
    }
    try {
      await mercoaSession.client?.invoice.update(invoiceLocal.id, {
        status: Mercoa.InvoiceStatus.Approved,
      })
      const url = await mercoaSession.client?.invoice.paymentLinks.sendPayerEmail(invoiceLocal.id)
      if (url) {
        navigator.clipboard.writeText(url).then(
          function () {
            toast.info('Email Sent')
          },
          function (err) {
            toast.error('There was an issue generating the email. Please refresh and try again.')
          },
        )
      } else {
        toast.error('There was an issue generating the email. Please refresh and try again.')
      }
    } catch (e: any) {
      toast.error(`There was an issue saving the invoice.\n Error: ${e.body}`)
    }
  }

  async function onSubmit(data: any) {
    if (!mercoaSession.entityId) return
    const newInvoice: Mercoa.InvoiceCreationRequest = {
      invoiceNumber: data.invoiceNumber,
      invoiceDate: dayjs(data.invoiceDate).toDate(),
      dueDate: dayjs(data.dueDate).toDate(),
      currency: data.currency ?? 'USD',
      amount: data.amount,
      payerId: data.payerId,
      vendorId: mercoaSession.entityId,
      paymentDestinationId: data.paymentDestinationId,
      creatorEntityId: mercoaSession.entityId,
      lineItems: data.lineItems.map((lineItem: any) => ({
        name: lineItem.name,
        description: lineItem.description,
        quantity: Number(lineItem.quantity),
        unitPrice: Number(lineItem.unitPrice),
        amount: Number(lineItem.amount),
        currency: lineItem.currency ?? 'USD',
      })),
    }
    if (newInvoice.payerId && mercoaSession.entityId) {
      await mercoaSession.client?.entity.counterparty.addPayors(mercoaSession.entityId, {
        payors: [newInvoice.payerId],
      })
    }
    const response = await mercoaSession.client?.invoice.create(newInvoice)
    console.log(response)
    if (response?.id) {
      toast.success('Invoice created')
      if (onRedirect) {
        onRedirect(response)
      }
    } else {
      toast.error('Invoice failed to create')
    }
  }

  const lineItemHeaders = ['Description', 'Quantity', 'Unit Price', 'Total Amount']

  return (
    <div className="mercoa-p-2">
      <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
        Edit Invoice {invoiceLocal && <InvoiceStatusPill invoice={invoiceLocal} />}
      </h2>
      <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-4 mercoa-max-w-xl mercoa-items-center">
        {/*  VENDOR SEARCH */}
        <div className="sm:mercoa-col-span-3">
          <label
            htmlFor="vendor-name"
            className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700"
          >
            Customer
          </label>

          <div className="mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-justify-left">
            <CounterpartySearch
              type="payor"
              onSelect={(payer) => {
                console.log({ payer })
                setSelectedPayer(payer)
                setValue('payerId', payer?.id ?? undefined, { shouldTouch: true, shouldDirty: true })
                setValue('payerName', payer?.name ?? undefined, { shouldTouch: true, shouldDirty: true })
                clearErrors('payerId')
              }}
              counterparty={selectedPayer}
            />
          </div>
          {errors.payerId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.payerId?.message.toString()}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mercoa-mt-5 mercoa-grid mercoa-grid-cols-3 mercoa-max-w-xl mercoa-items-center mercoa-gap-4 mercoa-p-0.5">
          {/*  INVOICE DATE */}
          <MercoaInput
            name="invoiceDate"
            label="Invoice Date"
            placeholder="Invoice Date"
            type="date"
            className="sm:mercoa-col-span-1"
            control={control}
            errors={errors}
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
          />
        </div>

        {/*  GRAY border  */}
        <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

        <div>
          <p className="mercoa-mb-1 mercoa-mt-5 mercoa-text-lg">Line Items</p>
          <table className="mercoa-min-w-full">
            <thead>
              <tr>
                {lineItemHeaders.map((header, index) => (
                  <th
                    key={header}
                    className="mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id}>
                  <td>
                    <MercoaInput
                      name={`lineItems.${index}.description`}
                      errors={errors}
                      register={register}
                      placeholder="Item Description"
                    />
                  </td>
                  <td>
                    <MercoaInput
                      name={`lineItems.${index}.quantity`}
                      errors={errors}
                      register={register}
                      placeholder="Quantity"
                      type="number"
                    />
                  </td>
                  <td>
                    {' '}
                    <MercoaInput
                      name={`lineItems.${index}.unitPrice`}
                      errors={errors}
                      register={register}
                      placeholder="Unit Price"
                      type="number"
                      leadingIcon={
                        <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
                      }
                    />
                  </td>
                  <td>
                    {' '}
                    <MercoaInput
                      name={`lineItems.${index}.amount`}
                      errors={errors}
                      register={register}
                      placeholder="Description"
                      readOnly
                    />
                  </td>
                  <td>
                    <XCircleIcon
                      className="mercoa-size-5 mercoa-cursor-pointer mercoa-text-gray-500"
                      onClick={() => remove(index)}
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <MercoaButton
                    type="button"
                    isEmphasized={false}
                    className="mercoa-mt-1"
                    size="sm"
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
                      })
                    }
                  >
                    Add Line Item
                  </MercoaButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mercoa-mt-5 mercoa-grid mercoa-grid-cols-4 mercoa-gap-4 mercoa-items-start mercoa-p-0.5">
          <MercoaInput
            name="amount"
            label="Invoice Total Amount"
            type="number"
            readOnly
            errors={errors}
            register={register}
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
                  className="mercoa-h-full mercoa-rounded-md mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                >
                  {supportedCurrencies.map((option: Mercoa.CurrencyCode, index: number) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </>
            }
          />
          {/*  DESCRIPTION */}
          <div className="mercoa-col-span-3">
            <label
              htmlFor="description"
              className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 "
            >
              Notes
            </label>
            <div className="mercoa-mt-1">
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
                defaultValue={''}
              />
            </div>
          </div>
        </div>

        {/*  GRAY border  */}
        <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

        {/*  PAYMENT SOURCE */}
        <div className="mercoa-pb-6 mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mt-5">
            Choose existing payment method on file for{' '}
            <span className="mercoa-text-gray-800 mercoa-underline">{payerName}</span>:
          </h2>
          <SelectPaymentSource
            paymentMethods={sourcePaymentMethods}
            paymentMethodSchemas={paymentMethodSchemas}
            currentPaymentMethodId={invoiceLocal?.paymentSourceId}
            isSource
            watch={watch}
            setValue={setValue}
            clearErrors={clearErrors}
            refreshVendorPaymentMethods={refreshVendorPaymentMethods}
            refreshPayerPaymentMethods={refreshPayerPaymentMethods}
          />
          {errors.paymentSourceId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentSourceId?.message.toString()}</p>
          )}
        </div>

        {/*  GRAY border  */}
        <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

        {/*  PAYMENT DESTINATION  */}

        <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-16 mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mt-5">
            How do you want to get paid?
          </h2>
          <SelectPaymentSource
            paymentMethods={destinationPaymentMethods}
            paymentMethodSchemas={paymentMethodSchemas}
            currentPaymentMethodId={invoiceLocal?.paymentDestinationId}
            isDestination
            watch={watch}
            setValue={setValue}
            clearErrors={clearErrors}
            refreshVendorPaymentMethods={refreshVendorPaymentMethods}
            refreshPayerPaymentMethods={refreshPayerPaymentMethods}
          />
          {/* {invoice?.id &&
      invoice?.status != Mercoa.InvoiceStatus.Canceled &&
      invoice?.status != Mercoa.InvoiceStatus.Archived &&
      !mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
        <MercoaButton
          isEmphasized={false}
          onClick={getVendorLink}
          className="mercoa-inline-flex mercoa-text-sm mercoa-float-right mercoa-mt-3"
          type="button"
        >
          <DocumentDuplicateIcon className="mercoa-size-5 md:mercoa-mr-2" />{' '}
          <span className="mercoa-hidden md:mercoa-inline-block">Get Payment Acceptance Link</span>
        </MercoaButton>
      )} */}
          {errors.paymentDestinationId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentDestinationId?.message.toString()}</p>
          )}
        </div>

        <div className="mercoa-mt-5 mercoa-grid mercoa-grid-cols-4 mercoa-gap-4 mercoa-items-end mercoa-p-0.5">
          {!invoiceLocal?.id ? (
            <MercoaButton className="mercoa-mt-5" isEmphasized>
              Create Invoice
            </MercoaButton>
          ) : (
            <>
              {invoiceLocal.status === Mercoa.InvoiceStatus.Draft && (
                <MercoaButton isEmphasized={false}>Update Draft</MercoaButton>
              )}
              <MercoaButton
                isEmphasized={false}
                onClick={getPDFLink}
                type="button"
                className="mercoa-flex mercoa-justify-center"
              >
                <DocumentDuplicateIcon className="mercoa-size-5 md:mercoa-mr-2" /> Preview Invoice
              </MercoaButton>
              <MercoaButton
                isEmphasized
                onClick={sendEmail}
                type="button"
                className="mercoa-flex mercoa-justify-center"
              >
                <EnvelopeIcon className="mercoa-size-5 md:mercoa-mr-2" />
                Send Invoice
              </MercoaButton>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
