import { Bar, Container, Section } from '@column-resizer/react'
import { Menu, Transition } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusCircleIcon,
  PlusIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import useResizeObserver from '@react-hook/resize-observer'
import accounting from 'accounting'
import Big from 'big.js'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import utc from 'dayjs/plugin/utc'
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Dropzone from 'react-dropzone'
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
import { isWeekday } from '../lib/scheduling'
import {
  AddBankAccountDialog,
  AddCheckDialog,
  AddCustomPaymentMethodDialog,
  BankAccount,
  Card,
  Check,
  CustomPaymentMethod,
  InvoiceComments,
  InvoiceStatusPill,
  LoadingSpinner,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  MercoaInput,
  NoSession,
  PayableCounterpartySearch,
  Tooltip,
  counterpartyYupValidation,
  onSubmitCounterparty,
  removeThousands,
  useMercoaSession,
} from './index'
dayjs.extend(utc)
dayjs.extend(minMax)

const dJSON = require('dirty-json')

export function PayableDetails({
  invoiceId,
  invoice,
  onRedirect,
  heightOffset,
  admin,
  documentPosition = 'left',
  children,
  invoicePreSubmit,
}: {
  invoiceId?: Mercoa.InvoiceId
  invoice?: Mercoa.InvoiceResponse
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  heightOffset?: number
  admin?: boolean
  documentPosition?: 'right' | 'left' | 'none'
  invoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  children?: ({
    invoice,
    refreshInvoice,
    ocrResponse,
    uploadedDocument,
    setUploadedDocument,
    height,
    setSelectedVendor,
    selectedVendor,
    getVendorPaymentLink,
    setValue,
    watch,
  }: PayableFormChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()
  const contentHeightOffset = heightOffset ?? mercoaSession.heightOffset

  const [ocrResponse, setOcrResponse] = useState<Mercoa.OcrResponse>()
  const [uploadedDocument, setUploadedDocument] = useState<string>()
  const [invoiceLocal, setInvoice] = useState<Mercoa.InvoiceResponse | undefined>(invoice)
  const [height, setHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight - contentHeightOffset : 0,
  )
  const [isViewingInvoiceMobile, setIsViewingInvoiceMobile] = useState<boolean>(false)

  async function refreshInvoice(invoiceId: Mercoa.InvoiceId) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.invoice.get(invoiceId)
    if (resp) {
      setInvoice(resp)
    }
  }

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    if (!invoice && invoiceId) {
      refreshInvoice(invoiceId)
    }
  }, [invoice, invoiceId, mercoaSession.token, mercoaSession.entity?.id])

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

  if (!invoiceLocal && invoiceId) {
    return <LoadingSpinner />
  }

  if (!mercoaSession.client) return <NoSession componentName="PayableDetails" />

  if (documentPosition === 'none')
    return (
      <PayableForm
        invoice={invoiceLocal}
        ocrResponse={ocrResponse}
        uploadedDocument={uploadedDocument}
        setUploadedDocument={setUploadedDocument}
        onRedirect={onRedirect}
        refreshInvoice={refreshInvoice}
        height={height}
        admin={admin}
        invoicePreSubmit={invoicePreSubmit}
      >
        {children}
      </PayableForm>
    )

  const document = (
    <PayableDocument
      onOCRComplete={setOcrResponse}
      onDocumentUpload={(e) => {
        setUploadedDocument(e.fileReaderObj)
      }}
      height={height}
      invoice={invoiceLocal}
    />
  )

  const invoiceUpload = <Section minSize={0}>{document}</Section>
  const invoiceDetails = (
    <Section className={`mercoa-relative ${documentPosition === 'left' ? 'mercoa-pl-5' : 'mercoa-pr-5'}`} minSize={400}>
      <div className="mercoa-flex mercoa-w-full mercoa-flex-row-reverse mercoa-visible min-[450px]:mercoa-invisible mercoa-absolute mercoa-top-2">
        <MercoaButton
          isEmphasized
          size="sm"
          type="button"
          onClick={() => {
            setIsViewingInvoiceMobile(!isViewingInvoiceMobile)
          }}
          className="mercoa-mr-7 mercoa-z-20"
        >
          View {isViewingInvoiceMobile ? 'Form' : 'Invoice'}
        </MercoaButton>
      </div>
      {isViewingInvoiceMobile ? (
        <div className="mercoa-mt-20">{document}</div>
      ) : (
        <PayableForm
          invoice={invoiceLocal}
          ocrResponse={ocrResponse}
          uploadedDocument={uploadedDocument}
          setUploadedDocument={setUploadedDocument}
          onRedirect={onRedirect}
          refreshInvoice={refreshInvoice}
          height={height}
          admin={admin}
          invoicePreSubmit={invoicePreSubmit}
        >
          {children}
        </PayableForm>
      )}
    </Section>
  )

  return (
    <Container>
      {documentPosition === 'left' ? invoiceUpload : invoiceDetails}
      <Bar size={10} className="mercoa-bg-gray-200 mercoa-cursor-ew-resize mercoa-invisible min-[450px]:mercoa-visible">
        <div className="mercoa-w-3 mercoa-h-10 mercoa-bg-gray-500 mercoa-absolute mercoa-top-1/2 mercoa-left-1/2 mercoa-transform -mercoa-translate-x-1/2 -mercoa-translate-y-1/2" />
      </Bar>
      {documentPosition === 'right' ? invoiceUpload : invoiceDetails}
    </Container>
  )
}

export type PayableFormChildrenProps = {
  invoice?: Mercoa.InvoiceResponse
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  ocrResponse?: Mercoa.OcrResponse
  uploadedDocument?: string
  setUploadedDocument: (e?: string) => void
  height: number
  setSelectedVendor: (e?: Mercoa.CounterpartyResponse) => void
  selectedVendor?: Mercoa.CounterpartyResponse
  getVendorPaymentLink: () => Promise<string | undefined>
  setValue: (
    name: UseFormSetValue<Mercoa.InvoiceCreationRequest>,
    value: any,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean },
  ) => void
  watch: (name: UseFormWatch<Mercoa.InvoiceCreationRequest>) => any
  errors: FieldErrors<Mercoa.InvoiceCreationRequest>
}

