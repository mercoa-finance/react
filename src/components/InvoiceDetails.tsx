import { Bar, Container, Section } from '@column-resizer/react'
import { Dialog, Transition } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import useResizeObserver from '@react-hook/resize-observer'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import Draggable from 'react-draggable'
import Dropzone from 'react-dropzone'
import { Controller, FieldArrayWithId, useFieldArray, useForm } from 'react-hook-form'
import { Document, Page } from 'react-pdf'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import { isWeekday, subtractWeekdays } from '../lib/scheduling'
import { CounterpartySearch } from './CounterpartySearch'
import { InvoiceStatusPill } from './Inbox'
import {
  AddBankAccountForm,
  AddCheckForm,
  AddCustomPaymentMethodForm,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  Tooltip,
  findCustomPaymentMethodAccountNameAndNumber,
  useMercoaSession,
} from './index'

const dJSON = require('dirty-json')

dayjs.extend(minMax)

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

export function InvoiceDetails({
  invoice,
  documents,
  onRedirect,
  addPaymentMethodRedirect,
}: {
  invoice?: Mercoa.InvoiceResponse
  documents?: Array<Mercoa.DocumentResponse>
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  addPaymentMethodRedirect?: () => void
}) {
  const mercoaSession = useMercoaSession()
  const [uploadedFile, setUploadedFile] = useState<{ fileReaderObj: string; mimeType: string }>()
  const [ocrResponse, setOcrResponse] = useState<Mercoa.OcrResponse>()
  const [uploadedImage, setUploadedImage] = useState<string>()
  const [ocrProcessing, setOcrProcessing] = useState<boolean>(false)
  const [invoiceLocal, setInvoice] = useState<Mercoa.InvoiceResponse | undefined>(invoice)
  const [height, setHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight - 120 : 0)

  function handleResize() {
    setHeight(window.innerHeight - 120)
  }
  useEffect(() => {
    window.addEventListener('resize', handleResize, false)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  async function refreshInvoice(invoiceId: Mercoa.InvoiceId) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.invoice.get(invoiceId)
    if (resp) {
      setInvoice(resp)
    }
  }

  async function onFileUpload(fileReaderObj: string, file: File) {
    setUploadedFile({ fileReaderObj, mimeType: file.type })
    setUploadedImage(fileReaderObj)
    // Run OCR on file upload
    setOcrProcessing(true)
    try {
      // const ocrResponse: Mercoa.OcrResponse = {
      //   invoice: {
      //     amount: 2722.55,
      //     invoiceNumber: '2167',
      //     invoiceDate: new Date(),
      //     dueDate: new Date(),
      //     approvers: [],
      //     approvalPolicy: [],
      //     id: 'new',
      //     status: Mercoa.InvoiceStatus.Draft,
      //     paymentDestinationConfirmed: false,
      //     transactions: [],
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //     serviceEndDate: new Date(),
      //     serviceStartDate: new Date(),
      //     lineItems: [],
      //     currency: Mercoa.CurrencyCode.Usd,
      //     hasDocuments: true,
      //     comments: [],
      //     metadata: {},
      //   },
      //   vendor: {
      //     id: 'new',
      //     email: 'ar@alpaca.markets',
      //     isCustomer: false,
      //     name: 'Alpaca Securities LLC',
      //     acceptedTos: false,
      //     status: Mercoa.EntityStatus.Pending,
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //     accountType: Mercoa.AccountType.Business,
      //     isPayee: true,
      //     isPayor: false,
      //     profile: {
      //       business: {
      //         email: 'ar@alpaca.markets',
      //         businessType: Mercoa.BusinessType.Llc,
      //         legalBusinessName: 'Alpaca Securities LLC',
      //         ownersProvided: false,
      //         taxIdProvided: false,
      //         website: 'alpaca.markets',
      //       },
      //     },
      //   },
      //   check: {
      //     addressLine1: '710 Oakfield Dr Ste 210',
      //     addressLine2: '',
      //     city: 'Brandon',
      //     stateOrProvince: 'FL',
      //     postalCode: '33511',
      //     country: 'US',
      //     payToTheOrderOf: 'Alpaca Securities LLC',
      //     supportedCurrencies: [Mercoa.CurrencyCode.Usd],
      //     id: 'new',
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //     isDefaultDestination: false,
      //     isDefaultSource: false,
      //   },
      //   bankAccount: {
      //     accountNumber: '3302307899',
      //     routingNumber: '121140399',
      //     bankName: 'Silicon Valley Bank',
      //     accountType: Mercoa.BankType.Checking,
      //     status: Mercoa.BankStatus.Verified,
      //     id: 'new',
      //     supportedCurrencies: [Mercoa.CurrencyCode.Usd],
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //     isDefaultDestination: false,
      //     isDefaultSource: false,
      //   },
      // }
      const ocrResponse = await mercoaSession.client?.ocr.ocr({
        entityId: mercoaSession.entityId,
        image: fileReaderObj,
        mimeType: file.type,
      })
      setOcrProcessing(false)
      setOcrResponse(ocrResponse)
    } catch (e) {
      console.log(e)
      setOcrProcessing(false)
    }
  }

  useEffect(() => {
    if (!documents || !documents[0]) return
    setUploadedFile({ fileReaderObj: documents?.[0]?.uri, mimeType: documents?.[0]?.mimeType })
  }, [documents])

  return (
    <Container>
      {/* ********* INVOICE UPLOAD FIELD */}
      <Section minSize={0}>
        <div className="min-w-[300px] mr-5">
          {uploadedFile ? (
            <>
              <div className={`items-center ${ocrProcessing ? 'flex' : 'hidden'}`}>
                <span className="mr-5 text-gray-800"> Invoice Processing </span>
                <LoadingSpinnerIcon />
              </div>
              <InvoiceDocuments documents={new Array(uploadedFile)} height={height} />
            </>
          ) : (
            <InvoiceDocumentsUpload onFileUpload={onFileUpload} />
          )}
        </div>
      </Section>

      <Bar size={5} className="bg-gray-200 cursor-ew-resize">
        <div className="w-3 h-10 bg-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </Bar>

      {/* EDIT INVOICE FORM */}
      <Section className="pl-5" minSize={300}>
        <EditInvoiceForm
          invoice={invoiceLocal}
          ocrResponse={ocrResponse}
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          onRedirect={onRedirect}
          refreshInvoice={refreshInvoice}
          addPaymentMethodRedirect={addPaymentMethodRedirect}
          height={height}
        />
      </Section>
    </Container>
  )
}

function InvoiceDocumentsUpload({ onFileUpload }: { onFileUpload: (fileReaderObj: string, file: File) => void }) {
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
          onFileUpload(fileReaderObj, acceptedFiles[0])
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
          className={`mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 ${
            isDragActive ? 'border-mercoa-primary' : 'border-gray-300'
          } px-6 py-10`}
          {...getRootProps()}
        >
          <div className="text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
            <div className="mt-4 flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white font-semibold text-mercoa-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-mercoa-primary focus-within:ring-offset-2 hover:text-indigo-500"
              >
                <span>Upload an invoice</span>
                <input {...getInputProps()} id="file-upload" name="file-upload" type="file" className="sr-only" />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-gray-600">PNG, JPG, PDF up to 10MB</p>
          </div>
        </div>
      )}
    </Dropzone>
  )
}

