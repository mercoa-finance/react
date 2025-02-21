import { Bar, Container, Section } from '@column-resizer/react'
import { Menu, Transition } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  ArrowPathRoundedSquareIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PlusCircleIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import useResizeObserver from '@react-hook/resize-observer'
import accounting from 'accounting'
import Big from 'big.js'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import tz from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { Dispatch, Fragment, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Dropzone from 'react-dropzone'
import {
  Control,
  FieldErrors,
  FormProvider,
  UseFormClearErrors,
  UseFormReturn,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { Document, Page, pdfjs } from 'react-pdf'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import { blobToDataUrl, classNames, removeThousands } from '../lib/lib'
import { isSupportedScheduleDate, isWeekday } from '../lib/scheduling'
import {
  AddBankAccountForm,
  AddCheckForm,
  AddCounterpartyAccount,
  AddCustomPaymentMethodForm,
  BankAccount,
  Card,
  Check,
  CounterpartyAccount,
  CustomPaymentMethod,
  EntitySelector,
  InvoiceCommentsV1,
  InvoiceStatusPill,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  MercoaContext,
  MercoaInput,
  MercoaSwitch,
  NoSession,
  PayableCounterpartySearchV1,
  PayablesInlineForm,
  Tooltip,
  counterpartyYupValidation,
  createCounterpartyRequest,
  inputClassName,
  onSubmitCounterparty,
  useDebounce,
  useMercoaSession,
} from './index'
import { FinanceWithOatfi } from './Oatfi'
import { RecurringSchedule } from './RecurringSchedule'
dayjs.extend(utc)
dayjs.extend(minMax)
dayjs.extend(tz)

const dJSON = require('dirty-json')

// @ts-ignore next-line
if (typeof Promise.withResolvers === 'undefined') {
  if (typeof window !== 'undefined') {
    // @ts-expect-error This does not exist outside of polyfill which this is doing
    window.Promise.withResolvers = function () {
      let resolve, reject
      const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
      })
      return { promise, resolve, reject }
    }
  }
}

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const afterScheduledStatus = [
  Mercoa.InvoiceStatus.Pending,
  Mercoa.InvoiceStatus.Paid,
  Mercoa.InvoiceStatus.Canceled,
  Mercoa.InvoiceStatus.Archived,
  Mercoa.InvoiceStatus.Refused,
]

const afterApprovedStatus = [...afterScheduledStatus, Mercoa.InvoiceStatus.Scheduled]