export function PayableForm({
  invoice,
  ocrResponse,
  uploadedDocument,
  setUploadedDocument,
  onRedirect,
  refreshInvoice,
  height,
  admin,
  invoicePreSubmit,
  children,
}: {
  invoice?: Mercoa.InvoiceResponse
  ocrResponse?: Mercoa.OcrResponse
  uploadedDocument?: string
  setUploadedDocument: (e?: string) => void
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  height: number
  admin?: boolean
  invoicePreSubmit?: (invoice: Mercoa.InvoiceCreationRequest) => Promise<Mercoa.InvoiceCreationRequest>
  children?: ({
    invoice,
    refreshInvoice,
    ocrResponse,
    uploadedDocument,
    setUploadedDocument,
    height,
    setSelectedVendor,
    selectedVendor,
    getVendorPaymentLink,
    setValue,
    watch,
  }: PayableFormChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()

  const [selectedVendor, setSelectedVendor] = useState<Mercoa.CounterpartyResponse | undefined>(invoice?.vendor)

  const schema = yup
    .object({
      id: yup.string().nullable(),
      status: yup.string(),
      amount: yup.number().transform(removeThousands).positive().typeError('Please enter a valid number'),
      invoiceNumber: yup.string(),
      description: yup.string(),
      dueDate: yup.date().typeError('Please select a due date'),
      deductionDate: yup.date().typeError('Please select a deduction date'),
      invoiceDate: yup.date().typeError('Please select an invoice date'),
      approvers: yup.mixed(),
      lineItems: yup.array().of(
        yup.object({
          id: yup.string(),
          description: yup.string().required(),
          amount: yup.number().transform(removeThousands).required().typeError('Please enter a valid number'),
          quantity: yup.number().transform(removeThousands).required().typeError('Please enter a valid number'),
          unitPrice: yup.number().transform(removeThousands).required().typeError('Please enter a valid number'),
          currency: yup.string().nullable(),
          metadata: yup.mixed().nullable(),
          glAccountId: yup.string(),
          createdAt: yup.date().nullable(),
          updatedAt: yup.date().nullable(),
        }),
      ),
      currency: yup.string().required(),
      vendorId: yup.string(),
      vendorName: yup.string(),
      paymentDestinationId: yup.string(),
      paymentDestinationType: yup.string(),
      paymentDestinationSchemaId: yup.string().nullable(),
      paymentDestinationOptions: yup.mixed().nullable(),
      paymentSourceId: yup.string(),
      paymentSourceType: yup.string(),
      paymentSourceCheckEnabled: yup.boolean().nullable(),
      paymentSourceSchemaId: yup.string().nullable(),
      hasDocuments: yup.boolean().nullable(),
      saveAsStatus: yup.string().nullable(),
      saveAsAdmin: yup.boolean(),
      metadata: yup.mixed().nullable(),
      newBankAccount: yup.mixed().nullable(),
      newCheck: yup.mixed().nullable(),
      commentText: yup.string().nullable(),
      comments: yup.mixed().nullable(),
      creatorUser: yup.mixed().nullable(),
      approvalPolicy: yup.mixed().nullable(),
      vendor: yup.object().shape(counterpartyYupValidation),
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
      vendorId: invoice?.vendor?.id,
      vendorName: invoice?.vendor?.name,
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
      hasDocuments: invoice?.hasDocuments ?? !!uploadedDocument ?? false,
      saveAsStatus: '',
      saveAsAdmin: false,
      metadata: invoice?.metadata ?? {},
      approvalPolicy: invoice?.approvalPolicy ?? { type: 'any', approvers: [] },
      approvers: invoice?.approvers ?? [],
      newBankAccount: {
        routingNumber: '',
        accountNumber: '',
        bankName: '',
      },
      newCheck: {
        payToTheOrderOf: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      commentText: '',
      comments: invoice?.comments ?? [],
      creatorUser: invoice?.creatorUser,
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
    setValue('vendorId', invoice.vendor?.id)
    setValue('vendorName', invoice.vendor?.name)
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
    setValue('hasDocuments', invoice.hasDocuments ?? uploadedDocument ?? false)
    setValue('saveAsStatus', '')
    setValue('saveAsAdmin', false)
    setValue('metadata', invoice.metadata ?? {})
    setValue('approvers', invoice?.approvers ?? [])
    setValue('approvalPolicy', invoice?.approvalPolicy ?? { type: 'any', approvers: [] })
    setValue('creatorUser', invoice?.creatorUser)
    setValue('comments', invoice?.comments ?? [])
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

  // OCR Merge
  useEffect(() => {
    if (!ocrResponse) return
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
    if (
      ocrResponse.invoice.lineItems &&
      mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled
    ) {
      setValue(
        'lineItems',
        ocrResponse.invoice.lineItems.map((lineItem) => ({
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
        })),
      )
    }

    if (ocrResponse.bankAccount) {
      setValue('newBankAccount', {
        routingNumber: ocrResponse.bankAccount.routingNumber,
        accountNumber: ocrResponse.bankAccount.accountNumber,
        bankName: ocrResponse.bankAccount.bankName,
      })
    }

    if (ocrResponse.check) {
      setValue('newCheck', {
        addressLine1: ocrResponse.check.addressLine1,
        addressLine2: ocrResponse.check.addressLine2 ?? '',
        city: ocrResponse.check.city,
        state: ocrResponse.check.stateOrProvince,
        postalCode: ocrResponse.check.postalCode,
        country: ocrResponse.check.country,
        payToTheOrderOf: ocrResponse.check.payToTheOrderOf,
      })
    }

    if (ocrResponse.vendor.id === 'new' && mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
      mercoaSession.debug('new vendor creation disabled')
    } else if (ocrResponse.vendor.id) {
      mercoaSession.debug('setting selected vendor', ocrResponse.vendor)
      setSelectedVendor(ocrResponse.vendor)
    }
  }, [ocrResponse])

  async function saveInvoice(data: any) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return

    let nextInvoiceState: Mercoa.InvoiceStatus = Mercoa.InvoiceStatus.Draft

    if (admin && data.saveAsAdmin) {
      nextInvoiceState = data.status
    } else if (invoice?.status === Mercoa.InvoiceStatus.Draft) {
      nextInvoiceState = Mercoa.InvoiceStatus.New
    } else if (invoice?.status === Mercoa.InvoiceStatus.New) {
      nextInvoiceState = Mercoa.InvoiceStatus.Approved
    } else if (invoice?.status === Mercoa.InvoiceStatus.Approved || invoice?.status === Mercoa.InvoiceStatus.Failed) {
      nextInvoiceState = Mercoa.InvoiceStatus.Scheduled
    } else if (invoice?.id) {
      // Invoice is already scheduled, there is no next state
      toast.error('This invoice is already scheduled and cannot be edited.')
      return
    }

    // Special Actions
    mercoaSession.debug({ saveAsStatus: data.saveAsStatus })
    if (data.saveAsStatus === 'COUNTERPARTY') {
      await onSubmitCounterparty({
        data: data.vendor,
        mercoaSession,
        type: 'payee',
        setError,
        onSelect: (counterparty) => {
          setSelectedVendor(counterparty)
          mercoaSession.refresh()
        },
      })
      return
    } else if (data.saveAsStatus === 'DELETE') {
      if (invoice?.id) {
        try {
          await mercoaSession.client?.invoice.delete(invoice.id)
          toast.success('Invoice deleted')

          if (onRedirect) onRedirect(undefined)
        } catch (e: any) {
          console.error(e)
          toast.error(`There was an error deleting the invoice.\n Error: ${e.body}`)
        }
      }
      return
    } else if (data.saveAsStatus === 'PRINT_CHECK') {
      if (!invoice?.id) return
      if (invoice?.paymentDestinationOptions?.delivery === Mercoa.CheckDeliveryMethod.Print) {
        if (confirm('Do you want to create a live check? This will mark the invoice as paid cannot be undone.')) {
          const resp = await mercoaSession.client?.invoice.update(invoice?.id, { status: Mercoa.InvoiceStatus.Paid })
          if (resp) {
            toast.success('Invoice marked as paid. Live check created.')
            refreshInvoice(resp.id)
          }
        } else {
          toast.success('VOID check created')
        }
      }
      const pdf = await mercoaSession.client?.invoice.document.generateCheckPdf(invoice.id)
      if (pdf) {
        window.open(pdf.uri, '_blank')
      } else {
        toast.error('There was an error generating the check PDF')
      }
      return
    } else if (data.saveAsStatus === 'APPROVE') {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) {
        refreshInvoice(invoice.id)
        return
      }
      try {
        await mercoaSession.client?.invoice.approval.approve(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        toast.success('Invoice approved')
        if (onRedirect) onRedirect(undefined)
      } catch (e: any) {
        console.error(e)
        toast.error(`There was an error approving the invoice.\n Error: ${e.body}`)
      }
      return
    } else if (data.saveAsStatus === 'REJECT') {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) {
        refreshInvoice(invoice.id)
        return
      }
      try {
        await mercoaSession.client?.invoice.approval.reject(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        toast.success('Invoice rejected')

        if (onRedirect) onRedirect(undefined)
      } catch (e: any) {
        console.error(e)
        toast.error(`There was an error rejecting the invoice.\n Error: ${e.body}`)
      }
      return
    } else if (data.saveAsStatus === 'MARK_PAID') {
      if (!invoice?.id) return
      try {
        if (confirm('Are you sure you want to mark this invoice as paid? This cannot be undone.')) {
          await mercoaSession.client?.invoice.update(invoice.id, { status: Mercoa.InvoiceStatus.Paid })
          toast.success('Invoice marked as paid')

          if (onRedirect) onRedirect(undefined)
        }
      } catch (e: any) {
        console.error(e)
        toast.error(`There was an error marking the invoice as paid.\n Error: ${e.body}`)
      }
      return
    } else if (data.saveAsStatus === 'COMMENT') {
      if (!mercoaSession.user?.id) {
        toast.error('Please login as a user to comment')
        return
      }
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
        toast.error('There was an error creating the comment')
      }
      return
    }

    const invoiceData: Mercoa.InvoiceCreationRequest = {
      status: data.saveAsStatus || nextInvoiceState,
      amount: Number(data.amount),
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
      paymentDestinationId: data.paymentDestinationId,
      ...(data.paymentDestinationType === 'check' && {
        paymentDestinationOptions: data.paymentDestinationOptions ?? {
          type: 'check',
          delivery: 'MAIL',
        },
      }),
      ...(data.paymentDestinationType === 'bankAccount' && {
        paymentDestinationOptions: data.paymentDestinationOptions ?? {
          type: 'bankAccount',
          delivery: 'ACH_SAME_DAY',
        },
      }),
      lineItems: data.lineItems.map((lineItem: any) => {
        const out: Mercoa.InvoiceLineItemRequest = {
          ...(lineItem.id && { id: lineItem.id }),
          description: lineItem.description,
          amount: Number(lineItem.amount),
          quantity: Number(lineItem.quantity),
          unitPrice: Number(lineItem.unitPrice),
          metadata: JSON.parse(JSON.stringify(lineItem.metadata)) as unknown as Record<string, string>,
          currency: data.currency ?? 'USD',
          glAccountId: lineItem.glAccountId,
        }
        return out
      }),
      metadata: JSON.parse(JSON.stringify(data.metadata)) as unknown as Record<string, string>,
      document: uploadedDocument,
      creatorEntityId: mercoaSession.entity?.id,
      creatorUserId: mercoaSession.user?.id,
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
              toast.error(metadataSchema.validationRules.errorMessage)
              setError('metadata', { type: 'manual', message: metadataSchema.validationRules.errorMessage })
              return
            }
          } else {
            delete invoiceData.metadata[key]
          }
        }
      }
    }

    // Make sure line items amount is equal to invoice amount
    if (
      mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled &&
      invoiceData.lineItems &&
      invoiceData.lineItems.length > 0
    ) {
      let lineItemsTotal = new Big(0)
      invoiceData.lineItems.forEach((lineItem, index) => {
        lineItemsTotal = lineItemsTotal.add(Number(lineItem.amount))
      })
      if (lineItemsTotal.toNumber() !== Number(data.amount)) {
        setError('amount', {
          type: 'manual',
          message: `Line item amounts do not match total amount.\nLine items: ${accounting.formatMoney(
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
        toast.error('Amount must be at least 0.01')
        setError('amount', { type: 'manual', message: 'Amount must be at least 0.01' })

        return
      }

      // Check if payment methods are selected
      if (!data.paymentSourceId && invoice?.id) {
        toast.error('Please select a payment source')
        setError('paymentSourceId', { type: 'manual', message: 'Please select how you want to pay' })

        return
      }
      if (!data.paymentDestinationId && invoice?.id) {
        toast.error('Please select a payment destination')
        setError('paymentDestinationId', { type: 'manual', message: 'Please select how the vendor wants to get paid' })

        return
      }

      // Check if approvers are assigned
      if (invoiceData.status !== Mercoa.InvoiceStatus.Draft) {
        if (invoiceData.approvers?.length !== invoice?.approvers.length) {
          toast.error('Please assign all approvers for this invoice.')
          setError('approvers', { type: 'manual', message: 'Please assign all approvers for this invoice.' })

          return
        }
      }

      if (nextInvoiceState === Mercoa.InvoiceStatus.Scheduled) {
        if (!invoiceData.deductionDate) {
          toast.error('Please select a payment date')
          setError('deductionDate', { type: 'manual', message: 'Please select a payment date' })

          return
        }
      }
    }

    //if the payment source is off-platform, make sure the destination is also off-platform
    if (data.paymentSourceType === 'offPlatform') {
      if (data.paymentDestinationType !== 'offPlatform') {
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

    mercoaSession.debug('invoiceData before API call: ', { invoiceData })

    let invoiceDataFinal = invoiceData
    if (invoicePreSubmit) {
      invoiceDataFinal = await invoicePreSubmit(invoiceData)
    }

    if (invoice) {
      mercoaSession.client?.invoice
        .update(invoice.id, invoiceDataFinal)
        .then((resp) => {
          if (resp) {
            mercoaSession.debug('invoice/update API response: ', resp)
            setUploadedDocument(undefined) // reset uploadedImage state so it is not repeatedly uploaded on subsequent saves that occur w/o a page refresh
            toast.success('Invoice updated')
            refreshInvoice(resp.id)
          }
        })
        .catch((e) => {
          console.error(e)
          console.error(e.body)
          toast.error(`There was an error updating the invoice.\n Error: ${e.body}`)
        })
    } else {
      mercoaSession.client?.invoice
        .create({
          ...invoiceDataFinal,
          creatorUserId: mercoaSession.user?.id,
        })
        .then((resp) => {
          if (resp) {
            mercoaSession.debug('invoice/create API response: ', resp)
            toast.success('Invoice created')
            setUploadedDocument(undefined) // reset uploadedImage state so it is not repeatedly uploaded on subsequent saves that occur w/o a page refresh
            refreshInvoice(resp.id)
            onRedirect(resp)
          }
        })
        .catch((e) => {
          console.error(e.statusCode)
          console.error(e.body)
          toast.error(`There was an error creating the invoice.\n Error: ${e.body}`)
        })
    }
    // sleep
    await new Promise((resolve) => setTimeout(resolve, 10))
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
    <div style={{ height: `${height}px` }} className="mercoa-overflow-auto mercoa-pr-2 mercoa-pb-10">
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(saveInvoice)}
          className={
            'mercoa-grid-cols-3 mercoa-mt-6 mercoa-grid md:mercoa-gap-x-6 md:mercoa-gap-y-4 mercoa-gap-2 mercoa-p-0.5'
          }
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
              setValue: setValue as any,
              watch,
              errors: errors as any,
            })
          ) : (
            <>
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableFormHeader /> <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableCounterpartySearch onSelect={setSelectedVendor} counterparty={selectedVendor} />{' '}
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableOverview />
              <PayableLineItems />
              <PayableMetadata /> <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayablePaymentSource />{' '}
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayablePaymentDestination />{' '}
              <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <PayableApprovers /> <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full" />
              <InvoiceComments />
              <PayableActions admin={admin} />
            </>
          )}
          <div className="mercoa-mt-20" />
        </form>
      </FormProvider>
    </div>
  )
}

export function PayableFormHeader({ hideId }: { hideId?: boolean }) {
  const { watch } = useFormContext()
  return (
    <>
      <div className="mercoa-flex mercoa-col-span-full">
        <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
          Edit Invoice{' '}
          <InvoiceStatusPill
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

export function PayableFormErrors() {
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
  } as Record<string, string>

  const errorMessages = {
    approvers: 'Please select all approvers',
    lineItems: 'Please make sure all line items have a description and amount.',
    vendor: 'Details incomplete.',
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

export function PayableDocument({
  onOCRComplete,
  onDocumentUpload,
  invoice,
  height,
}: {
  onOCRComplete?: (ocrResponse?: Mercoa.OcrResponse) => void
  onDocumentUpload?: ({ fileReaderObj, mimeType }: { fileReaderObj: string; mimeType: string }) => void
  invoice?: Mercoa.InvoiceResponse
  height: number
}) {
  const mercoaSession = useMercoaSession()

  const [uploadedFile, setUploadedFile] = useState<{ fileReaderObj: string; mimeType: string }>()
  const [ocrProcessing, setOcrProcessing] = useState<boolean>(false)

  async function refreshOcrJob(ocrJobId: string) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.ocr.getAsyncOcr(ocrJobId)
    if (resp && resp.status === Mercoa.OcrJobStatus.Success) {
      if (onOCRComplete) onOCRComplete(resp.data)
      setOcrProcessing(false)
    } else if (resp && resp.status === Mercoa.OcrJobStatus.Failed) {
      toast.error('OCR failed')
      setOcrProcessing(false)
    } else {
      setTimeout(() => refreshOcrJob(ocrJobId), 2500)
    }
  }

  async function onFileUpload(fileReaderObj: string, mimeType: string) {
    setUploadedFile({ fileReaderObj, mimeType })
    if (onDocumentUpload) onDocumentUpload({ fileReaderObj, mimeType })
    // Run OCR on file upload
    setOcrProcessing(true)
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
        toast.error('OCR failed')
        setOcrProcessing(false)
      }
    } catch (e) {
      console.error(e)
      toast.error('OCR failed')
      setOcrProcessing(false)
    }
  }

  function DocumentUploadBox({ onFileUpload }: { onFileUpload: (fileReaderObj: string, mimeType: string) => void }) {
    const blobToDataUrl = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

    return (
      <Dropzone
        onDropAccepted={(acceptedFiles) => {
          blobToDataUrl(acceptedFiles[0]).then((fileReaderObj) => {
            onFileUpload(fileReaderObj, acceptedFiles[0].type)
          })
        }}
        onDropRejected={() => {
          toast.error('Invalid file type')
        }}
        minSize={0}
        maxSize={10_000_000}
        accept={{
          'application/pdf': ['.pdf'],
          'image/png': ['.png'],
          'image/gif': ['.gif'],
          'image/tiff': ['.tif', '.tiff'],
          'image/jpeg': ['.jpeg', '.jpg'],
          'image/bmp': ['.bmp'],
          'image/webp': ['.webp'],
        }}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            className={`mercoa-mt-2 mercoa-flex mercoa-justify-center mercoa-rounded-mercoa mercoa-border mercoa-border-dashed mercoa-border-gray-900/25 ${
              isDragActive ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
            } mercoa-px-6 mercoa-py-10`}
            {...getRootProps()}
          >
            <div className="mercoa-text-center">
              <PhotoIcon className="mercoa-mx-auto mercoa-h-12 mercoa-w-12 mercoa-text-gray-300" aria-hidden="true" />
              <div className="mercoa-mt-4 mercoa-flex mercoa-text-sm mercoa-text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="mercoa-relative mercoa-cursor-pointer mercoa-rounded-mercoa mercoa-font-semibold mercoa-text-mercoa-primary focus-within:mercoa-outline-none focus-within:mercoa-ring-1 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2"
                >
                  <span>Upload an invoice</span>
                  <input {...getInputProps()} />
                </label>
                <p className="mercoa-pl-1">or drag and drop</p>
              </div>
              <p className="mercoa-text-xs mercoa-leading-5 mercoa-text-gray-600">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        )}
      </Dropzone>
    )
  }

  return (
    <div className={`mercoa-p-5 mercoa-rounded-mercoa`}>
      {uploadedFile || invoice?.hasDocuments ? (
        <>
          <div className={`mercoa-text-center ${ocrProcessing ? 'mercoa-block mercoa-mb-5' : 'mercoa-hidden'}`}>
            <span className="mercoa-text-gray-800 mercoa-w-full"> Extracting Invoice Details </span>
            <ProgressBar />
          </div>
          <PayableDocumentDisplay
            documents={uploadedFile ? new Array(uploadedFile) : undefined}
            invoice={invoice}
            height={height}
            showSourceEmail
          />
        </>
      ) : (
        <div className={`mercoa-min-w-[340px]`}>
          <DocumentUploadBox onFileUpload={onFileUpload} />
        </div>
      )}
    </div>
  )
}

export function PayableDocumentDisplay({
  documents,
  invoice,
  height,
  showSourceEmail,
}: {
  documents?: Array<{ fileReaderObj: string; mimeType: string }>
  invoice?: Mercoa.InvoiceResponse
  height: number
  showSourceEmail?: boolean
}) {
  const mercoaSession = useMercoaSession()
  const [localDocuments, setLocalDocuments] = useState<Array<{ fileReaderObj: string; mimeType: string }> | undefined>(
    documents,
  )
  const [sourceEmails, setSourceEmail] = useState<Mercoa.EmailLog[]>()
  const [view, setView] = useState<'document' | 'email'>('document')

  useEffect(() => {
    if (invoice && invoice.hasDocuments) {
      mercoaSession.client?.invoice.document.getAll(invoice.id).then((documents) => {
        if (documents && documents.length > 0) {
          setLocalDocuments(documents.map((document) => ({ fileReaderObj: document.uri, mimeType: document.mimeType })))
        }
      })
    }
    if (invoice && invoice.hasSourceEmail) {
      mercoaSession.client?.invoice.document.getSourceEmail(invoice.id).then((sourceEmail) => {
        if (sourceEmail) {
          setSourceEmail(sourceEmail.data)
        }
      })
    }
  }, [invoice])

  if (!mercoaSession.client) return <NoSession componentName="PayableDocumentDisplay" />
  if (!documents && !invoice)
    return <div>One of invoice or documents must be passed as a prop to PayableDocumentDisplay</div>
  return (
    <div className="mercoa-overflow-y-auto mercoa-overflow-x-hidden" style={{ height: `${height}px` }}>
      {view === 'document' && localDocuments && localDocuments.length > 0 && (
        <div className="mercoa-w-full">
          {localDocuments.map((document, i) => (
            <div key={i}>
              <div className="mercoa-flex mercoa-flex-row-reverse mercoa-gap-4 mercoa-mb-4">
                {showSourceEmail && sourceEmails && (
                  <MercoaButton
                    type="button"
                    isEmphasized={false}
                    className="mercoa-mt-2"
                    onClick={() => setView('email')}
                  >
                    <span className="mercoa-hidden xl:mercoa-inline">
                      <EnvelopeIcon className="-mercoa-ml-1 mercoa-mr-2 mercoa-inline-flex mercoa-size-5" /> View Email
                    </span>
                  </MercoaButton>
                )}
                <a href={document.fileReaderObj} target="_blank" rel="noreferrer" download>
                  <MercoaButton type="button" isEmphasized={false} className="mercoa-mt-2">
                    <span className="mercoa-hidden xl:mercoa-inline">
                      <ArrowDownTrayIcon className="-mercoa-ml-1 mercoa-mr-2 mercoa-inline-flex mercoa-size-5" />{' '}
                      Download Invoice
                    </span>
                    <span className="mercoa-inline xl:mercoa-hidden">Download</span>
                  </MercoaButton>
                </a>
              </div>

              <div className="mercoa-rounded-mercoa mercoa-border mercoa-shadow-lg mercoa-w-full">
                {document.mimeType === 'application/pdf' ? (
                  <embed
                    src={document.fileReaderObj}
                    key={document.fileReaderObj}
                    height={height - 90}
                    className="mercoa-object-contain mercoa-object-top mercoa-w-full"
                    type="application/pdf"
                  />
                ) : (
                  <img src={document.fileReaderObj} className="mercoa-object-contain mercoa-object-top mercoa-w-full" />
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

const ProgressBar = () => {
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
    <div className="mercoa-h-2 mercoa-w-full mercoa-bg-gray-300">
      <div
        style={{ width: `${progressPercentage}%` }}
        className={`mercoa-rounded-sm mercoa-h-full mercoa-bg-mercoa-primary`}
      ></div>
    </div>
  )
}

// End Documents

// Action Bar
export function PayableActions({
  approveButton,
  rejectButton,
  nonApproverButton,
  deleteButton,
  archiveButton,
  cancelButton,
  saveDraftButton,
  printCheckButton,
  createInvoiceButton,
  submitForApprovalButton,
  nextButton,
  markAsPaidButton,
  schedulePaymentButton,
  retryPaymentButton,
  admin,
}: {
  approveButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  rejectButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  nonApproverButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  deleteButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  archiveButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  cancelButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  saveDraftButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  printCheckButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
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
  admin?: boolean
}) {
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

  const buttons: React.ReactNode[] = []

  const deleteButtonComponent = deleteButton ? (
    deleteButton({
      onClick: () => {
        setValue('saveAsStatus', 'DELETE')
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={false}
      color="red"
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
      color="red"
      onClick={() => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Archived)
      }}
    >
      Archive Invoice
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
      color="red"
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
      type="button"
      isEmphasized
      onClick={() => {
        setValue('saveAsStatus', 'PRINT_CHECK')
      }}
    >
      {paymentDestinationOptions?.delivery === Mercoa.CheckDeliveryMethod.Print ? 'Print Check' : 'View Mailed Check'}
    </MercoaButton>
  )

  const createInvoiceButtonComponent = createInvoiceButton ? (
    createInvoiceButton({
      onClick: () => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Draft)
      },
    })
  ) : (
    <MercoaButton
      isEmphasized
      type="submit"
      onClick={() => {
        setValue('saveAsStatus', Mercoa.InvoiceStatus.Draft)
      }}
    >
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
        setValue('saveAsStatus', 'MARK_PAID')
      },
    })
  ) : (
    <MercoaButton
      isEmphasized={true}
      onClick={() => {
        setValue('saveAsStatus', 'MARK_PAID')
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
        buttons.push(
          <ApproverActionButtons
            approveButton={approveButton}
            rejectButton={rejectButton}
            nonApproverButton={nonApproverButton}
          />,
          cancelButtonComponent,
        )

        break

      case Mercoa.InvoiceStatus.Approved:
        let nextButton = <></>
        if (paymentDestinationType === Mercoa.PaymentMethodType.OffPlatform) {
          nextButton = markPaidButtonComponent
        } else if (
          paymentDestinationType === Mercoa.PaymentMethodType.Check &&
          paymentDestinationOptions === Mercoa.CheckDeliveryMethod.Print
        ) {
          nextButton = printCheckButtonComponent
        } else {
          nextButton = schedulePaymentButtonComponent
        }
        buttons.push(nextButton, cancelButtonComponent)

        break

      case Mercoa.InvoiceStatus.Scheduled:
        buttons.push(cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Paid:
        if (paymentDestinationType === Mercoa.PaymentMethodType.Check) {
          buttons.push(printCheckButtonComponent)
        }
        buttons.push(archiveButtonComponent)
        break

      case Mercoa.InvoiceStatus.Failed:
        buttons.push(retryPaymentButtonComponent, cancelButtonComponent)
        break

      case Mercoa.InvoiceStatus.Archived:
      case Mercoa.InvoiceStatus.Pending:
      case Mercoa.InvoiceStatus.Canceled:
      case Mercoa.InvoiceStatus.Refused:
      default:
        break
    }

    if (admin) {
      buttons.push(
        <MercoaButton
          type="submit"
          isEmphasized
          onClick={() => {
            setValue('saveAsStatus', '')
            setValue('saveAsAdmin', true)
          }}
        >
          SAVE AS ADMIN
        </MercoaButton>,
      )
    }
  }

  return (
    <>
      <div className="mercoa-col-span-full" style={{ visibility: 'hidden' }}>
        <PayableFormErrors />
      </div>
      <div className="mercoa-absolute mercoa-bottom-0 mercoa-right-0 mercoa-w-full mercoa-bg-white mercoa-z-10">
        {isSaving ? (
          <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-p-2">
            <LoadingSpinnerIcon />
          </div>
        ) : (
          <>
            <PayableFormErrors />
            <div className="mercoa-mx-auto mercoa-flex mercoa-flex-row-reverse mercoa-items-center mercoa-gap-2 mercoa-py-3 mercoa-px-6">
              {buttons.map((button, index) => (
                <div key={index}>{button}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export function PayableOverview({ readOnly }: { readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()

  const [supportedCurrencies, setSupportedCurrencies] = useState<Array<Mercoa.CurrencyCode>>([])

  const {
    register,
    control,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext()

  const currency = watch('currency')

  // // Get Supported Currencies
  useEffect(() => {
    // Figure out what currencies are supported by C1 -------------------------------
    let supportedCurrencies: Mercoa.CurrencyCode[] = []
    const hasMercoaPaymentRails = mercoaSession.organization?.paymentMethods?.payerPayments.some(
      (p) => p.active && (p.type === 'bankAccount' || p.type === 'card'),
    )
    // dedupe and add supported currencies
    if (hasMercoaPaymentRails) {
      supportedCurrencies.push('USD')
    }
    mercoaSession.customPaymentMethodSchemas.forEach((p) => {
      if (p.supportedCurrencies) {
        supportedCurrencies = [...new Set([...supportedCurrencies, ...p.supportedCurrencies])]
      }
    })
    setSupportedCurrencies(supportedCurrencies)
  }, [mercoaSession.client, mercoaSession.customPaymentMethodSchemas, mercoaSession.organization?.paymentMethods])

  // Reset currency dropdown
  useEffect(() => {
    if (currency) return
    if (supportedCurrencies.length > 0) {
      setValue('currency', supportedCurrencies[0])
    }
  }, [supportedCurrencies, currency])

  const useWidth = (target: any) => {
    const [width, setWidth] = useState<number>(0)

    useLayoutEffect(() => {
      setWidth(target.current.getBoundingClientRect().width)
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
  if (width && width > 1100) {
    formCols = 'mercoa-grid-cols-6'
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
        readOnly={readOnly}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
      />

      {/*  INVOICE AMOUNT */}
      <MercoaInput
        control={control}
        name="amount"
        label="Amount"
        type="currency"
        readOnly={readOnly}
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
              {supportedCurrencies.map((option: Mercoa.CurrencyCode, index: number) => (
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
        readOnly={readOnly}
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
        readOnly={readOnly}
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
        readOnly={readOnly}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        control={control}
        errors={errors}
        dateOptions={{
          minDate: dayjs().toDate(),
          filterDate: isWeekday,
        }}
      />

      {/*  DESCRIPTION */}
      <div className="mercoa-col-span-full">
        <label
          htmlFor="description"
          className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 "
        >
          Description
        </label>
        <div className="mercoa-mt-2">
          <textarea
            id="description"
            readOnly={readOnly}
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

// Payment Source and Destination

export function SelectPaymentMethod({
  isSource,
  isDestination,
  disableCreation,
  readOnly,
}: {
  isSource?: boolean
  isDestination?: boolean
  disableCreation?: boolean
  readOnly?: boolean // UNIMPLEMENTED
}) {
  const mercoaSession = useMercoaSession()

  const [paymentMethods, setPaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse>>([])
  const [firstRender, setFirstRender] = useState(true)

  const { watch, setValue, clearErrors } = useFormContext()

  const vendorId = watch('vendorId')
  const entityId = isDestination ? vendorId : mercoaSession.entity?.id

  // Get payment methods
  async function refreshPaymentMethods() {
    if (!mercoaSession.token || !entityId || !mercoaSession.client) return
    const resp = await mercoaSession.client?.entity.paymentMethod.getAll(entityId)
    setPaymentMethods(resp)
  }

  useEffect(() => {
    if (!mercoaSession.token || !entityId || !mercoaSession.client) return
    refreshPaymentMethods()
  }, [mercoaSession.client, entityId, mercoaSession.token])

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
  const destOption = watch('paymentDestinationOptions')

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
    if (isDestination) {
      setValue('paymentDestinationOptions', undefined)
    }
    if (selectedType === Mercoa.PaymentMethodType.BankAccount) {
      const account = paymentMethods.find(
        (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount,
      ) as Mercoa.PaymentMethodResponse.BankAccount
      setValue(sourceOrDestination, account?.id)
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
            clearErrors(sourceOrDestination)
          }
        })
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

  // Reset payment destination on type change
  useEffect(() => {
    if (!isDestination) return
    setValue('paymentDestinationOptions', undefined)
  }, [isDestination, selectedType])

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

  if (!mercoaSession.client) return <NoSession componentName="SelectPaymentMethod" />
  return (
    <div>
      <MercoaCombobox
        options={availableTypes.map((type) => ({ value: type, disabled: false }))}
        onChange={(selected) => {
          setValue(paymentMethodTypeKey, selected.key)
          setMethodOnTypeChange(selected.key)
        }}
        value={availableTypes.find((type) => type.key === selectedType)}
        displayIndex="value"
      />
      {selectedType === Mercoa.PaymentMethodType.BankAccount && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount)
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <BankAccount
                    account={paymentMethod as Mercoa.PaymentMethodResponse.BankAccount}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
          {isDestination &&
            !disableCreation &&
            vendorId &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <>
                <AddBankAccountDialog
                  entityId={vendorId}
                  onSelect={async (paymentMethod: Mercoa.PaymentMethodResponse.BankAccount) => {
                    await refreshPaymentMethods()
                    setTimeout(() => {
                      setValue(paymentMethodTypeKey, Mercoa.PaymentMethodType.BankAccount, { shouldDirty: true })
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }, 100)
                  }}
                  bankAccount={{
                    routingNumber: watch('newBankAccount.routingNumber') ?? '',
                    accountNumber: watch('newBankAccount.accountNumber') ?? '',
                    bankName: watch('newBankAccount.bankName') ?? '',
                    accountType: 'CHECKING',
                  }}
                />
                <div className="mercoa-mt-2" />
                <MercoaCombobox
                  displaySelectedAs="pill"
                  label="Payment Speed"
                  options={[
                    {
                      value: {
                        key: 'ACH_SAME_DAY',
                        value: 'Same-Day ACH (2 Days)',
                      },
                      disabled: false,
                    },
                    {
                      value: {
                        key: 'ACH_STANDARD',
                        value: 'Standard ACH (3-5 Days)',
                      },
                      disabled: false,
                    },
                  ]}
                  onChange={(selected) => {
                    setValue('paymentDestinationOptions', {
                      type: 'bankAccount',
                      delivery: selected.key,
                    })
                  }}
                  displayIndex="value"
                  value={() => {
                    return destOption?.delivery === 'ACH_STANDARD'
                      ? { key: 'ACH_STANDARD', value: 'Standard ACH (3-5 Days)' }
                      : { key: 'ACH_SAME_DAY', value: 'Same-Day ACH (2 Days)' }
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
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <Check
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Check}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
          {isDestination &&
            !disableCreation &&
            vendorId &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <>
                <AddCheckDialog
                  entityId={vendorId}
                  onSelect={async (paymentMethod: Mercoa.PaymentMethodResponse.Check) => {
                    await refreshPaymentMethods()
                    setTimeout(() => {
                      setValue(paymentMethodTypeKey, Mercoa.PaymentMethodType.Check, { shouldDirty: true })
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }, 100)
                  }}
                  check={{
                    payToTheOrderOf: watch('newCheck.payToTheOrderOf') ?? '',
                    addressLine1: watch('newCheck.addressLine1') ?? '',
                    addressLine2: watch('newCheck.addressLine2') ?? '',
                    city: watch('newCheck.city') ?? '',
                    stateOrProvince: watch('newCheck.state') ?? '',
                    postalCode: watch('newCheck.postalCode') ?? '',
                    country: watch('newCheck.country') ?? '',
                  }}
                />
                <div className="mercoa-mt-2" />
                <MercoaCombobox
                  label="Check Delivery Method"
                  displaySelectedAs="pill"
                  options={[
                    {
                      value: {
                        key: 'MAIL',
                        value: 'Mail it for me',
                      },
                      disabled: false,
                    },
                    {
                      value: {
                        key: 'PRINT',
                        value: 'Print it myself',
                      },
                      disabled: false,
                    },
                  ]}
                  onChange={(selected) => {
                    setValue('paymentDestinationOptions', {
                      type: 'check',
                      delivery: selected.key,
                    })
                  }}
                  displayIndex="value"
                  value={() => {
                    return destOption?.delivery === 'PRINT'
                      ? { key: 'PRINT', value: 'Print it myself' }
                      : { key: 'MAIL', value: 'Mail it for me' }
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
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <Card
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Card}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
        </>
      )}
      {selectedType.startsWith('cpms_') && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter(
                (paymentMethod) => (paymentMethod as Mercoa.PaymentMethodResponse.Custom).schemaId === selectedType,
              )
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <CustomPaymentMethod
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Custom}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }}
                  />
                </div>
              ))}
          </div>
          {isDestination &&
            !disableCreation &&
            vendorId &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <>
                <AddCustomPaymentMethodDialog
                  entityId={vendorId}
                  schema={mercoaSession.customPaymentMethodSchemas.find((e) => e.id === selectedType)}
                  onSelect={async (paymentMethod: Mercoa.PaymentMethodResponse.Custom) => {
                    await refreshPaymentMethods()
                    setTimeout(() => {
                      setValue(paymentMethodTypeKey, paymentMethod.schemaId, { shouldDirty: true })
                      setValue(sourceOrDestination, paymentMethod.id)
                      clearErrors(sourceOrDestination)
                    }, 100)
                  }}
                />
              </>
            )}
        </>
      )}
    </div>
  )
}

export function PayablePaymentSource({ readOnly }: { readOnly?: boolean }) {
  const {
    formState: { errors },
  } = useFormContext()
  return (
    <div className="mercoa-pb-6 mercoa-col-span-full">
      <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-my-5">
        How do you want to pay?
      </h2>
      <SelectPaymentMethod isSource readOnly={readOnly} />
      {errors.paymentSourceId?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentSourceId?.message.toString()}</p>
      )}
    </div>
  )
}

export function PayablePaymentDestination({ readOnly }: { readOnly?: boolean }) {
  const {
    formState: { errors },
    watch,
  } = useFormContext()

  const paymentSourceType = watch('paymentSourceType')
  const vendorId = watch('vendorId')
  const vendorName = watch('vendorName')

  return (
    <>
      {vendorId && vendorName && paymentSourceType !== 'offPlatform' && (
        <div className="mercoa-pb-16 mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-my-5">
            How does <span className="mercoa-text-gray-800 mercoa-underline">{vendorName}</span> want to get paid?
          </h2>
          <SelectPaymentMethod isDestination readOnly={readOnly} />
          {errors.paymentDestinationId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentDestinationId?.message.toString()}</p>
          )}
        </div>
      )}
    </>
  )
}

// End Payment Source and Destination

// Approvers

export function PayableApprovers({ readOnly }: { readOnly?: boolean }) {
  const {
    watch,
    formState: { errors },
  } = useFormContext()

  const approvers = watch('approvers') as Mercoa.ApprovalSlot[]
  const status = watch('status') as Mercoa.InvoiceStatus

  return (
    <div className="mercoa-col-span-full mercoa-space-y-4">
      {approvers?.length > 0 && (
        <>
          <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900 mercoa-mt-5">
            Approvals
          </h2>
          {status === Mercoa.InvoiceStatus.Draft && !readOnly ? <ApproversSelection /> : <ApproverWells />}
          {errors.approvers && <p className="mercoa-text-sm mercoa-text-red-500">Please select all approvers</p>}
        </>
      )}
    </div>
  )
}

function ApproversSelection() {
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
                mercoaSession.users.filter((user) => {
                  const approverSlot = approvers.find((e) => e?.approvalSlotId === slot.approvalSlotId)
                  if (user.id === approverSlot?.assignedUserId) return true
                })[0] ?? ''
              }
              options={[
                ...filterApproverOptions({
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

function ApproverWells() {
  const mercoaSession = useMercoaSession()
  const seenUsers: string[] = []
  const { watch } = useFormContext()
  const approvers = watch('approvers') as Mercoa.ApprovalSlot[]
  return (
    <>
      {approvers.map((slot) => {
        const user = mercoaSession.users.find((user) => user.id === slot.assignedUserId)
        if (user && !seenUsers.includes(user.id)) {
          seenUsers.push(user.id)
          return <ApproverWell key={user.id} approverSlot={slot} approver={user} />
        }
      })}
    </>
  )
}

function ApproverWell({
  approverSlot,
  approver,
}: {
  approverSlot: Mercoa.ApprovalSlot
  approver: Mercoa.EntityUserResponse
}) {
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

  return (
    <>
      <div className="mercoa-flex mercoa-items-center">
        <div className="mercoa-flex-auto">
          <div className={`mercoa-flex mercoa-items-center mercoa-rounded-mercoa ${bgColor}`}>
            <div className="mercoa-flex-auto mercoa-p-3">
              <div className={'mercoa-text-sm mercoa-font-medium mercoa-text-grey-900'}>{approver.name}</div>
              <div className="mercoa-text-sm mercoa-text-gray-500">{approver.email}</div>
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

function ApproverActionButtons({
  approveButton,
  rejectButton,
  nonApproverButton,
}: {
  approveButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  rejectButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
  nonApproverButton?: ({ onClick }: { onClick: () => void }) => JSX.Element
}) {
  const { setValue, watch } = useFormContext()

  const approvers = watch('approvers') as Mercoa.ApprovalSlot[]
  const status = watch('status')

  const mercoaSession = useMercoaSession()
  if (status != Mercoa.InvoiceStatus.New) return <></>
  const approverSlot = approvers.find((e) => e.assignedUserId === mercoaSession.user?.id)
  if (!approverSlot) {
    return nonApproverButton ? (
      nonApproverButton({ onClick: () => {} })
    ) : (
      <MercoaButton disabled color="gray" isEmphasized type="button">
        Waiting for approval
      </MercoaButton>
    )
  }

  return (
    <div className="mercoa-flex mercoa-items-center mercoa-justify-end mercoa-gap-x-2">
      {rejectButton ? (
        rejectButton({ onClick: () => setValue('saveAsStatus', 'REJECT') })
      ) : (
        <MercoaButton
          disabled={approverSlot.action === Mercoa.ApproverAction.Reject}
          color="red"
          isEmphasized
          onClick={() => setValue('saveAsStatus', 'REJECT')}
        >
          Reject
        </MercoaButton>
      )}
      {approveButton ? (
        approveButton({ onClick: () => setValue('saveAsStatus', 'APPROVE') })
      ) : (
        <MercoaButton
          disabled={approverSlot.action === Mercoa.ApproverAction.Approve}
          color="green"
          isEmphasized
          onClick={() => setValue('saveAsStatus', 'APPROVE')}
        >
          Approve
        </MercoaButton>
      )}
    </div>
  )
}

export function filterApproverOptions({
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
    const filteredUsers = filterApproverOptions({
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
export function PayableMetadata({ skipValidation, readOnly }: { skipValidation?: boolean; readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()

  return (
    <div className="mercoa-col-span-full mercoa-grid-cols-1 mercoa-gap-4 mercoa-hidden has-[div]:mercoa-grid ">
      <label className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700">
        Additional Invoice Details
      </label>
      {mercoaSession.organization?.metadataSchema?.map((schema) => (
        <MetadataSelection
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

export function MetadataSelection({
  schema,
  field,
  skipValidation,
  readOnly,
  lineItem,
  hideLabel,
}: {
  schema: Mercoa.MetadataSchema
  field: string
  skipValidation?: boolean
  readOnly?: boolean
  lineItem?: boolean
  hideLabel?: boolean
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
  }, [mercoaSession.entityId])

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

  function MetadataCombobox({
    schema,
    setValue,
    value,
    values,
  }: {
    schema: Mercoa.MetadataSchema
    setValue: (e: string) => void
    value?: string
    values: string[]
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
              value: '',
            }
            try {
              parsedValue = JSON.parse(value) as { key: string; value: string }
              parsedValue.value = `${parsedValue.value}`
              parsedValue.key = `${parsedValue.key}`
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
      if (schema.type === Mercoa.MetadataType.KeyValue) {
        setValueState(
          JSON.parse(
            values.find((e) => {
              let parsedValue = {
                key: '',
                value: '',
              }
              try {
                parsedValue = JSON.parse(e) as { key: string; value: string }
                parsedValue.value = `${parsedValue.value}`
                parsedValue.key = `${parsedValue.key}`
              } catch (e) {
                console.error(e)
              }
              return parsedValue?.key === `${value ?? ''}`
            }) ?? '{}',
          ) as any,
        )
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
          displayIndex="value"
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
        value={valueState}
        multiple={schema.allowMultiple}
        freeText={!schema.allowMultiple}
        displaySelectedAs="pill"
        showClear
        readOnly={readOnly}
      />
    )
  }

  function MetadataBoolean({ setValue, value }: { setValue: (e: string) => void; value?: string }) {
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

  const metadataSelection = (
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
      {((entityMetadata && schema.type === Mercoa.MetadataType.String) ||
        schema.type === Mercoa.MetadataType.KeyValue) && (
        <MetadataCombobox
          schema={schema}
          values={entityMetadata ?? []}
          value={watch(field)}
          setValue={(e) => {
            setValue(field, e)
          }}
        />
      )}
      {schema.type === Mercoa.MetadataType.Boolean && (
        <MetadataBoolean
          value={watch(field)}
          setValue={(e) => {
            setValue(field, e)
          }}
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
  )

  return (
    <div>
      {!hideLabel && (
        <h3 className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          {schema.displayName}
        </h3>
      )}
      {metadataSelection}
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

function filterMetadataValues(entityMetadata: string[], schema: Mercoa.MetadataSchema) {
  if (entityMetadata) {
    if (schema.type === Mercoa.MetadataType.KeyValue) {
      entityMetadata = entityMetadata.map((e) => {
        try {
          const parsedValue = dJSON.parse(e) as { key: string; value: string }
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
export function PayableLineItems({ readOnly }: { readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()
  const { control, watch } = useFormContext()

  const { append } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const lineItems = watch('lineItems') as Mercoa.InvoiceLineItemRequest[]
  const [isHidden, setIsHidden] = useState<boolean>(false)
  if (mercoaSession.iframeOptions?.options?.invoice?.lineItems === Mercoa.LineItemAvailabilities.Disabled) return <></>
  return (
    <div
      className={`mercoa-col-span-full mercoa-grid mercoa-grid-cols-2 mercoa-gap-2 mercoa-border mercoa-border-gray-900/10 mercoa-px-2 mercoa-py-6 mercoa-rounded-mercoa`}
    >
      {/* HEADER */}
      <div className="mercoa-flex mercoa-items-center mercoa-col-span-full">
        <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-700 mercoa-text-lg">
          Line Items{' '}
          <span className="mercoa-font-medium mercoa-text-gray-500 mercoa-text-base">({lineItems?.length ?? 0})</span>
        </h2>
        {!isHidden && !readOnly && (
          <MercoaButton
            isEmphasized={false}
            size="sm"
            hideOutline
            color="gray"
            onClick={() => {
              append({
                name: '',
                description: `Line Item ${(lineItems?.length ?? 0) + 1}`,
                amount: 0,
                unitPrice: 0,
                quantity: 1,
              })
            }}
            type="button"
          >
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
      {!isHidden && <LineItemRows readOnly={readOnly} />}
      {!isHidden && !readOnly && (lineItems?.length ?? 0) > 0 && (
        <div className="mercoa-col-span-full mercoa-gap-2 mercoa-flex">
          <div className="mercoa-flex-1" />
          <MercoaButton
            isEmphasized
            size="sm"
            onClick={() => {
              append({
                name: '',
                description: `Line Item ${(lineItems?.length ?? 0) + 1}`,
                amount: 0,
                unitPrice: 0,
                quantity: 1,
              })
            }}
            type="button"
          >
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
  const lineItems = watch('lineItems') as Mercoa.InvoiceLineItemRequest[]

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
            description: lineItems[0].description,
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

function LineItemRows({ readOnly }: { readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()
  const { register, control, watch, setValue } = useFormContext()
  const { remove } = useFieldArray({
    control,
    name: `lineItems`,
  })

  const currency = watch('currency')
  const lineItems = watch('lineItems') as Mercoa.InvoiceLineItemRequest[]

  const filteredMetadata = mercoaSession.organization?.metadataSchema?.filter((schema) => schema.lineItem) ?? []

  return (
    <>
      {lineItems.map((lineItem, index) => (
        <Fragment key={lineItem.id}>
          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full mercoa-my-4" />
          <div className="mercoa-flex mercoa-col-span-full mercoa-items-start">
            {/*  INVOICE NUMBER */}
            <MercoaInput
              name={`lineItems.${index}.description`}
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
              name={`lineItems.${index}.amount`}
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
                  remove(index)
                }}
                className="mercoa-ml-1"
              >
                <XCircleIcon className="mercoa-size-5 hover:mercoa-opacity-75" />
                <span className="mercoa-sr-only">Remove Line Item</span>
              </MercoaButton>
            )}
          </div>
          {filteredMetadata.map((schema) => (
            <MetadataSelection
              schema={schema}
              lineItem
              key={schema.key}
              readOnly={readOnly}
              field={
                schema.key === 'glAccountId'
                  ? `lineItems[${index}].${schema.key}`
                  : `lineItems[${index}].metadata.${schema.key}`
              }
            />
          ))}
          {lineItems.length - 1 === index && (
            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-col-span-full mercoa-my-4" />
          )}
        </Fragment>
      ))}
    </>
  )
} // End Line Items