function InvoiceDocuments({
  documents,
  height,
}: {
  documents: Array<{ fileReaderObj: string; mimeType: string }>
  height: number
}) {
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState<number>(1)

  const useWidth = (target: any) => {
    const [width, setWidth] = useState<number>()

    useLayoutEffect(() => {
      setWidth(target.current.getBoundingClientRect().width)
    }, [target])

    useResizeObserver(target, (entry) => setWidth(entry.contentRect.width))
    return width
  }

  const wrapperDiv = useRef(null)
  const width = useWidth(wrapperDiv)

  const documentNavigation = (
    <div className="flex justify-center ">
      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
        <button
          type="button"
          onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}
          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        >
          <span className="sr-only">Previous</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {Array.from(new Array(numPages), (el, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setPageNumber(index + 1)}
            aria-current={pageNumber != index + 1 ? 'false' : 'page'}
            className={
              pageNumber != index + 1
                ? 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                : 'relative z-10 inline-flex items-center bg-mercoa-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mercoa-primary'
            }
          >
            {index + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages ?? 1))}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        >
          <span className="sr-only">Next</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>
    </div>
  )

  const documentView = (
    <div>
      {documents && documents.length > 0 && (
        <div ref={wrapperDiv}>
          {documents.map((document, i) => (
            <div key={i}>
              {document.mimeType === 'application/pdf' ? (
                <Document
                  loading={
                    <div
                      className="mt-2 flex w-full items-center justify-center rounded-md border shadow-lg"
                      style={{ height: '700px' }}
                    >
                      <LoadingSpinnerIcon />
                    </div>
                  }
                  file={document.fileReaderObj}
                  key={document.fileReaderObj}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                >
                  <Page
                    pageNumber={pageNumber}
                    className="m-0 w-full p-0 mt-2 rounded-md border shadow-lg"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={width}
                  />
                </Document>
              ) : (
                <img
                  src={document.fileReaderObj}
                  key={document.fileReaderObj}
                  onLoad={() => setNumPages(1)}
                  className="mt-2 rounded-md border shadow-lg"
                />
              )}

              {document.fileReaderObj.startsWith('http') && (
                <MercoaButton
                  type="button"
                  isEmphasized={false}
                  onClick={() => {
                    window.open(document.fileReaderObj, '_blank')
                  }}
                  className="mt-2"
                >
                  <span className="hidden xl:inline">
                    <ArrowDownTrayIcon className="-ml-1 mr-2 inline-flex h-5 w-5" /> Download Invoice
                  </span>
                  <span className="inline xl:hidden">Download</span>
                </MercoaButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="overflow-auto" style={{ height: `${height}px` }}>
      {documentNavigation}
      {documentView}
    </div>
  )
}

export function EditInvoiceForm({
  invoice,
  ocrResponse,
  uploadedImage,
  setUploadedImage,
  onRedirect,
  refreshInvoice,
  addPaymentMethodRedirect,
  height,
}: {
  invoice?: Mercoa.InvoiceResponse
  ocrResponse?: Mercoa.OcrResponse
  uploadedImage?: string
  setUploadedImage: (e?: string) => void
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  addPaymentMethodRedirect?: () => void
  height: number
}) {
  const mercoaSession = useMercoaSession()

  const [sourcePaymentMethods, setSourcePaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse>>([])
  const [paymentMethodSchemas, setPaymentMethodSchemas] = useState<Array<Mercoa.PaymentMethodSchemaResponse>>([])
  const [destinationPaymentMethods, setDestinationPaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse>>([])
  const [supportedCurrencies, setSupportedCurrencies] = useState<Array<Mercoa.CurrencyCode>>([])
  const [selectedVendor, setSelectedVendor] = useState<Mercoa.EntityResponse | undefined>(invoice?.vendor)
  const [selectedApprovers, setSelectedApprovers] = useState<
    (Mercoa.ApprovalSlotAssignment | undefined)[] | undefined
  >()
  const [entityMetadata, setEntityMetadata] = useState<Mercoa.EntityMetadataResponse[]>([])
  const [isSaving, setIsSaving] = useState<boolean>(false)

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

  let formCols = 'grid-cols-1'
  if (width && width > 300) {
    formCols = 'grid-cols-2'
  }
  if (width && width > 500) {
    formCols = 'grid-cols-3'
  }
  if (width && width > 700) {
    formCols = 'grid-cols-4'
  }
  if (width && width > 900) {
    formCols = 'grid-cols-5'
  }
  if (width && width > 1100) {
    formCols = 'grid-cols-6'
  }

  const schema = yup
    .object({
      amount: yup.number().positive().required().typeError('Please enter a valid number'),
      invoiceNumber: yup.string(),
      description: yup.string(),
      dueDate: yup.date().required('Please select a due date').typeError('Please select a due date'),
      deductionDate: yup.date().typeError('Please select a deduction date'),
      invoiceDate: yup.date().required('Please select an invoice date').typeError('Please select an invoice date'),
      approvers: yup
        .array()
        .of(
          yup.object({
            assignedUserId: yup.string().required(),
            approvalSlotId: yup.string().required(),
          }),
        )
        .length(invoice?.approvers.length ?? 0),
      lineItems: yup.array().of(
        yup.object({
          id: yup.string(),
          description: yup.string().required(),
          amount: yup.number().positive().required().typeError('Please enter a valid number'),
          quantity: yup.number().positive().required().typeError('Please enter a valid number'),
          unitPrice: yup.number().positive().required().typeError('Please enter a valid number'),
          metadata: yup.mixed().nullable(),
          glAccountId: yup.string(),
        }),
      ),
      currency: yup.string().required(),
      vendorId: yup.string().required(),
      vendorName: yup.string().required(),
      paymentDestinationId: yup.string(),
      paymentMethodDestinationType: yup.string(),
      paymentSourceId: yup.string().required(),
      paymentMethodSourceType: yup.string(),
      saveAsDraft: yup.boolean(),
      metadata: yup.mixed().nullable(),
    })
    .required()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    control,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      invoiceNumber: invoice?.invoiceNumber,
      amount: invoice?.amount,
      currency: invoice?.currency ?? 'USD',
      vendorId: invoice?.vendor?.id,
      vendorName: invoice?.vendor?.name,
      invoiceDate: invoice?.invoiceDate ? dayjs(invoice?.invoiceDate).toDate() : undefined,
      dueDate: invoice?.dueDate ? dayjs(invoice?.dueDate).toDate() : undefined,
      deductionDate: invoice?.dueDate ? subtractWeekdays(dayjs(invoice?.dueDate), 3).toDate() : undefined,
      lineItems: invoice?.lineItems ?? [],
      paymentDestinationId: invoice?.paymentDestination?.id,
      paymentMethodDestinationType: '',
      paymentSourceId: invoice?.paymentSource?.id,
      paymentMethodSourceType: '',
      description: invoice?.noteToSelf ?? '',
      saveAsDraft: false,
      metadata: JSON.stringify(invoice?.metadata ?? {}),
      approvers: invoice?.approvers
        ? invoice.approvers.map((approver) => ({
            approvalSlotId: approver.approvalSlotId,
            assignedUserId: approver.assignedUserId,
          }))
        : [],
    },
  })

  const amount = watch('amount')
  const dueDate = watch('dueDate')
  const currency = watch('currency')
  const vendorId = watch('vendorId')
  const vendorName = watch('vendorName')
  const paymentDestinationId = watch('paymentDestinationId')
  const paymentSourceId = watch('paymentSourceId')
  const approvers = watch('approvers')
  const metadata = watch('metadata')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  })

  useEffect(() => {
    setSelectedApprovers(
      invoice?.approvers.map((e) => ({
        assignedUserId: e.assignedUserId ?? '',
        approvalSlotId: e.approvalSlotId,
      })),
    )
  }, [invoice])

  // Get payment methods
  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id || !mercoaSession.client) return
    mercoaSession.client?.entity.paymentMethod.getAll(mercoaSession.entity?.id).then((resp) => {
      if (resp) {
        setSourcePaymentMethods(resp)
      }
    })
    mercoaSession.client?.paymentMethodSchema.getAll().then((resp: Mercoa.PaymentMethodSchemaResponse[]) => {
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
  }, [mercoaSession.client, mercoaSession.entity?.id, mercoaSession.token])

  // Get entity metadata
  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.metadata.getAll(mercoaSession.entity.id).then((resp) => {
      if (resp) setEntityMetadata(resp)
    })
  }, [mercoaSession.entity?.id, mercoaSession.refreshId, mercoaSession.token])

  // Reset currency dropdown
  useEffect(() => {
    if (supportedCurrencies.length > 0) {
      setValue('currency', invoice?.currency ?? supportedCurrencies[0])
    }
  }, [supportedCurrencies])

  // Get destination payment methods
  useEffect(() => {
    if (!mercoaSession.token || !vendorId) return
    mercoaSession.client?.entity.paymentMethod.getAll(vendorId).then((resp) => {
      if (resp) {
        setDestinationPaymentMethods(resp)
      }
    })
  }, [mercoaSession.client, vendorId, mercoaSession.token])

  // Auto calculate deduction date based on due date
  useEffect(() => {
    if (dueDate)
      setValue('deductionDate', dayjs.max(subtractWeekdays(dayjs(dueDate), 3), dayjs().add(1, 'day'))?.toDate())
  }, [dueDate])

  // OCR Merge
  useEffect(() => {
    if (!ocrResponse) return
    if (ocrResponse.invoice.amount) setValue('amount', ocrResponse.invoice.amount)
    setValue('invoiceNumber', ocrResponse.invoice.invoiceNumber)
    if (ocrResponse.invoice.invoiceDate) setValue('invoiceDate', ocrResponse.invoice.invoiceDate)
    if (ocrResponse.invoice.dueDate) setValue('dueDate', ocrResponse.invoice.dueDate)
    setValue('deductionDate', ocrResponse.invoice.deductionDate)
    if (ocrResponse.invoice.currency) setValue('currency', ocrResponse.invoice.currency)
    // setValue('vendorName', ocrResponse.vendor.name)
    // setValue('vendorId', ocrResponse.vendor.id)
    if (ocrResponse.invoice.lineItems)
      setValue(
        'lineItems',
        ocrResponse.invoice.lineItems.map((lineItem) => ({
          description: lineItem.description ?? '',
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

    if (!selectedVendor) {
      if (ocrResponse.vendor.id === 'new' && mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
        console.log('new vendor creation disabled')
      } else if (ocrResponse.vendor.id) {
        console.log('setting selected vendor', ocrResponse.vendor)
        setSelectedVendor(ocrResponse.vendor)
      }
    }
  }, [ocrResponse, selectedVendor])

  const hasAssignedAllApprovers = !!invoice?.approvers.every((approver) => approver.assignedUserId)

  let approversAssigned = false
  if (invoice?.approvers) {
    approversAssigned = !!approvers?.every((approver) => !!approver)
  } else {
    approversAssigned = !!invoice?.approvers.every((approver) => approver.assignedUserId)
  }

  let canInvoiceBeNew =
    !!amount && !!dueDate && !!currency && !!vendorId && vendorId !== 'new' && !!paymentSourceId && !!vendorName

  if (!mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
    canInvoiceBeNew =
      canInvoiceBeNew &&
      !!selectedVendor?.email &&
      !!(
        selectedVendor.accountType === 'individual' ||
        (selectedVendor.accountType === 'business' &&
          (!!selectedVendor.profile.business?.website || !!selectedVendor.profile.business?.description))
      )
  }

  const missingDisbursement =
    invoice?.status === Mercoa.InvoiceStatus.Approved &&
    canInvoiceBeNew &&
    (!paymentDestinationId || paymentDestinationId === 'new')

  const canInvoiceBeScheduled =
    canInvoiceBeNew && invoice?.status === Mercoa.InvoiceStatus.Approved && paymentDestinationId

  let nextInvoiceState: Mercoa.InvoiceStatus = Mercoa.InvoiceStatus.Draft
  if (canInvoiceBeScheduled) {
    nextInvoiceState = Mercoa.InvoiceStatus.Scheduled
  } else if (missingDisbursement) {
    nextInvoiceState = Mercoa.InvoiceStatus.Approved
  } else if (invoice?.status === Mercoa.InvoiceStatus.New) {
    nextInvoiceState = Mercoa.InvoiceStatus.Approved
  } else if (canInvoiceBeNew && approversAssigned) {
    nextInvoiceState = Mercoa.InvoiceStatus.New
  }

  const saveInvoice = async (data: any) => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    //setIsSaving(true)
    const invoiceData: Mercoa.InvoiceRequest = {
      status: data.saveAsDraft ? Mercoa.InvoiceStatus.Draft : nextInvoiceState,
      amount: Number(data.amount),
      currency: data.currency,
      invoiceDate: data.invoiceDate,
      deductionDate: data.deductionDate,
      dueDate: data.dueDate,
      invoiceNumber: data.invoiceNumber,
      noteToSelf: data.description,
      payerId: mercoaSession.entity?.id,
      paymentSourceId: data.paymentSourceId,
      approvers: data.approvers,
      ...(data.vendorId !== 'new' && {
        vendorId: data.vendorId,
      }),
      paymentDestinationId: data.paymentDestinationId,
      lineItems: data.lineItems.map((lineItem: any) => ({
        ...(lineItem.id && { id: lineItem.id }),
        description: lineItem.description,
        amount: Number(lineItem.amount),
        quantity: Number(lineItem.quantity),
        unitPrice: Number(lineItem.unitPrice),
        metadata: lineItem.metadata,
        currency: data.currency ?? 'USD',
        glAccountId: lineItem.glAccountId,
      })),
      metadata: JSON.parse(data.metadata) as Record<string, string>,
      uploadedImage: uploadedImage,
      creatorEntityId: mercoaSession.entity?.id,
    }
    console.log({ data, invoiceData })

    // Create new vendor payment method if needed
    if (data.paymentMethodDestinationType && (!data.paymentDestinationId || data.paymentDestinationId === 'new')) {
      const paymentMethodDestinationType = data.paymentMethodDestinationType
      const type = data.paymentMethodDestinationType.startsWith('cpms_')
        ? 'custom'
        : (data.paymentMethodDestinationType as Mercoa.PaymentMethodType)

      let pm: Mercoa.PaymentMethodRequest | undefined
      if (type === 'bankAccount') {
        pm = {
          type: type,
          accountNumber: (data as Mercoa.BankAccountRequest).accountNumber,
          routingNumber: (data as Mercoa.BankAccountRequest).routingNumber,
          accountType: (data as Mercoa.BankAccountRequest).accountType,
          bankName: (data as Mercoa.BankAccountRequest).bankName,
        }
      } else if (type === 'check') {
        pm = {
          type: type,
          ...(data as Mercoa.CheckRequest),
        }
      } else if (type === 'custom') {
        const filtered: Record<string, string> = {}
        Object.entries(data as Mercoa.BankAccountRequest | Mercoa.CheckRequest | Record<string, string>).forEach(
          ([key, value]) => {
            if (key.startsWith('~cpm~~')) {
              value.forEach((v: any) => {
                filtered[v.name] = `${filtered[v.name] ?? v.value}`
              })
            }
          },
        )
        pm = {
          type: type,
          foreignId: Math.random().toString(36).substring(7),
          schemaId: paymentMethodDestinationType,
          data: filtered,
        }
      }

      if (pm) {
        const resp = await mercoaSession.client?.entity.paymentMethod.create(data.vendorId, pm)
        if (resp) {
          invoiceData.paymentDestinationId = resp.id
        }
      }
    }

    if (invoiceData.status !== Mercoa.InvoiceStatus.Draft) {
      if (invoiceData.approvers?.length !== invoice?.approvers.length) {
        toast.error('Please assign all approvers for this invoice.')
        setIsSaving(false)
        return
      }
    }
    console.log('invoiceData before API call: ', { invoiceData })
    if (invoice) {
      mercoaSession.client?.invoice
        .update(invoice.id, {
          ...invoiceData,
          creatorUserId: invoice.creatorUser?.id ?? mercoaSession.user?.id,
        })
        .then((resp) => {
          if (resp) {
            console.log('invoice/update API response: ', resp)
            setUploadedImage(undefined) // reset uploadedImage state so it is not repeatedly uploaded on subsequent saves that occur w/o a page refresh
            toast.success('Invoice updated')
            refreshInvoice(resp.id)
            setIsSaving(false)
          }
        })
        .catch((e) => {
          console.log(e.statusCode)
          console.log(e.body)
          toast.error(`There was an error updating the invoice.\n Error: ${e.body}`)
          setIsSaving(false)
        })
    } else {
      mercoaSession.client?.invoice
        .create({
          ...invoiceData,
          creatorUserId: mercoaSession.user?.id,
        })
        .then((resp) => {
          if (resp) {
            console.log('invoice/create API response: ', resp)
            toast.success('Invoice created')
            setUploadedImage(undefined) // reset uploadedImage state so it is not repeatedly uploaded on subsequent saves that occur w/o a page refresh
            refreshInvoice(resp.id)
            onRedirect(resp)
            setIsSaving(false)
          }
        })
        .catch((e) => {
          console.log(e.statusCode)
          console.log(e.body)
          toast.error(`'There was an error creating the invoice.\n Error: ${e.body}`)
          toast.error(
            'There was an error creating the invoice. Make sure the invoice number is unique for this vendor and try again.',
          )
          setIsSaving(false)
        })
    }
  }

  const handleApproverSelect = (
    index: number,
    slot: Mercoa.ApprovalSlotAssignment,
    formOnChange: (val: any) => void,
  ) => {
    const newApprovers = selectedApprovers?.map((approver, i) => {
      if (i === index) {
        return slot
      } else {
        return approver
      }
    })
    setSelectedApprovers(newApprovers)
    formOnChange(newApprovers)
  }

  async function getVendorLink() {
    if (!invoice?.id) return
    const url = await mercoaSession.client?.invoice.getVendorLink(invoice.id)
    if (url) {
      navigator.clipboard.writeText(url).then(
        function () {
          toast.info('Link Copied')
        },
        function (err) {
          toast.error('There was an issue generating the vendor link. Please refresh and try again.')
        },
      )
    } else {
      toast.error('There was an issue generating the vendor link. Please refresh and try again.')
    }
  }

  return (
    <div style={{ height: `${height}px` }} className="overflow-auto pr-2 pb-10" ref={wrapperDiv}>
      <h2 className="text-base font-semibold leading-7 text-gray-900">
        Edit Invoice {invoice && <InvoiceStatusPill invoice={invoice} />}
      </h2>
      <p className="mb-3 text-xs leading-6 text-gray-400 select-all">{invoice?.id}</p>

      {/*  GRAY BORDER  */}
      <div className="border-b border-gray-900/10 mb-4" />

      {/*  VENDOR SEARCH */}
      <div className="sm:col-span-3">
        <label htmlFor="vendor-name" className="block text-lg font-medium leading-6 text-gray-700">
          Vendor
        </label>

        <div className="mt-2 flex items-center justify-left">
          <CounterpartySearch
            type="payee"
            onSelect={(vendor) => {
              console.log({ vendor })
              setSelectedVendor(vendor)
              setValue('vendorId', vendor?.id ?? undefined, { shouldTouch: true, shouldDirty: true })
              setValue('vendorName', vendor?.name ?? undefined, { shouldTouch: true, shouldDirty: true })
            }}
            counterparty={selectedVendor}
          />
        </div>
      </div>

      {/*  GRAY BORDER  */}
      <div className="border-b border-gray-900/10 pb-6" />

      <form
        onSubmit={handleSubmit(saveInvoice)}
        className={`${
          vendorId === 'new' && !mercoaSession.iframeOptions?.options?.vendors?.disableCreation
            ? 'opacity-25 pointer-events-none'
            : ''
        }
        ${formCols}
        mt-6 grid gap-x-6 gap-y-4`}
      >
        <label htmlFor="vendor-name" className="block text-lg font-medium leading-6 text-gray-700 mb-2 col-span-full">
          Invoice Details
        </label>

        {/*  INVOICE NUMBER */}
        <div className="sm:col-span-1">
          <div className="flex justify-between">
            <label
              htmlFor="invoiceNumber"
              className="block text-sm font-medium leading-6 text-gray-900 whitespace-nowrap"
            >
              Invoice #
            </label>
            <span className="text-xs leading-6 text-gray-500 ml-1">Optional</span>
          </div>

          <div className="mt-2">
            <input
              type="text"
              {...register('invoiceNumber')}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6"
              placeholder="#1024"
            />
          </div>
        </div>

        {/*  INVOICE AMOUNT */}
        <div className="sm:col-span-1">
          <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">
            Amount
          </label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">{currencyCodeToSymbol(currency)}</span>
            </div>
            <input
              type="text"
              {...register('amount')}
              className={`block w-full rounded-md border-0 py-1.5 pr-[4.4rem] text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6
                ${currencyCodeToSymbol(currency).length > 1 ? 'pl-12' : 'pl-6'}`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <label htmlFor="currency" className="sr-only">
                Currency
              </label>
              <select
                {...register('currency')}
                className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm"
              >
                {supportedCurrencies.map((option: Mercoa.CurrencyCode, index: number) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.amount?.message && <p className="text-sm text-red-500">{errors.amount?.message.toString()}</p>}
        </div>

        {/*  INVOICE DATE */}
        <div className="col-span-1">
          <label htmlFor="invoiceDate" className="block text-sm font-medium leading-6 text-gray-900">
            Invoice Date
          </label>
          <div className="relative mt-2">
            <Controller
              control={control}
              name="invoiceDate"
              render={({ field }) => (
                <DatePicker
                  className="block w-full rounded-md border-gray-300 focus:border-mercoa-primary focus:ring-mercoa-primary sm:text-sm"
                  placeholderText="Select invoice date"
                  onChange={(date) => field.onChange(date)}
                  selected={field.value}
                />
              )}
            />
          </div>
          {errors.invoiceDate?.message && (
            <p className="text-sm text-red-500">{errors.invoiceDate?.message.toString()}</p>
          )}
        </div>

        {/*  DUE DATE */}
        <div className="col-span-1">
          <label htmlFor="dueDate" className="block text-sm font-medium leading-6 text-gray-900">
            Due Date
          </label>
          <div className="relative mt-2">
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  className="block w-full rounded-md border-gray-300 focus:border-mercoa-primary focus:ring-mercoa-primary sm:text-sm"
                  placeholderText="Select due date"
                  onChange={(date) => field.onChange(date)}
                  selected={field.value}
                />
              )}
            />
          </div>
          {errors.dueDate?.message && <p className="text-sm text-red-500">{errors.dueDate?.message.toString()}</p>}
        </div>

        {/*  SCHEDULED PAYMENT DATE */}
        <div className="col-span-1">
          <label
            htmlFor="deductionDate"
            className="block text-sm font-medium leading-6 text-gray-900 whitespace-nowrap"
          >
            Scheduled Payment Date
          </label>
          <div className="relative mt-2">
            <Controller
              control={control}
              name="deductionDate"
              render={({ field }) => (
                <DatePicker
                  className="block w-full rounded-md border-gray-300 focus:border-mercoa-primary focus:ring-mercoa-primary sm:text-sm"
                  placeholderText="Select Payment Date"
                  onChange={(date) => field.onChange(date)}
                  selected={field.value}
                  minDate={dayjs().add(1, 'day').toDate()}
                  filterDate={isWeekday}
                />
              )}
            />
          </div>
        </div>

        {/*  DESCRIPTION */}
        <div className="col-span-full">
          <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 ">
            Description
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6"
              defaultValue={''}
            />
          </div>
        </div>

        {/*  GRAY BORDER  */}
        <div className="border-b border-gray-900/10 pb-6 col-span-full" />

        {/*  LINE ITEMS */}
        <div className="col-span-full">
          <LineItems
            lineItems={fields}
            append={append}
            remove={remove}
            register={register}
            currency={currency as Mercoa.CurrencyCode}
            watch={watch}
            hasDocument={!!uploadedImage || !!invoice?.hasDocuments}
            paymentDestination={destinationPaymentMethods.find((pm) => pm.id === paymentDestinationId)}
            paymentSource={sourcePaymentMethods.find((pm) => pm.id === paymentSourceId)}
            setValue={setValue}
            entityMetadata={entityMetadata}
            width={width}
          />
        </div>

        {/*  GRAY BORDER  */}
        <div className="border-b border-gray-900/10 pb-6 col-span-full" />

        {/*  METADATA  */}
        {(mercoaSession.organization?.metadataSchema?.length ?? 0) > 0 && (
          <label htmlFor="vendor-name" className="block text-lg font-medium leading-6 text-gray-700 mb-2 col-span-full">
            Additional Invoice Details
          </label>
        )}
        {mercoaSession.organization?.metadataSchema?.map((schema) => {
          const md = JSON.parse((metadata as string) ?? {}) as Record<string, string>
          const value = md?.[schema.key]
          return (
            <MetadataSelection
              key={schema.key}
              entityMetadata={entityMetadata.find((m) => m.key === schema.key)}
              schema={schema}
              value={value}
              hasDocument={!!uploadedImage || !!invoice?.hasDocuments}
              paymentDestination={destinationPaymentMethods.find((pm) => pm.id === paymentDestinationId)}
              paymentSource={sourcePaymentMethods.find((pm) => pm.id === paymentSourceId)}
              setValue={(value: string | string[]) => {
                // combobox with multiple will return an array, but metadata needs a string, so join it with commas
                if (Array.isArray(value)) {
                  value = value.join(',')
                }
                const newMetadata = JSON.parse((metadata as string) ?? {}) as Record<string, string>
                newMetadata[schema.key] = `${value}`
                setValue('metadata', JSON.stringify(newMetadata), { shouldDirty: true, shouldTouch: true })
              }}
            />
          )
        })}

        {/*  GRAY BORDER  */}
        <div className="border-b border-gray-900/10 pb-6 col-span-full" />

        {/*  PAYMENT SOURCE */}
        <div className="pb-6 col-span-full">
          <h2 className="block text-lg font-medium leading-6 text-gray-700 mt-5">How do you want to pay?</h2>
          {addPaymentMethodRedirect &&
          sourcePaymentMethods.length < 1 &&
          mercoaSession.iframeOptions?.options?.entity?.enableMercoaPayments ? (
            <MercoaButton isEmphasized type="button" onClick={addPaymentMethodRedirect} size="md">
              Add Payment Method
            </MercoaButton>
          ) : (
            <SelectPaymentSource
              paymentMethods={sourcePaymentMethods}
              paymentMethodSchemas={paymentMethodSchemas}
              currentPaymentMethodId={invoice?.paymentSourceId}
              isSource
              register={register}
              watch={watch}
              errors={errors}
              control={control}
              setValue={setValue}
              setError={setError}
              clearErrors={clearErrors}
            />
          )}
        </div>

        {/*  PAYMENT DESTINATION  */}
        {vendorName && (
          <div className="border-b border-gray-900/10 pb-16 col-span-full">
            <h2 className="block text-lg font-medium leading-6 text-gray-700 mt-5">
              How does <span className="text-gray-800 underline">{vendorName}</span> want to get paid?
            </h2>
            <SelectPaymentSource
              paymentMethods={destinationPaymentMethods}
              paymentMethodSchemas={paymentMethodSchemas}
              currentPaymentMethodId={invoice?.paymentDestinationId}
              isDestination
              vendorName={vendorName}
              vendorId={vendorId}
              register={register}
              watch={watch}
              errors={errors}
              control={control}
              setValue={setValue}
              setError={setError}
              clearErrors={clearErrors}
            />
            {invoice?.id &&
              invoice?.status != Mercoa.InvoiceStatus.Canceled &&
              invoice?.status != Mercoa.InvoiceStatus.Archived &&
              !mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
                <MercoaButton
                  isEmphasized={false}
                  onClick={getVendorLink}
                  className="inline-flex text-sm float-right mt-3"
                  type="button"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 md:mr-2" />{' '}
                  <span className="hidden md:inline-block">Get Payment Acceptance Link</span>
                </MercoaButton>
              )}
          </div>
        )}

        {/* APPROVALS */}
        <div className="col-span-full">
          {invoice?.approvers && invoice.approvers.length > 0 && selectedApprovers && (
            <>
              {!hasAssignedAllApprovers && (
                <Controller
                  control={control}
                  name="approvers"
                  render={({ field: { onChange } }) => (
                    <ApproversSelection
                      approverSlots={invoice.approvers}
                      selectedApprovers={selectedApprovers}
                      setSelectedApprovers={handleApproverSelect}
                      hasError={!!errors.approvers?.message}
                      formOnChange={onChange}
                    />
                  )}
                />
              )}
              {hasAssignedAllApprovers && (
                <ApproversAction
                  approverSlots={invoice.approvers}
                  invoiceId={invoice.id}
                  invoiceStatus={invoice.status}
                  refreshInvoice={refreshInvoice}
                />
              )}
              {errors.approvers && <p className="text-sm text-red-500">Please select all approvers</p>}
            </>
          )}
        </div>

        {/* ACTION BUTTONS */}
        {invoice?.status != Mercoa.InvoiceStatus.Canceled &&
          invoice?.status != Mercoa.InvoiceStatus.Archived &&
          invoice?.status != Mercoa.InvoiceStatus.Paid && (
            <div className="absolute bottom-0 right-0 w-full bg-white z-10">
              <div className="container mx-auto flex flex-row-reverse items-center gap-2 py-3 px-4 sm:px-6 lg:px-8">
                {invoice?.status != Mercoa.InvoiceStatus.Scheduled && (
                  <>
                    <SaveInvoiceButton
                      nextInvoiceState={nextInvoiceState}
                      setValue={setValue}
                      approvers={invoice?.approvers}
                      approverSlots={approvers}
                      isSaving={isSaving}
                    />
                    {nextInvoiceState === 'NEW' && invoice?.status !== 'NEW' && (
                      <MercoaButton
                        isEmphasized={false}
                        onClick={() => setValue('saveAsDraft', true)}
                        disabled={isSaving}
                      >
                        Save Draft
                      </MercoaButton>
                    )}
                  </>
                )}
                {(invoice?.status === Mercoa.InvoiceStatus.Scheduled ||
                  invoice?.status === Mercoa.InvoiceStatus.Pending) &&
                  invoice?.paymentDestination?.type === Mercoa.PaymentMethodType.OffPlatform && (
                    <MercoaButton
                      disabled={isSaving}
                      isEmphasized={true}
                      onClick={() => {
                        if (!invoice?.id) return
                        setIsSaving(true)
                        if (confirm('Are you sure you want to mark this invoice as paid? This cannot be undone.')) {
                          mercoaSession.client?.invoice
                            .update(invoice?.id, { status: Mercoa.InvoiceStatus.Paid })
                            .then((resp) => {
                              if (resp) {
                                console.log(resp)
                                toast.success('Invoice marked as paid')
                                refreshInvoice(resp.id)
                              }
                              setIsSaving(false)
                            })
                        }
                      }}
                    >
                      Mark as Paid
                    </MercoaButton>
                  )}
                <CancelPayment invoice={invoice} refreshInvoice={refreshInvoice} onRedirect={onRedirect} />
              </div>
            </div>
          )}
      </form>
      {invoice?.id && invoice.id !== 'new' ? (
        <InvoiceComments invoice={invoice} refreshInvoice={refreshInvoice} />
      ) : (
        <div className="mt-10" />
      )}
    </div>
  )
}

function SaveInvoiceButton({
  nextInvoiceState,
  setValue,
  approverSlots,
  approvers,
  isSaving,
}: {
  nextInvoiceState: string
  setValue: Function
  approverSlots?: { approvalSlotId: string; assignedUserId: string | undefined }[]
  approvers?: Mercoa.ApprovalSlot[]
  isSaving: boolean
}) {
  let text = 'Next'
  switch (nextInvoiceState) {
    case Mercoa.InvoiceStatus.Draft:
      text = 'Save as Draft'
      break
    case Mercoa.InvoiceStatus.New:
      if (approvers && approvers.length > 0) {
        text = 'Submit for Approval'
      } else {
        text = 'Next'
      }
      break
    case Mercoa.InvoiceStatus.Approved:
      text = 'Missing Vendor Payment Details'
      break
    case Mercoa.InvoiceStatus.Scheduled:
      text = 'Schedule Payment'
      break
  }

  if (
    nextInvoiceState === Mercoa.InvoiceStatus.Approved &&
    approvers &&
    approvers.length > 0 &&
    approvers.every((e) => e.assignedUserId) &&
    !approvers.every((e) => e.action === Mercoa.ApproverAction.Approve)
  ) {
    return <span className="text-center text-gray-800 font-medium p-3 rounded-md bg-gray-50">Waiting for approval</span>
  }
  if (
    text === 'Submit for Approval' &&
    approverSlots &&
    approverSlots.length > 0 &&
    !approverSlots.every((e) => e.assignedUserId)
  ) {
    return (
      <MercoaButton type="submit" isEmphasized onClick={() => setValue('saveAsDraft', false)} disabled>
        Please assign all approvers
      </MercoaButton>
    )
  }
  return (
    <MercoaButton type="submit" isEmphasized onClick={() => setValue('saveAsDraft', false)} disabled={isSaving}>
      {text}
    </MercoaButton>
  )
}

function CancelPayment({
  invoice,
  refreshInvoice,
  onRedirect,
}: {
  invoice: Mercoa.InvoiceResponse | undefined
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
}) {
  const mercoaSession = useMercoaSession()
  const [showCancelInvoice, setShowCancelInvoice] = useState(false)
  const cancelButtonRef = useRef(null)

  function cancel() {
    if (!invoice?.id) return
    if (invoice.status === Mercoa.InvoiceStatus.Draft) {
      mercoaSession.client?.invoice.delete(invoice.id)
      toast.success('Invoice deleted')
      onRedirect(undefined)
    } else if (invoice.status === Mercoa.InvoiceStatus.New || invoice.status === Mercoa.InvoiceStatus.Approved) {
      mercoaSession.client?.invoice.update(invoice.id, { status: Mercoa.InvoiceStatus.Archived }).then((resp) => {
        if (resp) {
          console.log(resp)
          toast.success('Invoice archived')
          refreshInvoice(resp.id)
        }
      })
    } else if (invoice.status === Mercoa.InvoiceStatus.Scheduled) {
      mercoaSession.client?.invoice.update(invoice.id, { status: Mercoa.InvoiceStatus.Canceled }).then((resp) => {
        if (resp) {
          console.log(resp)
          toast.success('Invoice canceled')
          refreshInvoice(resp.id)
        }
      })
    }
  }

  let buttonText = 'Cancel Payment',
    promptText = 'Are you sure you want to cancel this invoice? This cannot be undone and the payment will be canceled.'
  if (invoice?.status === Mercoa.InvoiceStatus.Draft) {
    buttonText = 'Delete Invoice'
    promptText = 'Are you sure you want to delete this invoice? This cannot be undone.'
  } else if (invoice?.status === Mercoa.InvoiceStatus.New || invoice?.status === Mercoa.InvoiceStatus.Approved) {
    buttonText = 'Archive Invoice'
    promptText = 'Are you sure you want to archive this invoice?'
  }

  const preventDeletionStatuses: (Mercoa.InvoiceStatus | undefined)[] = [
    Mercoa.InvoiceStatus.Pending,
    Mercoa.InvoiceStatus.Paid,
    Mercoa.InvoiceStatus.Canceled,
    Mercoa.InvoiceStatus.Archived,
    undefined,
  ]

  return (
    <>
      {!preventDeletionStatuses.includes(invoice?.status) && (
        <>
          <MercoaButton type="button" isEmphasized={false} color="red" onClick={() => setShowCancelInvoice(true)}>
            {buttonText}
          </MercoaButton>
          <Transition.Root show={showCancelInvoice} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-10"
              onClose={() => setShowCancelInvoice(false)}
              initialFocus={cancelButtonRef}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
              </Transition.Child>

              <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  >
                    <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                            {buttonText}
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">{promptText}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                          onClick={cancel}
                        >
                          {buttonText}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={() => setShowCancelInvoice(false)}
                          ref={cancelButtonRef}
                        >
                          Never mind
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition.Root>
        </>
      )}
    </>
  )
}

function SelectPaymentSource({
  paymentMethods,
  paymentMethodSchemas,
  register,
  errors,
  watch,
  control,
  setValue,
  setError,
  clearErrors,
  isSource,
  isDestination,
  vendorName,
  vendorId,
  currentPaymentMethodId,
}: {
  paymentMethods: Array<Mercoa.PaymentMethodResponse>
  paymentMethodSchemas: Array<Mercoa.PaymentMethodSchemaResponse>
  register: Function
  errors: any
  watch: Function
  control: any
  setValue: Function
  setError: Function
  clearErrors: Function
  isSource?: boolean
  isDestination?: boolean
  vendorName?: string
  vendorId?: string
  currentPaymentMethodId?: string
}) {
  let paymentMethodTypeKey = 'paymentMethodSourceType'
  let sourceOrDestination = 'paymentSourceId'
  if (isDestination) {
    paymentMethodTypeKey = 'paymentMethodDestinationType'
    sourceOrDestination = 'paymentDestinationId'
  }
  const mercoaSession = useMercoaSession()

  const availableTypes: Array<{ key: string; value: string }> = []

  if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'bankAccount')) {
    availableTypes.push({ key: 'bankAccount', value: 'Bank Account' })
  }
  if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'card')) {
    availableTypes.push({ key: 'card', value: 'Card' })
  }
  paymentMethods.forEach((paymentMethod) => {
    if (paymentMethod.type === 'custom') {
      if (availableTypes.some((type) => type.key === paymentMethod.schemaId)) return // skip if already added
      availableTypes.push({ key: paymentMethod.schemaId ?? '', value: paymentMethod.schema.name ?? '' })
    }
  })

  if (isDestination) {
    mercoaSession.organization?.paymentMethods?.backupDisbursements.forEach((backupDisbursement) => {
      if (!backupDisbursement.active) return
      // skip if already added
      if (
        availableTypes.some((type) => {
          if (type.key === backupDisbursement.type) return true
          if (backupDisbursement.type === 'custom') {
            const schema = paymentMethodSchemas.find((e) => e.id == backupDisbursement.name)
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
          value: paymentMethodSchemas.find((e) => e.id == backupDisbursement.name)?.name ?? 'Other',
        })
    })
  }

  const selectedType = watch(paymentMethodTypeKey)
  const paymentId = watch(sourceOrDestination)

  // set a default payment method type
  useEffect(() => {
    if (currentPaymentMethodId) {
      const paymentMethod = paymentMethods.find((paymentMethod) => paymentMethod.id === currentPaymentMethodId)
      if (paymentMethod) {
        if (paymentMethod.type === 'custom') setValue(paymentMethodTypeKey, paymentMethod.schemaId)
        else setValue(paymentMethodTypeKey, paymentMethod.type)
        return
      }
    }

    // Check for default payment method
    if (isSource) {
      const defaultPm = paymentMethods.find((e) => e.isDefaultSource)
      if (defaultPm) {
        setValue(paymentMethodTypeKey, defaultPm.type)
        return
      }
    }

    if (isDestination) {
      const defaultPm = paymentMethods.find((e) => e.isDefaultDestination)
      if (defaultPm) {
        setValue(paymentMethodTypeKey, defaultPm.type)
        return
      }
    }

    if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'bankAccount')) {
      setValue(paymentMethodTypeKey, 'bankAccount')
    } else if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'card')) {
      setValue(paymentMethodTypeKey, 'card')
    } else if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'custom')) {
      let cpm: Mercoa.PaymentMethodResponse | undefined = paymentMethods.find(
        (paymentMethod) => paymentMethod.type === 'custom',
      )

      // Typeguard to calm TS
      if (cpm?.type === 'custom') {
        setValue(paymentMethodTypeKey, cpm?.schemaId)
      }
    }
  }, [paymentMethods])

  // set a default payment method
  useEffect(() => {
    // Check for default payment method
    if (isSource) {
      const defaultPm = paymentMethods.find((e) => e.isDefaultSource)
      if (defaultPm) {
        setValue(sourceOrDestination, defaultPm.id)
        return
      }
    }

    if (isDestination) {
      const defaultPm = paymentMethods.find((e) => e.isDefaultDestination)
      if (defaultPm) {
        setValue(sourceOrDestination, defaultPm.id)
        return
      }
    }

    if (currentPaymentMethodId) {
      const paymentMethod = paymentMethods.find((paymentMethod) => paymentMethod.id === currentPaymentMethodId)
      if (paymentMethod) {
        setValue(sourceOrDestination, paymentMethod.id)
        return
      }
    }

    if (selectedType === 'bankAccount') {
      setValue(sourceOrDestination, paymentMethods.find((paymentMethod) => paymentMethod.type === 'bankAccount')?.id)
    } else if (selectedType === 'card') {
      setValue(sourceOrDestination, paymentMethods.find((paymentMethod) => paymentMethod.type === 'card')?.id)
    } else {
      setValue(
        sourceOrDestination,
        paymentMethods.find(
          (paymentMethod) => paymentMethod.type === 'custom' && paymentMethod.schemaId === selectedType,
        )?.id,
      )
    }
  }, [selectedType, paymentMethods])

  // For offline payments, we need to set the correct payment method id automatically
  useEffect(() => {
    if (!isDestination) return
    if (!vendorId) return
    if (selectedType !== Mercoa.PaymentMethodType.OffPlatform) return

    const existingOffPlatformPaymentMethod = paymentMethods.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.OffPlatform,
    )
    if (existingOffPlatformPaymentMethod) {
      setValue(sourceOrDestination, existingOffPlatformPaymentMethod.id)
    } else {
      // if there is no off platform payment method, we need to create one
      mercoaSession.client?.entity.paymentMethod
        .create(vendorId, {
          type: Mercoa.PaymentMethodType.OffPlatform,
        })
        .then((resp) => {
          if (resp) {
            setValue(sourceOrDestination, resp.id)
          }
        })
    }
  }, [isDestination, vendorId, selectedType])

  return (
    <div className="mt-4">
      <MercoaCombobox
        options={availableTypes.map((type) => ({ value: type, disabled: false }))}
        onChange={(selected) => {
          setValue(paymentMethodTypeKey, selected.key)
        }}
        value={availableTypes.find((type) => type.key === selectedType)}
        displayIndex="value"
      />
      {selectedType && selectedType != Mercoa.PaymentMethodType.OffPlatform && (
        <select
          {...register(sourceOrDestination)}
          className="block w-full rounded-md border-gray-300 focus:border-mercoa-primary focus:ring-mercoa-primary sm:text-sm mt-4"
        >
          {paymentMethods
            ?.filter((paymentMethod) => {
              if (selectedType === Mercoa.PaymentMethodType.BankAccount)
                return paymentMethod.type === Mercoa.PaymentMethodType.BankAccount
              if (selectedType === Mercoa.PaymentMethodType.Card)
                return paymentMethod.type === Mercoa.PaymentMethodType.Card
              if (paymentMethod.type === Mercoa.PaymentMethodType.Custom) return paymentMethod.schemaId === selectedType
            })
            .map((paymentMethod) => (
              <option key={paymentMethod.id} value={paymentMethod.id}>
                {paymentMethod.type === Mercoa.PaymentMethodType.BankAccount && (
                  <>
                    <BuildingLibraryIcon className="h-5 w-5" aria-hidden="true" />
                    {paymentMethod.accountName ? `${paymentMethod.accountName} - ` : ''}
                    {paymentMethod.bankName} ••••
                    {String(paymentMethod.accountNumber).slice(-4)}
                  </>
                )}
                {paymentMethod.type === Mercoa.PaymentMethodType.Card && (
                  <>
                    <CreditCardIcon className="h-5 w-5" aria-hidden="true" />
                    {paymentMethod.cardBrand} ••••{paymentMethod.lastFour}
                  </>
                )}
                {paymentMethod.type === Mercoa.PaymentMethodType.Custom && (
                  <>
                    <BuildingLibraryIcon className="h-5 w-5" aria-hidden="true" />
                    {findCustomPaymentMethodAccountNameAndNumber(paymentMethod).accountName}{' '}
                    {findCustomPaymentMethodAccountNameAndNumber(paymentMethod).accountNumber
                      ? `••••${String(findCustomPaymentMethodAccountNameAndNumber(paymentMethod).accountNumber).slice(
                          -4,
                        )}`
                      : ''}
                  </>
                )}
              </option>
            ))}
          {isDestination &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && <option value={'new'}>Add New</option>}
        </select>
      )}
      {paymentId === 'new' && (
        <div className="mt-2">
          {selectedType === 'bankAccount' && (
            <AddBankAccountForm
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              setError={setError}
              clearErrors={clearErrors}
            />
          )}
          {selectedType === 'check' && <AddCheckForm register={register} />}
          {selectedType.startsWith('cpms_') && (
            <AddCustomPaymentMethodForm
              register={register}
              control={control}
              schema={paymentMethodSchemas?.find((e) => e.id === selectedType) as Mercoa.PaymentMethodSchemaResponse}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Approvers

function ApproversSelection({
  approverSlots,
  selectedApprovers,
  setSelectedApprovers,
  hasError,
  formOnChange,
}: {
  approverSlots: Mercoa.ApprovalSlot[]
  selectedApprovers: (Mercoa.ApprovalSlotAssignment | undefined)[]
  setSelectedApprovers: (
    slotIndex: number,
    approver: Mercoa.ApprovalSlotAssignment,
    formOnChange: (val: any) => void,
  ) => void
  hasError: boolean
  formOnChange: (val: any) => void
}) {
  const mercoaSession = useMercoaSession()

  const filterApproverOptions = (
    approverSlotIndex: number,
    eligibleRoles: string[],
    eligibleUserIds: Mercoa.EntityUserId[],
  ) => {
    if (!Array.isArray(eligibleRoles) && !Array.isArray(eligibleUserIds)) return []

    const users: Mercoa.EntityUserResponse[] = mercoaSession.users.filter((user) => {
      if (user.roles.some((role) => eligibleRoles.includes(role))) return true
      if (eligibleUserIds.some((eligibleId) => user.id === eligibleId)) return true
    })

    const options = users.map((user) => {
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

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold leading-7 text-gray-900 mt-5">Approvals</h2>
      {hasError && <p className="text-sm text-red-500">Please assign all approvers for this invoice.</p>}
      {approverSlots.map((slot, index) => (
        <ApproverCombobox
          key={index}
          options={filterApproverOptions(index, slot.eligibleRoles, slot.eligibleUserIds)}
          selectedApprover={
            mercoaSession.users.filter((user) => {
              if (user.id === slot.assignedUserId) return true
            })[0]
          }
          setSelectedApprover={(selection) => {
            setSelectedApprovers(
              index,
              {
                assignedUserId: selection,
                approvalSlotId: slot.approvalSlotId,
              },
              formOnChange,
            )
          }}
        />
      ))}
    </div>
  )
}

function ApproverCombobox({
  options,
  selectedApprover,
  setSelectedApprover,
}: {
  options: { user: Mercoa.EntityUserResponse; disabled: boolean }[]
  selectedApprover?: Mercoa.EntityUserResponse
  setSelectedApprover: (selectedApprover: Mercoa.EntityUserId) => void
}) {
  return (
    <MercoaCombobox
      label="Assigned to"
      onChange={(e) => {
        setSelectedApprover(e.id)
      }}
      value={selectedApprover}
      options={options.map((option) => {
        return { disabled: option.disabled, value: option.user }
      })}
      displayIndex="name"
      secondaryDisplayIndex="email"
      disabledText="Already assigned"
    />
  )
}

function ApproversAction({
  approverSlots,
  invoiceId,
  invoiceStatus,
  refreshInvoice,
}: {
  approverSlots: Mercoa.ApprovalSlot[]
  invoiceId: Mercoa.InvoiceId
  invoiceStatus: Mercoa.InvoiceStatus
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
}) {
  const mercoaSession = useMercoaSession()
  const loggedInUserApprovalSlot = approverSlots.find((e) => e.assignedUserId === mercoaSession.user?.id)

  const findAssignedUser = (approverSlot: Mercoa.ApprovalSlot) => {
    let user = mercoaSession.users.find((user) => user.id === approverSlot.assignedUserId)
    return user
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold leading-7 text-gray-900 mt-5">Approvals</h2>
      {approverSlots.map((slot) => {
        let user = findAssignedUser(slot)
        if (user) {
          return <ApproverWell key={user.id} approverSlot={slot} approver={user} />
        }
      })}
      {loggedInUserApprovalSlot && invoiceStatus === Mercoa.InvoiceStatus.New && (
        <ApproverActionButton
          approverSlot={loggedInUserApprovalSlot}
          invoiceId={invoiceId}
          refreshInvoice={refreshInvoice}
        />
      )}
    </div>
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
    bgColor = 'bg-gray-50'
    icon = <></>
  } else if (approverSlot.action === Mercoa.ApproverAction.Approve) {
    bgColor = 'bg-green-50'
    icon = <CheckCircleIcon className="h-8 w-8 text-green-400" aria-hidden="true" />
  } else if (approverSlot.action === Mercoa.ApproverAction.Reject) {
    bgColor = 'bg-red-50'
    icon = <XCircleIcon className="h-8 w-8 text-red-400" aria-hidden="true" />
  }

  return (
    <>
      <div className="flex items-center">
        <div className="flex-auto">
          <div className={classNames('flex items-center rounded-md', bgColor)}>
            <div className="flex-auto p-3">
              <div className={classNames('text-sm font-medium', 'text-grey-900')}>{approver.name}</div>
              <div className="text-sm text-gray-500">{approver.email}</div>
            </div>
            <div className="mx-4 flex-shrink-0 p-1 text-mercoa-primary-text hover:opacity-75">{icon}</div>
          </div>
        </div>
      </div>
    </>
  )
}

function ApproverActionButton({
  approverSlot,
  invoiceId,
  refreshInvoice,
}: {
  approverSlot: Mercoa.ApprovalSlot
  invoiceId: Mercoa.InvoiceId
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
}) {
  const mercoaSession = useMercoaSession()
  const handleApprove = () => {
    const approvalData: Mercoa.ApprovalRequest = {
      userId: approverSlot.assignedUserId ?? '',
    }
    if (approvalData.userId) {
      mercoaSession.client?.invoice.approval
        .approve(invoiceId, approvalData)
        .then(() => {
          toast.success('Invoice approved')
          refreshInvoice(invoiceId)
        })
        .catch((e) => {
          console.log(e)
          toast.error('There was an error approving this invoice. Please try again.')
        })
    }
  }
  const handleReject = () => {
    const approvalData: Mercoa.ApprovalRequest = {
      userId: approverSlot.assignedUserId ?? '',
    }
    if (approvalData.userId) {
      mercoaSession.client?.invoice.approval
        .reject(invoiceId, approvalData)
        .then(() => {
          toast.success('Invoice rejected')
          refreshInvoice(invoiceId)
        })
        .catch((e) => {
          console.log(e)
          toast.error('There was an error rejecting this invoice. Please try again.')
        })
    }
  }

  return (
    <div className="flex items-center justify-end gap-x-2">
      <MercoaButton
        disabled={approverSlot.action === Mercoa.ApproverAction.Reject}
        color="red"
        isEmphasized
        onClick={handleReject}
        type="button"
      >
        Reject
      </MercoaButton>
      <MercoaButton
        disabled={approverSlot.action === Mercoa.ApproverAction.Approve}
        color="green"
        isEmphasized
        onClick={handleApprove}
        type="button"
      >
        Approve
      </MercoaButton>
    </div>
  )
}

// End Approvers

// Comments

export function InvoiceComments({
  invoice,
  refreshInvoice,
}: {
  invoice?: Mercoa.InvoiceResponse
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
}) {
  const mercoaSession = useMercoaSession()

  const [comments, setComments] = useState<Array<Mercoa.CommentResponse>>(invoice?.comments ?? [])

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      type: 'comment',
      text: '',
    },
  })

  function addComment({ type, text }: { type: string; text: string }) {
    if (!mercoaSession.user?.id) {
      toast.error('Please login as a user to comment')
      return
    }
    if (!mercoaSession.token || !invoice?.id) return
    if (type === 'comment') {
      mercoaSession.client?.invoice.comment
        .create(invoice.id, {
          text,
          userId: mercoaSession.user?.id,
        })
        .then((resp) => {
          if (resp) {
            console.log(resp)
            setComments([...comments, resp])
            setValue('text', '')
          }
        })
    }
  }

  return (
    <div className="py-6">
      <h2 className="text-base font-semibold leading-7 text-gray-900 my-5">Comments</h2>
      {comments.map((comment) => (
        <div className="p-6 mb-6 text-base bg-gray-50 rounded-lg" key={comment.id}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <p className="inline-flex items-center mr-1 text-sm text-gray-900">{comment.user?.name}</p>
              <span aria-hidden="true" className="text-gray-400">
                &middot;
              </span>
              <p className="text-sm text-gray-600 ml-1">{dayjs(comment.updatedAt).format('MMM DD, YYYY')}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {comment.associatedApprovalAction?.action === Mercoa.ApproverAction.Approve && (
                <div>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                  <span className="sr-only">Approved</span>
                </div>
              )}
              {comment.associatedApprovalAction?.action === Mercoa.ApproverAction.Reject && (
                <div>
                  <XCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                  <span className="sr-only">Rejected</span>
                </div>
              )}
            </div>
            <pre className="text-gray-500">{comment.text}</pre>
          </div>
        </div>
      ))}
      <div className="mt-2">
        <form onSubmit={handleSubmit(addComment)} className="relative">
          <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-mercoa-primary">
            <label htmlFor="text" className="sr-only">
              Add your comment
            </label>
            <textarea
              rows={3}
              {...register('text')}
              className="block w-full resize-none border-0 bg-transparent py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              placeholder="Add your comment..."
              defaultValue={''}
            />

            {/* Spacer element to match the height of the toolbar */}
            <div className="py-2" aria-hidden="true">
              {/* Matches height of button in toolbar (1px border + 36px content height) */}
              <div className="py-px">
                <div className="h-9" />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
            <div className="flex-grow-1" />
            <div className="flex-shrink-0">
              <MercoaButton type="submit" isEmphasized={false}>
                Post
              </MercoaButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// End Comments

// Metadata

function MetadataSelection({
  schema,
  value,
  entityMetadata,
  setValue,
  hasDocument,
  paymentDestination,
  paymentSource,
  lineItem,
}: {
  schema: Mercoa.MetadataSchema
  value?: string
  entityMetadata?: Mercoa.EntityMetadataResponse
  setValue: (e: string) => void
  hasDocument: boolean
  paymentDestination?: Mercoa.PaymentMethodResponse
  paymentSource?: Mercoa.PaymentMethodResponse
  lineItem?: boolean
}) {
  const [edit, setEdit] = useState(!value)

  if (schema.showConditions?.hasDocument && !hasDocument) {
    return <></>
  }

  if (schema.showConditions?.hasOptions && !entityMetadata) {
    return <></>
  }

  if (schema.lineItem && !lineItem) {
    return <></>
  }

  if (schema.showConditions?.paymentDestinationTypes && schema.showConditions.paymentDestinationTypes.length > 0) {
    if (!paymentDestination) return <></>
    if (!schema.showConditions.paymentDestinationTypes.includes(paymentDestination.type)) return <></>
    if (schema.showConditions.paymentDestinationTypes.includes('custom')) {
      if (paymentDestination.type != Mercoa.PaymentMethodType.Custom) return <></>
      if (!schema.showConditions?.paymentDestinationCustomSchemaIds?.includes(paymentDestination.schemaId)) return <></>
    }
  }

  if (schema.showConditions?.paymentSourceTypes && schema.showConditions.paymentSourceTypes.length > 0) {
    if (!paymentSource) return <></>
    if (!schema.showConditions.paymentSourceTypes.includes(paymentSource.type)) return <></>
    if (schema.showConditions.paymentSourceTypes.includes('custom')) {
      if (paymentSource.type != Mercoa.PaymentMethodType.Custom) return <></>
      if (!schema.showConditions?.paymentSourceCustomSchemaIds?.includes(paymentSource.schemaId)) return <></>
    }
  }

  const metadataSelection = (
    <>
      {(schema.type === Mercoa.MetadataType.String ||
        schema.type === Mercoa.MetadataType.Number ||
        schema.type === Mercoa.MetadataType.KeyValue) && (
        <MetadataCombobox schema={schema} setValue={setValue} value={value} values={entityMetadata?.value ?? []} />
      )}
      {schema.type === Mercoa.MetadataType.Boolean && (
        <MetadataBoolean schema={schema} setValue={setValue} value={value} />
      )}
      {schema.type === Mercoa.MetadataType.Date && <MetadataDate setValue={setValue} value={value} />}
    </>
  )

  if (lineItem) {
    return metadataSelection
  }

  // if (value && !edit) {
  //   return (
  //     <MetadataWell key={schema.key} schema={schema} value={value} setEdit={setEdit} entityMetadata={entityMetadata} />
  //   )
  // }

  return (
    <div>
      <h3 className="mt-3 block text-sm font-medium leading-6 text-gray-900">{schema.displayName}</h3>
      {metadataSelection}
    </div>
  )
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
  let comboboxValue: string | string[] | undefined = value
  if (schema.allowMultiple) {
    // Metadata is stored as a comma separated string, but comboboxes expect an array
    comboboxValue = value?.split(',')
  }

  if (schema.type === Mercoa.MetadataType.KeyValue) {
    return (
      <MercoaCombobox
        options={values.map((value) => {
          let parsedValue = {
            key: '',
            value: '',
          }
          try {
            parsedValue = dJSON.parse(value) as { key: string; value: string }
            parsedValue.value = `${parsedValue.value}`
            parsedValue.key = `${parsedValue.key}`
          } catch (e) {
            console.error(e)
          }
          return { value: parsedValue, disabled: false }
        })}
        onChange={(value) => {
          setValue(value.key)
        }}
        displayIndex="value"
        value={dJSON.parse(
          values.find((e) => {
            let parsedValue = {
              key: '',
              value: '',
            }
            try {
              parsedValue = dJSON.parse(e) as { key: string; value: string }
              parsedValue.value = `${parsedValue.value}`
              parsedValue.key = `${parsedValue.key}`
            } catch (e) {
              console.error(e)
            }
            return parsedValue?.key === `${value ?? ''}`
          }) ?? '{}',
        )}
        multiple={schema.allowMultiple}
      />
    )
  }
  return (
    <MercoaCombobox
      options={values.map((value) => {
        return { value: value, disabled: false }
      })}
      onChange={(value) => {
        setValue(value)
      }}
      value={comboboxValue}
      multiple={schema.allowMultiple}
    />
  )
}

function MetadataDate({ setValue, value }: { setValue: (e: string) => void; value?: string }) {
  return (
    <DatePicker
      className="block w-full rounded-md border-gray-300 sm:text-sm"
      placeholderText="Select due date"
      onChange={(date) => {
        if (date) {
          setValue(date.toISOString())
        }
      }}
      selected={dayjs(value).toDate()}
    />
  )
}

function MetadataBoolean({
  schema,
  setValue,
  value,
}: {
  schema: Mercoa.MetadataSchema
  setValue: (e: string) => void
  value?: string
}) {
  return (
    <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0">
      <div className="flex items-center">
        <input
          type="radio"
          name={`true-false-${schema.key}`}
          defaultChecked={value === 'true'}
          className="h-4 w-4 border-gray-300 text-mercoa-primary focus:ring-mercoa-primary"
          onChange={() => setValue('true')}
        />
        <label htmlFor={`true-false-${schema.key}`} className="ml-3 block text-sm font-medium leading-6 text-gray-900">
          Yes
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="radio"
          name={`true-false-${schema.key}`}
          defaultChecked={value === 'false'}
          className="h-4 w-4 border-gray-300 text-mercoa-primary focus:ring-mercoa-primary"
          onChange={() => setValue('false')}
        />
        <label htmlFor={`true-false-${schema.key}`} className="ml-3 block text-sm font-medium leading-6 text-gray-900">
          No
        </label>
      </div>
    </div>
  )
}

function MetadataWell({
  schema,
  value,
  setEdit,
  entityMetadata,
}: {
  schema: Mercoa.MetadataSchema
  value: string
  setEdit: (e: any) => void
  entityMetadata?: Mercoa.EntityMetadataResponse
}) {
  if (!schema) return <></>
  if (schema.type === Mercoa.MetadataType.Date) {
    if (dayjs(value).isValid()) value = dayjs(value).format('MMM DD, YYYY')
  } else if (schema.type === Mercoa.MetadataType.Boolean) {
    if (value === 'true') value = 'Yes'
    if (value === 'false') value = 'No'
  } else if (schema.type === Mercoa.MetadataType.KeyValue) {
    entityMetadata?.value?.find((e: string) => {
      let parsedValue = {
        key: '',
        value: '',
      }
      try {
        parsedValue = dJSON.parse(e) as { key: string; value: string }
        parsedValue.value = `${parsedValue.value}`
        parsedValue.key = `${parsedValue.key}`
      } catch (e) {
        console.error(e)
      }

      if (parsedValue?.key === value) {
        value = parsedValue.value
        return true
      }
    })
  }
  return (
    <>
      <div className="flex items-center">
        <div className="flex-auto">
          <div className={classNames('flex items-center rounded-md')}>
            <div className="flex-auto p-3">
              <div className={classNames('text-sm font-medium', 'text-grey-900')}>{schema.displayName}</div>
              <div className="text-sm text-gray-500">{value}</div>
            </div>
            <button
              type="button"
              onClick={setEdit}
              className="mx-4 flex-shrink-0 p-1 text-mercoa-primary-text hover:opacity-75 cursor-pointer"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// End Metadata

// Line Items
function LineItems({
  lineItems,
  append,
  remove,
  register,
  currency,
  watch,
  setValue,
  entityMetadata,
  paymentDestination,
  paymentSource,
  hasDocument,
  width,
}: {
  lineItems?: FieldArrayWithId[]
  append: Function
  remove: Function
  register: Function
  currency: Mercoa.CurrencyCode
  watch: Function
  setValue: Function
  entityMetadata: Mercoa.EntityMetadataResponse[]
  paymentDestination?: Mercoa.PaymentMethodResponse
  paymentSource?: Mercoa.PaymentMethodResponse
  hasDocument: boolean
  width: number
}) {
  const mercoaSession = useMercoaSession()
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4">
      {/* HEADER */}
      <div className="flex items-center mt-5">
        <h2 className="text-base font-semibold leading-6 text-gray-700 text-lg">Line Items</h2>
        <button
          onClick={() => {
            append({
              name: '',
              description: '',
              amount: 0,
              unitPrice: 0,
              quantity: 1,
            })
          }}
          type="button"
          className="ml-4 flex-shrink-0 col-span-1"
        >
          <Tooltip title="Add line item">
            <PlusCircleIcon className="h-5 w-5 text-gray-400 hover:opacity-75" aria-hidden="true" />
          </Tooltip>
          <span className="sr-only">Add line item</span>
        </button>
      </div>
      {/* ROWS */}
      <div className="overflow-x-hidden hover:overflow-x-visible pointer-events-none">
        <table
          className="min-w-full divide-y divide-gray-300 w-[600px] relative mb-6 pointer-events-auto"
          id="lineItemsTable"
        >
          <thead>
            <tr className="divide-x divide-gray-200">
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 min-w-[300px]">
                Description
              </th>
              {mercoaSession.organization?.metadataSchema
                ?.filter((schema) => schema.lineItem)
                .map((schema) => {
                  return (
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 min-w-[200px]"
                      key={schema.key}
                    >
                      {schema.displayName}
                    </th>
                  )
                })}
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
                Qty
              </th>
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
                Price
              </th>
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
                Amount
              </th>
              <th>
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {lineItems?.map((field, index) => (
              <LineItemRow
                currency={currency}
                index={index}
                remove={remove}
                register={register}
                key={field.id}
                watch={watch}
                setValue={setValue}
                entityMetadata={entityMetadata}
                paymentDestination={paymentDestination}
                paymentSource={paymentSource}
                hasDocument={hasDocument}
              />
            ))}
          </tbody>
        </table>
        <LineItemScrollBar width={width} />
      </div>
    </div>
  )
}

function LineItemScrollBar({ width }: { width: number }) {
  const scrollBarWidth = (width / 730) * width
  const table = document.getElementById('lineItemsTable')

  function onDrag(data: { x: number }) {
    if (table) {
      const totalLength = width - scrollBarWidth
      const percent = data.x / totalLength
      const tableWidth = table?.offsetWidth ?? 0
      const overflow = tableWidth - scrollBarWidth
      table.style.left = `-${percent * overflow}px` // move the table left by the percent of the overflow, TODO: there is something wrong with this math but will fix later
    }
  }

  if (width > 730) {
    onDrag({ x: 0 })
    return <></>
  }

  return (
    <div className="w-full h-[10px] bg-gray-100 relative pointer-events-auto">
      <Draggable axis="x" bounds="parent" onDrag={(e, data) => onDrag(data)}>
        <div
          className="h-[10px] bg-gray-300 hover:bg-gray-400 absolute top-0"
          style={{ width: `${scrollBarWidth}px` }}
        />
      </Draggable>
    </div>
  )
}

function LineItemRow({
  currency,
  index,
  remove,
  register,
  watch,
  setValue,
  entityMetadata,
  paymentDestination,
  paymentSource,
  hasDocument,
}: {
  currency: Mercoa.CurrencyCode
  index: number
  remove: Function
  register: Function
  watch: Function
  setValue: Function
  entityMetadata: Mercoa.EntityMetadataResponse[]
  paymentDestination?: Mercoa.PaymentMethodResponse
  paymentSource?: Mercoa.PaymentMethodResponse
  hasDocument: boolean
}) {
  const mercoaSession = useMercoaSession()
  return (
    <tr className="divide-x divide-gray-200">
      <td className="whitespace-nowrap p-1 text-sm text-gray-500">
        {' '}
        <input
          type="text"
          className="block w-full border-0 py-1.5 text-gray-900
           placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6"
          {...register(`lineItems.${index}.description`)}
        />
      </td>
      {mercoaSession.organization?.metadataSchema
        ?.filter((schema) => schema.lineItem)
        .map((schema) => {
          const metadata = watch(`lineItems.${index}.metadata`)
          const value =
            schema.key === 'glAccountId'
              ? watch(`lineItems.${index}.glAccountId`)
              : watch(`lineItems.${index}.metadata.${schema.key}`)
          return (
            <td className="whitespace-nowrap text-sm text-gray-500" key={schema.key}>
              <MetadataSelection
                entityMetadata={entityMetadata.find((m) => m.key === schema.key)}
                schema={schema}
                value={value}
                hasDocument={hasDocument}
                paymentDestination={paymentDestination}
                paymentSource={paymentSource}
                setValue={(value: string | string[]) => {
                  // combobox with multiple will return an array, but metadata needs a string, so join it with commas
                  if (Array.isArray(value)) {
                    value = value.join(',')
                  }
                  if (schema.key === 'glAccountId') {
                    setValue(`lineItems.${index}.glAccountId`, `${value}`, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  } else {
                    const newMetadata = JSON.parse(JSON.stringify(metadata ?? '{}')) as Record<string, string>
                    newMetadata[schema.key] = `${value}`
                    setValue(`lineItems.${index}.metadata`, newMetadata, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                }}
                lineItem
              />
            </td>
          )
        })}
      <td className="whitespace-nowrap p-1 text-sm text-gray-500">
        <input
          type="text"
          className={`block w-full border-0 py-1.5 
            text-gray-900 
            placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6`}
          placeholder="1"
          {...register(`lineItems.${index}.quantity`)}
        />
      </td>
      <td className="whitespace-nowrap p-1 text-sm text-gray-500">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">{currencyCodeToSymbol(currency)}</span>
          </div>
          <input
            type="text"
            className={`block w-full border-0 py-1.5 
            text-gray-900 
            placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6 pl-6
            ${currencyCodeToSymbol(currency).length > 1 ? 'pl-12' : 'pl-6'}`}
            placeholder="0.00"
            {...register(`lineItems.${index}.unitPrice`)}
          />
        </div>
      </td>
      <td className="whitespace-nowrap py-1 pl-1 pr-1 text-sm text-gray-500 sm:pr-0">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">{currencyCodeToSymbol(currency)}</span>
          </div>
          <input
            type="text"
            className={`block w-full rounded-md border-0 py-1.5 
            text-gray-900 
            placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6 pl-6
            ${currencyCodeToSymbol(currency).length > 1 ? 'pl-12' : 'pl-6'}`}
            placeholder="0.00"
            {...register(`lineItems.${index}.amount`)}
          />
        </div>
      </td>
      <td className="whitespace-nowrap py-1 pl-1 pr-1 text-sm text-gray-500 sm:pr-0">
        <button type="button" onClick={() => remove(index)}>
          <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="sr-only">Remove line item</span>
        </button>
      </td>
    </tr>
  )
}