export type PayableDetailsV1ChildrenProps = {
  invoice?: Mercoa.InvoiceResponse
  ocrResponse?: Mercoa.OcrResponse
  uploadedDocument?: string
  onUpdate?: (invoice: Mercoa.InvoiceResponse | undefined) => void
  setUploadedDocument: (e?: string) => void
  height: number
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  invoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  counterpartyPreSubmit?: (
    counterparty: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onOcrComplete: (ocrResponse?: Mercoa.OcrResponse) => void
  ocrProcessing?: boolean
  setOcrProcessing?: Dispatch<SetStateAction<boolean>>
}

export function getInvoiceClient(mercoaSession: MercoaContext, invoiceType: 'invoice' | 'invoiceTemplate') {
  if (invoiceType === 'invoice') {
    return mercoaSession.client?.invoice
  } else {
    return mercoaSession.client?.invoiceTemplate
  }
}

export function PayableDetailsV1({
  invoiceType = 'invoice',
  invoiceId,
  invoice,
  onUpdate,
  heightOffset,
  admin,
  documentPosition = 'left',
  invoicePreSubmit,
  counterpartyPreSubmit,
  onInvoiceSubmit,
  children,
  renderCustom,
}: {
  invoiceType?: 'invoice' | 'invoiceTemplate'
  invoiceId?: Mercoa.InvoiceId | Mercoa.InvoiceTemplateId
  invoice?: Mercoa.InvoiceResponse
  onUpdate?: (invoice: Mercoa.InvoiceResponse | undefined) => void
  heightOffset?: number
  admin?: boolean
  documentPosition?: 'right' | 'left' | 'none'
  invoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  counterpartyPreSubmit?: (
    counterparty: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onInvoiceSubmit?: (resp: Mercoa.InvoiceResponse) => void
  children?: (props: PayableDetailsV1ChildrenProps) => JSX.Element[]
  renderCustom?: {
    toast?: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
}) {
  const mercoaSession = useMercoaSession()
  const contentHeightOffset = heightOffset ?? mercoaSession.heightOffset

  const [ocrResponse, setOcrResponse] = useState<Mercoa.OcrResponse>()
  const [ocrProcessing, setOcrProcessing] = useState<boolean>(false)
  const [uploadedDocument, setUploadedDocument] = useState<string>()
  const [invoiceLocal, setInvoice] = useState<Mercoa.InvoiceResponse | undefined>(invoice)
  const [height, setHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight - contentHeightOffset : 0,
  )

  async function refreshInvoice(invoiceId: Mercoa.InvoiceId | Mercoa.InvoiceTemplateId) {
    if (!mercoaSession.token) return
    const resp = await getInvoiceClient(mercoaSession, invoiceType)?.get(invoiceId)
    if (resp) {
      setInvoice(resp)
      if (onUpdate) {
        onUpdate(resp)
      }
    }
  }

  useEffect(() => {
    if (!mercoaSession.token) return
    if (!invoice && invoiceId) {
      refreshInvoice(invoiceId)
    }
  }, [invoice, invoiceId, mercoaSession.token])

  function handleResize() {
    setHeight(window.innerHeight - contentHeightOffset)
  }
  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize, false)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [contentHeightOffset])

  if (!mercoaSession.client) return <NoSession componentName="PayableDetails" />

  let leftComponent: JSX.Element | undefined
  let rightComponent: JSX.Element | undefined
  if (children) {
    const childrenArray = children({
      invoice: invoiceLocal,
      ocrResponse,
      uploadedDocument,
      setUploadedDocument,
      height,
      refreshInvoice,
      invoicePreSubmit,
      counterpartyPreSubmit,
      onOcrComplete: setOcrResponse,
      onUpdate,
      ocrProcessing,
      setOcrProcessing,
    })
    leftComponent = childrenArray[0]
    rightComponent = childrenArray[1]
  } else {
    leftComponent = (
      <PayableDocumentV1
        onOcrComplete={setOcrResponse}
        setUploadedDocument={setUploadedDocument}
        height={height}
        invoiceType={invoiceType}
        invoice={invoiceLocal}
        ocrProcessing={ocrProcessing}
        setOcrProcessing={setOcrProcessing}
      />
    )

    rightComponent = (
      <PayableFormV1
        invoiceType={invoiceType}
        invoice={invoiceLocal}
        ocrResponse={ocrResponse}
        uploadedDocument={uploadedDocument}
        setUploadedDocument={setUploadedDocument}
        onUpdate={onUpdate}
        refreshInvoice={refreshInvoice}
        height={height}
        admin={admin}
        invoicePreSubmit={invoicePreSubmit}
        counterpartyPreSubmit={counterpartyPreSubmit}
        onInvoiceSubmit={onInvoiceSubmit}
        ocrProcessing={ocrProcessing}
      />
    )
  }

  if (documentPosition === 'none' || !rightComponent) {
    return rightComponent ?? leftComponent ?? <></>
  }

  return (
    <Container>
      <Section className={`mercoa-relative mercoa-px-5`} minSize={0}>
        {documentPosition === 'left' ? leftComponent : rightComponent}
      </Section>
      <Bar
        size={10}
        className="mercoa-cursor-col-resize mercoa-invisible min-[450px]:mercoa-visible"
        style={{
          background:
            'linear-gradient(180deg, rgba(229,231,235,1) 48%, rgba(145,145,145,1) 48%, rgba(145,145,145,1) 52%, rgba(229,231,235,1) 52%)',
        }}
      />
      <Section className={`mercoa-relative mercoa-px-5`} minSize={400}>
        {documentPosition === 'right' ? leftComponent : rightComponent}
      </Section>
    </Container>
  )
}

export type PayableFormV1ChildrenProps = {
  invoice?: Mercoa.InvoiceResponse
  ocrProcessing?: boolean
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  ocrResponse?: Mercoa.OcrResponse
  uploadedDocument?: string
  setUploadedDocument: (e?: string) => void
  height: number
  setSelectedVendor: (e?: Mercoa.CounterpartyResponse) => void
  selectedVendor?: Mercoa.CounterpartyResponse
  getVendorPaymentLink: () => Promise<string | undefined>
  formMethods: UseFormReturn<Mercoa.InvoiceCreationRequest>
  setValue: UseFormSetValue<Mercoa.InvoiceCreationRequest>
  setError: UseFormSetError<Mercoa.InvoiceCreationRequest>
  clearErrors: UseFormClearErrors<Mercoa.InvoiceCreationRequest>
  control: Control<Mercoa.InvoiceCreationRequest>
  watch: UseFormWatch<Mercoa.InvoiceCreationRequest>
  errors: FieldErrors<Mercoa.InvoiceCreationRequest>
  isLoading: boolean
  submitForm: () => void
}

export function PayableFormV1({
  invoiceType = 'invoice',
  invoice,
  ocrResponse,
  ocrProcessing,
  reverseOcrResponse = false,
  uploadedDocument,
  setUploadedDocument,
  onUpdate,
  refreshInvoice,
  height,
  admin,
  invoicePreSubmit,
  counterpartyPreSubmit,
  lineItemDescriptionOptional = false,
  onInvoiceSubmit,
  fullWidth,
  children,
  renderCustom,
}: {
  invoiceType?: 'invoice' | 'invoiceTemplate'
  invoice?: Mercoa.InvoiceResponse
  ocrResponse?: Mercoa.OcrResponse
  ocrProcessing?: boolean
  reverseOcrResponse?: boolean
  uploadedDocument?: string
  setUploadedDocument: (e?: string) => void
  onUpdate?: (invoice: Mercoa.InvoiceResponse | undefined) => void
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  height: number
  admin?: boolean
  invoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  counterpartyPreSubmit?: (
    counterparty: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined,
    counterpartyId?: string,
  ) => Promise<Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined>
  onInvoiceSubmit?: (resp: Mercoa.InvoiceResponse) => void
  fullWidth?: boolean
  lineItemDescriptionOptional?: boolean
  children?: (props: PayableFormV1ChildrenProps) => JSX.Element
  renderCustom?: {
    toast?: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
}) {
  const mercoaSession = useMercoaSession()

  const [selectedVendor, setSelectedVendor] = useState<Mercoa.CounterpartyResponse | undefined>(invoice?.vendor)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const schema = yup
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
      paymentSourceCheckEnabled: yup.boolean().nullable(),
      batchPayment: yup.boolean().nullable(),
      paymentSourceSchemaId: yup.string().nullable(),
      paymentSchedule: yup.mixed().nullable(),
      hasDocuments: yup.boolean().nullable(),
      saveAsStatus: yup.string().nullable(),
      saveAsAdmin: yup.boolean(),
      metadata: yup.mixed().nullable(),
      newBankAccount: yup.mixed().nullable(),
      newCheck: yup.mixed().nullable(),
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
      taxAmount: yup.number().transform(removeThousands).nullable(),
      shippingAmount: yup.number().transform(removeThousands).nullable(),
      ocrJobId: yup.string().nullable(),
      createdAt: yup.date().nullable(),
      updatedAt: yup.date().nullable(),
    })
    .required()

  const defaultPaymentSchedule =
    invoiceType === 'invoiceTemplate'
      ? {
          type: 'daily',
          repeatEvery: 1,
          ends: new Date(),
        }
      : undefined

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: invoice?.id,
      status: invoice?.status,
      invoiceNumber: invoice?.invoiceNumber,
      amount: invoice?.amount,
      currency: invoice?.currency ?? 'USD',
      payerId: invoice?.payer?.id ?? mercoaSession.entityId,
      vendorId: invoice?.vendor?.id,
      vendorName: invoice?.vendor?.name,
      invoiceDate: invoice?.invoiceDate ? dayjs(invoice?.invoiceDate).toDate() : undefined,
      dueDate: invoice?.dueDate ? dayjs(invoice?.dueDate).toDate() : undefined,
      deductionDate: invoice?.deductionDate ? dayjs(invoice?.deductionDate).toDate() : undefined,
      processedAt: invoice?.processedAt ? dayjs(invoice?.processedAt).toDate() : undefined,
      lineItems: invoice?.lineItems ?? [],
      paymentDestinationId: invoice?.paymentDestination?.id,
      paymentDestinationType: invoice?.paymentDestination?.type ?? '',
      paymentDestinationOptions: invoice?.paymentDestinationOptions,
      paymentSourceId: invoice?.paymentSource?.id,
      paymentSourceType: invoice?.paymentSource?.type ?? '',
      paymentSourceCheckEnabled: (invoice?.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false,
      batchPayment: invoice?.batchPayment ?? false,
      description: invoice?.noteToSelf ?? '',
      hasDocuments: invoice?.hasDocuments ?? !!uploadedDocument ?? false,
      saveAsStatus: '',
      saveAsAdmin: false,
      metadata: invoice?.metadata ?? {},
      approvalPolicy: invoice?.approvalPolicy ?? { type: 'any', approvers: [] },
      approvers: invoice?.approvers ?? [],
      fees: invoice?.fees,
      vendorCreditIds: invoice?.vendorCreditIds ?? [],
      taxAmount: invoice?.taxAmount,
      shippingAmount: invoice?.shippingAmount,
      createdAt: invoice?.createdAt,
      updatedAt: invoice?.updatedAt,
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
      '~cpm~~': {} as any,
      paymentSchedule: invoice?.paymentSchedule ?? defaultPaymentSchedule,
      failureType: invoice?.failureType ?? '',
      commentText: '',
      comments: invoice?.comments ?? [],
      creatorUser: invoice?.creatorUser,
      creatorEntityId: invoice?.creatorEntityId,
      ocrJobId: invoice?.ocrJobId,
      vendor: {
        id: invoice?.vendor?.id,
        accountType: invoice?.vendor?.accountType,
        name: invoice?.vendor?.name,
        firstName: invoice?.vendor?.profile?.individual?.name?.firstName,
        lastName: invoice?.vendor?.profile?.individual?.name?.lastName,
        middleName: invoice?.vendor?.profile?.individual?.name?.middleName,
        suffix: invoice?.vendor?.profile?.individual?.name?.suffix,
        email:
          invoice?.vendor?.accountType === 'business'
            ? invoice?.vendor?.profile?.business?.email
            : invoice?.vendor?.profile?.individual?.email,
        website: invoice?.vendor?.profile?.business?.website,
        description: invoice?.vendor?.profile?.business?.description,
        accounts: [] as Mercoa.CounterpartyCustomizationAccount[],
      },
    },
  })

  const {
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    control,
    formState: { errors },
  } = methods

  useEffect(() => {
    if (!invoice) return

    if (invoice.vendor) {
      setSelectedVendor(invoice.vendor)
    }

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
    setValue('payerId', invoice.payer?.id ?? mercoaSession.entityId)
    setValue('vendorId', invoice.vendor?.id)
    setValue('vendorName', invoice.vendor?.name)
    setValue('invoiceDate', invoice.invoiceDate ? dayjs(invoice.invoiceDate).toDate() : undefined)
    setValue('dueDate', invoice.dueDate ? dayjs(invoice.dueDate).toDate() : undefined)
    setValue('deductionDate', invoice.deductionDate ? dayjs(invoice.deductionDate).toDate() : undefined)
    setValue('processedAt', invoice.processedAt ? dayjs(invoice.processedAt).toDate() : undefined)
    setValue('lineItems', (invoice.lineItems ?? []) as any)
    setValue('paymentDestinationId', invoice.paymentDestination?.id)
    setValue('paymentDestinationOptions', invoice.paymentDestinationOptions)
    setValue('paymentSourceId', invoice.paymentSource?.id)
    setValue(
      'paymentSourceCheckEnabled',
      (invoice.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false,
    )
    setValue('batchPayment', invoice.batchPayment ?? false)
    setValue('description', invoice.noteToSelf ?? '')
    setValue('hasDocuments', invoice.hasDocuments ?? uploadedDocument ?? false)
    setValue('saveAsStatus', '')
    setValue('saveAsAdmin', false)
    setValue('metadata', invoice.metadata ?? {})
    setValue('approvers', invoice?.approvers ?? [])
    setValue('approvalPolicy', invoice?.approvalPolicy ?? { type: 'any', approvers: [] })
    setValue('creatorUser', invoice?.creatorUser)
    setValue('comments', invoice?.comments ?? [])
    setValue('fees', invoice?.fees)
    setValue('failureType', invoice?.failureType ?? '')
    setValue('vendorCreditIds', invoice?.vendorCreditIds ?? [])
    setValue('createdAt', invoice?.createdAt)
    setValue('updatedAt', invoice?.updatedAt)
    setValue('paymentSchedule', invoice?.paymentSchedule)
    setValue('taxAmount', invoice?.taxAmount)
    setValue('shippingAmount', invoice?.shippingAmount)
    setValue('ocrJobId', invoice?.ocrJobId)
  }, [invoice])

  const { fields: lineItems } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const vendorId = watch('vendorId')

  // set selected vendor form values
  useEffect(() => {
    if (!selectedVendor) {
      setValue('vendorId', '')
      setValue('vendorName', '')
      clearErrors('vendorId')
      clearErrors('vendorName')
      setValue('paymentDestinationId', '')
      setValue('paymentDestinationType', '')
      setValue('paymentDestinationOptions', undefined)
    } else if (selectedVendor.id === 'new') {
      setValue('paymentDestinationId', '')
      setValue('paymentDestinationType', '')
      setValue('paymentDestinationOptions', undefined)
    } else if (selectedVendor.id) {
      mercoaSession.debug({ selectedVendor })
      setValue('vendorId', selectedVendor.id)
      setValue('vendorName', selectedVendor.name)
      if (selectedVendor.id != vendorId) {
        setValue('paymentDestinationId', '')
        setValue('paymentDestinationType', '')
        setValue('paymentDestinationOptions', undefined)
      }
      clearErrors('vendorId')
      clearErrors('vendorName')
    }
  }, [selectedVendor])

  // Get list of accounts on the active payor/payee relationship
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
  }, [mercoaSession.entity?.id, vendorId])

  function ocrMerge(ocrData: Mercoa.OcrResponse) {
    mercoaSession.debug({ ocrResponse: ocrData })
    if (ocrData.jobId) setValue('ocrJobId', ocrData.jobId)
    if (ocrData.invoice.amount) setValue('amount', ocrData.invoice.amount)
    if (ocrData.invoice.invoiceNumber) setValue('invoiceNumber', ocrData.invoice.invoiceNumber)
    if (ocrData.invoice.invoiceDate) {
      setValue('invoiceDate', dayjs(dayjs(ocrData.invoice.invoiceDate).utc().format('YYYY-MM-DD')).toDate())
    }
    if (ocrData.invoice.dueDate) {
      setValue('dueDate', dayjs(dayjs(ocrData.invoice.dueDate).utc().format('YYYY-MM-DD')).toDate())
    }
    if (ocrData.invoice.currency) setValue('currency', ocrData.invoice.currency)
    if (ocrData.invoice.metadata) setValue('metadata', ocrData.invoice.metadata)
    if (ocrData.invoice.taxAmount) setValue('taxAmount', ocrData.invoice.taxAmount)
    if (ocrData.invoice.shippingAmount) setValue('shippingAmount', ocrData.invoice.shippingAmount)
    if (
      ocrData.invoice.lineItems &&
      mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled
    ) {
      const ocrResponseLineItems = ocrData.invoice.lineItems.map((lineItem) => ({
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
      setValue('lineItems', reverseOcrResponse ? ocrResponseLineItems.reverse() : ocrResponseLineItems)
    }

    if (ocrData.bankAccount) {
      setValue('newBankAccount', {
        routingNumber: ocrData.bankAccount.routingNumber,
        accountNumber: ocrData.bankAccount.accountNumber,
        bankName: ocrData.bankAccount.bankName,
        accountType: Mercoa.BankType.Checking,
      })
    }

    if (ocrData.check) {
      setValue('newCheck', {
        addressLine1: ocrData.check.addressLine1,
        addressLine2: ocrData.check.addressLine2 ?? '',
        city: ocrData.check.city,
        state: ocrData.check.stateOrProvince,
        postalCode: ocrData.check.postalCode,
        country: 'US',
        payToTheOrderOf: ocrData.check.payToTheOrderOf,
      })
    }

    if (ocrData.vendor.id === 'new' && mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
      mercoaSession.debug('new vendor creation disabled')
    } else if (ocrData.vendor.id) {
      mercoaSession.debug('setting selected vendor', ocrData.vendor)
      setSelectedVendor(ocrData.vendor)
    }
  }

  // OCR Merge
  useEffect(() => {
    if (ocrResponse) {
      ocrMerge(ocrResponse)
    }
  }, [ocrResponse])

  // Get OCR Job Data
  useEffect(() => {
    if (!invoice?.ocrJobId) return
    if (!(invoice?.status === Mercoa.InvoiceStatus.Draft || invoice?.status === Mercoa.InvoiceStatus.Unassigned)) return
    if (invoice.vendor) return // only merge if vendor is not found
    mercoaSession.client?.ocr.getAsyncOcr(invoice.ocrJobId).then((resp) => {
      mercoaSession.debug({ ocrJob: resp.data })
      if (resp.data) {
        ocrMerge({
          vendor: resp.data.vendor,
          bankAccount: resp.data.bankAccount,
          check: resp.data.check,
          jobId: resp.data.jobId,
          invoice: {} as any,
        })
      }
    })
  }, [invoice?.ocrJobId, invoice?.vendor, invoice?.status])

  async function saveInvoiceLoadingWrapper(data: any) {
    setIsLoading(true)
    try {
      await saveInvoice(data)
    } catch (e) {
      console.error(e)
    }
    setIsLoading(false)
  }

  async function saveInvoice(data: any) {
    if (!mercoaSession.token) return
    if (!mercoaSession.entity?.id && !mercoaSession.entityGroup?.id) return

    // Special Actions
    mercoaSession.debug({ saveAsStatus: data.saveAsStatus })
    let postAction: 'APPROVE' | 'REJECT' | undefined = undefined
    if (data.saveAsStatus === Mercoa.InvoiceStatus.Canceled) {
      if (confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) {
        await getInvoiceClient(mercoaSession, invoiceType)?.update(data.id, {
          status: Mercoa.InvoiceStatus.Canceled,
        })
      }
      setIsLoading(false)
      refreshInvoice(data.id)
      return
    } else if (data.saveAsStatus === Mercoa.InvoiceStatus.Archived) {
      if (confirm('Are you sure you want to archive this invoice? This cannot be undone.')) {
        await getInvoiceClient(mercoaSession, invoiceType)?.update(data.id, {
          status: Mercoa.InvoiceStatus.Archived,
        })
      }
      setIsLoading(false)
      refreshInvoice(data.id)
      return
    } else if (data.saveAsStatus === 'COUNTERPARTY') {
      let profile = createCounterpartyRequest({ data: data.vendor, setError, type: 'payee' })
      if (counterpartyPreSubmit) {
        profile = await counterpartyPreSubmit(profile, data.vendor.id)
      }
      if (data.vendor && profile) {
        await onSubmitCounterparty({
          data: data.vendor,
          mercoaSession,
          type: 'payee',
          profile,
          onSelect: async (counterparty) => {
            await mercoaSession.refresh()
            setTimeout(() => {
              setSelectedVendor(counterparty)
            }, 100)
          },
        })
      } else {
        await mercoaSession.refresh()
        setTimeout(() => {
          setSelectedVendor(undefined)
        }, 100)
      }
      return
    }
    // payment method creation for vendor
    else if (data.saveAsStatus === 'CREATE_BANK_ACCOUNT') {
      if (vendorId) {
        try {
          const pm = await mercoaSession.client?.entity.paymentMethod.create(vendorId, {
            type: Mercoa.PaymentMethodType.BankAccount,
            routingNumber: data.newBankAccount.routingNumber,
            accountNumber: data.newBankAccount.accountNumber,
            accountType: data.newBankAccount.accountType,
          })
          await mercoaSession.refresh()
          setTimeout(() => {
            setValue('paymentDestinationType', Mercoa.PaymentMethodType.BankAccount, { shouldDirty: true })
            setValue('paymentDestinationId', pm?.id, { shouldDirty: true })
            setValue('saveAsStatus', 'CLOSE_INLINE_FORM')
          }, 100)
        } catch (e: any) {
          setError('newBankAccount', { message: e.body ?? 'Invalid Bank Account Data' })
        }
        return
      }
    } else if (data.saveAsStatus === 'CREATE_COUNTERPARTY_ACCOUNT') {
      if (mercoaSession.entity?.id && vendorId) {
        try {
          // TODO: Optimize this to one network request when patch adding counterparty accounts is supported in API
          const resp = await mercoaSession.client?.entity.counterparty.findPayees(mercoaSession.entity.id, {
            counterpartyId: vendorId,
          })
          let accounts = resp?.data[0].accounts
          if (accounts) {
            accounts?.push({
              accountId: data.newCounterpartyAccount.accountId,
              postalCode: data.newCounterpartyAccount.postalCode,
              nameOnAccount: data.newCounterpartyAccount.nameOnAccount,
            })
          } else {
            accounts = [
              {
                accountId: data.newCounterpartyAccount.accountId,
                postalCode: data.newCounterpartyAccount.postalCode,
                nameOnAccount: data.newCounterpartyAccount.nameOnAccount,
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
            setValue('saveAsStatus', 'CLOSE_INLINE_FORM')
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
        }
        return
      }
    } else if (data.saveAsStatus === 'CREATE_CHECK') {
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
          setTimeout(() => {
            setValue('paymentDestinationType', Mercoa.PaymentMethodType.Check, { shouldDirty: true })
            setValue('paymentDestinationId', pm?.id, { shouldDirty: true })
            setValue('saveAsStatus', 'CLOSE_INLINE_FORM')
          }, 1000)
        } catch (e: any) {
          setError('newCheck', { message: e.body ?? 'Invalid Check Data' })
        }
        return
      }
    } else if (data.saveAsStatus === 'CREATE_CUSTOM') {
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
            schemaId: data.paymentDestinationType,
            data: filtered,
          })) as Mercoa.PaymentMethodResponse.Custom
          await mercoaSession.refresh()
          setTimeout(() => {
            setValue('paymentDestinationType', pm.schemaId, { shouldDirty: true })
            setValue('paymentDestinationId', pm.id, { shouldDirty: true })
            setValue('saveAsStatus', 'CLOSE_INLINE_FORM')
          }, 1000)
        } catch (e: any) {
          setError('~cpm~~', { message: e.body ?? 'Invalid Data' })
        }
        return
      }
    } else if (data.saveAsStatus === 'DELETE') {
      if (invoice?.id) {
        try {
          if (confirm('Are you sure you want to delete this invoice? This cannot be undone.')) {
            await getInvoiceClient(mercoaSession, invoiceType)?.delete(invoice.id)
            renderCustom?.toast ? renderCustom.toast.success('Invoice deleted') : toast.success('Invoice deleted')
            if (onUpdate) onUpdate(undefined)
          }
          setIsLoading(false)
          return
        } catch (e: any) {
          console.error(e)
          renderCustom?.toast
            ? renderCustom?.toast.error(`There was an error deleting the invoice.\n Error: ${e.body}`)
            : toast.error(`There was an error deleting the invoice.\n Error: ${e.body}`)
        }
      }
      return
    } else if (data.saveAsStatus === 'PRINT_CHECK') {
      if (!invoice?.id) return

      if (invoice.status !== 'PAID' && invoice.status !== 'ARCHIVED') {
        if (
          confirm('Do you want to create a printable check? This will mark the invoice as paid and cannot be undone.')
        ) {
          const resp = await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice?.id, {
            status: Mercoa.InvoiceStatus.Paid,
            paymentDestinationOptions: {
              type: 'check',
              delivery: 'PRINT',
              printDescription: !!data.paymentDestinationOptions?.printDescription,
            },
          })
          if (resp) {
            renderCustom?.toast
              ? renderCustom.toast.success('Invoice marked as paid. Live check created.')
              : toast.success('Invoice marked as paid. Live check created.')
            refreshInvoice(resp.id)
          }
        } else {
          toast.success('VOID check created')
        }
      }

      const pdf = await getInvoiceClient(mercoaSession, invoiceType)?.document.generateCheckPdf(invoice.id)
      if (pdf) {
        window.open(pdf.uri, '_blank')
      } else {
        renderCustom?.toast
          ? renderCustom?.toast.error('There was an error generating the check PDF')
          : toast.error('There was an error generating the check PDF')
      }
      return
    } else if (data.saveAsStatus === 'COMMENT') {
      // if (!mercoaSession.user?.id && mercoaSession.entity?.id === invoice?.creatorEntityId) {
      //   renderCustom?.toast
      //     ? renderCustom?.toast.error('Please log in as a user to comment')
      //     : toast.error('Please log in as a user to comment')
      //   return
      // }
      if (!mercoaSession.token || !invoice?.id) return
      if (!data.commentText) return

      const comment = await mercoaSession.client?.invoice.comment.create(invoice.id, {
        text: data.commentText,
        userId: mercoaSession.user?.id,
      })
      if (comment) {
        setValue('comments', [...(invoice?.comments ?? []), comment])
        setValue('commentText', '')
      } else {
        renderCustom?.toast
          ? renderCustom?.toast.error('There was an error creating the comment')
          : toast.error('There was an error creating the comment')
      }
      return
    }

    let nextInvoiceState: Mercoa.InvoiceStatus = Mercoa.InvoiceStatus.Draft

    // we should save the data first, and then update the invoice approve/reject status
    if (data.saveAsStatus === 'APPROVE' || data.saveAsStatus === 'REJECT') {
      postAction = data.saveAsStatus
      data.saveAsStatus = Mercoa.InvoiceStatus.New
    }

    if (admin && data.saveAsAdmin) {
      setValue('saveAsAdmin', false)
      nextInvoiceState = data.status
    } else if (invoice?.status === Mercoa.InvoiceStatus.Draft) {
      nextInvoiceState = Mercoa.InvoiceStatus.New
    } else if (invoice?.status === Mercoa.InvoiceStatus.New) {
      nextInvoiceState = Mercoa.InvoiceStatus.Approved
    } else if (invoice?.status === Mercoa.InvoiceStatus.Approved || invoice?.status === Mercoa.InvoiceStatus.Failed) {
      nextInvoiceState = Mercoa.InvoiceStatus.Scheduled
    }

    if (data.paymentSchedule?.type) {
      if (
        isNaN(data.paymentSchedule.repeatEvery) ||
        data.paymentSchedule.repeatEvery < 1 ||
        !data.paymentSchedule.repeatEvery
      ) {
        data.paymentSchedule.repeatEvery = 1
      }
      if (!data.paymentSchedule) {
        renderCustom?.toast
          ? renderCustom?.toast.error('Please select a payment schedule')
          : toast.error('Please select a payment schedule')
        return
      }
      if (data.paymentSchedule.type === 'weekly') {
        if (data.paymentSchedule.repeatOn === undefined || data.paymentSchedule.repeatOn.length === 0) {
          renderCustom?.toast
            ? renderCustom?.toast.error('Please select a day of the week')
            : toast.error('Please select a day of the week')
          return
        }
        const out: Mercoa.PaymentSchedule = {
          type: 'weekly',
          repeatOn: data.paymentSchedule.repeatOn,
          repeatEvery: Number(data.paymentSchedule.repeatEvery),
          ends: data.paymentSchedule.ends,
        }
        data.paymentSchedule = out
      } else if (data.paymentSchedule.type === 'monthly') {
        if (isNaN(data.paymentSchedule.repeatOnDay) || !data.paymentSchedule.repeatOnDay) {
          data.paymentSchedule.repeatOnDay = 1
        }
        const out: Mercoa.PaymentSchedule = {
          type: 'monthly',
          repeatOnDay: Number(data.paymentSchedule.repeatOnDay),
          repeatEvery: Number(data.paymentSchedule.repeatEvery),
          ends: data.paymentSchedule.ends,
        }
        data.paymentSchedule = out
      } else if (data.paymentSchedule.type === 'yearly') {
        if (isNaN(data.paymentSchedule.repeatOnDay) || !data.paymentSchedule.repeatOnDay) {
          data.paymentSchedule.repeatOnDay = 1
        }
        if (
          isNaN(data.paymentSchedule.repeatOnMonth) ||
          data.paymentSchedule.repeatOnMonth < 1 ||
          !data.paymentSchedule.repeatOnMonth
        ) {
          data.paymentSchedule.repeatOnMonth = 1
        }
        const out: Mercoa.PaymentSchedule = {
          type: 'yearly',
          repeatOnDay: Number(data.paymentSchedule.repeatOnDay),
          repeatOnMonth: Number(data.paymentSchedule.repeatOnMonth),
          repeatEvery: Number(data.paymentSchedule.repeatEvery),
          ends: data.paymentSchedule.ends,
        }
        data.paymentSchedule = out
      } else if (data.paymentSchedule.type === 'daily') {
        const out: Mercoa.PaymentSchedule = {
          type: 'daily',
          repeatEvery: Number(data.paymentSchedule.repeatEvery),
          ends: data.paymentSchedule.ends,
        }
        data.paymentSchedule = out
      } else {
        const out: Mercoa.PaymentSchedule = {
          type: 'oneTime',
          repeatEvery: 1,
        }
        data.paymentSchedule = out
      }
    } else {
      const out: Mercoa.PaymentSchedule = {
        type: 'oneTime',
        repeatEvery: 1,
      }
      data.paymentSchedule = out
    }

    // clean up payment destination options
    if (
      data.paymentDestinationOptions?.type === Mercoa.PaymentMethodType.BankAccount &&
      data.paymentDestinationType !== Mercoa.PaymentMethodType.BankAccount
    ) {
      data.paymentDestinationOptions = undefined
    } else if (
      data.paymentDestinationOptions?.type === Mercoa.PaymentMethodType.Check &&
      data.paymentDestinationType !== Mercoa.PaymentMethodType.Check
    ) {
      data.paymentDestinationOptions = undefined
    }
    if (data.paymentDestinationOptions && !data.paymentDestinationOptions?.type) {
      data.paymentDestinationOptions = undefined
    }

    const incompleteInvoiceData: Omit<Mercoa.InvoiceCreationRequest, 'creatorEntityId' | 'creatorEntityGroupId'> = {
      status: data.saveAsStatus || nextInvoiceState,
      amount: Number(data.amount),
      taxAmount: typeof data.taxAmount !== 'undefined' ? Number(data.taxAmount ?? 0) : undefined,
      shippingAmount: typeof data.shippingAmount !== 'undefined' ? Number(data.shippingAmount ?? 0) : undefined,
      currency: data.currency,
      invoiceDate: data.invoiceDate,
      deductionDate: data.deductionDate,
      dueDate: data.dueDate,
      invoiceNumber: data.invoiceNumber,
      noteToSelf: data.description,
      payerId: mercoaSession.entity?.id,
      paymentSourceId: data.paymentSourceId,
      approvers: data.approvers.filter((e: { assignedUserId: string }) => e.assignedUserId),
      vendorId: data.vendorId,
      paymentSchedule: data.paymentSchedule,
      paymentDestinationId: data.paymentDestinationId,
      batchPayment: data.batchPayment,
      ocrJobId: data.ocrJobId,
      ...(data.paymentDestinationType === Mercoa.PaymentMethodType.Check && {
        paymentDestinationOptions: data.paymentDestinationOptions ?? {
          type: 'check',
          delivery: 'MAIL',
          printDescription: !!data.paymentDestinationOptions?.printDescription,
        },
      }),
      ...(data.paymentDestinationType === Mercoa.PaymentMethodType.BankAccount && {
        paymentDestinationOptions: data.paymentDestinationOptions ?? {
          type: 'bankAccount',
          delivery: 'ACH_SAME_DAY',
        },
      }),
      ...(data.paymentDestinationType === Mercoa.PaymentMethodType.Utility &&
        data.paymentDestinationOptions && {
          paymentDestinationOptions: {
            type: 'utility',
            accountId: data.paymentDestinationOptions.accountId,
          },
        }),
      lineItems: data.lineItems.map((lineItem: Mercoa.InvoiceLineItemUpdateRequest) => {
        const out: Mercoa.InvoiceLineItemUpdateRequest = {
          ...(lineItem.id && { id: lineItem.id }),
          description: lineItem.description,
          amount: Number(lineItem.amount),
          quantity: Number(lineItem.quantity),
          unitPrice: Number(lineItem.unitPrice),
          category: lineItem.category ?? 'EXPENSE',
          metadata: lineItem.metadata
            ? (JSON.parse(JSON.stringify(lineItem.metadata)) as unknown as Record<string, string>)
            : {},
          currency: data.currency ?? 'USD',
          glAccountId: lineItem.glAccountId,
        }
        return out
      }),
      metadata: JSON.parse(JSON.stringify(data.metadata)) as unknown as Record<string, string>,
      document: uploadedDocument,
      creatorUserId: mercoaSession.user?.id,
    }

    // Note: Typescript isn't smart enough to know that entityGroupId and entityId must be set at these points
    const createUnassignedInvoice = !!mercoaSession.entityGroup?.id && !mercoaSession.entity?.id
    const invoiceData: Mercoa.InvoiceCreationRequest = createUnassignedInvoice
      ? {
          ...incompleteInvoiceData,
          creatorEntityGroupId: mercoaSession.entityGroup?.id!,
        }
      : {
          ...incompleteInvoiceData,
          creatorEntityId: mercoaSession.entity?.id!,
        }

    mercoaSession.debug({ data, invoiceData })

    // metadata validation
    if (mercoaSession.organization?.metadataSchema) {
      if (!invoiceData.metadata) invoiceData.metadata = {}
      for (const [key, value] of Object.entries(invoiceData.metadata)) {
        const metadataSchema = mercoaSession.organization?.metadataSchema?.find((e) => e.key === key)
        if (metadataSchema && metadataSchema.validationRules?.regex) {
          if (
            showMetadata({
              schema: metadataSchema,
              entityMetadata: [],
              lineItem: false,
              hasDocument: !!uploadedDocument || !!invoice?.hasDocuments,
              hasNoLineItems: lineItems.length === 0,
              paymentDestinationType: data.paymentDestinationType,
              paymentSourceType: data.paymentSourceType,
            })
          ) {
            const regex = new RegExp(metadataSchema.validationRules.regex)
            if (!regex.test(value)) {
              renderCustom?.toast
                ? renderCustom?.toast.error(metadataSchema.validationRules.errorMessage)
                : toast.error(metadataSchema.validationRules.errorMessage)
              setError('metadata', { type: 'manual', message: metadataSchema.validationRules.errorMessage })
              return
            }
          } else {
            delete invoiceData.metadata[key]
          }
        }
      }
    }

    // if not draft or unassigned, make sure all line items have amounts and descriptions
    if (
      ![Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Unassigned].includes(invoiceData.status as any) &&
      mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled &&
      invoiceData.lineItems &&
      invoiceData.lineItems.length > 0
    ) {
      for (let index = 0; index < lineItems.length; index++) {
        const lineItem = lineItems[index]
        if (!lineItem.amount && lineItem.amount !== 0) {
          setError(`lineItems.${index}.amount`, {
            type: 'manual',
            message: 'Please enter an amount',
          })
          return
        }

        if (!lineItem.description && !lineItemDescriptionOptional) {
          setError(`lineItems.${index}.description`, {
            type: 'manual',
            message: 'Please enter a description',
          })
          return
        }
      }
    }

    // Make sure line items amount is equal to invoice amount
    if (
      ![Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Unassigned].includes(invoiceData.status as any) &&
      mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled &&
      ((invoiceData.lineItems && invoiceData.lineItems.length > 0) ||
        invoiceData.taxAmount ||
        invoiceData.shippingAmount)
    ) {
      let lineItemsTotal = new Big(0)
      invoiceData.lineItems?.forEach((lineItem, index) => {
        lineItemsTotal = lineItemsTotal.add(Number(lineItem.amount))
      })
      lineItemsTotal = lineItemsTotal
        .add(Number(invoiceData.taxAmount ?? 0))
        .add(Number(invoiceData.shippingAmount ?? 0))
      if (lineItemsTotal.toNumber() !== Number(data.amount)) {
        setError('amount', {
          type: 'manual',
          message: `Sum of line item, tax, and shipping amounts does not match total amount.\nSum: ${accounting.formatMoney(
            lineItemsTotal.toNumber(),
            currencyCodeToSymbol(data.currency),
          )}, Invoice Total: ${accounting.formatMoney(Number(data.amount), currencyCodeToSymbol(data.currency))}`,
        })
        return
      }
    }

    if (data.paymentDestinationType === 'check') {
      if (data.paymentSourceType !== 'bankAccount') {
        setError('paymentSourceId', {
          type: 'manual',
          message: 'Please select a bank account that is authorized to send checks',
        })
        return
      } else if (!data.paymentSourceCheckEnabled) {
        setError('paymentSourceId', { type: 'manual', message: 'This bank account is not authorized to send checks' })
        return
      }
    }
    if (data.paymentDestinationSchemaId && !data.paymentSourceSchemaId) {
      setError('paymentSourceId', { type: 'manual', message: 'These payment types cannot be used together!' })
      setError('paymentDestinationId', { type: 'manual', message: 'These payment types cannot be used together!' })
      return
    }

    // If using Mercoa payment rails, ensure vendor/payer are valid
    if (data.paymentDestinationType === 'bankAccount') {
      if (selectedVendor?.accountType === 'business') {
        if (!selectedVendor?.profile?.business?.description && !selectedVendor?.profile?.business?.website) {
          setError('vendor', { type: 'manual', message: 'Please provide the vendor business description or website' })
          return
        }
      } else {
        if (!selectedVendor?.profile?.individual?.email && !selectedVendor?.profile?.individual?.phone?.number) {
          setError('vendor', { type: 'manual', message: 'Please provide the vendor email or phone number' })
          return
        }
      }
    }

    // Check if a vendor is selected
    if (!data.saveAsStatus) {
      if (!data.amount) {
        setError('amount', { type: 'manual', message: 'Please enter an amount' })
        return
      }

      if (!data.invoiceDate) {
        setError('invoiceDate', { type: 'manual', message: 'Please select an invoice date' })
        return
      }

      if (!data.dueDate) {
        setError('dueDate', { type: 'manual', message: 'Please select a due date' })
        return
      }

      if (!data.vendorId) {
        setError('vendorId', { type: 'manual', message: 'Please select a vendor' })
        return
      }

      if (data.vendorId === 'new') {
        setError('vendorId', { type: 'manual', message: 'Please select a vendor' })
        return
      }

      // if line items are required, make sure at least one line item is set
      if (
        mercoaSession.iframeOptions?.options?.invoice?.lineItems === Mercoa.LineItemAvailabilities.Required &&
        invoiceData.lineItems?.length === 0
      ) {
        setError('lineItems', { type: 'manual', message: 'At least one line item is required' })
        return
      }

      // check that amount is at least 0.01
      if (Number(data.amount) < 0.01) {
        renderCustom?.toast
          ? renderCustom?.toast.error(`'Amount must be at least 0.01'`)
          : toast.error('Amount must be at least 0.01')
        setError('amount', { type: 'manual', message: 'Amount must be at least 0.01' })

        return
      }

      // Check if payment methods are selected
      if (!data.paymentSourceId && invoice?.id) {
        renderCustom?.toast
          ? renderCustom?.toast.error('Please select a payment source')
          : toast.error('Please select a payment source')
        setError('paymentSourceId', { type: 'manual', message: 'Please select how you want to pay' })

        return
      }
      if (!data.paymentDestinationId && invoice?.id) {
        // if the organization does not allow for na payment destination, check if the payment destination is set
        if (
          !mercoaSession.organization?.paymentMethods?.backupDisbursements?.find((e) => e.type === 'na')?.active ||
          nextInvoiceState === 'SCHEDULED'
        ) {
          renderCustom?.toast
            ? renderCustom?.toast.error('Please select a payment destination')
            : toast.error('Please select a payment destination')
          setError('paymentDestinationId', {
            type: 'manual',
            message:
              'Please select how the vendor wants to get paid' +
              (mercoaSession.organization?.paymentMethods?.backupDisbursements?.find((e) => e.type === 'na')?.active
                ? ' or send the vendor an email for their payment details'
                : ''),
          })
          return
        }
      }

      // Check if approvers are assigned
      if (invoiceData.status !== Mercoa.InvoiceStatus.Draft) {
        if (invoiceData.approvers?.length !== invoice?.approvers.length) {
          renderCustom?.toast
            ? renderCustom?.toast.error('Please assign all approvers for this invoice.')
            : toast.error('Please assign all approvers for this invoice.')
          setError('approvers', { type: 'manual', message: 'Please assign all approvers for this invoice.' })

          return
        }
      }

      if (nextInvoiceState === Mercoa.InvoiceStatus.Scheduled) {
        if (!invoiceData.deductionDate) {
          renderCustom?.toast
            ? renderCustom?.toast.error('Please select a payment date')
            : toast.error('Please select a payment date')
          setError('deductionDate', { type: 'manual', message: 'Please select a payment date' })

          return
        }
      }
    }

    //if the payment source is off-platform, make the payment destination destination off-platform too (only if a vendor exists)
    if (data.paymentSourceType === 'offPlatform') {
      if (data.vendorId && data.paymentDestinationType !== 'offPlatform') {
        const existingVendorPaymentMethods = await mercoaSession.client?.entity.paymentMethod.getAll(data.vendorId, {
          type: Mercoa.PaymentMethodType.OffPlatform,
        })
        let id = existingVendorPaymentMethods?.find((e) => e.type === Mercoa.PaymentMethodType.OffPlatform)?.id
        if (!id) {
          // if there is no off platform payment method, we need to create one
          const newPm = await mercoaSession.client?.entity.paymentMethod.create(data.vendorId, {
            type: Mercoa.PaymentMethodType.OffPlatform,
          })
          id = newPm?.id
        }
        invoiceData.paymentDestinationId = id
      }
    }

    //if the payment destination is utility, make sure the source is bankAccount or custom
    if (data.paymentDestinationType === 'utility') {
      if (data.paymentSourceType !== 'bankAccount' && !data.paymentSourceType.startsWith('cpms_')) {
        setError('paymentSourceId', {
          type: 'manual',
          message: 'Please select a payment source that can make utility payments',
        })
      }
    }

    // Auto-assign vendor credits if the invoice is saved as NEW, APPROVED, or SCHEDULED
    const vendorCreditUpdateStatuses: Mercoa.InvoiceStatus[] = [
      Mercoa.InvoiceStatus.New,
      Mercoa.InvoiceStatus.Approved,
      Mercoa.InvoiceStatus.Scheduled,
    ]
    if (vendorCreditUpdateStatuses.includes(nextInvoiceState)) {
      if (invoiceData.payerId && invoiceData.vendorId && invoiceData.amount) {
        const vendorCreditUsage = await mercoaSession.client?.entity.counterparty.vendorCredit.estimateUsage(
          invoiceData.payerId,
          invoiceData.vendorId,
          {
            amount: Number(invoiceData.amount),
            currency: 'USD',
            ...(invoice?.id && { excludedInvoiceIds: [invoice.id] }),
          },
        )
        const vendorCredits = vendorCreditUsage?.vendorCredits
        if (vendorCredits && vendorCredits.length > 0) {
          invoiceData.vendorCreditIds = vendorCredits.map((vendorCredit) => vendorCredit.id)
        }
      }
    }

    mercoaSession.debug('invoiceData before API call: ', { invoiceData })

    let invoiceDataFinal = invoiceData
    if (invoicePreSubmit) {
      invoiceDataFinal = await invoicePreSubmit(invoiceData)
    }

    if (invoice) {
      try {
        const resp = await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, invoiceDataFinal)
        if (resp) {
          if (!postAction) {
            mercoaSession.debug('invoice/update API response: ', resp)
            setUploadedDocument(undefined) // reset uploadedImage state so it is not repeatedly uploaded on subsequent saves that occur w/o a page refresh
            renderCustom?.toast ? renderCustom?.toast.success('Invoice updated') : toast.success('Invoice updated')
            onInvoiceSubmit?.(resp)
            refreshInvoice(resp.id)
          }
        } else {
          renderCustom?.toast
            ? renderCustom?.toast.error('There was an error updating the invoice')
            : toast.error('There was an error updating the invoice')
        }
      } catch (e: any) {
        console.log('error', e)
        // if the previous state was draft, we might need to refresh to get new approval rules
        if (invoiceDataFinal.status === Mercoa.InvoiceStatus.New && !postAction) {
          invoiceDataFinal.status = Mercoa.InvoiceStatus.Draft
          const resp = await getInvoiceClient(mercoaSession, invoiceType)?.update(invoice.id, invoiceDataFinal)
          if (resp) {
            setUploadedDocument(undefined) // reset uploadedImage state so it is not repeatedly uploaded on subsequent saves that occur w/o a page refresh
            refreshInvoice(resp.id)
          } else {
            console.error(e)

            console.error(e.body)
            renderCustom?.toast
              ? renderCustom?.toast.error(`There was an error updating the invoice.\n Error: ${e.body}`)
              : toast.error(`There was an error updating the invoice.\n Error: ${e.body}`)
          }
        } else {
          console.error(e)
          console.error(e.body)
          renderCustom?.toast
            ? renderCustom?.toast.error(`There was an error updating the invoice.\n Error: ${e.body}`)
            : toast.error(`There was an error updating the invoice.\n Error: ${e.body}`)
        }
      }
    } else {
      try {
        const resp = await getInvoiceClient(mercoaSession, invoiceType)?.create({
          ...invoiceDataFinal,
          creatorUserId: mercoaSession.user?.id,
        })
        if (resp) {
          mercoaSession.debug('invoice/update API response: ', resp)
          setUploadedDocument(undefined) // reset uploadedImage state so it is not repeatedly uploaded on subsequent saves that occur w/o a page refresh
          renderCustom?.toast ? renderCustom.toast.success('Invoice created') : toast.success('Invoice created')
          onInvoiceSubmit?.(resp)
          refreshInvoice(resp.id)
        } else {
          renderCustom?.toast
            ? renderCustom?.toast.error('There was an error creating the invoice')
            : toast.error('There was an error creating the invoice')
        }
      } catch (e: any) {
        console.error(e)
        console.error(e.body)
        renderCustom?.toast
          ? renderCustom?.toast.error(`There was an error creating the invoice.\n Error: ${e.body}`)
          : toast.error(`There was an error creating the invoice.\n Error: ${e.body}`)
      }
    }

    if (postAction === 'APPROVE') {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) {
        refreshInvoice(invoice.id)
        return
      }
      try {
        await getInvoiceClient(mercoaSession, invoiceType)?.approval.approve(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        refreshInvoice(invoice.id)
        renderCustom?.toast ? renderCustom.toast.success('Invoice approved') : toast.success('Invoice approved')
      } catch (e: any) {
        console.error(e)
        renderCustom?.toast
          ? renderCustom?.toast.error(`There was an error approving the invoice.\n Error: ${e.body}`)
          : toast.error(`There was an error approving the invoice.\n Error: ${e.body}`)
      }
      return
    } else if (postAction === 'REJECT') {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) {
        refreshInvoice(invoice.id)
        return
      }
      try {
        await getInvoiceClient(mercoaSession, invoiceType)?.approval.reject(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        toast.success('Invoice rejected')
      } catch (e: any) {
        console.error(e)
        renderCustom?.toast
          ? renderCustom?.toast.error(`There was an error rejecting the invoice.\n Error: ${e.body}`)
          : toast.error(`There was an error rejecting the invoice.\n Error: ${e.body}`)
      }
      return
    }
  }

  async function getVendorPaymentLink() {
    if (!invoice?.id) return
    try {
      const url = await mercoaSession.client?.invoice.paymentLinks.getVendorLink(invoice.id)
      return url
    } catch (e) {
      console.error(e)
      toast.error(`There was an error getting the payment link.`)
      return
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="PayableForm" />

  return (
    <div style={{ height: `${height}px` }} className="mercoa-overflow-auto mercoa-pr-2 mercoa-pb-32">
      <FormProvider {...methods}>
        <form
          id="payable-form"
          onSubmit={handleSubmit(saveInvoiceLoadingWrapper)}
          className={classNames(
            `mercoa-grid-cols-3 mercoa-mt-6 mercoa-grid md:mercoa-gap-x-6 md:mercoa-gap-y-4 mercoa-gap-2 mercoa-p-0.5 ${
              isLoading ? 'mercoa-opacity-50 mercoa-pointer-events-none' : ''
            }`,
            fullWidth ? 'mercoa-grid-cols-none' : '',
          )}
        >
          {children ? (
            children({
              invoice,
              refreshInvoice,
              ocrResponse,
              uploadedDocument,
              setUploadedDocument,
              height,
              setSelectedVendor,
              selectedVendor,
              getVendorPaymentLink,
              formMethods: methods as any,
              setValue: setValue as any,
              watch: watch as any,
              control: control as any,
              errors: errors as any,
              clearErrors: clearErrors as any,
              setError: setError as any,
              isLoading,
              ocrProcessing,
              submitForm: () => {
                handleSubmit(saveInvoiceLoadingWrapper)()
              },
            })
          ) : (
            <>
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableFormHeaderV1 /> <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableCounterpartySearchV1 onSelect={setSelectedVendor} counterparty={selectedVendor} />{' '}
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableOverviewV1 />
              <PayableLineItemsV1 />
              {mercoaSession.entityCustomizations?.ocr &&
                !mercoaSession.entityCustomizations?.ocr.taxAndShippingAsLineItems && <PayableTaxAndShippingV1 />}
              <PayableMetadataV1 /> <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              {mercoaSession.entity?.id && (
                <>
                  <PayablePaymentSourceV1 />{' '}
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                  <PayablePaymentDestinationV1 />
                  <PaymentDestinationProcessingTimeV1 />
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                  <PayableFeesV1 />
                  {invoiceType === 'invoiceTemplate' && <PayableRecurringScheduleV1 />}
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                  <PayableApproversV1 />{' '}
                  <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
                </>
              )}
              <InvoiceCommentsV1 />
              <PayableActionsV1
                submitForm={handleSubmit(saveInvoiceLoadingWrapper)}
                refreshInvoice={refreshInvoice}
                invoiceType={invoiceType}
              />
            </>
          )}
        </form>
      </FormProvider>
    </div>
  )
}

export function PayableFormHeaderV1({ hideId }: { hideId?: boolean }) {
  const { watch } = useFormContext()

  return (
    <>
      <div className="mercoa-flex mercoa-col-span-full">
        <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
          Edit Invoice{' '}
          <InvoiceStatusPill
            failureType={watch('failureType')}
            status={watch('status')}
            payerId={watch('payerId')}
            dueDate={watch('dueDate')}
            paymentSourceId={watch('paymentSourceId')}
            paymentDestinationId={watch('paymentDestinationId')}
            vendorId={watch('vendorId')}
            amount={watch('amount')}
            type="payable"
          />
        </h2>
      </div>
      {!hideId && (
        <p className="mercoa-col-span-full mercoa-text-xs mercoa-leading-6 mercoa-text-gray-400 mercoa-select-all">
          {watch('id')}
        </p>
      )}
    </>
  )
}

export function PayableFormErrorsV1() {
  const {
    formState: { errors },
    clearErrors,
  } = useFormContext()

  const errorKeys = Object.keys(errors)
  if (errorKeys.length === 0) return null

  const keyToField = {
    invoiceNumber: 'Invoice Number:',
    amount: 'Amount:',
    invoiceDate: 'Invoice Date:',
    dueDate: 'Due Date:',
    deductionDate: 'Scheduled Payment Date:',
    currency: 'Currency:',
    vendorId: 'Vendor:',
    paymentSourceId: 'Payment Source:',
    paymentDestinationId: 'Payment Destination:',
    approvers: 'Approvers:',
    lineItems: 'Line Items:',
    vendor: 'Vendor:',
    '~cpm~~': 'Payment Destination:',
  } as Record<string, string>

  const errorMessages = {
    approvers: 'Please select all approvers',
    lineItems: 'Please make sure all line items have a description and amount',
    vendor: 'Details incomplete',
    newBankAccount: 'Invalid Bank Account Data',
    newCheck: 'Invalid Check Data',
  } as Record<string, string>

  return (
    <div className="mercoa-bg-red-50 mercoa-border-l-4 mercoa-border-red-400 mercoa-p-4 mercoa-relative">
      {/* close button */}
      <button
        type="button"
        className="mercoa-absolute mercoa-top-1 mercoa-right-1 mercoa-p-1 mercoa-rounded-mercoa hover:mercoa-bg-red-100 focus:mercoa-outline-none focus:mercoa-bg-red-100"
        onClick={() => clearErrors()}
      >
        <span className="mercoa-sr-only">Close</span>
        <XMarkIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
      </button>
      <div className="mercoa-flex">
        <div className="mercoa-flex-shrink-0">
          <ExclamationCircleIcon className="mercoa-size-5 mercoa-text-red-400" aria-hidden="true" />
        </div>
        <div className="mercoa-ml-3">
          <h3 className="mercoa-text-sm mercoa-font-medium mercoa-text-red-800">
            There were errors with your submission
          </h3>
          <div className="mercoa-mt-2 mercoa-text-sm mercoa-text-red-700">
            <ul className="mercoa-list-disc mercoa-pl-5 mercoa-space-y-1">
              {errorKeys.map((key) => (
                <li key={key}>{`${keyToField[key] ?? ''} ${errors[key]?.message ?? errorMessages[key] ?? ''}`}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Document

export type PayableDocumentV1ChildrenProps = {
  documents?: Array<{ fileReaderObj: string; mimeType: string }>
  sourceEmails?: Mercoa.EmailLog[]
  invoice?: Mercoa.InvoiceResponse
  height: number
  theme?: 'light' | 'dark'
  onFileUpload: (fileReaderObj: string, mimeType: string) => void
  ocrProcessing?: boolean
  setOcrProcessing?: Dispatch<SetStateAction<boolean>>
}

export function PayableDocumentV1({
  onOcrComplete,
  setUploadedDocument,
  invoiceType = 'invoice',
  invoice,
  height,
  theme,
  children,
  ocrProcessing,
  setOcrProcessing,
  renderCustom,
}: {
  onOcrComplete?: (ocrResponse?: Mercoa.OcrResponse) => void
  setUploadedDocument?: (fileReaderObj: string) => void
  invoiceType?: 'invoice' | 'invoiceTemplate'
  invoice?: Mercoa.InvoiceResponse
  height: number
  theme?: 'light' | 'dark'
  children?: (props: PayableDocumentV1ChildrenProps) => JSX.Element
  ocrProcessing?: boolean
  setOcrProcessing?: Dispatch<SetStateAction<boolean>>
  renderCustom?: {
    uploadBanner?: () => React.ReactNode
    toast?: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
}) {
  const mercoaSession = useMercoaSession()
  const [documents, setDocuments] = useState<Array<{ fileReaderObj: string; mimeType: string }> | undefined>()
  const [sourceEmails, setSourceEmail] = useState<Mercoa.EmailLog[]>()
  const [ocrProcessingInternal, setOcrProcessingInternal] = useState(false)

  useEffect(() => {
    if (invoice && invoice.hasDocuments) {
      getInvoiceClient(mercoaSession, invoiceType)
        ?.document.getAll(invoice.id, { type: Mercoa.DocumentType.Invoice })
        .then((documents) => {
          if (documents && documents.length > 0) {
            setDocuments(documents.map((document) => ({ fileReaderObj: document.uri, mimeType: document.mimeType })))
          }
        })
    }
    if (invoice && invoice.hasSourceEmail) {
      getInvoiceClient(mercoaSession, invoiceType)
        ?.document.getSourceEmail(invoice.id)
        .then((sourceEmail) => {
          if (sourceEmail) {
            setSourceEmail(sourceEmail.data)
          }
        })
    }
  }, [invoice])

  async function refreshOcrJob(ocrJobId: string) {
    if (!mercoaSession.token) return
    const resp = await mercoaSession.client?.ocr.getAsyncOcr(ocrJobId)
    if (resp && resp.status === Mercoa.OcrJobStatus.Success) {
      if (onOcrComplete) onOcrComplete(resp.data)
      setOcrProcessing ? setOcrProcessing(false) : setOcrProcessingInternal(false)
    } else if (resp && resp.status === Mercoa.OcrJobStatus.Failed) {
      renderCustom?.toast ? renderCustom?.toast.error('OCR failed') : toast.error('OCR failed')
      setOcrProcessing ? setOcrProcessing(false) : setOcrProcessingInternal(false)
    } else {
      setTimeout(() => refreshOcrJob(ocrJobId), 2500)
    }
  }

  async function onFileUpload(fileReaderObj: string, mimeType: string) {
    setDocuments([{ fileReaderObj, mimeType }])
    if (setUploadedDocument) setUploadedDocument(fileReaderObj)
    // Run OCR on file upload
    setOcrProcessing ? setOcrProcessing(true) : setOcrProcessingInternal(true)
    try {
      //refreshOcrJob('ocr_57bab05c-0f69-4d98-86c5-ef258acf6253')
      const ocrResponse = await mercoaSession.client?.ocr.runAsyncOcr({
        entityId: mercoaSession.entityId,
        image: fileReaderObj,
        mimeType,
      })
      if (ocrResponse) {
        refreshOcrJob(ocrResponse.jobId)
      } else {
        renderCustom?.toast ? renderCustom?.toast.error('OCR failed') : toast.error('OCR failed')
        setOcrProcessing ? setOcrProcessing(false) : setOcrProcessingInternal(false)
      }
    } catch (e) {
      console.error(e)
      renderCustom?.toast ? renderCustom?.toast.error('OCR failed') : toast.error('OCR failed')
      setOcrProcessing ? setOcrProcessing(false) : setOcrProcessingInternal(false)
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="PayableDocument" />

  if (children) {
    return children({
      documents,
      sourceEmails,
      ocrProcessing: ocrProcessing ?? ocrProcessingInternal,
      setOcrProcessing: setOcrProcessing ?? setOcrProcessingInternal,
      invoice,
      height,
      theme,
      onFileUpload,
    })
  }

  return (
    <div className={`mercoa-p-5 mercoa-rounded-mercoa`}>
      {documents ? (
        <>
          <OcrProgressBarV1 ocrProcessing={ocrProcessing ?? ocrProcessingInternal} />
          <PayableDocumentDisplayV1
            documents={documents}
            invoice={invoice}
            height={height}
            showSourceEmail
            sourceEmails={sourceEmails}
            {...(!invoice?.hasDocuments && {
              onRemoveDocument: () => {
                setOcrProcessing ? setOcrProcessing(false) : setOcrProcessingInternal(false)
                setDocuments(undefined)
              },
            })}
          />
        </>
      ) : (
        <div className={`mercoa-min-w-[340px]`}>
          <DocumentUploadBoxV1 onFileUpload={onFileUpload} theme={theme} renderCustom={renderCustom} />
        </div>
      )}
    </div>
  )
}

export function DocumentUploadBoxV1({
  onFileUpload,
  theme,
  renderCustom,
}: {
  onFileUpload: (fileReaderObj: string, mimeType: string) => void
  theme?: 'light' | 'dark'
  renderCustom?: {
    uploadBanner?: () => React.ReactNode
    toast?: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
}) {
  return (
    <Dropzone
      onDropAccepted={(acceptedFiles) => {
        blobToDataUrl(acceptedFiles[0]).then((fileReaderObj) => {
          onFileUpload(fileReaderObj, acceptedFiles[0].type)
        })
      }}
      onDropRejected={() => {
        renderCustom?.toast ? renderCustom.toast.error('Invalid file type') : toast.success('Invalid file type')
      }}
      minSize={0}
      maxSize={10_000_000}
      accept={{
        'application/pdf': ['.pdf'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/jpeg': ['.jpeg', '.jpg'],
        'image/heic': ['.heic'],
        'image/webp': ['.webp'],
        'application/msword': ['.doc', '.docx'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.ms-excel': ['.xls', '.xlsx'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-powerpoint': ['.ppt', '.pptx'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      }}
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div
          className={classNames(
            `mercoa-mt-2 mercoa-flex mercoa-justify-center mercoa-rounded-mercoa mercoa-border mercoa-border-dashed mercoa-border-gray-900/25 ${
              isDragActive ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
            } mercoa-px-6 mercoa-py-10`,
            renderCustom?.uploadBanner ? 'mercoa-border-none' : '',
          )}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          {renderCustom?.uploadBanner ? (
            renderCustom.uploadBanner()
          ) : (
            <div className="mercoa-text-center">
              <PhotoIcon className="mercoa-mx-auto mercoa-h-12 mercoa-w-12 mercoa-text-gray-300" aria-hidden="true" />
              <div className="mercoa-mt-4 mercoa-flex mercoa-text-sm">
                <label
                  htmlFor="file-upload"
                  className="mercoa-relative mercoa-cursor-pointer mercoa-rounded-mercoa mercoa-font-semibold mercoa-text-mercoa-primary focus-within:mercoa-outline-none focus-within:mercoa-ring-1 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2"
                >
                  <span>Upload an invoice</span>
                </label>
                <p className="mercoa-pl-1">or drag and drop</p>
              </div>
              <p className="mercoa-text-xs mercoa-leading-5">PNG, JPG, WEBP, PDF up to 10MB</p>
            </div>
          )}
        </div>
      )}
    </Dropzone>
  )
}

export function PayableDocumentDisplayV1({
  documents,
  invoice,
  height,
  showSourceEmail,
  sourceEmails,
  onRemoveDocument,
}: {
  documents?: Array<{ fileReaderObj: string; mimeType: string }>
  invoice?: Mercoa.InvoiceResponse
  height: number
  showSourceEmail?: boolean
  sourceEmails?: Mercoa.EmailLog[]
  onRemoveDocument?: () => void
}) {
  const mercoaSession = useMercoaSession()

  const [view, setView] = useState<'document' | 'email'>('document')
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [rotate, setRotate] = useState<number>(0)
  const [debouncedWidth, setDebouncedWidth] = useDebounce(0, 20)
  const [numRenders, setNumRenders] = useState<number>(0)

  const wrapperDiv = useRef(null)

  useLayoutEffect(() => {
    if (wrapperDiv.current === null) return
    setDebouncedWidth((wrapperDiv.current as any).getBoundingClientRect().width)
  }, [wrapperDiv])

  useResizeObserver(wrapperDiv, (entry) => {
    if (numRenders > 100) return
    if (debouncedWidth && Math.abs(debouncedWidth - entry.contentRect.width) < 20) return
    setDebouncedWidth(entry.contentRect.width)
  })

  useEffect(() => {
    setNumRenders(numRenders + 1)
  }, [debouncedWidth])

  function getImageScale(scale: number) {
    if (scale <= 0.5) return `mercoa-scale-[0.5]`
    else if (scale <= 0.6) return `mercoa-scale-[0.6]`
    else if (scale <= 0.7) return `mercoa-scale-[0.7]`
    else if (scale <= 0.8) return `mercoa-scale-[0.8]`
    else if (scale <= 0.9) return `mercoa-scale-[0.9]`
    else if (scale <= 1) return `mercoa-scale-[1]`
    else if (scale <= 1.1) return `mercoa-scale-[1.1]`
    else if (scale <= 1.2) return `mercoa-scale-[1.2]`
    else if (scale <= 1.3) return `mercoa-scale-[1.3]`
    else if (scale <= 1.4) return `mercoa-scale-[1.4]`
    else if (scale <= 1.5) return `mercoa-scale-[1.5]`
    else if (scale <= 1.6) return `mercoa-scale-[1.6]`
    else if (scale <= 1.7) return `mercoa-scale-[1.7]`
    else if (scale <= 1.8) return `mercoa-scale-[1.8]`
    else if (scale <= 1.9) return `mercoa-scale-[1.9]`
    else if (scale <= 2) return `mercoa-scale-[2]`
    else if (scale <= 2.1) return `mercoa-scale-[2.1]`
    else if (scale <= 2.2) return `mercoa-scale-[2.2]`
    else if (scale <= 2.3) return `mercoa-scale-[2.3]`
    else if (scale <= 2.4) return `mercoa-scale-[2.4]`
    else if (scale <= 2.5) return `mercoa-scale-[2.5]`
    else if (scale <= 2.6) return `mercoa-scale-[2.6]`
    else if (scale <= 2.7) return `mercoa-scale-[2.7]`
    else if (scale <= 2.8) return `mercoa-scale-[2.8]`
    else if (scale <= 2.9) return `mercoa-scale-[2.9]`
    else if (scale <= 3) return `mercoa-scale-[3]`
    else if (scale <= 3.1) return `mercoa-scale-[3.1]`
    else if (scale <= 3.2) return `mercoa-scale-[3.2]`
    else if (scale <= 3.3) return `mercoa-scale-[3.3]`
    else if (scale <= 3.4) return `mercoa-scale-[3.4]`
    else if (scale <= 3.5) return `mercoa-scale-[3.5]`
    else if (scale <= 3.6) return `mercoa-scale-[3.6]`
    else if (scale <= 3.7) return `mercoa-scale-[3.7]`
    else if (scale <= 3.8) return `mercoa-scale-[3.8]`
    else if (scale <= 3.9) return `mercoa-scale-[3.9]`
    else if (scale <= 4) return `mercoa-scale-[4]`
    else if (scale <= 4.1) return `mercoa-scale-[4.1]`
    else if (scale <= 4.2) return `mercoa-scale-[4.2]`
    else if (scale <= 4.3) return `mercoa-scale-[4.3]`
    else if (scale <= 4.4) return `mercoa-scale-[4.4]`
    else if (scale <= 4.5) return `mercoa-scale-[4.5]`
    else if (scale <= 4.6) return `mercoa-scale-[4.6]`
    else if (scale <= 4.7) return `mercoa-scale-[4.7]`
    else if (scale <= 4.8) return `mercoa-scale-[4.8]`
    else if (scale <= 4.9) return `mercoa-scale-[4.9]`
    else if (scale <= 5) return `mercoa-scale-[5]`
  }

  function getRotate(angle: number) {
    if (angle % 360 === 0) return 'mercoa-rotate-0'
    else if (angle % 360 === 90) return 'mercoa-rotate-90'
    else if (angle % 360 === 180) return 'mercoa-rotate-180'
    else if (angle % 360 === 270) return 'mercoa-rotate-[270deg]'
    else return 'mercoa-rotate-0'
  }

  if (!mercoaSession.client) return <NoSession componentName="PayableDocumentDisplay" />
  if (!documents && !invoice)
    return <div>One of invoice or documents must be passed as a prop to PayableDocumentDisplay</div>
  return (
    <div className="mercoa-overflow-auto mercoa-min-w-[300px]" style={{ height: `${height}px` }} ref={wrapperDiv}>
      {view === 'document' && documents && documents.length > 0 && (
        <div className="mercoa-w-full">
          {documents.map((document, i) => (
            <div key={i} className="mercoa-rounded-mercoa mercoa-border mercoa-shadow-lg mercoa-w-full">
              <div className="mercoa-grid mercoa-grid-cols-3 mercoa-px-1 mercoa-bg-gray-100 mercoa-border-b">
                <div className="mercoa-flex">
                  <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}
                    className="mercoa-p-1 mercoa-text-gray-600 disabled:mercoa-text-gray-200"
                  >
                    <span className="mercoa-sr-only">Previous</span>
                    <ChevronUpIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                  </button>
                  <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-py-2 mercoa-gap-x-1 mercoa-text-gray-400">
                    <input
                      type="number"
                      min={1}
                      max={numPages ?? 1}
                      value={pageNumber}
                      onChange={(e) => setPageNumber(parseInt(e.target.value))}
                      className={inputClassName({ width: 'mercoa-w-[50px]' })}
                    />{' '}
                    / {numPages}
                  </div>
                  <button
                    type="button"
                    disabled={pageNumber >= (numPages ?? 1)}
                    onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages ?? 1))}
                    className="mercoa-p-1 mercoa-text-gray-600 disabled:mercoa-text-gray-200"
                  >
                    <span className="mercoa-sr-only">Next</span>
                    <ChevronDownIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="mercoa-flex mercoa-items-center mercoa-justify-center">
                  <button
                    type="button"
                    disabled={zoomLevel === 0.1}
                    onClick={() => setZoomLevel(Math.max(zoomLevel - 0.1, 0.1))}
                    className="mercoa-p-1 mercoa-text-gray-600 disabled:mercoa-text-gray-200"
                  >
                    <span className="mercoa-sr-only">Zoom Out</span>
                    <MagnifyingGlassMinusIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                  </button>
                  <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-py-2 mercoa-gap-x-1 mercoa-text-gray-400">
                    <span>{Math.floor(zoomLevel * 100)}%</span>
                  </div>
                  <button
                    type="button"
                    disabled={zoomLevel === 5}
                    onClick={() => setZoomLevel(Math.min(zoomLevel + 0.1, 5))}
                    className="mercoa-p-1 mercoa-text-gray-600 disabled:mercoa-text-gray-200"
                  >
                    <span className="mercoa-sr-only">Zoom In</span>
                    <MagnifyingGlassPlusIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={zoomLevel === 0.1}
                    onClick={() => setRotate(rotate + 90)}
                    className="mercoa-p-1 mercoa-text-gray-600 disabled:mercoa-text-gray-200"
                  >
                    <span className="mercoa-sr-only">Rotate</span>
                    <ArrowPathRoundedSquareIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="mercoa-flex mercoa-items-center mercoa-justify-end mercoa-gap-x-1">
                  {onRemoveDocument ? (
                    <div className="mercoa-cursor-pointer" onClick={onRemoveDocument}>
                      <TrashIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" color="#6B7280" />
                    </div>
                  ) : null}
                  <a
                    href={document.fileReaderObj}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="mercoa-p-1 mercoa-text-gray-600 disabled:mercoa-text-gray-200"
                  >
                    <span className="mercoa-sr-only">Download Invoice</span>
                    <ArrowDownTrayIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                  </a>
                  {showSourceEmail && sourceEmails && (
                    <button
                      type="button"
                      onClick={() => setView('email')}
                      className="mercoa-p-1 mercoa-text-gray-600 disabled:mercoa-text-gray-200"
                    >
                      <span className="mercoa-sr-only">View Email</span>
                      <EnvelopeIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mercoa-overflow-x-auto ">
                {document.mimeType === 'application/pdf' ? (
                  <Document
                    loading={
                      <div
                        className="mercoa-flex mercoa-w-full mercoa-items-center mercoa-justify-center"
                        style={{ height: '700px' }}
                      >
                        <LoadingSpinnerIcon />
                      </div>
                    }
                    file={document.fileReaderObj}
                    key={document.fileReaderObj}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    error={
                      <embed
                        src={document.fileReaderObj}
                        key={document.fileReaderObj}
                        height={height}
                        width={debouncedWidth - 5}
                        type="application/pdf"
                      />
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      className="mercoa-m-0 mercoa-w-full mercoa-p-0"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={debouncedWidth - 5}
                      scale={zoomLevel}
                      rotate={rotate % 360}
                    />
                  </Document>
                ) : (
                  <div className={`mercoa-w-full mercoa-overflow-scroll`}>
                    <img
                      src={document.fileReaderObj}
                      alt="Invoice Document"
                      className={`mercoa-origin-top-left mercoa-object-contain mercoa-object-top ${getImageScale(
                        zoomLevel,
                      )} ${getRotate(rotate)} mercoa-origin-center mercoa-w-full`}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {view === 'email' && sourceEmails && sourceEmails.length > 0 && (
        <div>
          <div className="mercoa-flex mercoa-flex-row-reverse mercoa-w-full">
            <MercoaButton
              type="button"
              isEmphasized={false}
              className="mercoa-mb-2"
              onClick={() => setView('document')}
            >
              <span className="mercoa-hidden xl:mercoa-inline">
                <DocumentIcon className="-mercoa-ml-1 mercoa-mr-2 mercoa-inline-flex mercoa-size-5" />
                View Invoice Document
              </span>
            </MercoaButton>
          </div>
          <div className="mercoa-w-full mercoa-justify-center">
            {sourceEmails.map((sourceEmail, i) => (
              <div className="mercoa-rounded-mercoa mercoa-border mercoa-shadow-lg mercoa-mb-5" key={i}>
                <div className="mercoa-space-y-2 mercoa-text-gray-800 mercoa-p-5 mercoa-bg-white">
                  <div className="mercoa-font-medium">From: {sourceEmail.from}</div>
                  <div className="mercoa-font-medium">Subject: {sourceEmail.subject}</div>
                  <div className="mercoa-font-medium">
                    Date: {dayjs(sourceEmail.createdAt).format('MMM DD, hh:mm a')}
                  </div>
                  <div className="mercoa-text-gray-600" dangerouslySetInnerHTML={{ __html: sourceEmail.htmlBody }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function OcrProgressBarV1({ ocrProcessing }: { ocrProcessing: boolean }) {
  const [progressPercentage, setProgressPercentage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressPercentage((prevProgressPercentage) => {
        if (prevProgressPercentage === 100) {
          return 0
        } else {
          return prevProgressPercentage + 1
        }
      })
    }, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`mercoa-text-center ${ocrProcessing ? 'mercoa-block mercoa-mb-5' : 'mercoa-hidden'}`}>
      <span className="mercoa-text-gray-800 mercoa-w-full"> Extracting Invoice Details </span>
      <div className="mercoa-h-2 mercoa-w-full mercoa-bg-gray-300">
        <div
          style={{ width: `${progressPercentage}%` }}
          className={`mercoa-rounded-sm mercoa-h-full mercoa-bg-mercoa-primary`}
        ></div>
      </div>
    </div>
  )
}

// End Documents

// Action Bar

export type PayableActionV1ChildrenProps = {
  isSaving: boolean
  buttons?: JSX.Element[]
  setStatus: (status: Mercoa.InvoiceStatus) => void
  submitForm?: () => void
}

export function findApproverSlot({
  approverSlots,
  userId,
  users,
}: {
  approverSlots: Mercoa.ApprovalSlot[]
  userId: string
  users: Mercoa.EntityUserResponse[]
}) {
  return approverSlots.find((approver, index) => {
    if (approver.assignedUserId === userId) {
      return true
    } else if (!approver.assignedUserId || approver.assignedUserId === 'ANY') {
      const eligibleApprovers = filterApproverOptionsV1({
        approverSlotIndex: index,
        eligibleRoles: approver.eligibleRoles,
        eligibleUserIds: approver.eligibleUserIds,
        users,
        selectedApprovers: [],
      })
      if (eligibleApprovers.find((e) => e.user.id === userId)) {
        return true
      }
    }
  })
}

export function PayableActionsV1({
  invoiceType = 'invoice',
  refreshInvoice,
  approveButton,
  rejectButton,
  nonApproverButton,
  recreateDraftButton,
  deleteButton,
  archiveButton,
  cancelButton,
  saveDraftButton,
  printCheckButton,
  viewCheckButton,
  createInvoiceButton,
  submitForApprovalButton,
  nextButton,
  markAsPaidButton,
  schedulePaymentButton,
  retryPaymentButton,
  submitForm,
  additionalActions,
  children,
}: {
  invoiceType?: 'invoice' | 'invoiceTemplate'
  refreshInvoice?: (invoiceId: string) => void
  approveButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  rejectButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  nonApproverButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  recreateDraftButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  deleteButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  archiveButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  cancelButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  saveDraftButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  printCheckButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  viewCheckButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  createInvoiceButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  submitForApprovalButton?: ({
    onClick,
    approversAssigned,
  }: {
    onClick: () => void
    approversAssigned: boolean
  }) => JSX.Element
  nextButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  markAsPaidButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  schedulePaymentButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  retryPaymentButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  submitForm?: () => void
  additionalActions?: {
    hideDefaultActions?: boolean
    position: 'left' | 'right'
    actions: (props: PayableActionV1ChildrenProps) => JSX.Element[]
  }
  children?: (props: PayableActionV1ChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()
  const [isSaving, setIsSaving] = useState(false)
  const { setValue, watch, formState } = useFormContext()

  useEffect(() => {
    if (formState.isSubmitting || formState.isLoading) {
      setIsSaving(true)
    } else {
      setTimeout(() => setIsSaving(false), 500)
    }
  }, [formState])

  const paymentDestinationOptions = watch('paymentDestinationOptions')
  const paymentDestinationType = watch('paymentDestinationType')
  const id = watch('id')
  const status = watch('status') as Mercoa.InvoiceStatus | undefined
  const approverSlots = watch('approvers') as Mercoa.ApprovalSlot[]
  const approverSlot = mercoaSession.user?.id
    ? findApproverSlot({
        approverSlots,
        userId: mercoaSession.user?.id,
        users: mercoaSession.users,
      })
    : undefined
  const [selectedEntity, setSelectedEntity] = useState<Mercoa.EntityResponse>()

  const buttons: JSX.Element[] = []

  if (!mercoaSession.client) return <NoSession componentName="PayableActions" />

  const assignToEntityComponent = (
    <div className="mercoa-flex mercoa-space-x-2">
      <EntitySelector onSelect={setSelectedEntity} direction="up" />
      <MercoaButton
        isEmphasized={true}
        disabled={!id || !selectedEntity}
        onClick={async () => {
          if (!id || !selectedEntity) return
          await getInvoiceClient(mercoaSession, invoiceType)?.update(id, {
            status: Mercoa.InvoiceStatus.Draft,
            creatorEntityId: selectedEntity.id,
            payerId: selectedEntity.id,
          })
          if (refreshInvoice) {
            refreshInvoice(id)
            mercoaSession.setEntity(selectedEntity)
          }
        }}
      >
        Assign to Entity
      </MercoaButton>
    </div>
  )

  const deleteButtonComponent = deleteButton ? (
    deleteButton({
      onClick: () => {
        setValue('saveAsStatus', 'DELETE')
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="secondary"
      onClick={() => {
        setValue('saveAsStatus', 'DELETE')
      }}
    >
      Delete Invoice
    </MercoaButton>
  )

  const archiveButtonComponent = archiveButton ? (
    archiveButton({
      onClick: () => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Archived)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="secondary"
      onClick={() => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Archived)
      }}
    >
      Archive Invoice
    </MercoaButton>
  )

  const recreateDraftButtonComponent = recreateDraftButton ? (
    recreateDraftButton({
      onClick: () => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Draft)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="green"
      onClick={() => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Draft)
      }}
    >
      Restore as Draft
    </MercoaButton>
  )

  const cancelButtonComponent = cancelButton ? (
    cancelButton({
      onClick: () => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Canceled)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="secondary"
      onClick={() => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Canceled)
      }}
    >
      Cancel Payment
    </MercoaButton>
  )

  const saveDraftButtonComponent = saveDraftButton ? (
    saveDraftButton({
      onClick: () => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Draft)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      type="submit"
      onClick={() => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Draft)
      }}
    >
      Save Draft
    </MercoaButton>
  )

  const printCheckButtonComponent = printCheckButton ? (
    printCheckButton({
      onClick: () => {
        setValue('saveAsStatus', 'PRINT_CHECK')
      },
    })
  ) : (
    <MercoaButton
      isEmphasized
      onClick={() => {
        setValue('saveAsStatus', 'PRINT_CHECK')
      }}
    >
      {(paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
      Mercoa.CheckDeliveryMethod.Print
        ? 'Print Check'
        : 'View Mailed Check'}
    </MercoaButton>
  )

  const viewCheckButtonComponent = viewCheckButton ? (
    viewCheckButton({
      onClick: async () => {
        const pdf = await getInvoiceClient(mercoaSession, invoiceType)?.document.generateCheckPdf(id)
        if (pdf) {
          window.open(pdf.uri, '_blank')
        } else {
          toast.error('There was an error generating the check PDF')
        }
      },
    })
  ) : (
    <MercoaButton
      type="button"
      isEmphasized
      onClick={async () => {
        const pdf = await getInvoiceClient(mercoaSession, invoiceType)?.document.generateCheckPdf(id)
        if (pdf) {
          window.open(pdf.uri, '_blank')
        } else {
          toast.error('There was an error generating the check PDF')
        }
      }}
    >
      {(paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
      Mercoa.CheckDeliveryMethod.Print
        ? 'Print Check'
        : 'View Mailed Check'}
    </MercoaButton>
  )

  const createInvoiceButtonHandler = () => {
    // Set initial invoice status to Unassigned if creating at the group level
    const creationStatus =
      !!mercoaSession.entityGroup?.id && !mercoaSession.entity?.id
        ? Mercoa.InvoiceStatus.Unassigned
        : Mercoa.InvoiceStatus.Draft
    setValue('saveAsStatus', creationStatus)
  }
  const createInvoiceButtonComponent = createInvoiceButton ? (
    createInvoiceButton({
      onClick: createInvoiceButtonHandler,
    })
  ) : (
    <MercoaButton isEmphasized type="submit" onClick={createInvoiceButtonHandler}>
      Create Invoice
    </MercoaButton>
  )

  const submitForApprovalButtonComponent = submitForApprovalButton ? (
    submitForApprovalButton({
      onClick: () => {
        if (approverSlots.every((e) => e.assignedUserId)) {
          setValue('saveAsStatus', '')
        }
      },
      approversAssigned: approverSlots.every((e) => e.assignedUserId),
    })
  ) : (
    <>
      {!approverSlots.every((e) => e.assignedUserId) ? (
        <MercoaButton type="submit" isEmphasized disabled>
          Please assign all approvers
        </MercoaButton>
      ) : (
        <MercoaButton
          type="submit"
          isEmphasized
          onClick={() => {
            setValue('saveAsStatus', '')
          }}
        >
          Submit for Approval
        </MercoaButton>
      )}
    </>
  )

  const nextButtonComponent = nextButton ? (
    nextButton({
      onClick: () => {
        setValue('saveAsStatus', '')
      },
    })
  ) : (
    <MercoaButton
      type="submit"
      isEmphasized
      onClick={() => {
        setValue('saveAsStatus', '')
      }}
    >
      Next
    </MercoaButton>
  )

  const markPaidButtonComponent = markAsPaidButton ? (
    markAsPaidButton({
      onClick: () => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Paid)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={true}
      onClick={() => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Paid)
      }}
    >
      Mark as Paid
    </MercoaButton>
  )

  const schedulePaymentButtonComponent = schedulePaymentButton ? (
    schedulePaymentButton({
      onClick: () => {
        setValue('saveAsStatus', '')
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={true}
      onClick={() => {
        setValue('saveAsStatus', '')
      }}
    >
      Schedule Payment
    </MercoaButton>
  )

  const retryPaymentButtonComponent = retryPaymentButton ? (
    retryPaymentButton({
      onClick: () => {
        setValue('saveAsStatus', '')
        setValue('status', Mercoa.InvoiceStatus.Scheduled)
      },
    })
  ) : (
    <MercoaButton
      type="submit"
      isEmphasized
      onClick={() => {
        setValue('saveAsStatus', '')
        setValue('status', Mercoa.InvoiceStatus.Scheduled)
      }}
    >
      Retry Payment
    </MercoaButton>
  )

  const nonApproverButtonComponent = nonApproverButton ? (
    nonApproverButton({ onClick: () => {} })
  ) : (
    <MercoaButton disabled color="gray" isEmphasized type="button">
      Waiting for approval
    </MercoaButton>
  )

  const rejectButtonComponent = rejectButton ? (
    rejectButton({ onClick: () => setValue('saveAsStatus', 'REJECT') })
  ) : (
    <MercoaButton
      disabled={approverSlot?.action === Mercoa.ApproverAction.Reject}
      color="secondary"
      isEmphasized
      onClick={() => setValue('saveAsStatus', 'REJECT')}
    >
      Reject
    </MercoaButton>
  )

  const approveButtonComponent = approveButton ? (
    approveButton({
      onClick: () => setValue('saveAsStatus', 'APPROVE'),
    })
  ) : (
    <MercoaButton
      disabled={approverSlot?.action === Mercoa.ApproverAction.Approve}
      color="green"
      isEmphasized
      onClick={() => setValue('saveAsStatus', 'APPROVE')}
    >
      Approve
    </MercoaButton>
  )

  // Creating a brand new invoice
  if (!id) {
    buttons.push(createInvoiceButtonComponent)
  } else {
    switch (status) {
      case Mercoa.InvoiceStatus.Draft:
        let saveButton = <></>
        if (approverSlots && approverSlots.length > 0) {
          saveButton = submitForApprovalButtonComponent
        } else {
          saveButton = nextButtonComponent
        }
        buttons.push(saveButton, saveDraftButtonComponent, deleteButtonComponent)
        break

      case Mercoa.InvoiceStatus.New:
        if (!approverSlot) {
          buttons.push(nonApproverButtonComponent)
        } else {
          buttons.push(approveButtonComponent, rejectButtonComponent)
        }
        buttons.push(cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Approved:
        let nextButton = <></>
        if (paymentDestinationType === Mercoa.PaymentMethodType.OffPlatform) {
          nextButton = markPaidButtonComponent
        } else if (
          paymentDestinationType === Mercoa.PaymentMethodType.Check &&
          (paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
            Mercoa.CheckDeliveryMethod.Print
        ) {
          nextButton = printCheckButtonComponent
        } else {
          nextButton = schedulePaymentButtonComponent
        }
        buttons.push(nextButton, cancelButtonComponent)

        break

      case Mercoa.InvoiceStatus.Scheduled:
        if (paymentDestinationType === Mercoa.PaymentMethodType.OffPlatform) {
          buttons.push(markPaidButtonComponent)
        }
        if (
          paymentDestinationType === Mercoa.PaymentMethodType.Check &&
          (paymentDestinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery ===
            Mercoa.CheckDeliveryMethod.Print
        ) {
          buttons.push(printCheckButtonComponent)
        }
        buttons.push(cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Paid:
        if (paymentDestinationType === Mercoa.PaymentMethodType.Check) {
          buttons.push(viewCheckButtonComponent)
        }
        buttons.push(archiveButtonComponent)
        break

      case Mercoa.InvoiceStatus.Failed:
        buttons.push(retryPaymentButtonComponent, cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Unassigned:
        buttons.push(assignToEntityComponent)
        break

      case Mercoa.InvoiceStatus.Canceled:
      case Mercoa.InvoiceStatus.Refused:
        buttons.push(recreateDraftButtonComponent, deleteButtonComponent)
        break

      case Mercoa.InvoiceStatus.Archived:
        if (paymentDestinationType === Mercoa.PaymentMethodType.Check) {
          buttons.push(viewCheckButtonComponent)
        }
        break

      case Mercoa.InvoiceStatus.Pending:
      default:
        break
    }
  }

  if (children) {
    return children({ isSaving, buttons, setStatus: (status) => setValue('saveAsStatus', status), submitForm })
  }

  const additionalActionButtons = (
    <>
      {additionalActions?.actions &&
        additionalActions.actions({
          isSaving,
          buttons,
          setStatus: (status) => setValue('saveAsStatus', status),
          submitForm,
        })}
    </>
  )

  return (
    <>
      <div className="mercoa-col-span-full" style={{ visibility: 'hidden' }}>
        <PayableFormErrorsV1 />
      </div>
      <div className="mercoa-absolute mercoa-bottom-0 mercoa-right-0 mercoa-w-full mercoa-bg-white mercoa-z-10">
        {isSaving ? (
          <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-p-2">
            <LoadingSpinnerIcon />
          </div>
        ) : (
          <>
            <PayableFormErrorsV1 />
            <div className="mercoa-mx-auto mercoa-flex mercoa-flex-row-reverse mercoa-items-center mercoa-gap-2 mercoa-py-3 mercoa-px-6">
              {additionalActions?.position !== 'left' && additionalActionButtons}
              {!additionalActions?.hideDefaultActions &&
                buttons.map((button, index) => <div key={index}>{button}</div>)}
              {additionalActions?.position === 'left' && additionalActionButtons}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export type PayableOverviewV1ChildrenProps = {
  readOnly?: boolean
  amount?: number
  setAmount?: (amount: number) => void
  supportedCurrencies?: Array<Mercoa.CurrencyCode>
  currency?: Mercoa.CurrencyCode
  setCurrency?: (currency: Mercoa.CurrencyCode) => void
  dueDate?: Date
  setDueDate?: (dueDate: Date) => void
  invoiceDate?: Date
  setInvoiceDate?: (invoiceDate: Date) => void
  supportedSchedulePaymentDates?: Array<'Weekend' | 'Past' | 'Holiday'>
  schedulePaymentDate?: Date
  setSchedulePaymentDate?: (schedulePaymentDate: Date) => void
  invoiceNumber?: string
  setInvoiceNumber?: (invoiceNumber: string) => void
  description?: string
  setDescription?: (description: string) => void
}

export type PayableTaxAndShippingV1ChildrenProps = {
  readOnly?: boolean
  taxAmount?: number
  setTaxAmount?: (taxAmount: number) => void
  shippingAmount?: number
  setShippingAmount?: (shippingAmount: number) => void
}

export function PayableOverviewV1({
  readOnly,
  supportedCurrencies,
  supportedSchedulePaymentDates,
  children,
}: {
  readOnly?: boolean
  supportedCurrencies?: Array<Mercoa.CurrencyCode>
  supportedSchedulePaymentDates?: Array<'Weekend' | 'Past' | 'Holiday'>
  children?: (props: PayableOverviewV1ChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  const [finalSupportedCurrencies, setFinalSupportedCurrencies] = useState<Array<Mercoa.CurrencyCode>>(
    supportedCurrencies && supportedCurrencies.length > 0 ? supportedCurrencies : [Mercoa.CurrencyCode.Usd],
  )

  const {
    register,
    control,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext()

  const currency = watch('currency')
  const status = watch('status')
  const paymentDestinationType = watch('paymentDestinationType')

  const notDraft = !!status && status !== Mercoa.InvoiceStatus.Draft

  // Get Supported Currencies
  useEffect(() => {
    // Figure out what currencies are supported by C1 -------------------------------
    let derivedSupportedCurrencies: Mercoa.CurrencyCode[] = []
    const hasMercoaPaymentRails = mercoaSession.organization?.paymentMethods?.payerPayments.some(
      (p) => p.active && (p.type === 'bankAccount' || p.type === 'card'),
    )
    // dedupe and add supported currencies
    if (hasMercoaPaymentRails) {
      derivedSupportedCurrencies.push(Mercoa.CurrencyCode.Usd)
    }
    mercoaSession.customPaymentMethodSchemas.forEach((p) => {
      if (p.supportedCurrencies) {
        derivedSupportedCurrencies = [...new Set([...derivedSupportedCurrencies, ...p.supportedCurrencies])]
      }
    })
    setFinalSupportedCurrencies([
      ...new Set([...derivedSupportedCurrencies, ...(supportedCurrencies ?? [Mercoa.CurrencyCode.Usd])]),
    ])
  }, [mercoaSession.client, mercoaSession.customPaymentMethodSchemas, mercoaSession.organization?.paymentMethods])

  // Reset currency dropdown
  useEffect(() => {
    if (currency) return
    if (finalSupportedCurrencies.length > 0) {
      setValue('currency', finalSupportedCurrencies[0])
    }
  }, [finalSupportedCurrencies, currency])

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

  if (children) {
    return children({
      readOnly,
      amount: watch('amount'),
      setAmount: (amount: number) => setValue('amount', amount),
      supportedCurrencies: finalSupportedCurrencies,
      currency,
      setCurrency: (currency: Mercoa.CurrencyCode) => setValue('currency', currency),
      dueDate: watch('dueDate'),
      setDueDate: (dueDate: Date) => setValue('dueDate', dueDate),
      invoiceDate: watch('invoiceDate'),
      setInvoiceDate: (invoiceDate: Date) => setValue('invoiceDate', invoiceDate),
      supportedSchedulePaymentDates,
      schedulePaymentDate: watch('deductionDate'),
      setSchedulePaymentDate: (schedulePaymentDate: Date) => setValue('deductionDate', schedulePaymentDate),
      invoiceNumber: watch('invoiceNumber'),
      setInvoiceNumber: (invoiceNumber: string) => setValue('invoiceNumber', invoiceNumber),
      description: watch('description'),
      setDescription: (description: string) => setValue('description', description),
    })
  }

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
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
      />

      {/*  INVOICE AMOUNT */}
      <MercoaInput
        control={control}
        name="amount"
        label="Amount"
        type="currency"
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>}
        trailingIcon={
          <>
            <label htmlFor="currency" className="mercoa-sr-only">
              Currency
            </label>
            <select
              {...register('currency')}
              disabled={readOnly || notDraft}
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
        errors={errors}
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
          paymentDestinationType === Mercoa.PaymentMethodType.OffPlatform
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
          <PrintDescriptionOnCheckRemittanceSwitchV1 />
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

export function PayableTaxAndShippingV1({
  readOnly,
  children,
}: {
  readOnly?: boolean
  children?: (props: PayableTaxAndShippingV1ChildrenProps) => JSX.Element
}) {
  const {
    control,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext()

  const currency = watch('currency')
  const status = watch('status')

  const notDraft = !!status && status !== Mercoa.InvoiceStatus.Draft

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

  if (children) {
    return children({
      readOnly,
      taxAmount: watch('taxAmount'),
      setTaxAmount: (taxAmount: number) => setValue('taxAmount', taxAmount),
      shippingAmount: watch('shippingAmount'),
      setShippingAmount: (shippingAmount: number) => setValue('shippingAmount', shippingAmount),
    })
  }

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
      {/*  TAX AMOUNT */}
      <MercoaInput
        control={control}
        name="taxAmount"
        label="Tax"
        type="currency"
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>}
        errors={errors}
      />

      {/*  SHIPPING AMOUNT */}
      <MercoaInput
        control={control}
        name="shippingAmount"
        label="Shipping"
        type="currency"
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>}
        errors={errors}
      />
    </div>
  )
}

function PrintDescriptionOnCheckRemittanceSwitchV1() {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext()

  const paymentDestinationType = watch('paymentDestinationType')
  const paymentDestinationOptions = watch('paymentDestinationOptions')

  // Only runs when paymentDestinationOptions is not set
  useEffect(() => {
    if (!paymentDestinationOptions?.type) {
      setValue('paymentDestinationOptions', {
        type: 'check',
        delivery: 'MAIL',
        printDescription: !!paymentDestinationOptions?.printDescription,
      })
    }
  }, [paymentDestinationOptions])

  if (paymentDestinationType !== 'check') return <></>
  return (
    <MercoaSwitch
      label="Print Description on Check Remittance"
      name="paymentDestinationOptions.printDescription"
      register={register}
      errors={errors}
      className="mercoa-mt-[0px]"
    />
  )
}

// Payment Source and Destination

export function PayableSelectPaymentMethodV1({
  isSource,
  isDestination,
  disableCreation,
  readOnly,
}: {
  isSource?: boolean
  isDestination?: boolean
  disableCreation?: boolean
  readOnly?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [paymentMethods, setPaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse>>([])
  const [offPlatformDestinationMethod, setOffPlatformDestinationMethod] = useState<Mercoa.PaymentMethodResponse>()
  const [firstRender, setFirstRender] = useState(true)

  const [showBNPL, setShowBNPL] = useState(false)

  const { watch, setValue, clearErrors } = useFormContext()

  const vendorId = watch('vendorId')
  const entityId = isDestination ? vendorId : mercoaSession.entity?.id

  // Get payment methods
  async function refreshPaymentMethods() {
    if (!mercoaSession.token || !entityId || !mercoaSession.client) return
    const resp = await mercoaSession.client?.entity.paymentMethod.getAll(entityId)
    setPaymentMethods(resp)
  }

  // Get off-platform destination payment methods only when current selector is source
  async function refreshOffPlatformDestinationMethod() {
    if (!mercoaSession.token || !vendorId || !mercoaSession.client || isDestination) return
    const resp = await mercoaSession.client?.entity.paymentMethod.getAll(vendorId, {
      type: Mercoa.PaymentMethodType.OffPlatform,
    })
    setOffPlatformDestinationMethod(resp[0])
  }

  useEffect(() => {
    if (!mercoaSession.token || !entityId || !mercoaSession.client) return
    refreshPaymentMethods()
    refreshOffPlatformDestinationMethod()
  }, [mercoaSession.client, entityId, mercoaSession.refreshId])

  let paymentMethodTypeKey: 'paymentSourceType' | 'paymentDestinationType' = 'paymentSourceType'
  let sourceOrDestination: 'paymentSourceId' | 'paymentDestinationId' = 'paymentSourceId'
  if (isDestination) {
    paymentMethodTypeKey = 'paymentDestinationType'
    sourceOrDestination = 'paymentDestinationId'
  }

  const availableTypes: Array<{ key: string; value: string }> = []

  if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'bankAccount')) {
    availableTypes.push({ key: 'bankAccount', value: 'Bank Account' })
  }
  if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'card')) {
    availableTypes.push({ key: 'card', value: 'Card' })
  }
  if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'check')) {
    availableTypes.push({ key: 'check', value: 'Check' })
  }
  if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'utility')) {
    availableTypes.push({ key: 'utility', value: 'Utility' })
  }
  paymentMethods.forEach((paymentMethod) => {
    if (paymentMethod.type === 'custom') {
      if (availableTypes.some((type) => type.key === paymentMethod.schemaId)) return // skip if already added
      availableTypes.push({ key: paymentMethod.schemaId ?? '', value: paymentMethod.schema.name ?? '' })
    }
  })

  if (isDestination && vendorId) {
    mercoaSession.organization?.paymentMethods?.backupDisbursements.forEach((backupDisbursement) => {
      if (!backupDisbursement.active) return
      // skip if already added
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
          value: mercoaSession.customPaymentMethodSchemas.find((e) => e.id == backupDisbursement.name)?.name ?? 'Other',
        })
    })
  } else {
    // if not a destination, check if off platform payments are enabled and push that
    const offPlatform = mercoaSession.organization?.paymentMethods?.payerPayments.find((e) => e.type === 'offPlatform')
    if (offPlatform && offPlatform.active) {
      availableTypes.push({
        key: offPlatform.type,
        value: offPlatform.name,
      })
    }
  }

  const selectedType = watch(paymentMethodTypeKey)
  const paymentId = watch(sourceOrDestination)
  const destinationOptions = watch('paymentDestinationOptions')
  const counterpartyAccounts: Array<Mercoa.CounterpartyCustomizationAccount> = watch('vendor.accounts')

  // set a default payment method type
  useEffect(() => {
    if (!paymentMethods || paymentMethods.length === 0) return
    if (!firstRender) return
    setFirstRender(false)
    if (paymentId) return

    // Check for default payment method
    let defaultPm: Mercoa.PaymentMethodResponse | undefined
    if (isSource) {
      defaultPm = paymentMethods.find((e) => e.isDefaultSource)
    } else {
      defaultPm = paymentMethods.find((e) => e.isDefaultDestination)
    }
    if (defaultPm) {
      if (defaultPm.type === 'custom') {
        setValue(paymentMethodTypeKey, defaultPm.schemaId)
      } else {
        setValue(paymentMethodTypeKey, defaultPm.type)
      }
      setValue(sourceOrDestination, defaultPm.id)
      clearErrors(sourceOrDestination)
      return
    }

    // if there is no default payment method, set some sane defaults
    if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'bankAccount')) {
      setValue(paymentMethodTypeKey, 'bankAccount')
      setMethodOnTypeChange('bankAccount')
    } else if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'card')) {
      setValue(paymentMethodTypeKey, 'card')
      setMethodOnTypeChange('card')
    } else if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'check')) {
      setValue(paymentMethodTypeKey, 'check')
      setMethodOnTypeChange('check')
    } else if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'utility')) {
      setValue(paymentMethodTypeKey, 'utility')
      setMethodOnTypeChange('utility')
    } else if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'custom')) {
      const cpm = paymentMethods.find(
        (paymentMethod) => paymentMethod.type === 'custom',
      ) as Mercoa.PaymentMethodResponse.Custom
      if (cpm.schemaId) {
        setValue(paymentMethodTypeKey, cpm.schemaId)
        setMethodOnTypeChange(cpm.schemaId)
      }
    }
  }, [paymentMethods, paymentId, firstRender])

  // if selectedType changes, set the payment method id to the first payment method of that type
  function setMethodOnTypeChange(selectedType: Mercoa.PaymentMethodType | string) {
    const backupDisbursement = mercoaSession.organization?.paymentMethods?.backupDisbursements.find((e) => {
      if (!e.active) return false
      if (e.type === 'custom') return e.name === selectedType
      return e.type === selectedType
    })
    if (isDestination) {
      setValue('paymentDestinationOptions', undefined)
    }
    if (selectedType === Mercoa.PaymentMethodType.BankAccount) {
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
  }

  // Create Off-Platform Payment Method
  function createOffPlatformPaymentMethod() {
    const existingOffPlatformPaymentMethod = paymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.OffPlatform,
    )
    if (existingOffPlatformPaymentMethod) {
      setValue(sourceOrDestination, existingOffPlatformPaymentMethod.id)
      setValue(paymentMethodTypeKey, Mercoa.PaymentMethodType.OffPlatform)
      setValue('paymentDestinationOptions', undefined)
      clearErrors(sourceOrDestination)
    } else {
      // if there is no off platform payment method, we need to create one
      mercoaSession.client?.entity.paymentMethod
        .create(entityId, {
          type: Mercoa.PaymentMethodType.OffPlatform,
        })
        .then(async (resp) => {
          if (resp) {
            await refreshPaymentMethods()
            setValue(sourceOrDestination, resp.id)
            setValue(paymentMethodTypeKey, Mercoa.PaymentMethodType.OffPlatform)
            setValue('paymentDestinationOptions', undefined)
            clearErrors(sourceOrDestination)
          }
        })
    }
    // create Off-Platform Payment Method for destination in case source is Off-Platform
    if (!isDestination) {
      if (offPlatformDestinationMethod) {
        setValue('paymentDestinationId', offPlatformDestinationMethod.id)
        setValue('paymentDestinationType', Mercoa.PaymentMethodType.OffPlatform)
        setValue('paymentDestinationOptions', undefined)
        clearErrors('paymentDestinationId')
      } else if (vendorId) {
        mercoaSession.client?.entity.paymentMethod
          .create(vendorId, {
            type: Mercoa.PaymentMethodType.OffPlatform,
          })
          .then(async (resp) => {
            if (resp) {
              await refreshOffPlatformDestinationMethod()
              setValue('paymentDestinationId', resp.id)
              setValue('paymentDestinationType', Mercoa.PaymentMethodType.OffPlatform)
              setValue('paymentDestinationOptions', undefined)
              clearErrors('paymentDestinationId')
            }
          })
      }
    }
  }

  // For offline payments, we need to set the correct payment method id automatically
  useEffect(() => {
    if (selectedType !== Mercoa.PaymentMethodType.OffPlatform) return
    if (!entityId) return
    createOffPlatformPaymentMethod()
  }, [isDestination, entityId, selectedType, paymentMethods])

  // For bank accounts, we need to set check enabled or not
  useEffect(() => {
    if (selectedType !== Mercoa.PaymentMethodType.BankAccount) return
    if (isDestination) return
    const bankAccount = paymentMethods.find(
      (paymentMethod) => paymentMethod.id === paymentId,
    ) as Mercoa.PaymentMethodResponse.BankAccount
    if (bankAccount) {
      setValue('paymentSourceCheckEnabled', bankAccount?.checkOptions?.enabled ?? false)
    }
  }, [isDestination, selectedType, paymentMethods, paymentId])

  // // Reset payment destination and fields on type change
  // useEffect(() => {
  //   if (!isDestination) return
  //   setValue('paymentDestinationOptions', undefined)
  // }, [isDestination, selectedType])

  // If selected type is custom, find the schema
  useEffect(() => {
    if (selectedType === Mercoa.PaymentMethodType.Custom) {
      const paymentMethod = paymentMethods.find(
        (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Custom && paymentMethod.id === paymentId,
      ) as Mercoa.PaymentMethodResponse.Custom
      if (paymentMethod?.schemaId) {
        setValue(paymentMethodTypeKey, paymentMethod.schemaId)
      }
    }
  }, [selectedType, paymentMethods, paymentId])

  const enableBNPL = mercoaSession.organization?.paymentMethods?.payerPayments.find(
    (e) => e.type === 'bnpl' && e.active,
  )

  if (!mercoaSession.client) return <NoSession componentName="SelectPaymentMethod" />
  const backupDisbursement = mercoaSession.organization?.paymentMethods?.backupDisbursements.find((e) => {
    if (!e.active) return false
    if (e.type === 'custom') return e.name === selectedType
    return e.type === selectedType
  })
  return (
    <div>
      {!readOnly && (
        <MercoaCombobox
          options={availableTypes.map((type) => ({ value: type, disabled: false }))}
          onChange={(selected) => {
            setValue(paymentMethodTypeKey, selected.key)
            setMethodOnTypeChange(selected.key)
          }}
          value={availableTypes.find((type) => type.key === selectedType)}
          displayIndex="value"
          showAllOptions
        />
      )}
      {selectedType === Mercoa.PaymentMethodType.BankAccount && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount)
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <BankAccount
                    account={paymentMethod as Mercoa.PaymentMethodResponse.BankAccount}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
          {isSource && enableBNPL && (
            <>
              {showBNPL ? (
                <FinanceWithOatfi paymentMethods={paymentMethods} setShowBNPL={setShowBNPL} />
              ) : (
                <div className="mercoa-flex mercoa-items-center mercoa-justify-end mercoa-mt-1">
                  <MercoaButton isEmphasized={false} onClick={() => setShowBNPL(true)} size="sm">
                    Extend payment terms
                  </MercoaButton>
                </div>
              )}
            </>
          )}
          {isDestination && !disableCreation && !readOnly && vendorId && backupDisbursement && (
            <>
              <div className="mercoa-col-span-full mercoa-mt-1">
                <PayablesInlineForm
                  form={<AddBankAccountForm prefix="newBankAccount." />}
                  name="Bank Account"
                  addNewButton={<BankAccount />}
                  saveAsStatus="CREATE_BANK_ACCOUNT"
                />
              </div>
              <div className="mercoa-mt-2" />
              <MercoaCombobox
                displaySelectedAs="pill"
                label="Payment Speed"
                showAllOptions
                options={(backupDisbursement as Mercoa.PaymentRailResponse.BankAccount)?.availableDeliveryMethods.map(
                  (e) => ({
                    value: {
                      key: e,
                      value: BankSpeedEnumToLabel(e),
                    },
                    disabled: false,
                  }),
                )}
                onChange={(selected) => {
                  setValue('paymentDestinationOptions', {
                    type: 'bankAccount',
                    delivery: selected.key,
                  })
                }}
                displayIndex="value"
                value={() => {
                  const speed = (destinationOptions as Mercoa.PaymentDestinationOptions.BankAccount)?.delivery
                  return { key: speed, value: BankSpeedEnumToLabel(speed) }
                }}
              />
            </>
          )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Check && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Check)
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <Check
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Check}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
          {isDestination && !disableCreation && !readOnly && vendorId && backupDisbursement && (
            <>
              <div className="mercoa-col-span-full mercoa-mt-1">
                <PayablesInlineForm
                  form={<AddCheckForm prefix="newCheck." />}
                  name="Check Address"
                  addNewButton={<Check />}
                  saveAsStatus="CREATE_CHECK"
                />
              </div>
              <div className="mercoa-mt-2" />
              <MercoaCombobox
                label="Check Delivery Method"
                showAllOptions
                displaySelectedAs="pill"
                options={(backupDisbursement as Mercoa.PaymentRailResponse.Check)?.availableDeliveryMethods.map(
                  (e) => ({
                    value: {
                      key: e,
                      value: CheckSpeedEnumToLabel(e),
                    },
                    disabled: false,
                  }),
                )}
                onChange={(selected) => {
                  setValue('paymentDestinationOptions.type', 'check')
                  setValue('paymentDestinationOptions.delivery', selected.key)
                }}
                displayIndex="value"
                value={() => {
                  const speed = (destinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery
                  return { key: speed, value: CheckSpeedEnumToLabel(speed) }
                }}
              />
            </>
          )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Card && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Card)
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <Card
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Card}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Utility && (
        <>
          {readOnly && (
            <>
              <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
                <div
                  className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border mercoa-border-gray-300
mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2`}
                >
                  <div className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900`}>Automated Utility Pay</div>
                </div>
              </div>
            </>
          )}
          {isDestination && !disableCreation && !readOnly && vendorId && (
            <>
              <div className="mercoa-mt-4">
                <MercoaCombobox
                  label="Utility Account"
                  showAllOptions
                  displaySelectedAs="pill"
                  options={counterpartyAccounts.map((account) => ({
                    value: {
                      accountId: account.accountId,
                      displayName: `${account.accountId} - ${account.nameOnAccount}`,
                    },
                    disabled: false,
                  }))}
                  onChange={(selected) => {
                    setValue('paymentDestinationOptions', {
                      type: 'utility',
                      accountId: selected.accountId,
                    })
                  }}
                  displayIndex="displayName"
                />
              </div>

              <div className="mercoa-col-span-full mercoa-mt-1">
                <PayablesInlineForm
                  form={<AddCounterpartyAccount prefix="newCounterpartyAccount." />}
                  name="Utility Account"
                  addNewButton={<CounterpartyAccount />}
                  saveAsStatus="CREATE_COUNTERPARTY_ACCOUNT"
                />
              </div>
              <div className="mercoa-mt-2" />
            </>
          )}
        </>
      )}
      {selectedType.startsWith('cpms_') && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter(
                (paymentMethod) => (paymentMethod as Mercoa.PaymentMethodResponse.Custom).schemaId === selectedType,
              )
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <CustomPaymentMethod
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Custom}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
          {isDestination && !disableCreation && !readOnly && vendorId && backupDisbursement && (
            <>
              <div className="mercoa-col-span-full mercoa-mt-1">
                <PayablesInlineForm
                  form={
                    <AddCustomPaymentMethodForm
                      schema={mercoaSession.customPaymentMethodSchemas.find((e) => e.id === selectedType)}
                    />
                  }
                  name={mercoaSession.customPaymentMethodSchemas.find((e) => e.id === selectedType)?.name ?? 'Other'}
                  addNewButton={
                    <CustomPaymentMethod
                      schema={mercoaSession.customPaymentMethodSchemas.find((e) => e.id === selectedType)}
                    />
                  }
                  saveAsStatus="CREATE_CUSTOM"
                />
              </div>
            </>
          )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.OffPlatform && (
        <>
          {readOnly && (
            <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
              <div
                className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border mercoa-border-gray-300
mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2`}
              >
                <div className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900`}>Off Platform</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function PayablePaymentSourceV1({ readOnly }: { readOnly?: boolean }) {
  const {
    watch,
    formState: { errors },
  } = useFormContext()

  const status = watch('status')
  readOnly = readOnly || (!!status && afterApprovedStatus.includes(status))

  return (
    <div className="mercoa-col-span-full">
      <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mb-5">
        {readOnly ? 'Paying from:' : 'How do you want to pay?'}
      </h2>
      <PayableSelectPaymentMethodV1 isSource readOnly={readOnly} />
      {errors.paymentSourceId?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentSourceId?.message.toString()}</p>
      )}
    </div>
  )
}

export function PayablePaymentDestinationV1({ readOnly }: { readOnly?: boolean }) {
  const {
    watch,
    formState: { errors },
  } = useFormContext()

  const mercoaSession = useMercoaSession()
  const [vendorLink, setVendorLink] = useState<string>()

  const status = watch('status')
  readOnly = readOnly || (!!status && afterApprovedStatus.includes(status))

  const paymentSourceType = watch('paymentSourceType')
  const vendorId = watch('vendorId')
  const vendorName = watch('vendorName')
  const id = watch('id')

  useEffect(() => {
    if (id && mercoaSession.organization?.paymentMethods?.backupDisbursements?.find((e) => e.type === 'na')?.active) {
      mercoaSession.client?.invoice.paymentLinks.getVendorLink(id).then((link) => {
        setVendorLink(link)
      })
    }
  }, [id, mercoaSession.organization?.paymentMethods?.backupDisbursements])

  return (
    <>
      {vendorId && vendorName && paymentSourceType !== 'offPlatform' && (
        <div className="mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mb-5">
            {readOnly ? (
              `Paying to ${vendorName}:`
            ) : (
              <>
                How does <span className="mercoa-text-gray-800 mercoa-underline">{vendorName}</span> want to get paid?
              </>
            )}
          </h2>
          <PayableSelectPaymentMethodV1 isDestination readOnly={readOnly} />
          {vendorLink && (
            <div className="mercoa-flex mercoa-items-center mercoa-space-x-2 mercoa-mt-2">
              <div className="mercoa-flex-auto" />
              <MercoaButton
                size="sm"
                type="button"
                isEmphasized
                onClick={async () => {
                  await mercoaSession.client?.invoice.paymentLinks.sendVendorEmail(id)
                  toast.success('Email sent to vendor')
                }}
              >
                Send Vendor Email
              </MercoaButton>

              <MercoaButton
                size="sm"
                type="link"
                isEmphasized
                href={vendorLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vendor Portal
              </MercoaButton>
            </div>
          )}
          {errors.paymentDestinationId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentDestinationId?.message.toString()}</p>
          )}
        </div>
      )}
    </>
  )
}

export function PaymentDestinationProcessingTimeV1({
  children,
}: {
  children?: ({ timing }: { timing?: Mercoa.CalculatePaymentTimingResponse }) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()
  const { watch } = useFormContext()

  const deductionDate = watch('deductionDate') as Date
  const processedAt = watch('processedAt') as Date
  const paymentSourceId = watch('paymentSourceId') as Mercoa.PaymentMethodType
  const paymentDestinationId = watch('paymentDestinationId') as Mercoa.PaymentMethodType
  const paymentDestinationOptions = watch('paymentDestinationOptions') as Mercoa.PaymentDestinationOptions
  const status = watch('status') as Mercoa.InvoiceStatus
  const invoiceId = watch('invoiceId') as string

  const [timing, setTiming] = useState<Mercoa.CalculatePaymentTimingResponse>()

  useEffect(() => {
    if (paymentSourceId && paymentDestinationId && deductionDate) {
      let payload: Mercoa.CalculatePaymentTimingRequest = {
        invoiceId,
      }
      payload = {
        ...(processedAt ? { processedAt } : { estimatedDeductionDate: deductionDate }),
        paymentSourceId,
        paymentDestinationId,
        paymentDestinationOptions,
      }
      mercoaSession.client?.calculate
        .paymentTiming(payload)
        .then((timing) => {
          setTiming(timing)
        })
        .catch((e) => {
          console.error(e)
        })
    }
  }, [deductionDate, processedAt, paymentSourceId, paymentDestinationId, paymentDestinationOptions])

  if (children) return children({ timing })

  if (!timing) return null
  if (timing.businessDays < 0) return null

  return (
    <div className="mercoa-col-span-full">
      <div className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-p-5 mercoa-rounded-md mercoa-text-center mercoa-max-w-[500px] mercoa-m-auto">
        <div className="mercoa-flex mercoa-items-center">
          <CalendarDaysIcon className="mercoa-size-5 mercoa-mr-2" />
          <span className="mercoa-text-gray-900">{dayjs(timing.estimatedProcessingDate).format('MMM D')}</span>
        </div>

        <div className="mercoa-flex mercoa-items-center">
          <hr className="mercoa-border-t mercoa-border-gray-300 mercoa-w-10" />
          <ArrowRightIcon className="mercoa-border-t mercoa-border-transparent mercoa-size-5 mercoa-text-gray-300 -mercoa-ml-1" />
          <Tooltip
            title={
              <div className="mercoa-text-xs">
                Estimated time.
                <br />
                Business days are Monday through Friday, excluding holidays.
              </div>
            }
          >
            <span className="mercoa-text-gray-500 mercoa-mx-4">
              {timing?.businessDays} business days<span className="mercoa-text-xs">*</span>
            </span>
          </Tooltip>
          <hr className="mercoa-border-t mercoa-border-gray-300 mercoa-w-10" />
          <ArrowRightIcon className="mercoa-border-t mercoa-border-transparent mercoa-size-5 mercoa-text-gray-300 -mercoa-ml-1" />
        </div>

        <div className="mercoa-flex mercoa-items-center">
          <CalendarDaysIcon className="mercoa-size-5 mercoa-mr-2" />
          <span className="mercoa-text-gray-900">{dayjs(timing.estimatedSettlementDate).format('MMM D')}</span>
        </div>
      </div>
    </div>
  )
}

// End Payment Source and Destination

// Approvers

export function PayableApproversV1({ readOnly }: { readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext()

  const approvers = watch('approvers') as Mercoa.ApprovalSlot[]
  const invoicePolicy = watch('approvalPolicy') as Mercoa.ApprovalPolicyResponse[]
  const status = watch('status') as Mercoa.InvoiceStatus

  // auto-assign ANY if rule tells us to
  useEffect(() => {
    approvers.forEach((approverSlot, index) => {
      const policy = invoicePolicy.find((e) => e.id === approverSlot.approvalPolicyId)
      if (policy?.rule.autoAssign && !approverSlot.assignedUserId) {
        setValue(`approvers.${index}.assignedUserId`, 'ANY')
      }
    })
  }, [approvers])

  return (
    <div className="mercoa-col-span-full mercoa-space-y-4">
      {approvers?.length > 0 && (
        <>
          <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900 mercoa-mt-5">
            Approvals
          </h2>
          {status === Mercoa.InvoiceStatus.Draft && !readOnly ? <ApproversSelectionV1 /> : <ApproverWellsV1 />}
          {errors.approvers && <p className="mercoa-text-sm mercoa-text-red-500">Please select all approvers</p>}
        </>
      )}
    </div>
  )
}

function ApproversSelectionV1() {
  const mercoaSession = useMercoaSession()

  const { watch, setValue } = useFormContext()

  const approvers = watch('approvers') as Mercoa.ApprovalSlot[]
  const approvalPolicies = watch('approvalPolicy') as Mercoa.ApprovalPolicyResponse[]

  if (!approvalPolicies) return <></>

  return (
    <>
      {approvers.map((slot, index) => (
        <Fragment key={index}>
          {isUpstreamPolicyAssigned({
            policyId: slot.approvalPolicyId,
            approvalPolicies,
            approverSlots: approvers,
            selectedApprovers: approvers,
          }) && (
            <MercoaCombobox
              label={'Assigned to'}
              showAllOptions
              onChange={(e) => {
                setValue(`approvers.${index}.assignedUserId`, e.id)
                propagateApprovalPolicy({
                  userId: e.id,
                  policyId: slot.approvalPolicyId,
                  approvalPolicies,
                  approverSlots: approvers,
                  setValue,
                  users: mercoaSession.users,
                  selectedApprovers: approvers,
                })
              }}
              value={
                [...mercoaSession.users, { id: 'ANY', name: 'Any Approver', email: '' }].find((user) => {
                  const approverSlot = approvers.find((e) => e?.approvalSlotId === slot.approvalSlotId)
                  if (user.id === approverSlot?.assignedUserId) return true
                }) ?? ''
              }
              options={[
                { disabled: false, value: { id: 'ANY', name: 'Any Approver', email: '' } },
                ...filterApproverOptionsV1({
                  approverSlotIndex: index,
                  eligibleRoles: slot.eligibleRoles,
                  eligibleUserIds: slot.eligibleUserIds,
                  users: mercoaSession.users,
                  selectedApprovers: approvers,
                }).map((option) => {
                  return { disabled: option.disabled, value: option.user }
                }),
                { disabled: false, value: { id: '', name: 'Reset Selection', email: '' } },
              ]}
              displayIndex="name"
              secondaryDisplayIndex="email"
              disabledText="Already assigned"
              displaySelectedAs="pill"
            />
          )}
        </Fragment>
      ))}
    </>
  )
}

function ApproverWellsV1() {
  const mercoaSession = useMercoaSession()
  const seenUsers: string[] = []
  const { watch } = useFormContext()
  const approvers = watch('approvers') as Mercoa.ApprovalSlot[]
  return (
    <>
      {approvers.map((slot, index) => {
        const user = mercoaSession.users.find((user) => user.id === slot.assignedUserId)
        if (!slot.assignedUserId || slot.assignedUserId === 'ANY') {
          return <ApproverWellV1 key={slot.approvalSlotId} approverSlot={slot} index={index} />
        } else if (user && !seenUsers.includes(user.id)) {
          seenUsers.push(user.id)
          return <ApproverWellV1 key={user.id} approverSlot={slot} approver={user} index={index} />
        }
      })}
    </>
  )
}

function ApproverWellV1({
  approverSlot,
  approver,
  index,
}: {
  approverSlot: Mercoa.ApprovalSlot
  approver?: Mercoa.EntityUserResponse
  index: number
}) {
  const mercoaSession = useMercoaSession()

  const [isExpanded, setIsExpanded] = useState(false)

  let bgColor = ''
  let icon
  if (approverSlot.action === Mercoa.ApproverAction.None) {
    bgColor = 'mercoa-bg-gray-50'
    icon = <></>
  } else if (approverSlot.action === Mercoa.ApproverAction.Approve) {
    bgColor = 'mercoa-bg-green-50'
    icon = <CheckCircleIcon className="mercoa-h-8 mercoa-w-8 mercoa-text-green-400" aria-hidden="true" />
  } else if (approverSlot.action === Mercoa.ApproverAction.Reject) {
    bgColor = 'mercoa-bg-red-50'
    icon = <XCircleIcon className="mercoa-h-8 mercoa-w-8 mercoa-text-red-400" aria-hidden="true" />
  }

  const approvers = filterApproverOptionsV1({
    approverSlotIndex: index,
    eligibleRoles: approverSlot.eligibleRoles,
    eligibleUserIds: approverSlot.eligibleUserIds,
    users: mercoaSession.users,
    selectedApprovers: [],
  })

  return (
    <>
      <div className="mercoa-flex mercoa-items-center">
        <div className="mercoa-flex-auto mercoa-max-w-full">
          <div className={`mercoa-flex mercoa-items-center mercoa-rounded-mercoa ${bgColor} mercoa-max-w-full`}>
            <div className="mercoa-flex-auto mercoa-p-3 mercoa-max-w-full">
              {approver ? (
                <>
                  <div className={'mercoa-text-sm mercoa-font-medium mercoa-text-grey-900'}>{approver.name}</div>
                  <div className="mercoa-text-sm mercoa-text-gray-500">{approver.email}</div>
                </>
              ) : (
                <div
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={
                    'mercoa-text-sm mercoa-font-medium mercoa-text-grey-900 mercoa-max-w-full mercoa-overflow-hidden mercoa-whitespace-nowrap mercoa-truncate mercoa-cursor-pointer'
                  }
                >
                  Any Approver:
                  <span className="mercoa-ml-1">
                    {isExpanded ? (
                      <>
                        {approvers.map(({ user: approver }) => (
                          <div
                            key={approver.id}
                            className="mercoa-text-sm mercoa-border mercoa-p-2 mercoa-border-gray-200 mercoa-rounded-mercoa mercoa-mt-2 mercoa-mb-1"
                          >
                            <div className={'mercoa-font-medium mercoa-text-grey-900 '}>{approver.name}</div>
                            <div className="mercoa-text-gray-500 ">{approver.email}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <span className="mercoa-text-gray-500">{approvers.map((e) => e.user.name).join(', ')}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="mercoa-mx-4 mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75">
              {icon}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function filterApproverOptionsV1({
  approverSlotIndex,
  eligibleRoles,
  eligibleUserIds,
  users,
  selectedApprovers,
}: {
  approverSlotIndex: number
  eligibleRoles: string[]
  eligibleUserIds: Mercoa.EntityUserId[]
  users: Mercoa.EntityUserResponse[]
  selectedApprovers: Mercoa.ApprovalSlot[]
}) {
  if (!Array.isArray(eligibleRoles) && !Array.isArray(eligibleUserIds)) return []

  const usersFiltered: Mercoa.EntityUserResponse[] = users.filter((user) => {
    if (user.roles.some((role) => eligibleRoles.includes(role))) return true
    if (eligibleUserIds.some((eligibleId) => user.id === eligibleId)) return true
  })

  const options = usersFiltered.map((user) => {
    let disabled: boolean = false
    // if this user is already a selectedApprover elsewhere in a different approverSlot, they should not be selectable
    if (
      selectedApprovers.find((e) => e?.assignedUserId === user.id) &&
      selectedApprovers[approverSlotIndex]?.assignedUserId !== user.id
    ) {
      disabled = true
    }

    return { user: user, disabled: disabled }
  })

  const enabledOptions = options.filter((option) => !option.disabled)
  const disabledOptions = options.filter((option) => option.disabled)
  return enabledOptions.concat(disabledOptions)
}

export function isUpstreamPolicyAssigned({
  policyId,
  approvalPolicies,
  approverSlots,
  selectedApprovers,
}: {
  policyId: string
  approvalPolicies: Mercoa.ApprovalPolicyResponse[]
  approverSlots: Mercoa.ApprovalSlot[]
  selectedApprovers: Mercoa.ApprovalSlot[]
}) {
  const policy = approvalPolicies?.find((p) => p.id === policyId)
  if (!policy) return true
  const upstreamPolicy = approvalPolicies.find((p) => p.id === policy.upstreamPolicyId)
  if (!upstreamPolicy) return true
  const upstreamSlots = approverSlots.filter((slot) => slot.approvalPolicyId === upstreamPolicy.id)
  if (upstreamSlots.length === 0) return true

  const upstreamUsers = upstreamSlots.map((slot) => {
    const approverSlot = selectedApprovers.find((e) => e?.approvalSlotId === slot.approvalSlotId)
    return approverSlot?.assignedUserId
  })

  const currentSlot = selectedApprovers.find(
    (e) => e?.approvalSlotId === approverSlots.find((e) => e.approvalPolicyId === policyId)?.approvalSlotId,
  )

  // The upstream slot has this assigned user
  if (upstreamUsers.indexOf(currentSlot?.assignedUserId) > -1) return false

  // if all upstream slots are assigned, this slot should be enabled
  return upstreamUsers.every((e) => e)
}

// If an approver can fulfill a downstream policy, they should be assigned to that downstream policy
export function propagateApprovalPolicy({
  userId,
  policyId,
  approvalPolicies,
  approverSlots,
  setValue,
  users,
  selectedApprovers,
}: {
  userId: string
  policyId: string
  approvalPolicies: Mercoa.ApprovalPolicyResponse[]
  approverSlots: Mercoa.ApprovalSlot[]
  setValue: Function
  users: Mercoa.EntityUserResponse[]
  selectedApprovers: Mercoa.ApprovalSlot[]
}) {
  const downstreamPolicies = approvalPolicies?.filter((p) => p.upstreamPolicyId === policyId) ?? []
  downstreamPolicies.forEach((downstreamPolicy) => {
    const downstreamSlot = approverSlots.find((slot) => slot.approvalPolicyId === downstreamPolicy.id)
    if (!downstreamSlot) return
    const filteredUsers = filterApproverOptionsV1({
      approverSlotIndex: approverSlots.indexOf(downstreamSlot),
      eligibleRoles: downstreamSlot.eligibleRoles,
      eligibleUserIds: downstreamSlot.eligibleUserIds,
      users,
      selectedApprovers,
    })
    if (!filteredUsers.find((e) => e.user.id === userId)) return
    setValue(`approvers.${approverSlots.indexOf(downstreamSlot)}.assignedUserId`, userId)
    propagateApprovalPolicy({
      userId,
      policyId: downstreamPolicy.id,
      approvalPolicies,
      approverSlots,
      setValue,
      users,
      selectedApprovers,
    })
  })
} // End Approvers

// Metadata
export function PayableMetadataV1({ skipValidation, readOnly }: { skipValidation?: boolean; readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()

  const { watch } = useFormContext()
  const status = watch('status')

  readOnly = readOnly || (!!status && status !== Mercoa.InvoiceStatus.Draft)

  return (
    <div className="mercoa-col-span-full mercoa-grid-cols-1 mercoa-gap-4 mercoa-hidden has-[div]:mercoa-grid ">
      <label className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700">
        Additional Invoice Details
      </label>
      {mercoaSession.organization?.metadataSchema?.map((schema) => (
        <MetadataSelectionV1
          readOnly={readOnly}
          key={schema.key}
          schema={schema}
          skipValidation={skipValidation}
          field={'metadata.' + schema.key}
        />
      ))}
    </div>
  )
}

export function MetadataSelectionV1({
  schema,
  field,
  skipValidation,
  readOnly,
  lineItem,
  hideLabel,
  renderCustom,
}: {
  schema: Mercoa.MetadataSchema
  field: string
  skipValidation?: boolean
  readOnly?: boolean
  lineItem?: boolean
  hideLabel?: boolean
  renderCustom?: {
    metadataCombobox: (props: {
      schema: Mercoa.MetadataSchema
      setValue: (value: string) => void
      value: string
      values: string[]
    }) => JSX.Element
  }
}) {
  const mercoaSession = useMercoaSession()
  const methods = useFormContext()

  const [entityMetadata, setEntityMetadata] = useState<string[]>()

  const { watch, register, setValue, control } = methods

  const hasDocument = watch('hasDocuments')
  const paymentDestinationType = watch('paymentDestinationType')
  const paymentSourceType = watch('paymentSourceType')
  const lineItems = watch('lineItems')

  useEffect(() => {
    if (!mercoaSession.entityId) return
    mercoaSession.client?.entity.metadata.get(mercoaSession.entityId, schema.key).then((e) => {
      setEntityMetadata(filterMetadataValues(e, schema))
    })
  }, [mercoaSession.entityId, schema.key])

  if (
    !skipValidation &&
    !showMetadata({
      schema,
      entityMetadata,
      hasDocument,
      hasNoLineItems: lineItems.length === 0,
      paymentDestinationType,
      paymentSourceType,
      lineItem,
    })
  ) {
    return null
  }

  return (
    <div>
      {!hideLabel && (
        <h3 className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          {schema.displayName}
        </h3>
      )}
      <>
        {((!entityMetadata && schema.type === Mercoa.MetadataType.String) ||
          schema.type === Mercoa.MetadataType.Number) && (
          <MercoaInput
            readOnly={readOnly}
            type={schema.type === Mercoa.MetadataType.Number ? 'number' : 'text'}
            name={field}
            register={register}
          />
        )}
        {entityMetadata &&
          (schema.type === Mercoa.MetadataType.String || schema.type === Mercoa.MetadataType.KeyValue) &&
          (entityMetadata.length > 0 ? (
            <>
              {renderCustom?.metadataCombobox ? (
                renderCustom.metadataCombobox({
                  schema: schema,
                  value: watch(field),
                  setValue: (e) => {
                    setValue(field, e)
                  },
                  values: entityMetadata,
                })
              ) : (
                <>
                  <MetadataCombobox
                    schema={schema}
                    values={entityMetadata}
                    value={watch(field)}
                    setValue={(e) => {
                      setValue(field, e)
                    }}
                    readOnly={readOnly ?? false}
                  />
                </>
              )}
            </>
          ) : (
            <>No Options Available</>
          ))}
        {schema.type === Mercoa.MetadataType.Boolean && (
          <MetadataBoolean
            value={watch(field)}
            setValue={(e) => {
              setValue(field, e)
            }}
            readOnly={readOnly}
          />
        )}
        {schema.type === Mercoa.MetadataType.Date && (
          <MercoaInput
            name={field}
            type="date"
            readOnly={readOnly}
            className="md:mercoa-col-span-1 mercoa-col-span-full"
            control={control}
          />
        )}
      </>
    </div>
  )
}

function showMetadata({
  schema,
  hasDocument,
  hasNoLineItems,
  entityMetadata,
  lineItem,
  paymentDestinationType,
  paymentSourceType,
}: {
  schema: Mercoa.MetadataSchema
  hasDocument: boolean
  hasNoLineItems: boolean
  entityMetadata?: string[]
  lineItem?: boolean
  paymentDestinationType?: Mercoa.PaymentMethodType
  paymentSourceType?: Mercoa.PaymentMethodType
}) {
  if (schema.showConditions?.alwaysHide) {
    return false
  }

  if (schema.showConditions?.hasDocument && !hasDocument) {
    return false
  }

  if (schema.showConditions?.hasNoLineItems && !hasNoLineItems) {
    return false
  }

  if (schema.type === Mercoa.MetadataType.KeyValue && (!entityMetadata || entityMetadata.length === 0)) {
    return false
  }

  if (schema.showConditions?.hasOptions && (!entityMetadata || entityMetadata.length === 0)) {
    return false
  }

  if (schema.lineItem && !lineItem) {
    return false
  }

  if (schema.showConditions?.paymentDestinationTypes && schema.showConditions.paymentDestinationTypes.length > 0) {
    if (!paymentDestinationType) return false
    if (schema.showConditions.paymentDestinationTypes.includes('custom')) {
      if (!paymentDestinationType.startsWith('cpms_')) return false
      if (!schema.showConditions?.paymentDestinationCustomSchemaIds?.includes(paymentDestinationType)) return false
    } else if (!schema.showConditions.paymentDestinationTypes.includes(paymentDestinationType)) {
      return false
    }
  }

  if (schema.showConditions?.paymentSourceTypes && schema.showConditions.paymentSourceTypes.length > 0) {
    if (!paymentSourceType) return false
    if (schema.showConditions.paymentSourceTypes.includes('custom')) {
      if (!paymentSourceType.startsWith('cpms_')) return false
      if (!schema.showConditions?.paymentSourceCustomSchemaIds?.includes(paymentSourceType)) return false
    } else if (!schema.showConditions.paymentSourceTypes.includes(paymentSourceType)) {
      return false
    }
  }

  return true
}

function MetadataCombobox({
  schema,
  setValue,
  value,
  values,
  readOnly = false,
}: {
  schema: Mercoa.MetadataSchema
  setValue: (e: string) => void
  value?: string
  values: string[]
  readOnly: boolean
}) {
  const [options, setOptions] = useState<Array<{ disabled: boolean; value: any }>>([])
  const [valueState, setValueState] = useState<string | string[]>()

  // Get Options
  useEffect(() => {
    if (schema.type === Mercoa.MetadataType.KeyValue) {
      setOptions(
        values.map((value) => {
          let parsedValue = {
            key: '',
            value: '' as any,
            subtitle: '' as any,
          }
          try {
            parsedValue = JSON.parse(value) as { key: string; value: string; subtitle: string }
            parsedValue.key = `${parsedValue.key}`
            try {
              const value = parsedValue.value.value
                ? parsedValue.value
                : (JSON.parse(parsedValue.value) as {
                    value: string
                    title?: string
                    subtitle?: string
                  })
              if (value.value) {
                parsedValue.value = value.title ?? value.value
                parsedValue.subtitle = value.subtitle
              } else {
                parsedValue.value = `${parsedValue.value}`
              }
            } catch (e) {
              parsedValue.value = `${parsedValue.value}`
            }
          } catch (e) {
            console.error(e)
          }
          return { value: parsedValue, disabled: false }
        }),
      )
    } else {
      setOptions(
        values.map((value) => {
          return { value: value, disabled: false }
        }),
      )
    }
  }, [values])

  // Get Value
  useEffect(() => {
    if (!value) return
    if (schema.type === Mercoa.MetadataType.KeyValue) {
      const foundValue = JSON.parse(
        values.find((e) => {
          let parsedValue = { key: '' }
          try {
            parsedValue = JSON.parse(e) as { key: string }
            parsedValue.key = `${parsedValue.key}`
          } catch (e) {
            console.error(e)
          }
          return parsedValue?.key === `${value ?? ''}`
        }) ?? '{}',
      ) as any
      try {
        const valueParsed = JSON.parse(foundValue.value) as { value: string; title?: string; subtitle?: string }
        if (valueParsed.value) {
          foundValue.value = valueParsed.title ?? valueParsed.value
        }
      } catch (e) {}
      setValueState(foundValue.value ? foundValue.value : foundValue)
    } else {
      let comboboxValue: string | string[] | undefined = value
      if (schema.allowMultiple) {
        // Metadata is stored as a comma separated string, but comboboxes expect an array
        if (Array.isArray(value)) comboboxValue = value
        else comboboxValue = value?.split(',')
      }
      setValueState(comboboxValue)
    }
  }, [value])

  if (schema.type === Mercoa.MetadataType.KeyValue) {
    return (
      <MercoaCombobox
        options={options}
        onChange={(value) => {
          setValue(value?.key)
        }}
        showAllOptions
        displayIndex="value"
        secondaryDisplayIndex="subtitle"
        value={valueState}
        multiple={schema.allowMultiple}
        displaySelectedAs="pill"
        showClear
        readOnly={readOnly}
      />
    )
  }
  return (
    <MercoaCombobox
      options={options}
      onChange={(value) => {
        setValue(value)
      }}
      showAllOptions
      value={valueState}
      multiple={schema.allowMultiple}
      freeText={!schema.allowMultiple}
      displaySelectedAs="pill"
      showClear
      readOnly={readOnly}
    />
  )
}

function MetadataBoolean({
  setValue,
  value,
  readOnly,
}: {
  setValue: (e: string) => void
  value?: string
  readOnly?: boolean
}) {
  return (
    <div className="mercoa-space-y-4 sm:mercoa-flex sm:mercoa-items-center sm:mercoa-space-x-10 sm:mercoa-space-y-0">
      <div className="mercoa-flex mercoa-items-center">
        <input
          readOnly={readOnly}
          type="radio"
          defaultChecked={value === 'true'}
          className="mercoa-size-4 mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary checked:mercoa-bg-mercoa-primary"
          onChange={() => setValue('true')}
        />
        <label className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          Yes
        </label>
      </div>

      <div className="mercoa-flex mercoa-items-center">
        <input
          readOnly={readOnly}
          type="radio"
          defaultChecked={value === 'false'}
          className="mercoa-size-4 mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary checked:mercoa-bg-mercoa-primary"
          onChange={() => setValue('false')}
        />
        <label className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          No
        </label>
      </div>
    </div>
  )
}

function filterMetadataValues(entityMetadata: string[], schema: Mercoa.MetadataSchema) {
  if (entityMetadata) {
    if (schema.type === Mercoa.MetadataType.KeyValue) {
      entityMetadata = entityMetadata.map((e) => {
        try {
          const parsedValue = dJSON.parse(e) as {
            key: string
            value:
              | string
              | {
                  title?: string
                  subtitle?: string
                  value: string
                }
          }
          if (parsedValue.key && parsedValue.value) {
            return JSON.stringify(parsedValue)
          }
        } catch (e) {
          console.error(e)
        }
        return ''
      })
    }
    entityMetadata = entityMetadata.filter((e) => e)
    if (entityMetadata?.length === 0) {
      return undefined
    } else {
      return entityMetadata
    }
  }
}

// End Metadata

// Line Items

export type PayableLineItemV1ChildrenProps = {
  readOnly?: boolean
  items: Mercoa.InvoiceLineItemUpdateRequest[]
  addItem: () => void
  updateItem: (index: number, item: Mercoa.InvoiceLineItemUpdateRequest) => void
  removeItem: (index: number) => void
  setItems: (items: Mercoa.InvoiceLineItemUpdateRequest[]) => void
}

export function PayableLineItemsV1({
  readOnly,
  children,
}: {
  readOnly?: boolean
  children?: (props: PayableLineItemV1ChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()
  const [isHidden, setIsHidden] = useState<boolean>(false)

  const { control, watch, setValue } = useFormContext()
  const { append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const status = watch('status')
  const currency = watch('currency')
  readOnly = readOnly || (!!status && status !== Mercoa.InvoiceStatus.Draft)
  const lineItems = watch('lineItems') as Mercoa.InvoiceLineItemUpdateRequest[]

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
    })
  }

  const removeItem = (index: number) => {
    remove(index)
  }

  if (children) {
    return children({
      readOnly,
      items: lineItems,
      addItem,
      updateItem: (index, item) => {
        setValue(`lineItems.${index}`, item)
      },
      removeItem,
      setItems: (items) => {
        setValue('lineItems', items)
      },
    })
  }

  if (mercoaSession.iframeOptions?.options?.invoice?.lineItems === Mercoa.LineItemAvailabilities.Disabled) return <></>
  return (
    <div
      className={`mercoa-col-span-full mercoa-grid mercoa-gap-2 mercoa-border mercoa-border-gray-900/10 mercoa-px-2 mercoa-py-6 mercoa-rounded-mercoa`}
    >
      {/* HEADER */}
      <div className="mercoa-flex mercoa-items-center mercoa-col-span-full">
        <h2 className="mercoa-text-lg mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-700">
          Line Items{' '}
          <span className="mercoa-font-medium mercoa-text-gray-500 mercoa-text-base">({lineItems?.length ?? 0})</span>
        </h2>
        {!isHidden && !readOnly && (
          <MercoaButton isEmphasized={false} size="sm" hideOutline color="gray" onClick={addItem} type="button">
            <Tooltip title="Add line item">
              <PlusCircleIcon
                className="mercoa-size-5 mercoa-text-gray-400 hover:mercoa-opacity-75"
                aria-hidden="true"
              />
            </Tooltip>
            <span className="mercoa-sr-only">Add line item</span>
          </MercoaButton>
        )}
        <div className="mercoa-flex-1" />
        <MercoaButton
          isEmphasized={false}
          size="sm"
          hideOutline
          type="button"
          onClick={() => {
            setIsHidden(!isHidden)
          }}
        >
          {isHidden ? (
            <span className="mercoa-flex mercoa-items-center">
              Show Line Items <EyeSlashIcon className="mercoa-ml-2 mercoa-size-5" />
            </span>
          ) : (
            <span className="mercoa-flex mercoa-items-center">
              Hide Line Items <EyeIcon className="mercoa-ml-2 mercoa-size-5" />
            </span>
          )}
        </MercoaButton>
      </div>

      {/* ROWS */}
      {!isHidden && <LineItemRowsV1 readOnly={readOnly} />}
      {!isHidden && !readOnly && (lineItems?.length ?? 0) > 0 && (
        <div className="mercoa-col-span-full mercoa-gap-2 mercoa-flex">
          <div className="mercoa-flex-1" />
          <MercoaButton isEmphasized size="sm" onClick={addItem} type="button">
            <div className="mercoa-flex mercoa-items-center">
              Add Line Item
              <PlusIcon className="mercoa-ml-1 mercoa-size-4" aria-hidden="true" />
            </div>
          </MercoaButton>
          <LineItemOptions />
        </div>
      )}
    </div>
  )
}

function LineItemOptions() {
  const { watch, clearErrors, setValue, setFocus } = useFormContext()
  const lineItems = watch('lineItems') as Mercoa.InvoiceLineItemUpdateRequest[]

  // Auto-calculate line item amounts and total amount
  function calculateTotalAmountFromLineItems() {
    let amount = new Big(0)
    lineItems?.forEach((lineItem, index) => {
      if (typeof lineItem.amount === 'string')
        lineItem.amount = Number((lineItem.amount as unknown as string).replace(/,/g, ''))
      amount = amount.add(Number(lineItem.amount))
    })
    clearErrors('amount')
    setValue('amount', amount.toNumber())
    setFocus('amount')
  }

  function collapseLineItems() {
    let amount = new Big(0)
    lineItems?.forEach((lineItem, index) => {
      amount = amount.add(Number(lineItem.amount))
    })
    setValue('lineItems', [])
    setTimeout(() => {
      setValue(
        'lineItems',
        [
          {
            amount: amount.toNumber(),
            quantity: 1,
            unitPrice: amount.toNumber(),
            category: 'EXPENSE',
            description: lineItems
              .map((lineItem) => lineItem.description)
              .join(', ')
              .slice(0, 100),
            currency: lineItems[0].currency ?? 'USD',
            metadata: lineItems[0].metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { shouldDirty: true, shouldTouch: true },
      )
    }, 10)
  }

  return (
    <Menu as="div" className="mercoa-relative mercoa-inline-block mercoa-text-left">
      <div>
        <Menu.Button className="mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-bg-gray-100 hover:mercoa-bg-gray-200 mercoa-rounded-full mercoa-p-1.5">
          <EllipsisVerticalIcon className="mercoa-size-5" aria-hidden="true" />
          <span className="mercoa-sr-only">More options</span>
        </Menu.Button>
      </div>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="mercoa-absolute mercoa-right-0 mercoa-z-10 mercoa-mt-2 mercoa-w-64 mercoa-origin-top-right mercoa-rounded-mercoa mercoa-bg-white mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none">
          <div className="mercoa-py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  onClick={() => {
                    if (confirm('Are you sure you want to collapse all line items into a single item?')) {
                      collapseLineItems()
                    }
                  }}
                  className={`${
                    active ? 'mercoa-bg-gray-100 mercoa-text-gray-900' : 'mercoa-text-gray-700'
                  } mercoa-block mercoa-px-4 mercoa-py-2 mercoa-text-sm`}
                >
                  Collapse line items
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  onClick={() => {
                    calculateTotalAmountFromLineItems()
                  }}
                  className={`${
                    active ? 'mercoa-bg-gray-100 mercoa-text-gray-900' : 'mercoa-text-gray-700'
                  } mercoa-block mercoa-px-4 mercoa-py-2 mercoa-text-sm`}
                >
                  Calculate invoice amount
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export function LineItemRowsV1({ readOnly }: { readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()
  const { register, control, watch, setValue } = useFormContext()
  const { remove } = useFieldArray({
    control,
    name: `lineItems`,
  })

  const currency = watch('currency')
  const lineItems = watch('lineItems') as Mercoa.InvoiceLineItemUpdateRequest[]

  const filteredMetadata = mercoaSession.organization?.metadataSchema?.filter((schema) => schema.lineItem) ?? []

  return (
    <>
      {lineItems.map((lineItem, lineItemIndex) => (
        <Fragment key={`${lineItem.id}`}>
          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-my-4" />
          <div className="mercoa-flex mercoa-items-start">
            {/*  INVOICE NUMBER */}
            <MercoaInput
              name={`lineItems.${lineItemIndex}.description`}
              placeholder="Description"
              label="Description"
              register={register}
              type="text"
              readOnly={readOnly}
              className="mercoa-flex-1"
            />
            {/*  INVOICE AMOUNT */}
            <MercoaInput
              control={control}
              name={`lineItems.${lineItemIndex}.amount`}
              label="Amount"
              type="currency"
              readOnly={readOnly}
              className="mercoa-max-w-[100px] mercoa-ml-2"
              leadingIcon={
                <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
              }
            />
            {/*  Remove Button */}
            {!readOnly && (
              <MercoaButton
                isEmphasized={false}
                size="sm"
                hideOutline
                type="button"
                color="gray"
                onClick={() => {
                  remove(lineItemIndex)
                }}
                className="mercoa-ml-1"
              >
                <XCircleIcon className="mercoa-size-5 hover:mercoa-opacity-75" />
                <span className="mercoa-sr-only">Remove Line Item</span>
              </MercoaButton>
            )}
          </div>
          <div className={`mercoa-grid ${filteredMetadata.length > 1 ? 'mercoa-grid-cols-2' : 'mercoa-grid-cols-1'}`}>
            {filteredMetadata.map((schema) => (
              <MetadataSelectionV1
                schema={schema}
                lineItem
                key={schema.key}
                readOnly={readOnly}
                field={
                  schema.key === 'glAccountId'
                    ? `lineItems[${lineItemIndex}].${schema.key}`
                    : `lineItems[${lineItemIndex}].metadata.${schema.key}`
                }
              />
            ))}
          </div>
          {lineItems.length - 1 === lineItemIndex && (
            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-my-4" />
          )}
        </Fragment>
      ))}
    </>
  )
} // End Line Items

// Payment Options

export function PaymentOptionsV1() {
  const {
    watch,
    register,
    formState: { errors },
  } = useFormContext()

  const deductionDate = watch('deductionDate')
  const vendorName = watch('vendorName')
  const paymentSourceType = watch('paymentSourceType')
  const paymentDestinationType = watch('paymentDestinationType')

  if (
    paymentSourceType !== Mercoa.PaymentMethodType.BankAccount ||
    (paymentDestinationType !== Mercoa.PaymentMethodType.BankAccount &&
      paymentDestinationType !== Mercoa.PaymentMethodType.Check)
  ) {
    return <></>
  }

  return (
    <div className="sm:mercoa-col-span-3 mercoa-pl-1">
      <MercoaSwitch
        label="Batch Payment"
        name="batchPayment"
        register={register}
        errors={errors}
        tooltip={
          <div className="mercoa-whitespace-normal mercoa-w-[300px]">{`Send a single payment to ${vendorName} for invoices scheduled on ${dayjs(
            deductionDate,
          ).format('MMM DD')}`}</div>
        }
      />
    </div>
  )
}

// Fees

export function PayableFeesV1({
  children,
}: {
  children?: ({ fees }: { fees?: Mercoa.InvoiceFeesResponse }) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  const [fees, setFees] = useState<Mercoa.InvoiceFeesResponse>()
  const [vendorCreditUsage, setVendorCreditUsage] = useState<Mercoa.CalculateVendorCreditUsageResponse>()

  const { watch, setError, clearErrors } = useFormContext()
  const invoiceId = watch('id')
  const status = watch('status')
  const amount = watch('amount')
  const currency = watch('currency')
  const payerId = mercoaSession.entityId
  const vendorId = watch('vendorId')
  const paymentSourceId = watch('paymentSourceId')
  const paymentDestinationId = watch('paymentDestinationId')
  const paymentDestinationOptions = watch('paymentDestinationOptions')
  const vendorCreditIds = watch('vendorCreditIds') as Mercoa.VendorCreditId[] | undefined

  // Convert number to digits
  let amountNumber = amount
  if (typeof amount === 'string') {
    amountNumber = Number(amount.replace(/,/g, ''))
  }

  // Calculate fees
  useEffect(() => {
    if (mercoaSession.client && amountNumber && paymentSourceId && paymentDestinationId) {
      mercoaSession.client.calculate
        .fee({
          amount: amountNumber,
          paymentSourceId,
          paymentDestinationId,
          paymentDestinationOptions: paymentDestinationOptions?.type ? paymentDestinationOptions : undefined,
        })
        .then((fees) => {
          setFees(fees)
          clearErrors('amount')
        })
        .catch((e) => {
          setError('amount', {
            type: 'manual',
            message: e.body,
          })
        })
    }
  }, [mercoaSession.client, amountNumber, paymentSourceId, paymentDestinationId, paymentDestinationOptions])

  // Calculate estimated vendor credit usage
  useEffect(() => {
    if (mercoaSession.client && amountNumber && payerId && vendorId) {
      const vendorCreditApplicationIsFixed =
        status &&
        ![
          Mercoa.InvoiceStatus.Unassigned,
          Mercoa.InvoiceStatus.Draft,
          Mercoa.InvoiceStatus.New,
          Mercoa.InvoiceStatus.Approved,
        ].includes(status)
      mercoaSession.client?.entity.counterparty.vendorCredit
        .estimateUsage(payerId, vendorId, {
          amount: amountNumber,
          currency: 'USD',
          ...(invoiceId && { excludedInvoiceIds: [invoiceId] }),
          ...(vendorCreditApplicationIsFixed && { includedVendorCreditIds: vendorCreditIds ?? [] }),
        })
        .then((usage) => {
          setVendorCreditUsage(usage)
          clearErrors('amount')
        })
        .catch((e) => {
          setError('amount', {
            type: 'manual',
            message: e.body,
          })
        })
    }
  }, [mercoaSession.client, amountNumber, payerId, vendorId])

  if (children) {
    return children({ fees })
  }

  const feeTotal = (fees?.destinationPlatformMarkupFee ?? 0) + (fees?.sourcePlatformMarkupFee ?? 0)
  const vendorCreditTotal = !!(amountNumber !== undefined && vendorCreditUsage?.remainingAmount !== undefined)
    ? amountNumber - vendorCreditUsage.remainingAmount
    : 0

  if (amount && (feeTotal || vendorCreditTotal)) {
    return (
      <div className="mercoa-col-span-full">
        <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-md">
          <div className="mercoa-flex-1" />
          Invoice Amount:
          <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
            {accounting.formatMoney(amount, currencyCodeToSymbol(currency))}
          </span>
        </div>

        {feeTotal > 0 && (
          <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-md">
            <div className="mercoa-flex-1" />
            Payment Fees:
            <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
              {accounting.formatMoney(feeTotal, currencyCodeToSymbol(currency))}
            </span>
          </div>
        )}

        {vendorCreditTotal > 0 && (
          <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-md">
            <div className="mercoa-flex-1" />
            Vendor Credits:
            <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
              -{accounting.formatMoney(vendorCreditTotal, currencyCodeToSymbol(currency))}
            </span>
          </div>
        )}

        <div className="mercoa-flex mercoa-mb-1">
          <div className="mercoa-flex-1" />
          <div className="mercoa-border-b-2 mercoa-border-gray-300 mercoa-w-64" />
        </div>

        <div className="mercoa-flex mercoa-text-gray-700 mercoa-text-lg">
          <div className="mercoa-flex-1" />
          Total Payment:
          <span className="mercoa-font-medium mercoa-ml-1 mercoa-text-gray-900 mercoa-w-28 mercoa-text-right">
            {accounting.formatMoney(amount + feeTotal - vendorCreditTotal, currencyCodeToSymbol(currency))}
          </span>
        </div>
      </div>
    )
  }

  return null
}

export function PayableRecurringScheduleV1() {
  return (
    <div className="mercoa-col-span-full">
      <div className="mercoa-flex mercoa-pl-1">
        <RecurringSchedule />
      </div>
    </div>
  )
}

function BankSpeedEnumToLabel(speed?: Mercoa.BankDeliveryMethod) {
  if (speed === Mercoa.BankDeliveryMethod.AchAccelerated) return 'Accelerated ACH (Same Day)'
  if (speed === Mercoa.BankDeliveryMethod.AchSameDay) return 'Fast ACH (2 Days)'
  if (speed === Mercoa.BankDeliveryMethod.AchStandard) return 'Standard ACH (3-5 Days)'
  return 'Standard ACH (3-5 Days)'
}

function CheckSpeedEnumToLabel(speed?: Mercoa.CheckDeliveryMethod) {
  if (speed === Mercoa.CheckDeliveryMethod.Print) return 'Print it myself'
  if (speed === Mercoa.CheckDeliveryMethod.Mail) return 'Mail it for me'
  return 'Mail it for me'
}
