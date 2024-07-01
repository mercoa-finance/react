import { Bar, Container, Section } from '@column-resizer/react'
import { DocumentDuplicateIcon, EnvelopeIcon, GlobeAltIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useEffect, useState } from 'react'
import {
  FieldErrors,
  FormProvider,
  UseFormSetValue,
  UseFormWatch,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import InvoicePreview from './InvoicePreview'
import {
  CounterpartySearch,
  InvoiceStatusPill,
  MercoaButton,
  MercoaInput,
  NoSession,
  SelectPaymentMethod,
  useMercoaSession,
} from './index'

dayjs.extend(utc)

export type ReceivableFormValues = {
  id?: string
  status?: Mercoa.InvoiceStatus
  invoiceNumber?: string
  amount?: number
  currency?: Mercoa.CurrencyCode
  payerId?: string
  payerName?: string
  invoiceDate?: Date
  dueDate?: Date
  deductionDate?: Date
  lineItems?: Mercoa.InvoiceLineItemResponse[]
  paymentDestinationId?: string
  paymentDestinationType?: string
  paymentDestinationOptions?: Mercoa.PaymentDestinationOptions
  paymentSourceId?: string
  paymentSourceType?: string
  paymentSourceCheckEnabled?: boolean
  description?: string
  saveAsDraft?: boolean
  hasDocuments?: boolean
  saveAsStatus?: string
  saveAsAdmin?: boolean
  metadata?: Record<string, any>
  commentText?: string
  comments?: Array<any>
  creatorUser?: any
}

export function ReceivableDetails({
  invoiceId,
  invoice,
  onRedirect,
  admin,
  documentPosition = 'left',
  children,
}: {
  invoiceId?: Mercoa.InvoiceId
  invoice?: Mercoa.InvoiceResponse
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  admin?: boolean
  documentPosition?: 'right' | 'left' | 'none'
  children?: ({
    invoice,
    refreshInvoice,
    setSelectedPayer,
    selectedPayer,
    setValue,
    watch,
  }: ReceivableFormChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  const [paymentMethodSchemas, setPaymentMethodSchemas] = useState<Array<Mercoa.CustomPaymentMethodSchemaResponse>>([])
  const [destinationPaymentMethods, setDestinationPaymentMethods] = useState<
    Mercoa.PaymentMethodResponse.BankAccount[]
  >([])
  const [sourcePaymentMethods, setSourcePaymentMethods] = useState<Mercoa.PaymentMethodResponse[]>([])
  const [invoiceLocal, setInvoiceLocal] = useState<Mercoa.InvoiceResponse | undefined>(invoice)
  const [selectedPayer, setSelectedPayer] = useState<Mercoa.CounterpartyResponse | undefined>(invoice?.payer)
  const [supportedCurrencies, setSupportedCurrencies] = useState<Array<Mercoa.CurrencyCode>>([])

  const schema = yup
    .object({
      id: yup.string().nullable(),
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
      paymentDestinationType: yup.string(),
      paymentSourceType: yup.string(),
      paymentDestinationOptions: yup.mixed().nullable(),
      paymentSourceCheckEnabled: yup.boolean(),
      paymentSourceId: yup.string(),
      saveAsDraft: yup.boolean(),
      saveAsAdmin: yup.boolean(),
      metadata: yup.mixed().nullable(),
      creatorUser: yup.mixed().nullable(),
    })
    .required()

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: invoice?.id,
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
      paymentDestinationType: invoice?.paymentDestination?.type ?? '',
      paymentDestinationOptions: invoice?.paymentDestinationOptions,
      paymentSourceId: invoice?.paymentSource?.id,
      paymentSourceType: invoice?.paymentSource?.type ?? '',
      paymentSourceCheckEnabled: (invoice?.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false,
      description: invoice?.noteToSelf ?? '',
      saveAsDraft: false,
      metadata: invoice?.metadata ?? {},
      creatorUser: invoice?.creatorUser,
    },
  })

  async function refreshInvoice(invoiceId: Mercoa.InvoiceId) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.invoice.get(invoiceId)
    if (resp) {
      setInvoiceLocal(resp)
      setSelectedPayer(resp.payer)
    }
  }

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    if (!invoice && invoiceId) {
      refreshInvoice(invoiceId)
    }
  }, [invoice, invoiceId, mercoaSession.token, mercoaSession.entity?.id])

  if (!mercoaSession.client) return <NoSession componentName="ReceivableDetails" />

  if (documentPosition === 'none') {
    return (
      <FormProvider {...methods}>
        <ReceivableForm
          invoice={invoiceLocal}
          onRedirect={onRedirect}
          refreshInvoice={refreshInvoice}
          admin={admin}
          supportedCurrencies={supportedCurrencies}
          setSupportedCurrencies={setSupportedCurrencies}
          setDestinationPaymentMethods={setDestinationPaymentMethods}
          setSourcePaymentMethods={setSourcePaymentMethods}
          setPaymentMethodSchemas={setPaymentMethodSchemas}
          selectedPayer={selectedPayer}
          setSelectedPayer={setSelectedPayer}
        >
          {children}
        </ReceivableForm>
      </FormProvider>
    )
  }

  const invoicePreview = (
    <Section minSize={0} maxSize={800}>
      <InvoicePreview selectedPayer={selectedPayer} />
    </Section>
  )
  const invoiceDetails = (
    <Section className={`mercoa-relative ${documentPosition === 'left' ? 'mercoa-pl-5' : 'mercoa-pr-5'}`} minSize={400}>
      <ReceivableForm
        invoice={invoiceLocal}
        onRedirect={onRedirect}
        refreshInvoice={refreshInvoice}
        admin={admin}
        supportedCurrencies={supportedCurrencies}
        setSupportedCurrencies={setSupportedCurrencies}
        setDestinationPaymentMethods={setDestinationPaymentMethods}
        setSourcePaymentMethods={setSourcePaymentMethods}
        setPaymentMethodSchemas={setPaymentMethodSchemas}
        selectedPayer={selectedPayer}
        setSelectedPayer={setSelectedPayer}
      >
        {children}
      </ReceivableForm>
    </Section>
  )

  return (
    <FormProvider {...methods}>
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
    </FormProvider>
  )
}

