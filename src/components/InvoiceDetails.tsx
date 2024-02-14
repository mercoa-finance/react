import { Bar, Container, Section } from '@column-resizer/react'
import { Dialog, Transition } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
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
import { Controller, FieldArrayWithId, FieldErrors, useFieldArray, useForm } from 'react-hook-form'
import { Document, Page } from 'react-pdf'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import { currencyCodeToSymbol } from '../lib/currency'
import { isWeekday } from '../lib/scheduling'
import { CounterpartySearch } from './Counterparties'
import { InvoiceStatusPill } from './Inbox'
import { InvoiceComments } from './InvoiceComments'
import {
  AddBankAccountDialog,
  AddCheckDialog,
  BankAccountComponent,
  CheckComponent,
  CreditCardComponent,
  CustomPaymentMethodComponent,
  LoadingSpinner,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  Tooltip,
  useDebounce,
  useMercoaSession,
} from './index'

const dJSON = require('dirty-json')

dayjs.extend(minMax)

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

export function InvoiceDetails({
  invoiceId,
  invoice,
  onRedirect,
  addPaymentMethodRedirect,
  children,
  heightOffset,
}: {
  invoiceId?: Mercoa.InvoiceId
  invoice?: Mercoa.InvoiceResponse
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  addPaymentMethodRedirect?: () => void
  heightOffset?: number
  children?: ({
    invoice,
    documents,
  }: {
    invoice: Mercoa.InvoiceResponse | undefined
    documents: Mercoa.DocumentResponse[] | undefined
  }) => React.ReactNode
}) {
  const mercoaSession = useMercoaSession()
  const [uploadedFile, setUploadedFile] = useState<{ fileReaderObj: string; mimeType: string }>()
  const [ocrResponse, setOcrResponse] = useState<Mercoa.OcrResponse>()
  const [uploadedImage, setUploadedImage] = useState<string>()
  const [ocrProcessing, setOcrProcessing] = useState<boolean>(false)
  const [invoiceLocal, setInvoice] = useState<Mercoa.InvoiceResponse | undefined>(invoice)
  const [documents, setDocuments] = useState<Mercoa.DocumentResponse[]>()
  const [height, setHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight - (heightOffset ?? 70) : 0,
  )
  const [isViewingInvoiceMobile, setIsViewingInvoiceMobile] = useState<boolean>(false)

  async function refreshInvoice(invoiceId: Mercoa.InvoiceId) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.invoice.get(invoiceId)
    if (resp) {
      setInvoice(resp)
    }
  }

  async function refreshOcrJob(ocrJobId: string) {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.ocr.getAsyncOcr(ocrJobId)
    if (resp && resp.status === Mercoa.OcrJobStatus.Success) {
      setOcrResponse(resp.data)
      setOcrProcessing(false)
    } else if (resp && resp.status === Mercoa.OcrJobStatus.Failed) {
      toast.error('OCR failed')
      setOcrProcessing(false)
    } else {
      setTimeout(() => refreshOcrJob(ocrJobId), 5000)
    }
  }

  async function onFileUpload(fileReaderObj: string, file: File) {
    setUploadedFile({ fileReaderObj, mimeType: file.type })
    setUploadedImage(fileReaderObj)
    // Run OCR on file upload
    setOcrProcessing(true)
    try {
      //refreshOcrJob('ocr_57bab05c-0f69-4d98-86c5-ef258acf6253')
      const ocrResponse = await mercoaSession.client?.ocr.runAsyncOcr({
        entityId: mercoaSession.entityId,
        image: fileReaderObj,
        mimeType: file.type,
      })
      if (ocrResponse) {
        refreshOcrJob(ocrResponse?.jobId)
      } else {
        toast.error('OCR failed')
        setOcrProcessing(false)
      }
    } catch (e) {
      console.log(e)
      toast.error('OCR failed')
      setOcrProcessing(false)
    }
  }

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    if (!invoice && invoiceId) {
      refreshInvoice(invoiceId)
    }
  }, [invoice, invoiceId, mercoaSession.token, mercoaSession.entity?.id])

  function handleResize() {
    setHeight(window.innerHeight - (heightOffset ?? 70))
  }
  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize, false)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (invoiceLocal && invoiceLocal.hasDocuments) {
      mercoaSession.client?.invoice.document.getAll(invoiceLocal.id).then((documents) => {
        if (documents && documents.length > 0) {
          setDocuments(documents)
          setUploadedFile({ fileReaderObj: documents?.[0]?.uri, mimeType: documents?.[0]?.mimeType })
        }
      })
    }
  }, [invoiceLocal])

  const document = (
    <div className="mercoa-min-w-[300px] mercoa-mr-5">
      {uploadedFile ? (
        <>
          <div className={`mercoa-text-center ${ocrProcessing ? 'mercoa-block mercoa-mb-5' : 'mercoa-hidden'}`}>
            <span className="mercoa-text-gray-800 mercoa-w-full"> Extracting Invoice Details </span>
            <ProgressBar />
          </div>
          <InvoiceDocuments documents={new Array(uploadedFile)} height={height} />
        </>
      ) : (
        <InvoiceDocumentsUpload onFileUpload={onFileUpload} />
      )}
    </div>
  )

  if (children) return <>{children({ invoice: invoiceLocal, documents })}</>

  if (!invoiceLocal && invoiceId) {
    return <LoadingSpinner />
  }

  return (
    <Container>
      {/* ********* INVOICE UPLOAD FIELD */}
      <Section minSize={0}>{document}</Section>

      <Bar size={5} className="mercoa-bg-gray-200 mercoa-cursor-ew-resize mercoa-invisible min-[450px]:mercoa-visible">
        <div className="mercoa-w-3 mercoa-h-10 mercoa-bg-gray-500 mercoa-absolute mercoa-top-1/2 mercoa-left-1/2 mercoa-transform -mercoa-translate-x-1/2 -mercoa-translate-y-1/2" />
      </Bar>

      {/* EDIT INVOICE FORM */}
      <Section className="mercoa-pl-5 mercoa-relative" minSize={400}>
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
        )}
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
          className={`mercoa-mt-2 mercoa-flex mercoa-justify-center mercoa-rounded-lg mercoa-border mercoa-border-dashed mercoa-border-gray-900/25 ${
            isDragActive ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
          } mercoa-px-6 mercoa-py-10`}
          {...getRootProps()}
        >
          <div className="mercoa-text-center">
            <PhotoIcon className="mercoa-mx-auto mercoa-h-12 mercoa-w-12 mercoa-text-gray-300" aria-hidden="true" />
            <div className="mercoa-mt-4 mercoa-flex mercoa-text-sm mercoa-text-gray-600">
              <label
                htmlFor="file-upload"
                className="mercoa-relative mercoa-cursor-pointer mercoa-rounded-md mercoa-bg-white mercoa-font-semibold mercoa-text-mercoa-primary focus-within:mercoa-outline-none focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 hover:mercoa-text-indigo-500"
              >
                <span>Upload an invoice</span>
                <input
                  {...getInputProps()}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="mercoa-sr-only"
                />
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

