import { yupResolver } from '@hookform/resolvers/yup'
import Big from 'big.js'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Resolver, useFieldArray, useForm } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { filterApproverOptions, propagateApprovalPolicy, useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { getInvoiceClient } from '../../common/utils'
import { useApprovePayable, useCreatePayable, useRejectPayable, useRunOcr, useUpdatePayable } from '../api/mutations'
import {
  useBnplLoanQuery,
  useBnplOfferQuery,
  useOcrJobQuery,
  usePayableDetailQuery,
  usePayableDocumentsQuery,
  usePayableEventsQuery,
  usePayableFeeQuery,
  usePayableSourceEmailQuery,
  usePayeesQuery,
  usePaymentMethodsQuery,
  usePaymentTimingQuery,
  useVendorCreditUsageQuery,
} from '../api/queries'
import { filterMetadataValues } from '../components/payable-form/components/payable-metadata/utils'
import { PayableFormAction } from '../components/payable-form/constants'
import { PayableFormData } from '../components/payable-form/types'
import {
  createCounterpartyRequest,
  findExistingCounterparties,
  onSubmitCounterparty,
  payableFormUtils,
} from '../components/payable-form/utils'
import {
  PayableApproversContext,
  PayableBnplContext,
  PayableCommentsContext,
  PayableDetailsContextValue,
  PayableDetailsProps,
  PayableEventsContext,
  PayableFeesContext,
  PayableLineItemsContext,
  PayableMetadataContext,
  PayableOverviewContext,
  PayablePaymentMethodContext,
  PayablePaymentTimingContext,
  PayableRecurringScheduleContext,
  PayableTaxAndShippingContext,
  PayableVendorContext,
  PayableVendorCreditContext,
} from '../types'

// this is purposely added here to avoid circular dependencies need to inspect further later
const counterpartyYupValidation = {
  id: yup.string().nullable(),
  name: yup.string().typeError('Please enter a name'),
  email: yup.string().email('Please enter a valid email'),
  accountType: yup.string(),
  firstName: yup.string(),
  lastName: yup.string(),
  middleName: yup.string(),
  suffix: yup.string(),
  website: yup
    .string()
    .url('Website must be a valid URL')
    .transform((currentValue) => {
      const doesNotStartWithHttp =
        currentValue && !currentValue.startsWith('http://') && !currentValue.startsWith('https://')
      if (doesNotStartWithHttp) {
        return `http://${currentValue}`
      }
      return currentValue
    }),
  description: yup.string(),
  accounts: yup.array().of(
    yup.object().shape({
      accountId: yup.string(),
      postalCode: yup.string().nullable(),
      nameOnAccount: yup.string().nullable(),
    }),
  ),
}

export const usePayableDetailsInternal = (props: PayableDetailsProps) => {
  const {
    queryOptions = { invoiceId: '', invoiceType: 'invoice', getInvoiceEvents: true },
    handlers = {},
    config = {},
    displayOptions = {
      documentPosition: 'left',
      heightOffset: 0,
      paymentMethods: { showDestinationPaymentMethodConfirmation: true },
    },
    renderCustom,
  } = props
  const { toast } = renderCustom ?? {}
  const { supportedCurrencies } = config
  const mercoaSession = useMercoaSession()
  const { invoiceType, invoiceId, invoice: invoiceExternal } = queryOptions
  const [vendorSearch, setVendorSearch] = useState('')
  const [duplicateVendorModalOpen, setDuplicateVendorModalOpen] = useState(false)
  const [duplicateVendorInfo, setDuplicateVendorInfo] = useState<{
    duplicates: Mercoa.CounterpartyResponse[]
    foundType: 'name' | 'email'
    foundString: string
    type: 'payee' | 'payor'
  }>()

  const getInvoiceEvents = typeof queryOptions.getInvoiceEvents === 'boolean' ? queryOptions.getInvoiceEvents : true

  const { heightOffset } = displayOptions
  const showDestinationPaymentMethodConfirmation =
    displayOptions.paymentMethods?.showDestinationPaymentMethodConfirmation === undefined
      ? true
      : displayOptions.paymentMethods?.showDestinationPaymentMethodConfirmation
  const [height, setHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight - (heightOffset ?? 0) : 0,
  )

  function removeThousands(_value: any, originalValue: string | number) {
    return typeof originalValue === 'string' ? Number(originalValue?.replace(/,/g, '')) : originalValue
  }

  const {
    onInvoicePreSubmit,
    onInvoiceSubmit,
    onCounterpartyPreSubmit,
    onInvoiceUpdate,
    onOcrComplete,
    onCounterpartySelect,
  } = handlers

  const [ocrResponse, setOcrResponse] = useState<Mercoa.OcrResponse>()

  const [invoiceDocuments, setInvoiceDocuments] = useState<
    Array<{ fileReaderObj: string; mimeType: string }> | undefined
  >()
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [activeOcrJobId, setActiveOcrJobId] = useState<string>()
  const [uploadedDocument, setUploadedDocument] = useState<string>()

  const { data: invoiceData, isLoading: invoiceDataLoading } = usePayableDetailQuery(
    invoiceId,
    invoiceType,
    invoiceExternal,
  )
  const { data: documents, isLoading: documentsLoading } = usePayableDocumentsQuery(invoiceId, invoiceType)
  const { data: sourceEmails, isLoading: sourceEmailsLoading } = usePayableSourceEmailQuery(invoiceId, invoiceType)
  const { data: vendors, isLoading: vendorsLoading } = usePayeesQuery({ search: vendorSearch })

  const { data: ocrJob } = useOcrJobQuery(activeOcrJobId, 2500)

  const { data: invoiceOcrJob } = useOcrJobQuery(invoiceData?.ocrJobId ?? '', Infinity)

  const { mutate: updatePayable, isPending: updatePayablePending } = useUpdatePayable()
  const { mutate: createPayable, isPending: createPayablePending } = useCreatePayable()
  const { mutate: approvePayable, isPending: approvePayablePending } = useApprovePayable()
  const { mutate: rejectPayable, isPending: rejectPayablePending } = useRejectPayable()

  const { mutate: runOcr } = useRunOcr()

  const useDocumentOnce = useRef(true)

  const [selectedVendor, setSelectedVendor] = useState<Mercoa.CounterpartyResponse | undefined>(
    invoiceData?.vendor ?? config?.counterparty?.defaultCounterparty,
  )

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const defaultPaymentSchedule =
    invoiceType === 'invoiceTemplate'
      ? {
          type: 'daily',
          repeatEvery: 1,
          ends: new Date(),
        }
      : undefined

  const baseSchema = yup
    .object({
      id: yup.string().nullable(),
      status: yup.string(),
      amount: yup.number().transform(removeThousands).typeError('Please enter a valid number'),
      invoiceNumber: yup.string(),
      description: yup.string(),
      processedAt: yup.date().nullable(),
      dueDate: yup.date().typeError('Please select a due date'),
      deductionDate: yup.date().typeError('Please select a deduction date'),
      invoiceDate: yup.date().typeError('Please select an invoice date'),
      approvers: yup.mixed(),
      lineItems: yup.array().of(
        yup.object({
          id: yup.string(),
          description: yup.string().nullable(),
          amount: yup.number().transform(removeThousands).nullable(),
          quantity: yup.number().transform(removeThousands).nullable(),
          unitPrice: yup.number().transform(removeThousands).nullable(),
          category: yup.mixed().nullable(),
          currency: yup.string().nullable(),
          metadata: yup.mixed().nullable(),
          glAccountId: yup.string().nullable(),
          createdAt: yup.date().nullable(),
          updatedAt: yup.date().nullable(),
        }),
      ),
      currency: yup.string().required(),
      payerId: yup.string(),
      vendorId: yup.string(),
      vendorName: yup.string(),
      paymentDestinationId: yup.string(),
      paymentDestinationType: yup.string(),
      paymentDestinationSchemaId: yup.string().nullable(),
      paymentDestinationOptions: yup.mixed().nullable(),
      paymentSourceId: yup.string(),
      paymentSourceType: yup.string(),
      paymentSourceOptions: yup.mixed().nullable(),
      paymentSourceCheckEnabled: yup.boolean().nullable(),
      batchPayment: yup.boolean().nullable(),
      paymentSourceSchemaId: yup.string().nullable(),
      paymentSchedule: yup.mixed().nullable(),
      hasDocuments: yup.boolean().nullable(),
      formAction: yup.string().nullable(),
      saveAsAdmin: yup.boolean(),
      metadata: yup.mixed().nullable(),
      newBankAccount: yup.mixed().nullable(),
      newCheck: yup.mixed().nullable(),
      newCounterpartyAccount: yup.mixed().nullable(),
      commentText: yup.string().nullable(),
      comments: yup.mixed().nullable(),
      creatorUser: yup.mixed().nullable(),
      creatorEntityId: yup.string().nullable(),
      approvalPolicy: yup.mixed().nullable(),
      vendor: yup.object().shape(counterpartyYupValidation),
      '~cpm~~': yup.mixed().nullable(),
      fees: yup.mixed().nullable(),
      failureType: yup.string().nullable(),
      vendorCreditIds: yup.array().nullable(),
      taxAmount: yup.number().transform(removeThousands).positive().nullable(),
      shippingAmount: yup.number().transform(removeThousands).positive().nullable(),
      ocrJobId: yup.string().nullable(),
      createdAt: yup.date().nullable(),
      updatedAt: yup.date().nullable(),
    })
    .required()

  const formDefaultValues = {
    id: invoiceData?.id,
    status: invoiceData?.status,
    invoiceNumber: invoiceData?.invoiceNumber,
    amount: invoiceData?.amount ?? 0,
    currency: invoiceData?.currency ?? 'USD',
    payerId: invoiceData?.payer?.id ?? mercoaSession.entityId,
    vendorId: invoiceData?.vendor?.id,
    vendorName: invoiceData?.vendor?.name,
    invoiceDate: invoiceData?.invoiceDate ? dayjs(invoiceData?.invoiceDate).toDate() : undefined,
    dueDate: invoiceData?.dueDate ? dayjs(invoiceData?.dueDate).toDate() : undefined,
    deductionDate: invoiceData?.deductionDate ? dayjs(invoiceData?.deductionDate).toDate() : undefined,
    processedAt: invoiceData?.processedAt ? dayjs(invoiceData?.processedAt).toDate() : undefined,
    lineItems: invoiceData?.lineItems ?? [],
    paymentDestinationId: invoiceData?.paymentDestination?.id,
    paymentDestinationType: invoiceData?.paymentDestination?.type ?? '',
    paymentDestinationOptions: invoiceData?.paymentDestinationOptions,
    paymentSourceId: invoiceData?.paymentSource?.id,
    paymentSourceType: invoiceData?.paymentSource?.type ?? '',
    paymentSourceOptions: invoiceData?.paymentSourceOptions,
    paymentSourceCheckEnabled:
      (invoiceData?.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false,
    batchPayment: invoiceData?.batchPayment ?? false,
    description: invoiceData?.noteToSelf ?? '',
    hasDocuments: invoiceData?.hasDocuments ?? !!uploadedDocument,
    formAction: '',
    saveAsAdmin: false,
    metadata: invoiceData?.metadata ?? {},
    approvalPolicy: invoiceData?.approvalPolicy ?? { type: 'any', approvers: [] },
    approvers: invoiceData?.approvers ?? [],
    fees: invoiceData?.fees,
    vendorCreditIds: invoiceData?.vendorCreditIds ?? [],
    taxAmount: invoiceData?.taxAmount,
    shippingAmount: invoiceData?.shippingAmount,
    createdAt: invoiceData?.createdAt,
    updatedAt: invoiceData?.updatedAt,
    newBankAccount: {
      routingNumber: '',
      accountNumber: '',
      bankName: '',
      accountType: Mercoa.BankType.Checking,
    },
    newCheck: {
      payToTheOrderOf: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    newCounterpartyAccount: {
      accountId: '',
      postalCode: '',
      nameOnAccount: '',
    },
    '~cpm~~': {} as any,
    paymentSchedule: invoiceData?.paymentSchedule ?? defaultPaymentSchedule,
    failureType: invoiceData?.failureType ?? '',
    commentText: '',
    comments: invoiceData?.comments ?? [],
    creatorUser: invoiceData?.creatorUser,
    creatorEntityId: invoiceData?.creatorEntityId,
    ocrJobId: invoiceData?.ocrJobId,
    vendor: {
      id: invoiceData?.vendor?.id,
      accountType: invoiceData?.vendor?.accountType,
      name: invoiceData?.vendor?.name,
      firstName: invoiceData?.vendor?.profile?.individual?.name?.firstName,
      lastName: invoiceData?.vendor?.profile?.individual?.name?.lastName,
      middleName: invoiceData?.vendor?.profile?.individual?.name?.middleName,
      suffix: invoiceData?.vendor?.profile?.individual?.name?.suffix,
      email:
        invoiceData?.vendor?.accountType === 'business'
          ? invoiceData?.vendor?.profile?.business?.email
          : invoiceData?.vendor?.profile?.individual?.email,
      website: invoiceData?.vendor?.profile?.business?.website,
      description: invoiceData?.vendor?.profile?.business?.description,
      accounts: [] as Mercoa.CounterpartyCustomizationAccount[],
    },
  }
  type FormDefaultValues = typeof formDefaultValues

  const methods = useForm<FormDefaultValues>({
    resolver: yupResolver(baseSchema) as Resolver<FormDefaultValues>,
    defaultValues: formDefaultValues,
  })

  const {
    setValue,
    setFocus,
    setError,
    clearErrors,
    watch,
    control,
    formState: { errors },
  } = methods

  const { append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const [
    amount,
    taxAmount,
    shippingAmount,
    description,
    deductionDate,
    invoiceNumber,
    invoiceDate,
    dueDate,
    lineItems,
    currency,
    comments,
    approvers,
    approvalPolicy,
    paymentDestinationOptions,
    paymentDestinationType,
    paymentSourceType,
    printDescriptionOnCheckRemittance,
    paymentSourceId,
    bnplInstallmentsStartDate,
    bnplDefermentWeeks,
    bnplAcceptedTerms,
    bnplLoanId,
    paymentDestinationId,
    vendorCreditIds,
    payerId,
    vendorId,
    status,
    processedAt,
    selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId,
    selectedSourceType,
    selectedDestinationType,
    paymentScheduleType,
    paymentScheduleEnds,
    paymentScheduleRepeatEvery,
    paymentScheduleRepeatOn,
    paymentScheduleRepeatOnDay,
    paymentScheduleRepeatOnMonth,
  ] = watch([
    'amount',
    'taxAmount',
    'shippingAmount',
    'description',
    'deductionDate',
    'invoiceNumber',
    'invoiceDate',
    'dueDate',
    'lineItems',
    'currency',
    'comments',
    'approvers',
    'approvalPolicy',
    'paymentDestinationOptions',
    'paymentDestinationType',
    'paymentSourceType',
    'paymentDestinationOptions.printDescription',
    'paymentSourceId',
    'paymentSourceOptions.installmentsStartDate',
    'paymentSourceOptions.defermentWeeks',
    'paymentSourceOptions.acceptedTerms',
    'paymentSourceOptions.loanId',
    'paymentDestinationId',
    'vendorCreditIds',
    'payerId',
    'vendorId',
    'status',
    'processedAt',
    'paymentSourceId',
    'paymentDestinationId',
    'paymentSourceType',
    'paymentDestinationType',
    'paymentSchedule.type',
    'paymentSchedule.ends',
    'paymentSchedule.repeatEvery',
    'paymentSchedule.repeatOn',
    'paymentSchedule.repeatOnDay',
    'paymentSchedule.repeatOnMonth',
  ])

  const { data: fees, isLoading: feesLoading } = usePayableFeeQuery({
    amount: amount,
    creatorEntityId: payerId,
    paymentSourceId: paymentSourceId,
    paymentDestinationId: paymentDestinationId,
    paymentDestinationOptions: paymentDestinationOptions,
  })
  const { data: vendorCreditUsage, isLoading: vendorCreditUsageLoading } = useVendorCreditUsageQuery({
    amount: amount,
    payerId: payerId,
    vendorId: vendorId,
    invoiceId: invoiceId,
    status: status as Mercoa.InvoiceStatus,
    vendorCreditIds: vendorCreditIds,
  })

  const { data: paymentTiming, isLoading: paymentTimingLoading } = usePaymentTimingQuery({
    invoiceId: invoiceId,
    processedAt: processedAt,
    estimatedDeductionDate: deductionDate,
    paymentSourceId: paymentSourceId,
    paymentDestinationId: paymentDestinationId,
    paymentDestinationOptions: paymentDestinationOptions,
  })

  const bnplRequest: Mercoa.BnplOfferRequest = useMemo(
    () => ({
      cadence: 'WEEKLY',
      numberOfInstallments: bnplDefermentWeeks,
      downPaymentDueDate: dayjs(deductionDate).format('YYYY-MM-DD'),
      installmentsStartDate: bnplInstallmentsStartDate,
      paymentDayOfWeek: dayjs(bnplInstallmentsStartDate).format('dddd').toUpperCase() as Mercoa.BnplDayOfWeek,
    }),
    [bnplDefermentWeeks, deductionDate, bnplInstallmentsStartDate],
  )

  const { data: bnplOffer, isLoading: bnplOfferLoading } = useBnplOfferQuery(
    invoiceId ?? '',
    bnplRequest,
    !!invoiceId && !!bnplInstallmentsStartDate && !!bnplDefermentWeeks && !!deductionDate && !bnplLoanId,
  )

  const { data: paymentMethodsSource, isLoading: paymentMethodsSourceLoading } = usePaymentMethodsQuery({
    entityId: payerId,
  })

  const { data: paymentMethodsDestination, isLoading: paymentMethodsDestinationLoading } = usePaymentMethodsQuery({
    entityId: vendorId,
  })

  const { data: events, isLoading: eventsLoading } = usePayableEventsQuery({
    invoiceId: invoiceId,
    enabled: !!getInvoiceEvents,
  })

  const { data: bnplLoan, isLoading: bnplLoanLoading } = useBnplLoanQuery(bnplLoanId ?? '')

  useEffect(() => {
    if (!invoiceData) return

    if (invoiceData.vendor && !selectedVendor) {
      mercoaSession.debug('setting selected vendor', invoiceData.vendor)
      setSelectedVendor(invoiceData.vendor)
    }

    if (invoiceData.paymentDestination?.type === 'custom') {
      setValue(
        'paymentDestinationType',
        (invoiceData.paymentDestination as Mercoa.CustomPaymentMethodResponse)?.schemaId ?? '',
      )
    } else {
      setValue('paymentDestinationType', invoiceData.paymentDestination?.type ?? '')
    }

    if (invoiceData.paymentSource?.type === 'custom') {
      setValue('paymentSourceType', (invoiceData.paymentSource as Mercoa.CustomPaymentMethodResponse)?.schemaId ?? '')
    } else {
      setValue(
        'paymentSourceType',
        invoiceData.paymentSourceOptions?.type === 'bnpl'
          ? Mercoa.PaymentMethodType.Bnpl
          : invoiceData.paymentSource?.type ?? '',
      )
    }

    setValue('id', invoiceData.id)
    setValue('status', invoiceData.status)
    setValue('invoiceNumber', invoiceData.invoiceNumber)
    setValue('amount', invoiceData.amount ?? 0)
    setValue('currency', invoiceData.currency ?? 'USD')
    setValue('payerId', invoiceData.payer?.id ?? mercoaSession.entityId)
    setValue('vendorId', invoiceData.vendor?.id)
    setValue('vendorName', invoiceData.vendor?.name)
    setValue('invoiceDate', invoiceData.invoiceDate ? dayjs(invoiceData.invoiceDate).toDate() : undefined)
    setValue('dueDate', invoiceData.dueDate ? dayjs(invoiceData.dueDate).toDate() : undefined)
    setValue('deductionDate', invoiceData.deductionDate ? dayjs(invoiceData.deductionDate).toDate() : undefined)
    setValue('processedAt', invoiceData.processedAt ? dayjs(invoiceData.processedAt).toDate() : undefined)
    setValue(
      'lineItems',
      (invoiceData.lineItems ?? []).map((item) => ({
        id: item.id,
        amount: item.amount ?? 0,
        currency: item.currency ?? 'USD',
        category: item.category ?? 'EXPENSE',
        createdAt: item.createdAt ?? new Date(),
        updatedAt: item.updatedAt ?? new Date(),
        description: item.description ?? '',
        glAccountId: item.glAccountId ?? '',
        name: item.name ?? '',
        quantity: item.quantity ?? 0,
        unitPrice: item.unitPrice ?? 0,
        metadata: item.metadata ?? {},
      })),
    )
    setValue('paymentDestinationId', invoiceData.paymentDestination?.id)
    setValue('paymentSourceOptions', invoiceData.paymentSourceOptions)
    setValue('paymentDestinationOptions', invoiceData.paymentDestinationOptions)
    setValue('paymentSourceId', invoiceData.paymentSource?.id)
    setValue(
      'paymentSourceCheckEnabled',
      (invoiceData.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false,
    )
    setValue('batchPayment', invoiceData.batchPayment ?? false)
    setValue('description', invoiceData.noteToSelf ?? '')
    setValue('hasDocuments', invoiceData.hasDocuments ?? !!uploadedDocument)
    setValue('formAction', '')
    setValue('saveAsAdmin', false)
    setValue('metadata', invoiceData.metadata ?? {})
    setValue('approvers', invoiceData?.approvers ?? [])
    setValue('approvalPolicy', invoiceData?.approvalPolicy ?? { type: 'any', approvers: [] })
    setValue('creatorUser', invoiceData?.creatorUser)
    setValue('comments', invoiceData?.comments ?? [])
    setValue('fees', invoiceData?.fees)
    setValue('failureType', invoiceData?.failureType ?? '')
    setValue('vendorCreditIds', invoiceData?.vendorCreditIds ?? [])
    setValue('createdAt', invoiceData?.createdAt)
    setValue('updatedAt', invoiceData?.updatedAt)
    setValue('paymentSchedule', invoiceData?.paymentSchedule)
    setValue('taxAmount', invoiceData?.taxAmount)
    setValue('shippingAmount', invoiceData?.shippingAmount)
    setValue('ocrJobId', invoiceData?.ocrJobId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData])

  useEffect(() => {
    if (!selectedVendor) {
      setValue('vendorId', '')
      setValue('vendorName', '')
      clearErrors('vendorId')
      clearErrors('vendorName')
      setValue('paymentDestinationId', '')
      setValue('paymentDestinationType', '')
      setValue('paymentDestinationOptions', undefined)
      setValue('paymentSourceOptions', undefined)
    } else if (selectedVendor.id === 'new') {
      setValue('paymentDestinationId', '')
      setValue('paymentDestinationType', '')
      setValue('paymentDestinationOptions', undefined)
      setValue('paymentSourceOptions', undefined)
    } else if (selectedVendor.id) {
      mercoaSession.debug({ selectedVendor })
      setValue('vendorId', selectedVendor.id)
      setValue('vendorName', selectedVendor.name)
      if (selectedVendor.id != vendorId) {
        setValue('paymentDestinationId', '')
        setValue('paymentDestinationType', '')
        setValue('paymentDestinationOptions', undefined)
        setValue('paymentSourceOptions', undefined)
      }
      clearErrors('vendorId')
      clearErrors('vendorName')
    }
  }, [clearErrors, mercoaSession, selectedVendor, setValue, vendorId])

  useEffect(() => {
    if (mercoaSession.entity?.id && vendorId) {
      mercoaSession.client?.entity.counterparty
        .findPayees(mercoaSession.entity.id, {
          counterpartyId: vendorId,
        })
        .then((resp) => {
          if (resp.data.length > 0) {
            const accounts = resp.data[0].accounts
            if (accounts) {
              setValue('vendor.accounts', accounts)
            }
          }
        })
    }
  }, [mercoaSession.client?.entity.counterparty, mercoaSession.entity?.id, setValue, vendorId])

  useEffect(() => {
    if (!ocrResponse) return

    if (
      invoiceData?.ocrJobId &&
      (invoiceData?.vendor ||
        !(
          invoiceData?.status === Mercoa.InvoiceStatus.Draft || invoiceData?.status === Mercoa.InvoiceStatus.Unassigned
        ))
    ) {
      return
    }

    setValue('ocrJobId', ocrResponse.jobId)

    mercoaSession.debug({ ocrResponse })
    if (ocrResponse.invoice.amount) setValue('amount', ocrResponse.invoice.amount)
    if (ocrResponse.invoice.invoiceNumber) setValue('invoiceNumber', ocrResponse.invoice.invoiceNumber)
    if (ocrResponse.invoice.invoiceDate) {
      setValue('invoiceDate', dayjs(dayjs(ocrResponse.invoice.invoiceDate).utc().format('YYYY-MM-DD')).toDate())
    }
    if (ocrResponse.invoice.dueDate) {
      setValue('dueDate', dayjs(dayjs(ocrResponse.invoice.dueDate).utc().format('YYYY-MM-DD')).toDate())
    }
    if (ocrResponse.invoice.currency) setValue('currency', ocrResponse.invoice.currency)
    if (ocrResponse.invoice.metadata) setValue('metadata', ocrResponse.invoice.metadata)
    if (ocrResponse.invoice.taxAmount) setValue('taxAmount', ocrResponse.invoice.taxAmount)
    if (ocrResponse.invoice.shippingAmount) setValue('shippingAmount', ocrResponse.invoice.shippingAmount)
    if (
      ocrResponse.invoice.lineItems &&
      mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled
    ) {
      const ocrResponseLineItems = ocrResponse.invoice.lineItems.map((lineItem) => ({
        description: lineItem.description ?? '',
        currency: lineItem.currency ?? 'USD',
        amount: lineItem.amount ?? 0,
        quantity: lineItem.quantity ?? 0,
        unitPrice: lineItem.unitPrice ?? 0,
        name: lineItem.name ?? '',
        metadata: lineItem.metadata ?? {},
        glAccountId: lineItem.glAccountId ?? '',
        category: lineItem.category ?? 'EXPENSE',
        id: lineItem.id ?? '',
        createdAt: lineItem.createdAt ?? new Date(),
        updatedAt: lineItem.updatedAt ?? new Date(),
      }))
      setValue('lineItems', ocrResponseLineItems)
    }

    if (ocrResponse.bankAccount) {
      setValue('newBankAccount', {
        routingNumber: ocrResponse.bankAccount.routingNumber,
        accountNumber: ocrResponse.bankAccount.accountNumber,
        bankName: ocrResponse.bankAccount.bankName,
        accountType: Mercoa.BankType.Checking,
      })
    }

    if (ocrResponse.check) {
      setValue('newCheck', {
        addressLine1: ocrResponse.check.addressLine1,
        addressLine2: ocrResponse.check.addressLine2 ?? '',
        city: ocrResponse.check.city,
        state: ocrResponse.check.stateOrProvince,
        postalCode: ocrResponse.check.postalCode,
        country: 'US',
        payToTheOrderOf: ocrResponse.check.payToTheOrderOf,
      })
    }

    if (ocrResponse.vendor.id === 'new' && mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
      mercoaSession.debug('new vendor creation disabled')
    } else if (ocrResponse.vendor.id) {
      setSelectedVendor(ocrResponse.vendor)
    }
    setOcrResponse(undefined)
  }, [activeOcrJobId, invoiceData, invoiceData?.ocrJobId, invoiceData?.vendor, mercoaSession, ocrResponse, setValue])

  useEffect(() => {
    if (useDocumentOnce.current === true && documents) {
      setInvoiceDocuments(
        documents.map((document) => {
          return {
            fileReaderObj: document.uri,
            mimeType: document.mimeType,
          }
        }),
      )
      useDocumentOnce.current = false
    }
  }, [documents])

  useEffect(() => {
    // Early exit if no active OCR job ID to prevent infinite loop
    if (!activeOcrJobId) return

    if (!!ocrJob && activeOcrJobId === ocrJob.data?.jobId) {
      if (ocrJob.status === Mercoa.OcrJobStatus.Success) {
        if (ocrJob.data && onOcrComplete) {
          setActiveOcrJobId(undefined)
          onOcrComplete(ocrJob.data).then((response) => {
            setOcrResponse(response)
            setOcrProcessing(false)
          })
        } else {
          setActiveOcrJobId(undefined)
          setOcrResponse(ocrJob.data)
          setOcrProcessing(false)
        }
        return
      }
      if (ocrJob.status === Mercoa.OcrJobStatus.Failed) {
        toast?.error('OCR failed')
        setOcrProcessing(false)
        setActiveOcrJobId(undefined)
        return
      }
    }
  }, [ocrJob, toast, activeOcrJobId, onOcrComplete])

  useEffect(() => {
    if (!invoiceOcrJob?.data) return
    setOcrResponse({
      jobId: invoiceOcrJob.data?.jobId ?? '',
      vendor: invoiceOcrJob.data?.vendor,
      check: invoiceOcrJob.data?.check,
      bankAccount: invoiceOcrJob.data?.bankAccount,
      invoice: {} as any,
    })
  }, [invoiceOcrJob])

  useEffect(() => {
    if (paymentSourceType === 'bnpl' && !bnplDefermentWeeks) {
      setValue('paymentSourceOptions', {
        type: 'bnpl',
        installmentsStartDate: '',
        defermentWeeks: 4,
        acceptedTerms: false,
      })
    }
  }, [bnplDefermentWeeks, paymentSourceType, setValue])

  const setMethodOnTypeChange = useCallback(
    (isDestination: boolean, selectedType: Mercoa.PaymentMethodType | string) => {
      const sourceOrDestination = isDestination ? 'paymentDestinationId' : 'paymentSourceId'
      const paymentMethods = (isDestination ? paymentMethodsDestination : paymentMethodsSource) ?? []
      const backupDisbursement = mercoaSession.organization?.paymentMethods?.backupDisbursements.find((e) => {
        if (!e.active) return false
        if (e.type === 'custom') return e.name === selectedType
        return e.type === selectedType
      })
      if (isDestination) {
        setValue('paymentDestinationOptions', undefined)
      }
      if (!isDestination) {
        setValue('paymentSourceOptions', undefined)
      }
      if (selectedType === Mercoa.PaymentMethodType.BankAccount || selectedType === Mercoa.PaymentMethodType.Bnpl) {
        const account = paymentMethods.find(
          (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount,
        ) as Mercoa.PaymentMethodResponse.BankAccount
        setValue(sourceOrDestination, account?.id)
        if (isDestination) {
          setValue('paymentDestinationOptions', {
            type: 'bankAccount',
            delivery: (backupDisbursement as Mercoa.PaymentRailResponse.BankAccount)?.defaultDeliveryMethod,
          })
        }
      } else if (selectedType === Mercoa.PaymentMethodType.Card) {
        setValue(
          sourceOrDestination,
          paymentMethods.find((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Card)?.id,
        )
      } else if (selectedType === Mercoa.PaymentMethodType.Check) {
        setValue(
          sourceOrDestination,
          paymentMethods.find((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Check)?.id,
        )
        if (isDestination) {
          setValue('paymentDestinationOptions', {
            type: 'check',
            delivery: (backupDisbursement as Mercoa.PaymentRailResponse.Check)?.defaultDeliveryMethod,
            printDescription: !!(backupDisbursement as Mercoa.PaymentRailResponse.Check)?.printDescription,
          })
        }
      } else if (selectedType === Mercoa.PaymentMethodType.Utility) {
        setValue(
          sourceOrDestination,
          paymentMethods.find((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Utility)?.id,
        )
      } else if (selectedType === Mercoa.PaymentMethodType.Wallet) {
        setValue(
          sourceOrDestination,
          paymentMethods.find((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Wallet)?.id,
        )
      } else if (selectedType === Mercoa.PaymentMethodType.OffPlatform) {
        const offPlatformMethod = paymentMethods.find(
          (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.OffPlatform,
        )
        if (offPlatformMethod) {
          setValue(sourceOrDestination, offPlatformMethod.id)
          setValue('paymentDestinationOptions', undefined)
        }
      } else {
        setValue(
          sourceOrDestination,
          paymentMethods.find(
            (paymentMethod) =>
              paymentMethod.type === Mercoa.PaymentMethodType.Custom && paymentMethod.schemaId === selectedType,
          )?.id,
        )
      }

      clearErrors(sourceOrDestination)
    },
    [
      paymentMethodsSource,
      paymentMethodsDestination,
      setValue,
      clearErrors,
      mercoaSession.organization?.paymentMethods?.backupDisbursements,
    ],
  )

  const getAvailablePaymentMethodTypes = useCallback(
    (isDestination: boolean = false) => {
      const paymentMethods = (isDestination ? paymentMethodsDestination : paymentMethodsSource) ?? []
      const availableTypes: Array<{ key: string; value: string }> = []

      if (paymentMethods?.some((paymentMethod) => paymentMethod.type === 'bankAccount')) {
        availableTypes.push({ key: 'bankAccount', value: 'Bank Account' })
      }
      if (paymentMethods?.some((paymentMethod) => paymentMethod.type === 'card')) {
        availableTypes.push({ key: 'card', value: 'Card' })
      }
      if (paymentMethods?.some((paymentMethod) => paymentMethod.type === 'check')) {
        availableTypes.push({ key: 'check', value: 'Check' })
      }
      if (paymentMethods?.some((paymentMethod) => paymentMethod.type === 'utility')) {
        availableTypes.push({ key: 'utility', value: 'Utility' })
      }
      if (paymentMethods?.some((paymentMethod) => paymentMethod.type === 'wallet')) {
        availableTypes.push({ key: 'wallet', value: 'Wallet' })
      }

      paymentMethods?.forEach((paymentMethod) => {
        if (paymentMethod.type === 'custom') {
          if (availableTypes.some((type) => type.key === paymentMethod.schemaId)) return
          availableTypes.push({ key: paymentMethod.schemaId ?? '', value: paymentMethod.schema.name ?? '' })
        }
      })

      if (isDestination && vendorId) {
        mercoaSession.organization?.paymentMethods?.backupDisbursements.forEach((backupDisbursement) => {
          if (!backupDisbursement.active) return
          if (
            availableTypes.some((type) => {
              if (type.key === backupDisbursement.type) return true
              if (backupDisbursement.type === 'custom') {
                const schema = mercoaSession.customPaymentMethodSchemas.find((e) => e.id == backupDisbursement.name)
                if (schema && type.key === schema.id) return true
              }
              return false
            })
          ) {
            return
          }

          if (backupDisbursement.type != 'custom')
            availableTypes.push({ key: backupDisbursement.type, value: backupDisbursement.name })
          else
            availableTypes.push({
              key: backupDisbursement.name,
              value:
                mercoaSession.customPaymentMethodSchemas.find((e) => e.id == backupDisbursement.name)?.name ?? 'Other',
            })
        })
      } else {
        const offPlatform = mercoaSession.organization?.paymentMethods?.payerPayments.find(
          (e) => e.type === 'offPlatform',
        )
        if (offPlatform && offPlatform.active) {
          availableTypes.push({
            key: offPlatform.type,
            value: offPlatform.name,
          })
        }
        const bnpl = mercoaSession.organization?.paymentMethods?.payerPayments.find((e) => e.type === 'bnpl')
        if (
          bnpl &&
          bnpl.active &&
          invoiceId &&
          mercoaSession.entity?.oatfiStatus === 'APPROVED' &&
          dueDate &&
          !dayjs(dueDate).isBefore(dayjs())
        ) {
          availableTypes.push({
            key: bnpl.type,
            value: 'Pay Later',
          })
        }
      }

      return availableTypes
    },
    [
      paymentMethodsDestination,
      paymentMethodsSource,
      mercoaSession.organization?.paymentMethods,
      invoiceId,
      mercoaSession.entity?.oatfiStatus,
      dueDate,
    ],
  )

  // Handle source payment method defaults
  useEffect(() => {
    if (!paymentMethodsSource || paymentSourceType) return
    // Check if payment source options contain BNPL
    const paymentSourceOptions = watch('paymentSourceOptions')
    if (paymentSourceOptions?.type === 'bnpl') {
      setValue('paymentSourceType', 'bnpl')
      return
    }

    // Check for default source payment method
    const defaultSourcePm = paymentMethodsSource?.find((e) => e.isDefaultSource)

    if (defaultSourcePm) {
      if (defaultSourcePm.type === 'custom') {
        setValue('paymentSourceType', defaultSourcePm.schemaId)
      } else {
        setValue('paymentSourceType', defaultSourcePm.type)
      }
      setValue('paymentSourceId', defaultSourcePm.id)
      clearErrors('paymentSourceId')
    } else {
      // Set sane source defaults
      if (
        paymentMethodsSource?.some((pm) => pm.type === 'bankAccount') &&
        getAvailablePaymentMethodTypes(false).some((e) => e.key === 'bankAccount')
      ) {
        setValue('paymentSourceType', 'bankAccount')
        setMethodOnTypeChange(false, 'bankAccount')
      } else if (
        paymentMethodsSource?.some((pm) => pm.type === 'card') &&
        getAvailablePaymentMethodTypes(false).some((e) => e.key === 'card')
      ) {
        setValue('paymentSourceType', 'card')
        setMethodOnTypeChange(false, 'card')
      } else if (
        paymentMethodsSource?.some((pm) => pm.type === 'utility') &&
        getAvailablePaymentMethodTypes(false).some((e) => e.key === 'utility')
      ) {
        setValue('paymentSourceType', 'utility')
        setMethodOnTypeChange(false, 'utility')
      } else if (
        paymentMethodsSource?.some((pm) => pm.type === 'offPlatform') &&
        getAvailablePaymentMethodTypes(false).some((e) => e.key === 'offPlatform')
      ) {
        setValue('paymentSourceType', 'offPlatform')
        setMethodOnTypeChange(false, 'offPlatform')
      } else if (paymentMethodsSource?.some((pm) => pm.type === 'custom')) {
        const cpm = paymentMethodsSource?.find((pm) => pm.type === 'custom') as Mercoa.PaymentMethodResponse.Custom
        if (cpm.schemaId && getAvailablePaymentMethodTypes(false).some((e) => e.key === cpm.schemaId)) {
          setValue('paymentSourceType', cpm.schemaId)
          setMethodOnTypeChange(false, cpm.schemaId)
        }
      }
    }
  }, [
    paymentMethodsSource,
    paymentSourceType,
    setValue,
    clearErrors,
    setMethodOnTypeChange,
    watch,
    getAvailablePaymentMethodTypes,
  ])

  // Handle destination payment method defaults
  useEffect(() => {
    if (!paymentMethodsDestination || paymentDestinationType) return

    // Check for default destination payment method
    const defaultDestPm = paymentMethodsDestination?.find((e) => e.isDefaultDestination)

    if (defaultDestPm) {
      if (defaultDestPm.type === 'custom') {
        setValue('paymentDestinationType', defaultDestPm.schemaId)
      } else {
        setValue('paymentDestinationType', defaultDestPm.type)
      }
      setValue('paymentDestinationId', defaultDestPm.id)
      clearErrors('paymentDestinationId')
    } else {
      // Set sane destination defaults
      if (
        paymentMethodsDestination?.some((pm) => pm.type === 'bankAccount') &&
        getAvailablePaymentMethodTypes(true).some((e) => e.key === 'bankAccount')
      ) {
        setValue('paymentDestinationType', 'bankAccount')
        setMethodOnTypeChange(true, 'bankAccount')
      } else if (
        paymentMethodsDestination?.some((pm) => pm.type === 'check') &&
        getAvailablePaymentMethodTypes(true).some((e) => e.key === 'check')
      ) {
        setValue('paymentDestinationType', 'check')
        setMethodOnTypeChange(true, 'check')
      } else if (
        paymentMethodsDestination?.some((pm) => pm.type === 'utility') &&
        getAvailablePaymentMethodTypes(true).some((e) => e.key === 'utility')
      ) {
        setValue('paymentDestinationType', 'utility')
        setMethodOnTypeChange(true, 'utility')
      } else if (
        paymentMethodsDestination?.some((pm) => pm.type === 'offPlatform') &&
        getAvailablePaymentMethodTypes(true).some((e) => e.key === 'offPlatform')
      ) {
        setValue('paymentDestinationType', 'offPlatform')
        setMethodOnTypeChange(true, 'offPlatform')
      } else if (paymentMethodsDestination?.some((pm) => pm.type === 'custom')) {
        const cpm = paymentMethodsDestination?.find((pm) => pm.type === 'custom') as Mercoa.PaymentMethodResponse.Custom
        if (cpm.schemaId && getAvailablePaymentMethodTypes(true).some((e) => e.key === cpm.schemaId)) {
          setValue('paymentDestinationType', cpm.schemaId)
          setMethodOnTypeChange(true, cpm.schemaId)
        }
      }
    }
  }, [
    paymentMethodsDestination,
    paymentDestinationType,
    setValue,
    clearErrors,
    setMethodOnTypeChange,
    getAvailablePaymentMethodTypes,
  ])

  // If selected type is custom, find the schema for both source and destination
  useEffect(() => {
    // Handle source custom payment method
    if (selectedSourceType === Mercoa.PaymentMethodType.Custom) {
      const sourcePaymentMethod = paymentMethodsSource?.find(
        (paymentMethod) =>
          paymentMethod.type === Mercoa.PaymentMethodType.Custom && paymentMethod.id === selectedSourcePaymentMethodId,
      ) as Mercoa.PaymentMethodResponse.Custom
      if (sourcePaymentMethod?.schemaId) {
        setValue('paymentSourceType', sourcePaymentMethod.schemaId)
      }
    }

    // Handle destination custom payment method
    if (selectedDestinationType === Mercoa.PaymentMethodType.Custom) {
      const destinationPaymentMethod = paymentMethodsDestination?.find(
        (paymentMethod) =>
          paymentMethod.type === Mercoa.PaymentMethodType.Custom &&
          paymentMethod.id === selectedDestinationPaymentMethodId,
      ) as Mercoa.PaymentMethodResponse.Custom
      if (destinationPaymentMethod?.schemaId) {
        setValue('paymentDestinationType', destinationPaymentMethod.schemaId)
      }
    }
  }, [
    selectedSourceType,
    selectedDestinationType,
    paymentMethodsSource,
    paymentMethodsDestination,
    selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId,
    setValue,
  ])

  // Handle bank account check options for source
  useEffect(() => {
    if (selectedSourceType === Mercoa.PaymentMethodType.BankAccount) {
      const bankAccount = paymentMethodsSource?.find(
        (paymentMethod) => paymentMethod.id === selectedSourcePaymentMethodId,
      ) as Mercoa.PaymentMethodResponse.BankAccount
      if (bankAccount) {
        setValue('paymentSourceCheckEnabled', bankAccount?.checkOptions?.enabled ?? false)
      }
    }
  }, [selectedSourceType, paymentMethodsSource, selectedSourcePaymentMethodId, setValue])

  // Auto-sync destination to offPlatform when source is offPlatform
  useEffect(() => {
    if (
      paymentSourceType === Mercoa.PaymentMethodType.OffPlatform &&
      paymentDestinationType !== Mercoa.PaymentMethodType.OffPlatform &&
      vendorId
    ) {
      // Check if vendor already has an off-platform payment method
      const existingOffPlatformMethod = paymentMethodsDestination?.find(
        (pm) => pm.type === Mercoa.PaymentMethodType.OffPlatform
      )
      
      if (existingOffPlatformMethod) {
        // Use existing off-platform method
        setValue('paymentDestinationType', Mercoa.PaymentMethodType.OffPlatform)
        setMethodOnTypeChange(true, 'offPlatform')
      } else {
        // Create off-platform payment method for vendor
        mercoaSession.client?.entity.paymentMethod
          .create(vendorId, {
            type: Mercoa.PaymentMethodType.OffPlatform,
          })
          .then((resp) => {
            if (resp) {
              // Refresh payment methods and set the new one
              queryClient.invalidateQueries({ queryKey: ['paymentMethods', vendorId] })
              setValue('paymentDestinationType', Mercoa.PaymentMethodType.OffPlatform)
              setValue('paymentDestinationId', resp.id)
              clearErrors('paymentDestinationId')
            }
          })
          .catch((error) => {
            console.error('Failed to create off-platform payment method for vendor:', error)
          })
      }
    }
  }, [paymentSourceType, paymentDestinationType, paymentMethodsDestination, vendorId, setValue, setMethodOnTypeChange, mercoaSession.client, queryClient, clearErrors])

  const finalSupportedCurrencies = useMemo(() => {
    let derivedSupportedCurrencies: Mercoa.CurrencyCode[] = []

    const hasMercoaPaymentRails = mercoaSession.organization?.paymentMethods?.payerPayments.some(
      (p) => p.active && (p.type === 'bankAccount' || p.type === 'card'),
    )

    if (hasMercoaPaymentRails) {
      derivedSupportedCurrencies.push('USD')
    }

    mercoaSession.customPaymentMethodSchemas.forEach((p) => {
      if (p.supportedCurrencies) {
        derivedSupportedCurrencies = [...new Set([...derivedSupportedCurrencies, ...p.supportedCurrencies])]
      }
    })

    return [...new Set([...derivedSupportedCurrencies, ...(supportedCurrencies ?? [])])]
  }, [
    mercoaSession.customPaymentMethodSchemas,
    mercoaSession.organization?.paymentMethods?.payerPayments,
    supportedCurrencies,
  ])

  useEffect(() => {
    if (currency) return
    if (finalSupportedCurrencies.length > 0) {
      setValue('currency', finalSupportedCurrencies[0])
    }
  }, [finalSupportedCurrencies, currency, setValue])

  useEffect(() => {
    if (selectedVendor && selectedVendor.id !== 'new') {
      onCounterpartySelect?.(selectedVendor)
    }
  }, [selectedVendor])

  useEffect(() => {
    approvers.forEach((approverSlot, index) => {
      const policy = (approvalPolicy as Mercoa.ApprovalPolicyResponse[]).find(
        (e) => e.id === approverSlot.approvalPolicyId,
      )
      if (policy?.rule.type === 'approver' && policy?.rule.autoAssign && !approverSlot.assignedUserId) {
        setValue(`approvers.${index}.assignedUserId`, 'ANY')
      }
    })
  }, [approvalPolicy, approvers, setValue])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setValue('formAction', '')
    }
  }, [errors, setValue])

  const handleFormAction = (formData: PayableFormData, action: PayableFormAction) => {
    mercoaSession.debug('handleFormAction', formData, action)
    setIsLoading(true)
    if (!mercoaSession.token) return
    if (!mercoaSession.entity?.id && !mercoaSession.entityGroup?.id) return

    if (
      action &&
      [
        PayableFormAction.CANCEL,
        PayableFormAction.ARCHIVE,
        PayableFormAction.PRINT_CHECK,
        PayableFormAction.VOID_CHECK,
        PayableFormAction.DELETE,
        PayableFormAction.COMMENT,
        PayableFormAction.CREATE_COUNTERPARTY_ACCOUNT,
        PayableFormAction.CREATE_UPDATE_COUNTERPARTY,
        PayableFormAction.CREATE_UPDATE_COUNTERPARTY_AND_SEND_ONBOARDING_LINK,
        PayableFormAction.CREATE_BANK_ACCOUNT,
        PayableFormAction.CREATE_CHECK,
        PayableFormAction.CREATE_CUSTOM,
      ].includes(action)
    ) {
      handleSecondaryActions(formData, action)
    } else {
      handleCreateOrUpdatePayable(formData, action)
    }
  }

  const refreshPayables = () => {
    queryClient.invalidateQueries({ queryKey: ['payables'] })
    queryClient.invalidateQueries({ queryKey: ['recurringPayables'] })
    queryClient.invalidateQueries({ queryKey: ['payableStatusTabsMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['payableMetrics'] })
  }

  const refreshInvoice = useCallback(
    (invoiceId: string) => {
      queryClient.invalidateQueries({ queryKey: ['payableDetail', invoiceId, invoiceType] })
      queryClient.invalidateQueries({ queryKey: ['payableEvents', invoiceId] })
      refreshPayables()
    },
    [invoiceType],
  )

  const refreshPaymentMethods = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['paymentMethods', payerId] })
    queryClient.invalidateQueries({ queryKey: ['paymentMethods', vendorId] })
  }, [payerId, vendorId])

  const handleCreateOrUpdatePayable = async (formData: PayableFormData, action: PayableFormAction) => {
    const request: Mercoa.InvoiceCreationRequest | false = await payableFormUtils.validateAndConstructPayload({
      formData,
      setError,
      invoice: invoiceData,
      mercoaSession,
      uploadedDocument,
      toast: toast,
      saveAsStatus: action ? payableFormUtils.getNextInvoiceStatus(action, mercoaSession) : Mercoa.InvoiceStatus.Draft,
      selectedVendor,
      action,
    })

    if (!request) {
      setIsLoading(false)
      setValue('formAction', '')
      return
    }

    const requestPayload: Mercoa.InvoiceCreationRequest | false = await (async () => {
      try {
        return onInvoicePreSubmit ? await onInvoicePreSubmit(request) : request
      } catch (error) {
        console.error(error)
        return false
      }
    })()

    if (!requestPayload) {
      setIsLoading(false)
      setValue('formAction', '')
      return
    }

    invoiceData
      ? updatePayable(
          {
            invoice: invoiceData,
            invoiceType: invoiceType ?? 'invoice',
            requestPayload,
          },
          {
            onSuccess: (res) => {
              if (action && [PayableFormAction.APPROVE, PayableFormAction.REJECT].includes(action)) {
                handleApproveOrRejectPayable(res as Mercoa.InvoiceResponse, action)
              } else {
                toast?.success('Invoice updated')
                onInvoiceUpdate?.(res as Mercoa.InvoiceResponse)
                setUploadedDocument(undefined)
                onInvoiceSubmit?.(res as Mercoa.InvoiceResponse)
                setIsLoading(false)
                setValue('formAction', '')
              }
            },
            onError: async (e) => {
              // Check if this is an invoice number conflict error
              if (e.message && typeof e.message === 'string' && e.message.includes('Invoice number already exists')) {
                setError('invoiceNumber', {
                  type: 'manual',
                  message: 'This invoice number already exists for this vendor.',
                })
                setIsLoading(false)
                setValue('formAction', '')
                return
              }

              // if we are trying to approve or reject, just try that directly
              if (action && [PayableFormAction.APPROVE, PayableFormAction.REJECT].includes(action)) {
                try {
                  handleApproveOrRejectPayable(invoiceData, action)
                } catch (error) {
                  console.error(e)
                  toast?.error(e.message)
                }
                return
              }
              toast?.error(e.message)
              if (requestPayload.status === 'NEW') {
                requestPayload.status = 'DRAFT'
                updatePayable(
                  {
                    invoice: invoiceData,
                    invoiceType: invoiceType ?? 'invoice',
                    requestPayload,
                  },
                  {
                    onSuccess: (res) => {
                      setUploadedDocument(undefined)
                      setIsLoading(false)
                      setValue('formAction', '')
                    },
                    onError: (e) => {
                      // Check if this is an invoice number conflict error
                      if (
                        e.message &&
                        typeof e.message === 'string' &&
                        e.message.includes('Invoice number already exists')
                      ) {
                        setError('invoiceNumber', {
                          type: 'manual',
                          message: 'This invoice number already exists for this vendor.',
                        })
                        setIsLoading(false)
                        setValue('formAction', '')
                        return
                      }

                      console.error(e.message, e.reasons)
                      setIsLoading(false)
                      setValue('formAction', '')
                    },
                  },
                )
              } else {
                console.error(e)
                // toast?.error(e.message)
                setIsLoading(false)
                setValue('formAction', '')
              }
            },
          },
        )
      : createPayable(
          {
            invoice: requestPayload,
            invoiceType: invoiceType ?? 'invoice',
          },
          {
            onSuccess: (res) => {
              setIsLoading(false)
              setValue('formAction', '')
              mercoaSession.debug('invoice/create API response: ', res)
              toast?.success('Invoice created')
              onInvoiceSubmit?.(res)
              onInvoiceUpdate?.(res)
              if (action && [PayableFormAction.APPROVE, PayableFormAction.REJECT].includes(action)) {
                handleApproveOrRejectPayable(res, action)
              }
            },
            onError: (e: any) => {
              // Check if this is an invoice number conflict error
              if (e.message && typeof e.message === 'string' && e.message.includes('Invoice number already exists')) {
                setError('invoiceNumber', {
                  type: 'manual',
                  message: 'This invoice number already exists. Please choose a different number.',
                })
                setIsLoading(false)
                setValue('formAction', '')
                return
              }

              setIsLoading(false)
              setValue('formAction', '')
              console.error(e.message, e.reasons)
              toast?.error(e.message)
            },
          },
        )
  }

  const handleApproveOrRejectPayable = async (invoice: Mercoa.InvoiceResponse, action: PayableFormAction) => {
    if (action === PayableFormAction.APPROVE) {
      approvePayable(
        { invoice, invoiceType: invoiceType ?? 'invoice', toast },
        {
          onSuccess: async () => {
            setIsLoading(false)
            setValue('formAction', '')
            const updatedInvoice = await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.get(invoice.id)
            onInvoiceUpdate?.(updatedInvoice)
          },
          onError: (e) => {
            setIsLoading(false)
            setValue('formAction', '')
          },
        },
      )
    } else {
      rejectPayable(
        { invoice, invoiceType: invoiceType ?? 'invoice', toast },
        {
          onSuccess: async () => {
            setIsLoading(false)
            setValue('formAction', '')
            const updatedInvoice = await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.get(invoice.id)
            onInvoiceUpdate?.(updatedInvoice)
          },
          onError: (e) => {
            setIsLoading(false)
            setValue('formAction', '')
          },
        },
      )
    }
  }

  const handleSecondaryActions = async (data: any, action?: PayableFormAction) => {
    if (action === PayableFormAction.CANCEL) {
      if (confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) {
        try {
          await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.update(data.id, {
            status: Mercoa.InvoiceStatus.Canceled,
          })
        } catch (e: any) {
          toast?.error(`Failed to cancel invoice: ${e.body ?? e.message}`)
        }
      }
      setIsLoading(false)
      setValue('formAction', '')
      refreshInvoice(data?.id ?? '')
      return
    } else if (action === PayableFormAction.ARCHIVE) {
      if (confirm('Are you sure you want to archive this invoice? This cannot be undone.')) {
        await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.update(data.id, {
          status: Mercoa.InvoiceStatus.Archived,
        })
      }
      setIsLoading(false)
      setValue('formAction', '')
      refreshInvoice(data?.id ?? '')
      return
    } else if (
      action === PayableFormAction.CREATE_UPDATE_COUNTERPARTY ||
      action === PayableFormAction.CREATE_UPDATE_COUNTERPARTY_AND_SEND_ONBOARDING_LINK
    ) {
      if (!mercoaSession.entity?.id) return
      let profile = createCounterpartyRequest({ data: data.vendor, setError, type: 'payee' })
      if (!duplicateVendorInfo && profile) {
        const duplicateCheck = await findExistingCounterparties({
          entityId: mercoaSession.entity?.id,
          mercoaSession,
          type: 'payee',
          entityRequest: profile,
        })

        if (duplicateCheck?.duplicates) {
          setDuplicateVendorInfo({
            duplicates: duplicateCheck.duplicates,
            foundType: duplicateCheck.foundType! as any,
            foundString: duplicateCheck.foundString!,
            type: 'payee',
          })
          setDuplicateVendorModalOpen(true)
          setIsLoading(false)
          setValue('formAction', '')
          return
        }
      }
      mercoaSession.debug(`create update counterparty ${data.vendor}`)

      if (onCounterpartyPreSubmit) {
        profile = await onCounterpartyPreSubmit(profile, data.vendor.id)
      }
      if (data.vendor && profile) {
        try {
          await onSubmitCounterparty({
            data: data.vendor,
            mercoaSession,
            type: 'payee',
            profile,
            onSelect: async (counterparty) => {
              await mercoaSession.refresh()
              setTimeout(() => {
                mercoaSession.debug('counterparty', counterparty)
                setSelectedVendor(counterparty)
                if (action === PayableFormAction.CREATE_UPDATE_COUNTERPARTY_AND_SEND_ONBOARDING_LINK && counterparty) {
                  mercoaSession.client?.entity.sendOnboardingLink(counterparty.id, {
                    type: 'PAYEE',
                  })
                }
                setValue('formAction', PayableFormAction.CLOSE_INLINE_FORM)
              }, 100)
            },
          })
          setValue('formAction', '')
          setIsLoading(false)
          setDuplicateVendorInfo(undefined)
        } catch (e: any) {
          toast?.error(e.body ?? 'Error creating/updating counterparty')
          setError('vendor', { message: e.body ?? 'Error creating/updating counterparty' })
          setValue('formAction', '')
          setIsLoading(false)
          setDuplicateVendorInfo(undefined)
        }
      } else {
        await mercoaSession.refresh()
        setTimeout(() => {
          setSelectedVendor(undefined)
        }, 100)
      }
      return
    }
    // payment method creation for vendor
    else if (action === PayableFormAction.CREATE_BANK_ACCOUNT) {
      if (vendorId) {
        try {
          const pm = await mercoaSession.client?.entity.paymentMethod.create(vendorId, {
            type: Mercoa.PaymentMethodType.BankAccount,
            routingNumber: data.newBankAccount.routingNumber,
            accountNumber: data.newBankAccount.accountNumber,
            accountType: data.newBankAccount.accountType,
          })
          await mercoaSession.refresh()
          refreshPaymentMethods()
          setTimeout(() => {
            setValue('paymentDestinationType', Mercoa.PaymentMethodType.BankAccount, { shouldDirty: true })
            setValue('paymentDestinationId', pm?.id, { shouldDirty: true })
            setValue('formAction', PayableFormAction.CLOSE_INLINE_FORM)
          }, 100)
        } catch (e: any) {
          setError('newBankAccount', { message: e.body ?? 'Invalid Bank Account Data' })
          setIsLoading(false)
          setValue('formAction', '')
        }
        return
      }
    } else if (action === PayableFormAction.CREATE_COUNTERPARTY_ACCOUNT) {
      if (mercoaSession.entity?.id && vendorId) {
        try {
          const resp = await mercoaSession.client?.entity.counterparty.findPayees(mercoaSession.entity.id, {
            counterpartyId: vendorId,
          })
          let accounts = resp?.data[0].accounts
          if (accounts) {
            accounts?.push({
              accountId: data.newCounterpartyAccount?.accountId,
              postalCode: data.newCounterpartyAccount?.postalCode,
              nameOnAccount: data.newCounterpartyAccount?.nameOnAccount,
            })
          } else {
            accounts = [
              {
                accountId: data.newCounterpartyAccount?.accountId,
                postalCode: data.newCounterpartyAccount?.postalCode,
                nameOnAccount: data.newCounterpartyAccount?.nameOnAccount,
              },
            ]
          }
          await mercoaSession.client?.entity.counterparty.addPayees(mercoaSession.entity.id, {
            payees: [vendorId],
            customizations: [
              {
                counterpartyId: vendorId,
                accounts,
              },
            ],
          })
          await mercoaSession.refresh()

          setValue('vendor.accounts', accounts)

          setTimeout(() => {
            setValue('formAction', PayableFormAction.CLOSE_INLINE_FORM)
            setValue('newCounterpartyAccount', {
              accountId: '',
              postalCode: '',
              nameOnAccount: '',
            })
            setTimeout(() => {
              setValue('paymentDestinationType', Mercoa.PaymentMethodType.Utility, { shouldDirty: true })
              setValue('paymentDestinationOptions', {
                type: 'utility',
                accountId: data.newCounterpartyAccount.accountId,
              })
            }, 100)
          }, 100)
        } catch (e: any) {
          setError('vendor', { message: e.body ?? 'Invalid Utility Account Data' })
          setValue('formAction', '')
          setIsLoading(false)
        }
        return
      }
    } else if (action === PayableFormAction.CREATE_CHECK) {
      if (vendorId) {
        try {
          const pm = await mercoaSession.client?.entity.paymentMethod.create(vendorId, {
            type: Mercoa.PaymentMethodType.Check,
            payToTheOrderOf: data.newCheck.payToTheOrderOf,
            addressLine1: data.newCheck.addressLine1,
            addressLine2: data.newCheck.addressLine2,
            city: data.newCheck.city,
            stateOrProvince: data.newCheck.stateOrProvince,
            postalCode: data.newCheck.postalCode,
            country: 'US',
          })
          mercoaSession.refresh()
          refreshPaymentMethods()
          setTimeout(() => {
            setValue('paymentDestinationType', Mercoa.PaymentMethodType.Check, { shouldDirty: true })
            setValue('paymentDestinationId', pm?.id, { shouldDirty: true })
            setValue('formAction', PayableFormAction.CLOSE_INLINE_FORM)
          }, 1000)
        } catch (e: any) {
          setError('newCheck', { message: e.body ?? 'Invalid Check Data' })
          setIsLoading(false)
          setValue('formAction', '')
        }
        return
      }
    } else if (action === PayableFormAction.CREATE_CUSTOM) {
      if (vendorId) {
        const filtered: Record<string, string> = {}
        Object.entries(data['~cpm~~']).forEach(([key, value]: [string, any]) => {
          if (typeof value === 'string') {
            filtered[key] = value
          } else {
            Object.entries(value).forEach(([subKey, value]: [string, any]) => {
              if (subKey === 'full') {
                filtered[key] = value
              } else {
                filtered[key + '.' + subKey] = value
              }
            })
          }
        })
        try {
          const pm = (await mercoaSession.client?.entity.paymentMethod.create(vendorId, {
            type: Mercoa.PaymentMethodType.Custom,
            schemaId: data.paymentDestinationType ?? '',
            data: filtered,
          })) as Mercoa.PaymentMethodResponse.Custom
          await mercoaSession.refresh()
          refreshPaymentMethods()
          setTimeout(() => {
            setValue('paymentDestinationType', pm.schemaId, { shouldDirty: true })
            setValue('paymentDestinationId', pm.id, { shouldDirty: true })
            setValue('formAction', PayableFormAction.CLOSE_INLINE_FORM)
          }, 100)
        } catch (e: any) {
          setError('~cpm~~', { message: e.body ?? 'Invalid Data' })
          setIsLoading(false)
          setValue('formAction', '')
        }
        return
      }
    } else if (action === PayableFormAction.DELETE) {
      if (invoiceData?.id) {
        try {
          if (confirm('Are you sure you want to delete this invoice? This cannot be undone.')) {
            await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.delete(invoiceData.id)
            toast?.success('Invoice deleted')
            if (onInvoiceUpdate) onInvoiceUpdate(undefined)
          }
          setIsLoading(false)
          setValue('formAction', '')
          refreshPayables()
          return
        } catch (e: any) {
          console.error(e)
          toast?.error(`There was an error deleting the invoice.\n Error: ${e.body}`)
          setIsLoading(false)
          setValue('formAction', '')
        }
      }
      return
    } else if (action === PayableFormAction.PRINT_CHECK) {
      if (!invoiceData?.id) return
      if (invoiceData.status !== 'PAID' && invoiceData.status !== 'ARCHIVED') {
        if (confirm('Do you want to create a printable check? This will mark the invoice as paid cannot be undone.')) {
          let requestPayload: Mercoa.InvoiceCreationRequest | false =
            await payableFormUtils.validateAndConstructPayload({
              formData: data,
              setError,
              invoice: invoiceData,
              mercoaSession,
              uploadedDocument,
              toast: toast,
              saveAsStatus: action
                ? payableFormUtils.getNextInvoiceStatus(action, mercoaSession)
                : Mercoa.InvoiceStatus.Draft,
              selectedVendor,
              action,
            })

          if (!requestPayload) {
            setIsLoading(false)
            setValue('formAction', '')
            return
          }

          const resp = await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.update(invoiceData?.id, {
            ...requestPayload,
            status: Mercoa.InvoiceStatus.Paid,
            paymentDestinationOptions: {
              type: 'check',
              delivery: 'PRINT',
            },
          })
          if (resp) {
            toast?.success('Invoice marked as paid. Live check created.')
            setIsLoading(false)
            setValue('formAction', '')
            refreshInvoice(invoiceData.id)
          }
        } else {
          toast?.success('VOID check created')
        }
      }

      const pdf = await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.document.generateCheckPdf(
        invoiceData.id,
      )
      if (pdf) {
        window.open(pdf.uri, '_blank')
      } else {
        toast?.error('There was an error generating the check PDF')
        setIsLoading(false)
        setValue('formAction', '')
      }
      return
    } else if (action === PayableFormAction.VOID_CHECK) {
      if (!invoiceData?.id) return
      if (invoiceData.status !== Mercoa.InvoiceStatus.Paid) {
        toast?.error('Only paid invoices can be voided')
        setIsLoading(false)
        setValue('formAction', '')
        return
      }

      try {
        await getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')?.update(invoiceData.id, {
          status: Mercoa.InvoiceStatus.Failed,
        })
        toast?.success('Check voided successfully')
        refreshInvoice(invoiceData.id)
      } catch (error: any) {
        toast?.error(`Failed to void check: ${error.body ?? error.message}`)
      }

      setIsLoading(false)
      setValue('formAction', '')
      return
    } else if (action === PayableFormAction.COMMENT) {
      if (!mercoaSession.token || !invoiceData?.id) return
      if (!data.commentText) return
      try {
        const comment = await mercoaSession.client?.invoice.comment.create(invoiceData.id, {
          text: data.commentText,
          userId: mercoaSession.user?.id,
        })
        if (comment) {
          setValue('comments', [...(invoiceData?.comments ?? []), comment])
          setValue('commentText', '')
          setIsLoading(false)
          setValue('formAction', '')
        } else {
          toast?.error('There was an error creating the comment')
          setIsLoading(false)
          setValue('formAction', '')
        }
      } catch (error: any) {
        console.error('Error creating comment:', error)
        toast?.error(`Failed to create comment: ${error.message}`)
        setIsLoading(false)
        setValue('formAction', '')
      }
      return
    }
  }

  const getVendorPaymentLink = async () => {
    if (!invoiceData?.id) return
    try {
      const url = await mercoaSession.client?.invoice.paymentLinks.getVendorLink(invoiceData.id)
      return url
    } catch (e) {
      console.error(e)
      toast?.error(`There was an error getting the payment link.`)
      return
    }
  }

  const handleFileUpload = useCallback(
    (fileReaderObj: string, mimeType: string) => {
      setUploadedDocument(fileReaderObj)
      setOcrProcessing(true)
      setInvoiceDocuments([{ fileReaderObj, mimeType }])
      runOcr(
        { fileReaderObj, mimeType },
        {
          onSuccess: (resp) => {
            setActiveOcrJobId(resp.jobId)
          },
          onError: () => {
            toast?.error('OCR failed')
            setOcrProcessing(false)
          },
        },
      )
    },
    [runOcr, toast],
  )

  const filteredMetadata = useMemo(
    () => mercoaSession.organization?.metadataSchema?.filter((schema) => schema.lineItem) ?? [],
    [mercoaSession.organization?.metadataSchema],
  )

  const filteredComments = comments?.filter((comment) => comment.text || comment.associatedApprovalAction) ?? []

  const initialCreationComment = {
    id: '',
    createdAt: invoiceData?.createdAt ?? new Date(),
    updatedAt: invoiceData?.createdAt ?? new Date(),
    user: {
      id: '',
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    text: '',
    associatedApprovalAction: {
      action: Mercoa.ApproverAction.None,
      userId: '',
    },
  }

  const addItem = () => {
    append({
      id: `li-${Math.random()}`,
      name: '',
      description: `Line Item ${(lineItems?.length ?? 0) + 1}`,
      amount: 0,
      unitPrice: 0,
      quantity: 1,
      currency: currency,
      category: 'EXPENSE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const updateItem = (index: number, item: Mercoa.InvoiceLineItemUpdateRequest, id?: string) => {
    if (id) {
      const index = lineItems.findIndex((ele) => ele.id === id)
      if (index !== -1) {
        setValue(`lineItems.${index}`, item as Mercoa.InvoiceLineItemResponse)
      }
    } else {
      setValue(`lineItems.${index}`, item as Mercoa.InvoiceLineItemResponse)
    }
  }

  const removeItem = (index: number, id?: string) => {
    if (id) {
      const index = lineItems.findIndex((ele) => ele.id === id)
      if (index !== -1) {
        remove(index)
      }
    } else {
      remove(index)
    }
  }

  const handleUpdateTotalAmount = useCallback(() => {
    if (!lineItems?.length) return
    const total = lineItems.reduce((sum, item) => sum + (item.amount ?? 0), 0)
    const calculatedTotal = total + (taxAmount ?? 0) + (shippingAmount ?? 0)

    if (calculatedTotal !== amount) {
      let amount = new Big(0)
      lineItems?.forEach((lineItem, index) => {
        if (typeof lineItem.amount === 'string' && (!lineItem.category || lineItem.category === 'EXPENSE')) {
          const cleanedAmount = (lineItem.amount as unknown as string).replace(/,/g, '')
          const parsedAmount = Number(cleanedAmount)
          if (!isNaN(parsedAmount)) {
            lineItem.amount = parsedAmount
          }
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lineItems), amount, taxAmount, shippingAmount])

  useEffect(() => {
    if (!lineItems?.length) return
    const total = lineItems.reduce((sum, item) => sum + (item.amount ?? 0), 0)
    const calculatedTotal = total + (taxAmount ?? 0) + (shippingAmount ?? 0)
    if (calculatedTotal !== amount) {
      let amount = new Big(0)
      lineItems?.forEach((lineItem, index) => {
        if (typeof lineItem.amount === 'string' && (!lineItem.category || lineItem.category === 'EXPENSE')) {
          const cleanedAmount = (lineItem.amount as unknown as string).replace(/,/g, '')
          const parsedAmount = Number(cleanedAmount)
          if (!isNaN(parsedAmount)) {
            lineItem.amount = parsedAmount
          }
        }
        if (!isNaN(Number(lineItem.amount))) {
          amount = amount.add(Number(lineItem.amount))
        }
      })

      if (taxAmount) {
        if (typeof taxAmount === 'string') {
          const cleanedTaxAmount = (taxAmount as unknown as string).replace(/,/g, '')
          const parsedTaxAmount = Number(cleanedTaxAmount)
          if (!isNaN(parsedTaxAmount)) {
            amount = amount.add(parsedTaxAmount)
          }
        } else if (!isNaN(Number(taxAmount))) {
          amount = amount.add(Number(taxAmount))
        }
      }

      if (shippingAmount) {
        if (typeof shippingAmount === 'string') {
          const cleanedShippingAmount = (shippingAmount as unknown as string).replace(/,/g, '')
          const parsedShippingAmount = Number(cleanedShippingAmount)
          if (!isNaN(parsedShippingAmount)) {
            amount = amount.add(parsedShippingAmount)
          }
        } else if (!isNaN(Number(shippingAmount))) {
          amount = amount.add(Number(shippingAmount))
        }
      }

      clearErrors('amount')
      setValue('amount', amount.toNumber())
      setFocus('amount')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lineItems), amount, taxAmount, shippingAmount, clearErrors, setValue, setFocus])

  const handleResize = useCallback(() => {
    setHeight(window.innerHeight - (heightOffset ?? 0))
  }, [heightOffset])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize, false)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [heightOffset, handleResize])

  const overviewContext: PayableOverviewContext = {
    currency,
    setCurrency: (currency: Mercoa.CurrencyCode) => setValue('currency', currency),
    supportedCurrencies: finalSupportedCurrencies,
    amount,
    setAmount: (amount: number) => setValue('amount', amount),
    description,
    setDescription: (description: string) => setValue('description', description),
    setDueDate: (dueDate: Date) => setValue('dueDate', dueDate),
    invoiceNumber,
    setInvoiceNumber: (invoiceNumber: string) => setValue('invoiceNumber', invoiceNumber),
    scheduledPaymentDate: deductionDate,
    setScheduledPaymentDate: (deductionDate: Date) => setValue('deductionDate', deductionDate),
    invoiceDate,
    setInvoiceDate: (invoiceDate: Date) => setValue('invoiceDate', invoiceDate),
    printDescriptionOnCheckRemittance: printDescriptionOnCheckRemittance ?? false,
    setPrintDescriptionOnCheckRemittance: (printDescriptionOnCheckRemittance: boolean) =>
      setValue('paymentDestinationOptions.printDescription', printDescriptionOnCheckRemittance),
  }

  const lineItemsContext: PayableLineItemsContext = {
    lineItems: lineItems,
    setLineItems: (lineItems: Mercoa.InvoiceLineItemUpdateRequest[]) =>
      setValue('lineItems', lineItems as Mercoa.InvoiceLineItemResponse[]),
    addItem,
    removeItem,
    updateItem,
    updateTotalAmount: handleUpdateTotalAmount,
    filteredMetadata,
  }

  const commentsContext: PayableCommentsContext = {
    comments: [initialCreationComment, ...filteredComments],
    commentText: watch('commentText'),
    setCommentText: (commentText: string) => setValue('commentText', commentText),
    addComment: () => {
      setValue('formAction', PayableFormAction.COMMENT)
    },
    getCommentAuthor: (comment: Mercoa.CommentResponse) => {
      return comment.user?.name ?? ''
    },
  }
  const metadataContext: PayableMetadataContext = {
    metadataSchemas: mercoaSession.organization?.metadataSchema ?? [],
    getSchemaMetadataValues: async (schema: Mercoa.MetadataSchema) => {
      const schemaMetadataValues = mercoaSession.entityId
        ? await mercoaSession.client?.entity.metadata.get(mercoaSession.entityId, schema.key)
        : []
      return filterMetadataValues(schemaMetadataValues ?? [], schema)
    },
    schemaFieldValue: (schemaKey: string) => {
      return watch(('metadata.' + schemaKey) as any) as string
    },
    setSchemaFieldValue: (schemaKey: string, value: string) => {
      setValue(('metadata.' + schemaKey) as any, value)
    },
  }

  const taxAndShippingContext: PayableTaxAndShippingContext = {
    taxAmount: watch('taxAmount'),
    setTaxAmount: (taxAmount: number) => setValue('taxAmount', taxAmount),
    shippingAmount: watch('shippingAmount'),
    setShippingAmount: (shippingAmount: number) => setValue('shippingAmount', shippingAmount),
  }

  const feesContext: PayableFeesContext = {
    fees,
    feesLoading,
  }

  const eventsContext: PayableEventsContext = {
    events: events?.data ?? [],
    eventsLoading,
    getEventAuthor: (event: Mercoa.InvoiceEvent) => {
      const user = mercoaSession.users.find((user) => user.id === event.userId)
      return user?.name ?? 'System'
    },
  }

  const vendorCreditContext: PayableVendorCreditContext = {
    vendorCreditUsage,
    vendorCreditUsageLoading,
  }

  const paymentTimingContext: PayablePaymentTimingContext = {
    paymentTiming,
    paymentTimingLoading,
  }

  const paymentMethodContext: PayablePaymentMethodContext = {
    sourcePaymentMethods: paymentMethodsSource,
    destinationPaymentMethods: paymentMethodsDestination,
    selectedSourcePaymentMethodId: selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId: selectedDestinationPaymentMethodId,
    showDestinationPaymentMethodConfirmation: showDestinationPaymentMethodConfirmation,
    setSelectedSourcePaymentMethodId: (paymentMethodId: string) => {
      setValue('paymentSourceId', paymentMethodId)
      clearErrors('paymentSourceId')
    },
    setSelectedDestinationPaymentMethodId: (paymentMethodId: string) => {
      setValue('paymentDestinationId', paymentMethodId)
      clearErrors('paymentDestinationId')
    },
    availableSourceTypes: getAvailablePaymentMethodTypes(),
    selectedSourceType: watch('paymentSourceType') as Mercoa.PaymentMethodType,
    setSelectedSourceType: (type: Mercoa.PaymentMethodType) => {
      setValue('paymentSourceType', type)
      setMethodOnTypeChange(false, type)
    },
    availableDestinationTypes: getAvailablePaymentMethodTypes(true),
    selectedDestinationType: watch('paymentDestinationType') as Mercoa.PaymentMethodType,
    setSelectedDestinationType: (type: Mercoa.PaymentMethodType) => {
      setValue('paymentDestinationType', type)
      setMethodOnTypeChange(true, type)
    },
    getVendorPaymentLink,
  }

  const recurringScheduleContext: PayableRecurringScheduleContext = {
    type: paymentScheduleType as 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime',
    repeatEvery: paymentScheduleRepeatEvery as number | undefined,
    repeatOn: paymentScheduleRepeatOn as Array<Mercoa.DayOfWeek> | undefined,
    repeatOnDay: paymentScheduleRepeatOnDay as number | undefined,
    repeatOnMonth: paymentScheduleRepeatOnMonth as number | undefined,
    ends: paymentScheduleEnds as Date | undefined,
    setType: (type: 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime') => setValue('paymentSchedule.type', type),
    setRepeatEvery: (repeatEvery: number) => setValue('paymentSchedule.repeatEvery', repeatEvery),
    setRepeatOn: (repeatOn: Array<Mercoa.DayOfWeek>) => setValue('paymentSchedule.repeatOn', repeatOn),
    setRepeatOnDay: (repeatOnDay: number) => setValue('paymentSchedule.repeatOnDay', repeatOnDay),
    setRepeatOnMonth: (repeatOnMonth: number) => setValue('paymentSchedule.repeatOnMonth', repeatOnMonth),
    setEnds: (ends: Date | undefined) => setValue('paymentSchedule.ends', ends),
  }

  const approversContextValue: PayableApproversContext = {
    approvers: watch('approvers') as Mercoa.ApprovalSlot[],
    approvalPolicy: approvalPolicy as Mercoa.ApprovalPolicyResponse[],
    setApproverBySlot: (approvalSlotId: string, assignedUserId: string) => {
      const index = approvers.findIndex((approver) => approver.approvalSlotId === approvalSlotId)
      if (index !== -1) {
        setValue(`approvers.${index}.assignedUserId`, assignedUserId)
        if (!assignedUserId || assignedUserId === '') {
          resetDownstreamPoliciesRecursive(approvalSlotId, approvers, setValue)
        } else {
          propagateApprovalPolicy({
            userId: assignedUserId,
            policyId: approvers[index].approvalPolicyId,
            approvalPolicies: approvalPolicy as Mercoa.ApprovalPolicyResponse[],
            approverSlots: approvers,
            setValue,
            users: mercoaSession.users,
            selectedApprovers: approvers,
          })
        }
      }
    },
    getApprovalSlotOptions: (approvalSlotId: string) => {
      const slot = approvers.find((approver) => approver.approvalSlotId === approvalSlotId)
      if (!slot) return []
      return [
        { disabled: false, value: { id: 'ANY', name: 'Any Approver', email: '' } },
        ...filterApproverOptions({
          approverSlotIndex: approvers.findIndex((a) => a.approvalSlotId === approvalSlotId),
          eligibleRoles: slot.eligibleRoles,
          eligibleUserIds: slot.eligibleUserIds,
          users: mercoaSession.users,
          selectedApprovers: approvers,
        }).map((option) => {
          return { disabled: option.disabled, value: option.user }
        }),
        { disabled: false, value: { id: '', name: 'Reset Selection', email: '' } },
      ]
    },
    selectedApproverBySlot: (approvalSlotId: string) => {
      const result =
        [...mercoaSession.users, { id: 'ANY', name: 'Any Approver', email: '' }].find((user) => {
          const approverSlot = approvers.find((e) => e?.approvalSlotId === approvalSlotId)
          if (user.id === approverSlot?.assignedUserId) return true
        }) ?? ''
      return result
    },
  }

  // Recursive function to reset all downstream policies when upstream is reset
  function resetDownstreamPoliciesRecursive(
    upstreamSlotId: string,
    approvers: Mercoa.ApprovalSlot[],
    setValue: Function,
  ) {
    const upstreamSlot = approvers.find((slot) => slot.approvalSlotId === upstreamSlotId)
    if (!upstreamSlot) return

    // Find immediate downstream slots that depend on this upstream policy
    const immediateDownstreamSlots = approvers.filter((slot) => slot.upstreamPolicyId === upstreamSlot.approvalPolicyId)

    // Reset immediate downstream slots
    immediateDownstreamSlots.forEach((slot) => {
      const slotIndex = approvers.findIndex((a) => a.approvalSlotId === slot.approvalSlotId)
      if (slotIndex !== -1) {
        setValue(`approvers.${slotIndex}.assignedUserId`, '')

        // RECURSIVE: Reset all downstream policies from this slot too
        resetDownstreamPoliciesRecursive(slot.approvalSlotId, approvers, setValue)
      }
    })
  }

  const vendorContextValue: PayableVendorContext = {
    selectedVendor,
    setSelectedVendor,
    vendors,
    vendorsLoading,
    vendorSearch,
    setVendorSearch,
    duplicateVendorModalOpen,
    setDuplicateVendorModalOpen,
    duplicateVendorInfo,
  }

  const bnplContext: PayableBnplContext = {
    bnplInstallmentsStartDate: watch('paymentSourceOptions.installmentsStartDate'),
    setBnplInstallmentsStartDate: (installmentsStartDate: string) =>
      setValue('paymentSourceOptions.installmentsStartDate', installmentsStartDate),
    bnplDefermentWeeks: watch('paymentSourceOptions.defermentWeeks'),
    setBnplDefermentWeeks: (defermentWeeks: number) => setValue('paymentSourceOptions.defermentWeeks', defermentWeeks),
    bnplAcceptedTerms: watch('paymentSourceOptions.acceptedTerms'),
    setBnplAcceptedTerms: (acceptedTerms: boolean) => setValue('paymentSourceOptions.acceptedTerms', acceptedTerms),
    bnplOffer,
    bnplOfferLoading,
    bnplLoan,
    bnplLoanLoading,
  }

  const out: PayableDetailsContextValue = {
    dataContextValue: {
      invoice: invoiceData,
      invoiceType: invoiceType ?? 'invoice',
      invoiceLoading: invoiceDataLoading,
      refreshInvoice,
    },
    displayContextValue: {
      heightOffset: heightOffset ?? 0,
      height,
    },
    propsContextValue: props,
    documentContextValue: {
      documents: invoiceDocuments,
      documentsLoading,
      handleFileUpload,
      ocrProcessing,
      sourceEmails,
      sourceEmailsLoading,
    },
    formContextValue: {
      formMethods: methods,
      handleFormAction,
      formActionLoading:
        approvePayablePending || rejectPayablePending || createPayablePending || updatePayablePending || isLoading,
      vendorContextValue,
      overviewContextValue: overviewContext,
      lineItemsContextValue: lineItemsContext,
      commentsContextValue: commentsContext,
      metadataContextValue: metadataContext,
      paymentMethodContextValue: paymentMethodContext,
      approversContextValue: approversContextValue,
      taxAndShippingContextValue: taxAndShippingContext,
      feesContextValue: feesContext,
      vendorCreditContextValue: vendorCreditContext,
      paymentTimingContextValue: paymentTimingContext,
      recurringScheduleContextValue: recurringScheduleContext,
      bnplContextValue: bnplContext,
    },
    eventsContextValue: eventsContext,
  }
  return out
}