export type ReceivableFormChildrenProps = {
  invoice?: Mercoa.InvoiceResponse
  refreshInvoice?: (invoiceId: Mercoa.InvoiceId) => void
  setSelectedPayer: (e?: Mercoa.CounterpartyResponse) => void
  selectedPayer?: Mercoa.CounterpartyResponse
  setValue: (
    name: UseFormSetValue<Mercoa.InvoiceCreationRequest>,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean },
  ) => void
  watch: (name: UseFormWatch<Mercoa.InvoiceCreationRequest>) => any
  errors: FieldErrors<Mercoa.InvoiceCreationRequest>
}

export function ReceivableForm({
  invoice,
  onRedirect,
  refreshInvoice,
  // height,              TODO: Is used in PayableDetails but not used at all here, implement
  admin,
  // invoicePreSubmit,
  supportedCurrencies,
  setSupportedCurrencies,
  setDestinationPaymentMethods,
  setSourcePaymentMethods,
  setPaymentMethodSchemas,
  selectedPayer,
  setSelectedPayer,
  children,
}: {
  invoice?: Mercoa.InvoiceResponse
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  refreshInvoice: (invoice: Mercoa.InvoiceId) => void
  admin?: boolean
  supportedCurrencies: Mercoa.CurrencyCode[]
  setSupportedCurrencies: (currencies: Mercoa.CurrencyCode[]) => void
  setDestinationPaymentMethods: (paymentMethods: Mercoa.PaymentMethodResponse.BankAccount[]) => void
  setSourcePaymentMethods: (paymentMethods: Mercoa.PaymentMethodResponse[]) => void
  setPaymentMethodSchemas: (paymentMethodSchemas: Mercoa.CustomPaymentMethodSchemaResponse[]) => void
  invoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  selectedPayer: Mercoa.CounterpartyResponse | undefined
  setSelectedPayer: (payer: Mercoa.CounterpartyResponse | undefined) => void
  children?: ({
    invoice,
    refreshInvoice,
    setSelectedPayer,
    selectedPayer,
    setValue,
    watch,
  }: ReceivableFormChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

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
  } = useFormContext()

  useEffect(() => {
    if (!invoice) return

    if (invoice.paymentDestination?.type === 'custom') {
      setValue(
        'paymentDestinationType',
        (invoice.paymentDestination as Mercoa.CustomPaymentMethodResponse)?.schemaId ?? '',
      )
    } else {
      setValue('paymentDestinationType', invoice.paymentDestination?.type ?? '')
    }

    if (invoice.paymentSource?.type === 'custom') {
      setValue('paymentSourceType', (invoice.paymentSource as Mercoa.CustomPaymentMethodResponse)?.schemaId ?? '')
    } else {
      setValue('paymentSourceType', invoice.paymentSource?.type ?? '')
    }

    setValue('id', invoice.id)
    setValue('status', invoice.status)
    setValue('invoiceNumber', invoice.invoiceNumber)
    setValue('amount', invoice.amount)
    setValue('currency', invoice.currency ?? 'USD')
    setValue('payerId', invoice.payer?.id)
    setValue('payerName', invoice.payer?.name)
    setValue('invoiceDate', invoice.invoiceDate ? dayjs(invoice.invoiceDate).toDate() : undefined)
    setValue('dueDate', invoice.dueDate ? dayjs(invoice.dueDate).toDate() : undefined)
    setValue('deductionDate', invoice.deductionDate ? dayjs(invoice.deductionDate).toDate() : undefined)
    setValue('lineItems', (invoice.lineItems ?? []) as any)
    setValue('paymentDestinationId', invoice.paymentDestination?.id)
    setValue('paymentDestinationOptions', invoice.paymentDestinationOptions)
    setValue('paymentSourceId', invoice.paymentSource?.id)
    setValue(
      'paymentSourceCheckEnabled',
      (invoice.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false,
    )
    setValue('description', invoice.noteToSelf ?? '')
    setValue('hasDocuments', invoice.hasDocuments ?? false)
    setValue('saveAsStatus', '')
    setValue('saveAsAdmin', false)
    setValue('metadata', invoice.metadata ?? {})
    setValue('creatorUser', invoice?.creatorUser)
    setValue('comments', invoice?.comments ?? [])
  }, [invoice])

  useEffect(() => {
    if (!invoice?.id) return
    setValue('status', invoice?.status)
    setValue('invoiceNumber', invoice?.invoiceNumber)
    if (invoice?.amount) setValue('amount', invoice.amount)
    setValue('currency', invoice?.currency ?? 'USD')
    setValue('payerId', invoice?.payer?.id)
    setValue('payerName', invoice?.payer?.name)
    if (invoice?.invoiceDate) setValue('invoiceDate', dayjs(invoice.invoiceDate).toDate())
    if (invoice?.dueDate) setValue('dueDate', dayjs(invoice?.dueDate).toDate())
    setValue('deductionDate', invoice?.deductionDate ? dayjs(invoice?.deductionDate).toDate() : undefined)
    setValue(
      'lineItems',
      invoice?.lineItems?.map((lineItem) => ({
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
    setValue('paymentDestinationId', invoice?.paymentDestination?.id)
    setValue('paymentDestinationOptions', invoice?.paymentDestinationOptions)
    setValue('paymentSourceId', invoice?.paymentSource?.id)
    setValue('description', invoice?.noteToSelf ?? '')
  }, [invoice, setValue])

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
    if (!invoice?.id) return
    const pdfLink = await mercoaSession.client?.invoice.document.generateInvoicePdf(invoice.id)
    if (pdfLink?.uri) {
      // open in new window
      window.open(pdfLink.uri, '_blank')
    } else {
      toast.error('There was an issue generating the Invoice PDF. Please refresh and try again.')
    }
  }

  async function getPaymentLink() {
    if (!invoice?.id) return
    const pdfLink = await mercoaSession.client?.invoice.paymentLinks.getPayerLink(invoice.id)
    if (pdfLink) {
      // open in new window
      window.open(pdfLink, '_blank')
    } else {
      toast.error('There was an issue creating the payment link. Please refresh and try again.')
    }
  }

  async function sendEmail() {
    if (!invoice?.id) return
    if (!invoice.payer?.email) {
      toast.error('There is no payer email address for this invoice.')
      return
    }
    try {
      await mercoaSession.client?.invoice.update(invoice.id, {
        status: Mercoa.InvoiceStatus.Approved,
      })
      const url = await mercoaSession.client?.invoice.paymentLinks.sendPayerEmail(invoice.id)
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
    mercoaSession.debug(response)
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

  if (!mercoaSession.client) return <NoSession componentName="ReceivableForm" />
  return (
    <div className="mercoa-p-2 mercoa-mx-4">
      <h2 className="mercoa-text-lg mercoa-font-bold mercoa-leading-7 mercoa-text-gray-900">
        Edit Invoice {invoice && <InvoiceStatusPill status={invoice?.status ?? 'DRAFT'} />}
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
              <tr className="mercoa-grid mercoa-grid-cols-[24%_24%_24%_24%_4%]">
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
                <tr key={field.id} className="mercoa-grid mercoa-grid-cols-[24%_24%_24%_24%_4%]">
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
                      control={control}
                      placeholder="Unit Price"
                      type="currency"
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
                      control={control}
                      placeholder="Description"
                      readOnly
                      type="currency"
                      leadingIcon={
                        <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
                      }
                    />
                  </td>
                  <td className="mercoa-flex mercoa-items-center">
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
          <table className="mercoa-mt-5 mercoa-grid mercoa-grid-cols-4 mercoa-gap-4 mercoa-items-start mercoa-p-0.5">
            <MercoaInput
              name="amount"
              label="Invoice Total Amount"
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
                    className="mercoa-h-full mercoa-rounded-mercoa mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
                  className="mercoa-block mercoa-w-full mercoa-rounded-mercoa mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
                  style={{ height: '36px' }}
                  defaultValue={''}
                />
              </div>
            </div>
          </table>
        </div>

        {/*  GRAY border  */}
        <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

        {/*  PAYMENT SOURCE */}
        <div className="mercoa-pb-6 mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mt-5">
            Choose existing payment method on file for{' '}
            <span className="mercoa-text-gray-800 mercoa-underline">{payerName}</span>:
          </h2>
          <SelectPaymentMethod isSource />
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
          <SelectPaymentMethod isDestination />
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
          {!invoice?.id ? (
            <MercoaButton className="mercoa-mt-5" isEmphasized>
              Create Invoice
            </MercoaButton>
          ) : (
            <>
              {invoice.status === Mercoa.InvoiceStatus.Draft && (
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
                isEmphasized={false}
                onClick={getPaymentLink}
                type="button"
                className="mercoa-flex mercoa-justify-center"
              >
                <GlobeAltIcon className="mercoa-size-5 md:mercoa-mr-2" /> Get Payment Link
              </MercoaButton>
              <MercoaButton
                isEmphasized
                onClick={sendEmail}
                type="button"
                className="mercoa-flex mercoa-justify-center"
              >
                <EnvelopeIcon className="mercoa-size-5 md:mercoa-mr-2" />
                {invoice.status === 'DRAFT' ? 'Send Invoice' : 'Resend Invoice'}
              </MercoaButton>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