function InvoiceDocuments({
  documents,
  height,
}: {
  documents: Array<{ fileReaderObj: string; mimeType: string }>
  height: number
}) {
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [debouncedWidth, setDebouncedWidth] = useDebounce(0, 20)

  const wrapperDiv = useRef(null)

  useLayoutEffect(() => {
    if (wrapperDiv.current === null) return
    setDebouncedWidth((wrapperDiv.current as any).getBoundingClientRect().width)
  }, [wrapperDiv])

  useResizeObserver(wrapperDiv, (entry) => {
    if (debouncedWidth && Math.abs(debouncedWidth - entry.contentRect.width) < 20) return
    setDebouncedWidth(entry.contentRect.width)
  })

  const documentNavigation = (
    <div className="mercoa-flex mercoa-justify-center">
      <nav
        className="mercoa-isolate mercoa-inline-flex -mercoa-space-x-px mercoa-rounded-md mercoa-shadow-sm"
        aria-label="Pagination"
      >
        <button
          type="button"
          onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}
          className="mercoa-relative mercoa-inline-flex mercoa-items-center mercoa-rounded-l-md mercoa-px-2 mercoa-py-2 mercoa-text-gray-400 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus:mercoa-z-20 focus:mercoa-outline-offset-0"
        >
          <span className="mercoa-sr-only">Previous</span>
          <ChevronLeftIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
        </button>

        {Array.from(new Array(numPages), (el, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setPageNumber(index + 1)}
            aria-current={pageNumber != index + 1 ? 'false' : 'page'}
            className={
              pageNumber != index + 1
                ? 'mercoa-relative mercoa-inline-flex mercoa-items-center mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus:mercoa-z-20 focus:mercoa-outline-offset-0'
                : 'mercoa-relative mercoa-z-10 mercoa-inline-flex mercoa-items-center mercoa-bg-mercoa-primary mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-white focus:mercoa-z-20 focus-visible:outline focus-visible:mercoa-outline-2 focus-visible:mercoa-outline-offset-2 focus-visible:mercoa-outline-mercoa-primary'
            }
          >
            {index + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages ?? 1))}
          className="mercoa-relative mercoa-inline-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 mercoa-py-2 mercoa-text-gray-400 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus:mercoa-z-20 focus:mercoa-outline-offset-0"
        >
          <span className="mercoa-sr-only">Next</span>
          <ChevronRightIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
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
              <div
                className="mercoa-rounded-md mercoa-border mercoa-shadow-lg"
                style={{ width: `${debouncedWidth}px` }}
              >
                {document.mimeType === 'application/pdf' ? (
                  <Document
                    loading={
                      <div
                        className="mercoa-mt-2 mercoa-flex mercoa-w-full mercoa-items-center mercoa-justify-center"
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
                      className="mercoa-m-0 mercoa-w-full mercoa-p-0 mercoa-mt-2"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={debouncedWidth - 5}
                    />
                  </Document>
                ) : (
                  <img
                    src={document.fileReaderObj}
                    key={document.fileReaderObj}
                    onLoad={() => setNumPages(1)}
                    className="mercoa-mt-2"
                  />
                )}
              </div>
              <a href={document.fileReaderObj} target="_blank" rel="noreferrer" className="mercoa-mt-2" download>
                <MercoaButton type="button" isEmphasized={false} className="mercoa-mt-2">
                  <span className="mercoa-hidden xl:mercoa-inline">
                    <ArrowDownTrayIcon className="-mercoa-ml-1 mercoa-mr-2 mercoa-inline-flex mercoa-h-5 mercoa-w-5" />{' '}
                    Download Invoice
                  </span>
                  <span className="mercoa-inline xl:mercoa-hidden">Download</span>
                </MercoaButton>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="mercoa-overflow-auto" style={{ height: `${height}px` }}>
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
  const [paymentMethodSchemas, setPaymentMethodSchemas] = useState<Array<Mercoa.CustomPaymentMethodSchemaResponse>>([])
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

  const schema = yup
    .object({
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
          quantity: yup.number().required().typeError('Please enter a valid number'),
          unitPrice: yup.number().required().typeError('Please enter a valid number'),
          metadata: yup.mixed().nullable(),
          glAccountId: yup.string(),
        }),
      ),
      currency: yup.string().required(),
      vendorId: yup.string(),
      vendorName: yup.string(),
      paymentDestinationId: yup.string(),
      paymentMethodDestinationType: yup.string(),
      paymentDestinationOptions: yup.mixed().nullable(),
      paymentSourceId: yup.string(),
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
    setFocus,
    control,
    formState: { errors },
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
      deductionDate: invoice?.deductionDate ? dayjs(invoice?.deductionDate).toDate() : undefined,
      lineItems: invoice?.lineItems ?? [],
      paymentDestinationId: invoice?.paymentDestination?.id,
      paymentMethodDestinationType: '',
      paymentDestinationOptions: invoice?.paymentDestinationOptions,
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
  const lineItems = watch('lineItems')
  const paymentDestinationOptions = watch('paymentDestinationOptions') as Mercoa.PaymentDestinationOptions

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  })

  // Auto-calculate line item amounts and total amount

  function calculateTotalAmountFromLineItems() {
    if (lineItems?.find((e) => isNaN(e.amount as number))) {
      setError('amount', { type: 'manual', message: 'Please enter a valid number' })
      return
    }
    let amount =
      lineItems?.reduce((acc, lineItem, index) => {
        return acc + Number(lineItem.amount) ?? 0
      }, 0) ?? 0
    amount = Math.floor(amount * 100) / 100
    setValue('amount', amount)
    setFocus('amount')
  }

  // watch((data, { name, type }) => {
  //   if (type != 'change') return
  //   if (!name?.startsWith('lineItems')) return
  //   if (name.endsWith('description') || name.endsWith('name')) return
  //   let amount = 0
  //   if (name.endsWith('amount')) {
  //     const lineItems = data.lineItems as Mercoa.InvoiceLineItemRequest[]
  //     if (lineItems.find((e) => isNaN(e.amount))) {
  //       setError('amount', { type: 'manual', message: 'Please enter a valid number' })
  //       return
  //     }
  //     amount = lineItems.reduce((acc, lineItem, index) => {
  //       return acc + Number(lineItem.amount) ?? 0
  //     }, 0)
  //   } else {
  //     const lineItems = data.lineItems as Mercoa.InvoiceLineItemRequest[]
  //     amount = lineItems.reduce((acc, lineItem, index) => {
  //       lineItem.amount = Math.floor((lineItem.quantity ?? 1) * (lineItem.unitPrice ?? 1) * 100) / 100
  //       setValue(`lineItems.${index}.amount`, lineItem.amount)
  //       return acc + lineItem.amount
  //     }, 0)
  //   }
  //   amount = Math.floor(amount * 100) / 100
  //   setValue('amount', amount)
  // })

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

  async function refreshVendorPaymentMethods() {
    if (!mercoaSession.token || !vendorId) return
    const resp = await mercoaSession.client?.entity.paymentMethod.getAll(vendorId)
    if (resp) {
      setDestinationPaymentMethods(resp)
    }
  }

  useEffect(() => {
    refreshVendorPaymentMethods()
  }, [mercoaSession.client, vendorId, mercoaSession.token])

  // OCR Merge
  useEffect(() => {
    if (!ocrResponse) return
    if (ocrResponse.invoice.amount) setValue('amount', ocrResponse.invoice.amount)
    setValue('invoiceNumber', ocrResponse.invoice.invoiceNumber)
    if (ocrResponse.invoice.invoiceDate) setValue('invoiceDate', ocrResponse.invoice.invoiceDate)
    if (ocrResponse.invoice.dueDate) setValue('dueDate', ocrResponse.invoice.dueDate)
    setValue('deductionDate', ocrResponse.invoice.deductionDate)
    if (ocrResponse.invoice.currency) setValue('currency', ocrResponse.invoice.currency)
    if (ocrResponse.invoice.metadata) setValue('metadata', JSON.stringify(ocrResponse.invoice.metadata))
    // setValue('vendorName', ocrResponse.vendor.name)
    // setValue('vendorId', ocrResponse.vendor.id)
    if (ocrResponse.invoice.lineItems && !mercoaSession.iframeOptions?.options?.invoice?.disableLineItems) {
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
    }

    if (!selectedVendor) {
      if (ocrResponse.vendor.id === 'new' && mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
        console.log('new vendor creation disabled')
      } else if (ocrResponse.vendor.id) {
        console.log('setting selected vendor', ocrResponse.vendor)
        setSelectedVendor(ocrResponse.vendor)
      }
    }
  }, [ocrResponse, selectedVendor])

  let approversAssigned = false
  if (invoice?.approvers) {
    approversAssigned = !!approvers?.every((approver: any) => !!approver)
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
    setIsSaving(true)
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
      approvers: data.approvers.filter((e: { assignedUserId: string }) => e.assignedUserId),
      ...(data.vendorId !== 'new' && {
        vendorId: data.vendorId,
      }),
      paymentDestinationId: data.paymentDestinationId,
      ...(data.paymentMethodDestinationType === 'check' && {
        paymentDestinationOptions: data.paymentDestinationOptions,
      }),
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

    // Make sure line items amount is equal to invoice amount
    if (!mercoaSession.iframeOptions?.options?.invoice?.disableLineItems && data.lineItems.length > 0) {
      const lineItemsTotal = data.lineItems.reduce((acc: number, lineItem: any) => {
        return acc + Number(lineItem.amount)
      }, 0)
      if (lineItemsTotal !== Number(data.amount)) {
        setError('amount', { type: 'manual', message: 'Line item amounts do not match total amount' })
        setIsSaving(false)
        return
      }
    }

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
          toast.error(`There was an error creating the invoice.\n Error: ${e.body}`)
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

  const printCheckButton = (
    <MercoaButton
      type="button"
      isEmphasized
      onClick={async () => {
        if (!invoice?.id) return
        const pdf = await mercoaSession.client?.invoice.generateCheckPdf(invoice.id)
        if (pdf) {
          window.open(pdf.uri, '_blank')
        } else {
          toast.error('There was an error generating the check PDF')
        }
      }}
    >
      Print Check
    </MercoaButton>
  )

  return (
    <div style={{ height: `${height}px` }} className="mercoa-overflow-auto mercoa-pr-2 mercoa-pb-10" ref={wrapperDiv}>
      <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
        Edit Invoice {invoice && <InvoiceStatusPill invoice={invoice} />}
      </h2>
      <p className="mercoa-mb-3 mercoa-text-xs mercoa-leading-6 mercoa-text-gray-400 mercoa-select-all">
        {invoice?.id}
      </p>

      {/*  GRAY border  */}
      <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-mb-4" />

      {/*  VENDOR SEARCH */}
      <div className="sm:mercoa-col-span-3">
        <label
          htmlFor="vendor-name"
          className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700"
        >
          Vendor
        </label>

        <div className="mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-justify-left">
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

      {/*  GRAY border  */}
      <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6" />

      <form
        onSubmit={handleSubmit(saveInvoice)}
        className={`${
          vendorId === 'new' && !mercoaSession.iframeOptions?.options?.vendors?.disableCreation
            ? 'mercoa-opacity-25 mercoa-pointer-events-none'
            : ''
        }
        ${formCols}
        mercoa-mt-6 mercoa-grid mercoa-gap-x-6 mercoa-gap-y-4`}
      >
        <label
          htmlFor="vendor-name"
          className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mb-2 mercoa-col-span-full"
        >
          Invoice Details
        </label>

        {/*  INVOICE NUMBER */}
        <div className="sm:mercoa-col-span-1">
          <div className="mercoa-flex mercoa-justify-between">
            <label
              htmlFor="invoiceNumber"
              className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-whitespace-nowrap"
            >
              Invoice #
            </label>
            <span className="mercoa-text-xs mercoa-leading-6 mercoa-text-gray-500 mercoa-ml-1">Optional</span>
          </div>

          <div className="mercoa-mt-2">
            <input
              type="text"
              {...register('invoiceNumber')}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
              placeholder="#1024"
            />
          </div>
        </div>

        {/*  INVOICE AMOUNT */}
        <div className="sm:mercoa-col-span-1">
          <label
            htmlFor="amount"
            className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
          >
            Amount
          </label>
          <div className="mercoa-relative mercoa-mt-2 mercoa-rounded-md mercoa-shadow-sm">
            <div className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-flex mercoa-items-center mercoa-pl-3">
              <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
            </div>
            <input
              type="text"
              {...register('amount')}
              className={`mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-py-1.5 mercoa-pr-[4.4rem] mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6
                ${currencyCodeToSymbol(currency).length > 1 ? 'mercoa-pl-12' : 'mercoa-pl-6'}`}
              placeholder="0.00"
            />
            <div className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center">
              <label htmlFor="currency" className="mercoa-sr-only">
                Currency
              </label>
              <select
                {...register('currency')}
                className="mercoa-h-full mercoa-rounded-md mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
              >
                {supportedCurrencies.map((option: Mercoa.CurrencyCode, index: number) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.amount?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.amount?.message.toString()}</p>
          )}
        </div>

        {/*  INVOICE DATE */}
        <div className="mercoa-col-span-1">
          <label
            htmlFor="invoiceDate"
            className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
          >
            Invoice Date
          </label>
          <div className="mercoa-relative mercoa-mt-2">
            <Controller
              control={control}
              name="invoiceDate"
              render={({ field }) => (
                <DatePicker
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                  placeholderText="Select invoice date"
                  onChange={(date) => field.onChange(date)}
                  selected={field.value}
                />
              )}
            />
          </div>
          {errors.invoiceDate?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.invoiceDate?.message.toString()}</p>
          )}
        </div>

        {/*  DUE DATE */}
        <div className="mercoa-col-span-1">
          <label
            htmlFor="dueDate"
            className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
          >
            Due Date
          </label>
          <div className="mercoa-relative mercoa-mt-2">
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                  placeholderText="Select due date"
                  onChange={(date) => field.onChange(date)}
                  selected={field.value}
                />
              )}
            />
          </div>
          {errors.dueDate?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.dueDate?.message.toString()}</p>
          )}
        </div>

        {/*  SCHEDULED PAYMENT DATE */}
        <div className="mercoa-col-span-1">
          <label
            htmlFor="deductionDate"
            className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-whitespace-nowrap"
          >
            Scheduled Payment Date
          </label>
          <div className="mercoa-relative mercoa-mt-2">
            <Controller
              control={control}
              name="deductionDate"
              render={({ field }) => (
                <DatePicker
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                  placeholderText="Scheduled payment date"
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
              {...register('description')}
              rows={3}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
              defaultValue={''}
            />
          </div>
        </div>

        {/*  LINE ITEMS */}
        {!mercoaSession.iframeOptions?.options?.invoice?.disableLineItems && (
          <>
            {/*  GRAY border  */}
            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

            <div className="mercoa-col-span-full">
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
                calculateTotalAmountFromLineItems={calculateTotalAmountFromLineItems}
              />
            </div>
          </>
        )}

        {/*  METADATA  */}
        {(mercoaSession.organization?.metadataSchema?.filter(
          (schema) =>
            !schema.lineItem &&
            showMetadata({
              schema,
              entityMetadata: entityMetadata.find((m) => m.key === schema.key),
              hasDocument: !!uploadedImage || !!invoice?.hasDocuments,
              hasNoLineItems: fields.length === 0,
              paymentDestination: destinationPaymentMethods.find((pm) => pm.id === paymentDestinationId),
              paymentSource: sourcePaymentMethods.find((pm) => pm.id === paymentSourceId),
            }),
        )?.length ?? 0) > 0 && (
          <>
            {/*  GRAY border  */}
            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />
            <label
              htmlFor="vendor-name"
              className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mb-2 mercoa-col-span-full"
            >
              Additional Invoice Details
            </label>

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
                  hasNoLineItems={fields.length === 0}
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
          </>
        )}

        {/*  GRAY border  */}
        <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

        {/*  PAYMENT SOURCE */}
        <div className="mercoa-pb-6 mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mt-5">
            How do you want to pay?
          </h2>
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
              watch={watch}
              setValue={setValue}
            />
          )}
        </div>

        {/*  GRAY border  */}
        <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-6 mercoa-col-span-full" />

        {/*  PAYMENT DESTINATION  */}
        {vendorName && (
          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-pb-16 mercoa-col-span-full">
            <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mt-5">
              How does <span className="mercoa-text-gray-800 mercoa-underline">{vendorName}</span> want to get paid?
            </h2>
            <SelectPaymentSource
              paymentMethods={destinationPaymentMethods}
              paymentMethodSchemas={paymentMethodSchemas}
              currentPaymentMethodId={invoice?.paymentDestinationId}
              isDestination
              vendorId={vendorId}
              watch={watch}
              setValue={setValue}
              refreshVendorPaymentMethods={refreshVendorPaymentMethods}
            />
            {invoice?.id &&
              invoice?.status != Mercoa.InvoiceStatus.Canceled &&
              invoice?.status != Mercoa.InvoiceStatus.Archived &&
              !mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
                <MercoaButton
                  isEmphasized={false}
                  onClick={getVendorLink}
                  className="mercoa-inline-flex mercoa-text-sm mercoa-float-right mercoa-mt-3"
                  type="button"
                >
                  <DocumentDuplicateIcon className="mercoa-h-5 mercoa-w-5 md:mercoa-mr-2" />{' '}
                  <span className="mercoa-hidden md:mercoa-inline-block">Get Payment Acceptance Link</span>
                </MercoaButton>
              )}
          </div>
        )}

        {/* APPROVALS */}
        <div className="mercoa-col-span-full">
          {invoice && (
            <div className="mercoa-space-y-4">
              <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900 mercoa-mt-5">
                Approvals
              </h2>
              {invoice?.approvers && invoice.approvers.length > 0 && selectedApprovers && (
                <>
                  {invoice.status === Mercoa.InvoiceStatus.Draft ? (
                    <Controller
                      control={control}
                      name="approvers"
                      render={({ field: { onChange } }) => (
                        <ApproversSelection
                          approverSlots={invoice.approvers}
                          selectedApprovers={selectedApprovers}
                          setSelectedApprovers={handleApproverSelect}
                          formOnChange={onChange}
                        />
                      )}
                    />
                  ) : (
                    <>
                      {invoice?.approvers?.map((slot) => {
                        const user = mercoaSession.users.find((user) => user.id === slot.assignedUserId)
                        if (user) {
                          return <ApproverWell key={user.id} approverSlot={slot} approver={user} />
                        }
                      })}
                    </>
                  )}
                  {errors.approvers && (
                    <p className="mercoa-text-sm mercoa-text-red-500">Please select all approvers</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mercoa-col-span-full" style={{ visibility: 'hidden' }}>
          <ErrorOverview errors={errors} clearErrors={clearErrors} />
        </div>

        {/* ACTION BUTTONS */}
        {invoice?.status != Mercoa.InvoiceStatus.Canceled &&
          invoice?.status != Mercoa.InvoiceStatus.Archived &&
          invoice?.status != Mercoa.InvoiceStatus.Paid && (
            <div className="mercoa-absolute mercoa-bottom-0 mercoa-right-0 mercoa-w-full mercoa-bg-white mercoa-z-10">
              {isSaving ? (
                <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-p-2">
                  <LoadingSpinnerIcon />
                </div>
              ) : (
                <>
                  <ErrorOverview errors={errors} clearErrors={clearErrors} />
                  <div className=" mercoa-container mercoa-mx-auto mercoa-flex mercoa-flex-row-reverse mercoa-items-center mercoa-gap-2 mercoa-py-3 mercoa-px-4 sm:mercoa-px-6 lg:mercoa-px-8">
                    <ApproverActionButton invoice={invoice} refreshInvoice={refreshInvoice} setIsSaving={setIsSaving} />
                    {invoice?.status != Mercoa.InvoiceStatus.Scheduled && (
                      <>
                        {!mercoaSession.iframeOptions?.options?.vendors?.disableCreation &&
                          selectedVendor &&
                          !selectedVendor?.email && (
                            <MercoaButton isEmphasized disabled={true}>
                              Vendor Email Required
                            </MercoaButton>
                          )}
                        {nextInvoiceState === Mercoa.InvoiceStatus.Scheduled &&
                        paymentDestinationOptions?.type === 'check' &&
                        paymentDestinationOptions?.delivery === 'PRINT' ? (
                          <>{printCheckButton}</>
                        ) : (
                          <SaveInvoiceButton
                            nextInvoiceState={nextInvoiceState}
                            setValue={setValue}
                            approvers={invoice?.approvers}
                            approverSlots={approvers}
                          />
                        )}
                        {nextInvoiceState === 'NEW' && invoice?.status !== 'NEW' && (
                          <MercoaButton isEmphasized={false} onClick={() => setValue('saveAsDraft', true)}>
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
                </>
              )}
            </div>
          )}
      </form>

      {/*  GRAY border  */}
      <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-mb-4" />

      {invoice?.id && invoice.id !== 'new' ? <InvoiceComments invoice={invoice} /> : <div className="mercoa-mt-10" />}

      {invoice?.status === Mercoa.InvoiceStatus.Paid &&
        paymentDestinationOptions?.type === 'check' &&
        paymentDestinationOptions?.delivery === 'PRINT' && (
          <div className="mercoa-mt-10 mercoa-flex mercoa-flex-row-reverse">{printCheckButton}</div>
        )}

      <div className="mercoa-mt-20" />
    </div>
  )
}

function ErrorOverview({ errors, clearErrors }: { errors: FieldErrors; clearErrors: Function }) {
  const errorKeys = Object.keys(errors)
  if (errorKeys.length === 0) return null

  const keyToField = {
    invoiceNumber: 'Invoice Number',
    amount: 'Amount',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    deductionDate: 'Scheduled Payment Date',
    currency: 'Currency',
    vendorId: 'Vendor',
    paymentSourceId: 'Payment Source',
    paymentDestinationId: 'Payment Destination',
    approvers: 'Approvers',
    lineItems: 'Line Items',
  } as Record<string, string>

  const errorMessages = {
    approvers: 'Please select all approvers',
    lineItems: 'Please make sure all line items have a description and amount.',
  } as Record<string, string>

  return (
    <div className="mercoa-bg-red-50 mercoa-border-l-4 mercoa-border-red-400 mercoa-p-4 mercoa-relative">
      {/* close button */}
      <button
        type="button"
        className="mercoa-absolute mercoa-top-1 mercoa-right-1 mercoa-p-1 mercoa-rounded-md hover:mercoa-bg-red-100 focus:mercoa-outline-none focus:mercoa-bg-red-100"
        onClick={() => clearErrors()}
      >
        <span className="mercoa-sr-only">Close</span>
        <XMarkIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
      </button>
      <div className="mercoa-flex">
        <div className="mercoa-flex-shrink-0">
          <ExclamationCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-red-400" aria-hidden="true" />
        </div>
        <div className="mercoa-ml-3">
          <h3 className="mercoa-text-sm mercoa-font-medium mercoa-text-red-800">
            There were errors with your submission
          </h3>
          <div className="mercoa-mt-2 mercoa-text-sm mercoa-text-red-700">
            <ul className="mercoa-list-disc mercoa-pl-5 mercoa-space-y-1">
              {errorKeys.map((key) => (
                <li key={key}>{`${keyToField[key]}: ${errors[key]?.message ?? errorMessages[key] ?? ''}`}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function SaveInvoiceButton({
  nextInvoiceState,
  setValue,
  approverSlots,
  approvers,
}: {
  nextInvoiceState: string
  setValue: Function
  approverSlots?: { approvalSlotId: string; assignedUserId: string | undefined }[]
  approvers?: Mercoa.ApprovalSlot[]
}) {
  let text = 'Next'
  switch (nextInvoiceState) {
    case Mercoa.InvoiceStatus.Draft:
      text = 'Save Draft'
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
    return <></>
  }
  if (
    text === 'Submit for Approval' &&
    approverSlots &&
    approverSlots.length > 0 &&
    !approverSlots.every((e) => e.assignedUserId)
  ) {
    return (
      <MercoaButton type="submit" isEmphasized disabled>
        Please assign all approvers
      </MercoaButton>
    )
  }
  return (
    <MercoaButton type="submit" isEmphasized onClick={() => setValue('saveAsDraft', false)}>
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
              className="mercoa-relative mercoa-z-10"
              onClose={() => setShowCancelInvoice(false)}
              initialFocus={cancelButtonRef}
            >
              <Transition.Child
                as={Fragment}
                enter="mercoa-ease-out mercoa-duration-300"
                enterFrom="mercoa-opacity-0"
                enterTo="mercoa-opacity-100"
                leave="mercoa-ease-in mercoa-duration-200"
                leaveFrom="mercoa-opacity-100"
                leaveTo="mercoa-opacity-0"
              >
                <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-mercoa-opacity-75 mercoa-transition-opacity" />
              </Transition.Child>

              <div className="mercoa-fixed mercoa-inset-0 mercoa-z-10 mercoa-overflow-y-auto">
                <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
                  <Transition.Child
                    as={Fragment}
                    enter="mercoa-ease-out mercoa-duration-300"
                    enterFrom="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
                    enterTo="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                    leave="mercoa-ease-in mercoa-duration-200"
                    leaveFrom="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                    leaveTo="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
                  >
                    <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-overflow-hidden mercoa-rounded-lg mercoa-bg-white mercoa-px-4 mercoa-pb-4 mercoa-pt-5 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-lg sm:mercoa-p-6">
                      <div className="sm:mercoa-flex sm:mercoa-items-start">
                        <div className="mercoa-mx-auto mercoa-flex mercoa-h-12 mercoa-w-12 mercoa-flex-shrink-0 mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-bg-red-100 sm:mercoa-mx-0 sm:mercoa-h-10 sm:mercoa-w-10">
                          <ExclamationTriangleIcon
                            className="mercoa-h-6 mercoa-w-6 mercoa-text-red-600"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mercoa-mt-3 mercoa-text-center sm:mercoa-ml-4 sm:mercoa-mt-0 sm:mercoa-text-left">
                          <Dialog.Title
                            as="h3"
                            className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900"
                          >
                            {buttonText}
                          </Dialog.Title>
                          <div className="mercoa-mt-2">
                            <p className="mercoa-text-sm mercoa-text-gray-500">{promptText}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mercoa-mt-5 sm:mercoa-mt-4 sm:mercoa-flex sm:mercoa-flex-row-reverse">
                        <button
                          type="button"
                          className="mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-rounded-md mercoa-bg-red-600 mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-red-500 sm:mercoa-ml-3 sm:mercoa-w-auto"
                          onClick={cancel}
                        >
                          {buttonText}
                        </button>
                        <button
                          type="button"
                          className="mercoa-mt-3 mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-rounded-md mercoa-bg-white mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 sm:mercoa-mt-0 sm:mercoa-w-auto"
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
  watch,
  setValue,
  isSource,
  isDestination,
  vendorId,
  currentPaymentMethodId,
  refreshVendorPaymentMethods,
}: {
  paymentMethods: Array<Mercoa.PaymentMethodResponse>
  paymentMethodSchemas: Array<Mercoa.CustomPaymentMethodSchemaResponse>
  watch: Function
  setValue: Function
  isSource?: boolean
  isDestination?: boolean
  vendorId?: string
  currentPaymentMethodId?: string
  refreshVendorPaymentMethods?: Function
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
  if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'check')) {
    availableTypes.push({ key: 'check', value: 'Check' })
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
    } else if (paymentMethods.some((paymentMethod) => paymentMethod.type === 'check')) {
      setValue(paymentMethodTypeKey, 'check')
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
    if (currentPaymentMethodId) {
      const paymentMethod = paymentMethods.find((paymentMethod) => paymentMethod.id === currentPaymentMethodId)
      if (paymentMethod) {
        setValue(sourceOrDestination, paymentMethod.id)
        return
      }
    }

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
  }, [paymentMethods])

  // if selectedType changes, set the payment method id to the first payment method of that type
  function setMethodOnTypeChange(selectedType: Mercoa.PaymentMethodType) {
    if (selectedType === Mercoa.PaymentMethodType.BankAccount) {
      setValue(
        sourceOrDestination,
        paymentMethods.find((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount)?.id,
      )
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
  }

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
    <div className="mercoa-mt-4">
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
          {paymentMethods
            ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount)
            .map((paymentMethod) => (
              <div key={paymentMethod.id} className="mercoa-mt-1">
                <BankAccountComponent
                  account={paymentMethod as Mercoa.PaymentMethodResponse.BankAccount}
                  selected={paymentId === paymentMethod.id}
                  onSelect={() => setValue(sourceOrDestination, paymentMethod.id)}
                />
              </div>
            ))}
          {isDestination && (
            <AddBankAccountDialog
              entityId={vendorId}
              onSelect={async (paymentMethod: Mercoa.PaymentMethodResponse.BankAccount) => {
                if (refreshVendorPaymentMethods) await refreshVendorPaymentMethods()
                setTimeout(() => {
                  setValue(paymentMethodTypeKey, Mercoa.PaymentMethodType.BankAccount, { shouldDirty: true })
                  setValue(sourceOrDestination, paymentMethod.id)
                }, 100)
              }}
            />
          )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Check && (
        <>
          {paymentMethods
            ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Check)
            .map((paymentMethod) => (
              <div key={paymentMethod.id} className="mercoa-mt-1">
                <CheckComponent
                  account={paymentMethod as Mercoa.PaymentMethodResponse.Check}
                  selected={paymentId === paymentMethod.id}
                  onSelect={() => setValue(sourceOrDestination, paymentMethod.id)}
                />
              </div>
            ))}
          {isDestination && (
            <>
              <AddCheckDialog
                entityId={vendorId}
                onSelect={async (paymentMethod: Mercoa.PaymentMethodResponse.Check) => {
                  if (refreshVendorPaymentMethods) await refreshVendorPaymentMethods()
                  setTimeout(() => {
                    setValue(paymentMethodTypeKey, Mercoa.PaymentMethodType.Check, { shouldDirty: true })
                    setValue(sourceOrDestination, paymentMethod.id)
                  }, 100)
                }}
              />
              <div className="mercoa-mt-2" />
              <MercoaCombobox
                label="Check Delivery Method"
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
                  const destOption = watch('paymentDestinationOptions')
                  if (destOption?.type === 'check') {
                    return destOption.delivery === 'MAIL'
                      ? { key: 'MAIL', value: 'Mail it for me' }
                      : { key: 'PRINT', value: 'Print it myself' }
                  }
                }}
              />
            </>
          )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Card && (
        <>
          {paymentMethods
            ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Card)
            .map((paymentMethod) => (
              <div key={paymentMethod.id} className="mercoa-mt-1">
                <CreditCardComponent
                  account={paymentMethod as Mercoa.PaymentMethodResponse.Card}
                  selected={paymentId === paymentMethod.id}
                  onSelect={() => setValue(sourceOrDestination, paymentMethod.id)}
                />
              </div>
            ))}
        </>
      )}
      {selectedType.startsWith('cpms_') && (
        <>
          {paymentMethods
            ?.filter(
              (paymentMethod) => (paymentMethod as Mercoa.PaymentMethodResponse.Custom).schemaId === selectedType,
            )
            .map((paymentMethod) => (
              <div key={paymentMethod.id} className="mercoa-mt-1">
                <CustomPaymentMethodComponent
                  account={paymentMethod as Mercoa.PaymentMethodResponse.Custom}
                  selected={paymentId === paymentMethod.id}
                  onSelect={() => setValue(sourceOrDestination, paymentMethod.id)}
                />
              </div>
            ))}
        </>
      )}
    </div>
  )
}

// Approvers

function ApproversSelection({
  approverSlots,
  selectedApprovers,
  setSelectedApprovers,
  formOnChange,
}: {
  approverSlots: Mercoa.ApprovalSlot[]
  selectedApprovers: (Mercoa.ApprovalSlotAssignment | undefined)[]
  setSelectedApprovers: (
    slotIndex: number,
    approver: Mercoa.ApprovalSlotAssignment,
    formOnChange: (val: any) => void,
  ) => void
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
    <>
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
    </>
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
          <div className={classNames('mercoa-flex mercoa-items-center mercoa-rounded-md', bgColor)}>
            <div className="mercoa-flex-auto mercoa-p-3">
              <div className={classNames('mercoa-text-sm mercoa-font-medium', 'mercoa-text-grey-900')}>
                {approver.name}
              </div>
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

function ApproverActionButton({
  invoice,
  refreshInvoice,
  setIsSaving,
}: {
  invoice?: Mercoa.InvoiceResponse
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  setIsSaving: (isSaving: boolean) => void
}) {
  const mercoaSession = useMercoaSession()
  if (invoice?.status != Mercoa.InvoiceStatus.New) return <></>
  const approverSlot = invoice.approvers.find((e) => e.assignedUserId === mercoaSession.user?.id)
  if (!approverSlot)
    return (
      <span className="mercoa-text-center mercoa-text-gray-800 mercoa-font-medium mercoa-p-3 mercoa-rounded-md mercoa-bg-gray-50">
        Waiting for approval
      </span>
    )
  const handleApprove = () => {
    const approvalData: Mercoa.ApprovalRequest = {
      userId: approverSlot.assignedUserId ?? '',
    }
    if (approvalData.userId) {
      setIsSaving(true)
      mercoaSession.client?.invoice.approval
        .approve(invoice.id, approvalData)
        .then(() => {
          setIsSaving(false)
          toast.success('Invoice approved')
          refreshInvoice(invoice.id)
        })
        .catch((e) => {
          setIsSaving(false)
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
      setIsSaving(true)
      mercoaSession.client?.invoice.approval
        .reject(invoice.id, approvalData)
        .then(() => {
          setIsSaving(false)
          toast.success('Invoice rejected')
          refreshInvoice(invoice.id)
        })
        .catch((e) => {
          setIsSaving(false)
          console.log(e)
          toast.error('There was an error rejecting this invoice. Please try again.')
        })
    }
  }

  return (
    <div className="mercoa-flex mercoa-items-center mercoa-justify-end mercoa-gap-x-2">
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

// Metadata

export function MetadataSelection({
  schema,
  value,
  entityMetadata,
  setValue,
  hasDocument,
  hasNoLineItems,
  paymentDestination,
  paymentSource,
  lineItem,
  skipValidation,
}: {
  schema: Mercoa.MetadataSchema
  value?: string
  entityMetadata?: Mercoa.EntityMetadataResponse
  setValue: (e: string) => void
  hasDocument: boolean
  hasNoLineItems: boolean
  paymentDestination?: Mercoa.PaymentMethodResponse
  paymentSource?: Mercoa.PaymentMethodResponse
  lineItem?: boolean
  skipValidation?: boolean
}) {
  const [edit, setEdit] = useState(!value)

  // Filter out empty values from metadata
  if (entityMetadata) {
    entityMetadata.value = entityMetadata.value.filter((e) => e)

    if (schema.type === Mercoa.MetadataType.KeyValue) {
      entityMetadata.value = entityMetadata.value.filter((e) => {
        try {
          const parsedValue = dJSON.parse(e) as { key: string; value: string }
          return parsedValue.key && parsedValue.value
        } catch (e) {
          console.error(e)
        }
        return false
      })
    }
    if (entityMetadata?.value.length === 0) {
      entityMetadata = undefined
    }
  }

  if (
    !skipValidation &&
    !showMetadata({
      schema,
      entityMetadata,
      hasDocument,
      hasNoLineItems,
      paymentDestination,
      paymentSource,
      lineItem,
    })
  ) {
    return <></>
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
      {schema.type === Mercoa.MetadataType.Date && (
        <MetadataDate setValue={setValue} value={value} displayName={schema.displayName} />
      )}
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
    <div className="mercoa-col-span-full">
      <h3 className="mercoa-mt-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
        {schema.displayName}
      </h3>
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
    if (Array.isArray(value)) comboboxValue = value
    else comboboxValue = value?.split(',')
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
      freeText
    />
  )
}

function MetadataDate({
  setValue,
  value,
  displayName,
}: {
  setValue: (e: string) => void
  value?: string
  displayName: string
}) {
  return (
    <DatePicker
      className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 sm:mercoa-text-sm"
      placeholderText={`Select ${displayName}`}
      onChange={(date) => {
        if (date) {
          setValue(date.toISOString())
        }
      }}
      selected={(() => {
        if (dayjs(value).isValid()) {
          return dayjs(value).toDate()
        }
        return undefined
      })()}
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
    <div className="mercoa-space-y-4 sm:mercoa-flex sm:mercoa-items-center sm:mercoa-space-x-10 sm:mercoa-space-y-0">
      <div className="mercoa-flex mercoa-items-center">
        <input
          type="radio"
          name={`true-false-${schema.key}`}
          defaultChecked={value === 'true'}
          className="mercoa-h-4 mercoa-w-4 mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary"
          onChange={() => setValue('true')}
        />
        <label
          htmlFor={`true-false-${schema.key}`}
          className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
        >
          Yes
        </label>
      </div>

      <div className="mercoa-flex mercoa-items-center">
        <input
          type="radio"
          name={`true-false-${schema.key}`}
          defaultChecked={value === 'false'}
          className="mercoa-h-4 mercoa-w-4 mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary"
          onChange={() => setValue('false')}
        />
        <label
          htmlFor={`true-false-${schema.key}`}
          className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
        >
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
    <div className="mercoa-flex mercoa-items-center">
      <div className="mercoa-flex-auto">
        <div className={classNames('mercoa-flex mercoa-items-center mercoa-rounded-md')}>
          <div className="mercoa-flex-auto mercoa-p-3">
            <div className={classNames('mercoa-text-sm mercoa-font-medium', 'mercoa-text-grey-900')}>
              {schema.displayName}
            </div>
            <div className="mercoa-text-sm mercoa-text-gray-500">{value}</div>
          </div>
          <button
            type="button"
            onClick={setEdit}
            className="mercoa-mx-4 mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75 mercoa-cursor-pointer "
          >
            <PencilSquareIcon className="mercoa-w-5 mercoa-h-5" />
          </button>
        </div>
      </div>
    </div>
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
  calculateTotalAmountFromLineItems,
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
  calculateTotalAmountFromLineItems: () => void
}) {
  const mercoaSession = useMercoaSession()
  return (
    <div className="mercoa-grid mercoa-grid-cols-1 mercoa-gap-x-6 mercoa-gap-y-4">
      {/* HEADER */}
      <div className="mercoa-flex mercoa-items-center mercoa-mt-5">
        <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-700 mercoa-text-lg">
          Line Items
        </h2>
        <button
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
          className="mercoa-ml-4 mercoa-flex-shrink-0 mercoa-col-span-1"
        >
          <Tooltip title="Add line item">
            <PlusCircleIcon
              className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400 hover:mercoa-opacity-75"
              aria-hidden="true"
            />
          </Tooltip>
          <span className="mercoa-sr-only">Add line item</span>
        </button>
      </div>
      {/* ROWS */}
      <div className="mercoa-overflow-x-hidden hover:mercoa-overflow-x-visible mercoa-pointer-events-none">
        <table
          className="mercoa-min-w-full mercoa-divide-y mercoa-divide-gray-300 mercoa-w-[600px] mercoa-relative mercoa-mb-6 mercoa-pointer-events-auto"
          id="lineItemsTable"
        >
          <thead>
            <tr className="mercoa-divide-x mercoa-divide-gray-200">
              <th
                scope="col"
                className="mercoa-px-4 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
              >
                Amount
              </th>
              <th
                scope="col"
                className="mercoa-px-4 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-min-w-[300px]"
              >
                Description
              </th>
              {mercoaSession.organization?.metadataSchema
                ?.filter((schema) => schema.lineItem)
                .map((schema) => {
                  return (
                    <th
                      scope="col"
                      className="mercoa-px-4 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-min-w-[200px]"
                      key={schema.key}
                    >
                      {schema.displayName}
                    </th>
                  )
                })}
              {/* <th
                scope="col"
                className="mercoa-px-4 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
              >
                Qty
              </th>
              <th
                scope="col"
                className="mercoa-px-4 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
              >
                Price
              </th> */}
              <th>
                <span className="mercoa-sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="mercoa-divide-y mercoa-divide-gray-200 mercoa-bg-white">
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
            {(lineItems?.length ?? 0) > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="mercoa-py-1">
                    <MercoaButton
                      size="sm"
                      isEmphasized={false}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        calculateTotalAmountFromLineItems()
                      }}
                      type="button"
                    >
                      Calculate total invoice amount
                    </MercoaButton>
                  </td>
                </tr>
                <tr />
                {/* Add a row for the bottom border */}
              </>
            )}
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
    <div className="mercoa-w-full mercoa-h-[10px] mercoa-bg-gray-100 mercoa-relative mercoa-pointer-events-auto">
      <Draggable axis="x" bounds="parent" onDrag={(e, data) => onDrag(data)}>
        <div
          className="mercoa-h-[10px] mercoa-bg-gray-300 hover:mercoa-bg-gray-400 mercoa-absolute mercoa-top-0"
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
    <tr className="mercoa-divide-x mercoa-divide-gray-200">
      <td className="mercoa-whitespace-nowrap mercoa-py-1 mercoa-pl-1 mercoa-pr-1 mercoa-text-sm mercoa-text-gray-500 sm:pr-0">
        <div className="mercoa-relative">
          <div className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-flex mercoa-items-center mercoa-pl-3">
            <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
          </div>
          <input
            type="text"
            className={`mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-py-1.5 
            mercoa-text-gray-900 
            placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6 mercoa-pl-6
            ${currencyCodeToSymbol(currency).length > 1 ? 'mercoa-pl-12' : 'mercoa-pl-6'}`}
            placeholder="0.00"
            {...register(`lineItems.${index}.amount`)}
          />
        </div>
      </td>
      <td className="mercoa-whitespace-nowrap mercoa-p-1 mercoa-text-sm mercoa-text-gray-500">
        {' '}
        <input
          type="text"
          className="mercoa-block mercoa-w-full mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900
           placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
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
            <td className="mercoa-whitespace-nowrap mercoa-text-sm mercoa-text-gray-500" key={schema.key}>
              <MetadataSelection
                entityMetadata={entityMetadata.find((m) => m.key === schema.key)}
                schema={schema}
                value={value}
                hasNoLineItems={false}
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
                    let newMetadata = {} as Record<string, string>
                    if (metadata) {
                      newMetadata = (
                        typeof metadata === 'string'
                          ? JSON.parse(metadata ?? '{}')
                          : JSON.parse(JSON.stringify(metadata))
                      ) as Record<string, string>
                    }
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
      {/* <td className="mercoa-whitespace-nowrap mercoa-p-1 mercoa-text-sm mercoa-text-gray-500">
        <input
          type="text"
          className={`mercoa-block mercoa-w-full mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 
            placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6`}
          placeholder="1"
          {...register(`lineItems.${index}.quantity`)}
        />
      </td>
      <td className="mercoa-whitespace-nowrap mercoa-p-1 mercoa-text-sm mercoa-text-gray-500">
        <div className="mercoa-relative">
          <div className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-flex mercoa-items-center mercoa-pl-3">
            <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
          </div>
          <input
            type="text"
            className={`mercoa-block mercoa-w-full mercoa-border-0 mercoa-py-1.5 
            mercoa-text-gray-900 
            placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6 mercoa-pl-6
            ${currencyCodeToSymbol(currency).length > 1 ? 'mercoa-pl-12' : 'mercoa-pl-6'}`}
            placeholder="0.00"
            {...register(`lineItems.${index}.unitPrice`)}
          />
        </div>
      </td> */}
      <td className="mercoa-whitespace-nowrap mercoa-py-1 mercoa-pl-1 mercoa-pr-1 mercoa-text-sm mercoa-text-gray-500 sm:pr-0">
        <button type="button" onClick={() => remove(index)}>
          <XMarkIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
          <span className="mercoa-sr-only">Remove line item</span>
        </button>
      </td>
    </tr>
  )
}

const ProgressBar = () => {
  const [progressPercentage, setProgressPercentage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressPercentage((prevProgressPercentage) => {
        if (prevProgressPercentage === 100) {
          return 80
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

function showMetadata({
  schema,
  hasDocument,
  hasNoLineItems,
  entityMetadata,
  lineItem,
  paymentDestination,
  paymentSource,
}: {
  schema: Mercoa.MetadataSchema
  hasDocument: boolean
  hasNoLineItems: boolean
  entityMetadata?: Mercoa.EntityMetadataResponse
  lineItem?: boolean
  paymentDestination?: Mercoa.PaymentMethodResponse
  paymentSource?: Mercoa.PaymentMethodResponse
}) {
  if (schema.showConditions?.hasDocument && !hasDocument) {
    return false
  }

  if (schema.showConditions?.hasNoLineItems && !hasNoLineItems) {
    return false
  }

  if (schema.type === Mercoa.MetadataType.KeyValue && !entityMetadata) {
    return false
  }

  if (schema.showConditions?.hasOptions && !entityMetadata) {
    return false
  }

  if (schema.lineItem && !lineItem) {
    return false
  }

  if (schema.showConditions?.paymentDestinationTypes && schema.showConditions.paymentDestinationTypes.length > 0) {
    if (!paymentDestination) return false
    if (!schema.showConditions.paymentDestinationTypes.includes(paymentDestination.type)) return false
    if (schema.showConditions.paymentDestinationTypes.includes('custom')) {
      if (paymentDestination.type != Mercoa.PaymentMethodType.Custom) return false
      if (!schema.showConditions?.paymentDestinationCustomSchemaIds?.includes(paymentDestination.schemaId)) return false
    }
  }

  if (schema.showConditions?.paymentSourceTypes && schema.showConditions.paymentSourceTypes.length > 0) {
    if (!paymentSource) return false
    if (!schema.showConditions.paymentSourceTypes.includes(paymentSource.type)) return false
    if (schema.showConditions.paymentSourceTypes.includes('custom')) {
      if (paymentSource.type != Mercoa.PaymentMethodType.Custom) return false
      if (!schema.showConditions?.paymentSourceCustomSchemaIds?.includes(paymentSource.schemaId)) return false
    }
  }

  return true
}
