import { Bar, Container, Section } from '@column-resizer/react'
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import useResizeObserver from '@react-hook/resize-observer'
import Big from 'big.js'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import Draggable from 'react-draggable'
import Dropzone from 'react-dropzone'
import { Controller, FieldArrayWithId, FieldErrors, useFieldArray, useForm } from 'react-hook-form'
import { Document, Page, pdfjs } from 'react-pdf'
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
  MercoaContext,
  Tooltip,
  useDebounce,
  useMercoaSession,
} from './index'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

const dJSON = require('dirty-json')

dayjs.extend(minMax)

export function InvoiceDetails({
  invoiceId,
  invoice,
  onRedirect,
  children,
  heightOffset,
}: {
  invoiceId?: Mercoa.InvoiceId
  invoice?: Mercoa.InvoiceResponse
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
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

  async function onFileUpload(fileReaderObj: string, mimeType: string) {
    setUploadedFile({ fileReaderObj, mimeType })
    setUploadedImage(fileReaderObj)
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
          <InvoiceDocuments
            documents={new Array(uploadedFile)}
            height={height}
            onFileUpload={onFileUpload}
            invoiceStatus={invoice?.status}
          />
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
            height={height}
          />
        )}
      </Section>
    </Container>
  )
}

function InvoiceDocumentsUpload({ onFileUpload }: { onFileUpload: (fileReaderObj: string, mimeType: string) => void }) {
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
  onFileUpload,
  invoiceStatus,
}: {
  documents: Array<{ fileReaderObj: string; mimeType: string }>
  height: number
  onFileUpload: (fileReaderObj: string, mimeType: string) => void
  invoiceStatus?: Mercoa.InvoiceStatus
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
    <div className="mercoa-flex mercoa-justify-center mercoa-mb-1">
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
                    error={
                      <embed
                        src={document.fileReaderObj}
                        key={document.fileReaderObj}
                        className="mercoa-mt-2"
                        height={height}
                        width={debouncedWidth - 5}
                        type="application/pdf"
                      />
                    }
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
              <a
                href={document.fileReaderObj}
                target="_blank"
                rel="noreferrer"
                className="mercoa-mt-2 mercoa-mr-2"
                download
              >
                <MercoaButton type="button" isEmphasized={false} className="mercoa-mt-2">
                  <span className="mercoa-hidden xl:mercoa-inline">
                    <ArrowDownTrayIcon className="-mercoa-ml-1 mercoa-mr-2 mercoa-inline-flex mercoa-h-5 mercoa-w-5" />{' '}
                    Download Invoice
                  </span>
                  <span className="mercoa-inline xl:mercoa-hidden">Download</span>
                </MercoaButton>
              </a>
              {/* {(!invoiceStatus || invoiceStatus === Mercoa.InvoiceStatus.Draft) && (
                <MercoaButton
                  type="button"
                  isEmphasized={false}
                  onClick={(e) => {
                    if (
                      confirm(
                        'Are you sure you want to reprocess this invoice? Any changes you have made may be overwritten.',
                      )
                    ) {
                      onFileUpload(documents[0].fileReaderObj, documents[0].mimeType)
                    }
                  }}
                >
                  <span className="mercoa-hidden xl:mercoa-inline">
                    <ArrowPathIcon className="-mercoa-ml-1 mercoa-mr-2 mercoa-inline-flex mercoa-h-5 mercoa-w-5" />{' '}
                    Reprocess Invoice
                  </span>
                  <span className="mercoa-inline xl:mercoa-hidden">Reprocess Invoice</span>
                </MercoaButton>
              )} */}
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
  height,
}: {
  invoice?: Mercoa.InvoiceResponse
  ocrResponse?: Mercoa.OcrResponse
  uploadedImage?: string
  setUploadedImage: (e?: string) => void
  onRedirect: (invoice: Mercoa.InvoiceResponse | undefined) => void
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  height: number
}) {
  const mercoaSession = useMercoaSession()

  const [sourcePaymentMethods, setSourcePaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse>>([])
  const [paymentMethodSchemas, setPaymentMethodSchemas] = useState<Array<Mercoa.CustomPaymentMethodSchemaResponse>>([])
  const [destinationPaymentMethods, setDestinationPaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse>>([])
  const [supportedCurrencies, setSupportedCurrencies] = useState<Array<Mercoa.CurrencyCode>>([])
  const [selectedVendor, setSelectedVendor] = useState<Mercoa.EntityResponse | undefined>(invoice?.vendor)
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
    },
  })

  useEffect(() => {
    setValue(
      'approvers',
      invoice?.approvers
        ? invoice.approvers.map((approver) => ({
            approvalSlotId: approver.approvalSlotId,
            assignedUserId: approver.assignedUserId,
          }))
        : [],
    )
  }, [invoice])

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

  // Auto-calculate line item amounts and total amount

  function calculateTotalAmountFromLineItems(lineItems: Mercoa.InvoiceLineItemRequest[]) {
    if (lineItems?.find((e) => isNaN(e.amount as number))) {
      setError('amount', { type: 'manual', message: 'Please enter a valid number' })
      return
    }
    let amount = new Big(0)
    lineItems?.forEach((lineItem, index) => {
      amount = amount.add(Number(lineItem.amount))
    })
    clearErrors('amount')
    setValue('amount', amount.toNumber())
    setFocus('amount')
  }

  // Get payment methods

  async function refreshPayerPaymentMethods() {
    if (!mercoaSession.token || !mercoaSession.entity?.id || !mercoaSession.client) return
    const resp = await mercoaSession.client?.entity.paymentMethod.getAll(mercoaSession.entity?.id)
    if (resp) {
      setSourcePaymentMethods(resp)
    }
  }

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

  // Offline Payment Source
  const isPaymentSourceOffPlatform: boolean =
    sourcePaymentMethods.find((e) => e.id === paymentSourceId)?.type === 'offPlatform'

  useEffect(() => {
    if (vendorId && isPaymentSourceOffPlatform) {
      createOffPlatformPaymentMethod({
        entityId: vendorId,
        paymentMethods: destinationPaymentMethods,
        sourceOrDestination: 'paymentDestinationId',
        setValue,
        clearErrors,
        mercoaSession,
        refreshPaymentMethods: async () => {
          await refreshPayerPaymentMethods()
          await refreshVendorPaymentMethods()
        },
      })
    }
  }, [vendorId, isPaymentSourceOffPlatform])

  // OCR Merge
  useEffect(() => {
    if (!ocrResponse) return
    if (ocrResponse.invoice.amount) setValue('amount', ocrResponse.invoice.amount)
    if (ocrResponse.invoice.invoiceNumber) setValue('invoiceNumber', ocrResponse.invoice.invoiceNumber)
    if (ocrResponse.invoice.invoiceDate)
      setValue('invoiceDate', dayjs(ocrResponse.invoice.invoiceDate.toDateString()).toDate())
    if (ocrResponse.invoice.dueDate) setValue('dueDate', dayjs(ocrResponse.invoice.dueDate.toDateString()).toDate())
    if (ocrResponse.invoice.deductionDate)
      setValue('deductionDate', dayjs(ocrResponse.invoice.deductionDate.toDateString()).toDate())
    if (ocrResponse.invoice.currency) setValue('currency', ocrResponse.invoice.currency)
    if (ocrResponse.invoice.metadata) setValue('metadata', JSON.stringify(ocrResponse.invoice.metadata))
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

    if (!selectedVendor) {
      if (ocrResponse.vendor.id === 'new' && mercoaSession.iframeOptions?.options?.vendors?.disableCreation) {
        console.log('new vendor creation disabled')
      } else if (ocrResponse.vendor.id) {
        console.log('setting selected vendor', ocrResponse.vendor)
        setSelectedVendor(ocrResponse.vendor)
      }
    }
  }, [ocrResponse, selectedVendor])

  const saveInvoice = async (data: any) => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return

    let nextInvoiceState: Mercoa.InvoiceStatus = Mercoa.InvoiceStatus.Draft
    if (invoice?.status === Mercoa.InvoiceStatus.Draft) {
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

    setIsSaving(true)
    const invoiceData: Mercoa.InvoiceCreationRequest = {
      status: data.saveAsDraft ? invoice?.status ?? Mercoa.InvoiceStatus.Draft : nextInvoiceState,
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
      ...(data.paymentMethodDestinationType === 'check' && {
        paymentDestinationOptions: data.paymentDestinationOptions ?? {
          type: 'check',
          delivery: 'MAIL',
        },
      }),
      lineItems: data.lineItems.map((lineItem: any) => {
        const out: Mercoa.InvoiceLineItemRequest = {
          ...(lineItem.id && { id: lineItem.id }),
          description: lineItem.description,
          amount: Number(lineItem.amount),
          quantity: Number(lineItem.quantity),
          unitPrice: Number(lineItem.unitPrice),
          metadata: lineItem.metadata,
          currency: data.currency ?? 'USD',
          glAccountId: lineItem.glAccountId,
        }
        return out
      }),
      metadata: JSON.parse(data.metadata) as Record<string, string>,
      document: uploadedImage,
      creatorEntityId: mercoaSession.entity?.id,
    }
    console.log({ data, invoiceData })

    // Check if a vendor is selected
    if (!data.saveAsDraft) {
      if (!data.vendorId && invoice?.id) {
        toast.error('Please select a vendor')
        setError('vendorId', { type: 'manual', message: 'Please select a vendor' })
        setIsSaving(false)
        return
      }

      // if line items are required, make sure at least one line item is set
      if (
        mercoaSession.iframeOptions?.options?.invoice?.lineItems === Mercoa.LineItemAvailabilities.Required &&
        invoiceData.lineItems?.length === 0
      ) {
        setError('lineItems', { type: 'manual', message: 'At least one line item is required' })
        setIsSaving(false)
        return
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
          setError('amount', { type: 'manual', message: 'Line item amounts do not match total amount' })
          setIsSaving(false)
          return
        }
      }

      // check that amount is at least 0.01
      if (Number(data.amount) < 0.01) {
        toast.error('Amount must be at least 0.01')
        setError('amount', { type: 'manual', message: 'Amount must be at least 0.01' })
        setIsSaving(false)
        return
      }

      // Check if payment methods are selected
      if (!data.paymentSourceId && invoice?.id) {
        toast.error('Please select a payment source')
        setError('paymentSourceId', { type: 'manual', message: 'Please select how you want to pay' })
        setIsSaving(false)
        return
      }
      if (!data.paymentDestinationId && invoice?.id) {
        toast.error('Please select a payment destination')
        setError('paymentDestinationId', { type: 'manual', message: 'Please select how the vendor wants to get paid' })
        setIsSaving(false)
        return
      }

      // Check if approvers are assigned
      if (invoiceData.status !== Mercoa.InvoiceStatus.Draft) {
        if (invoiceData.approvers?.length !== invoice?.approvers.length) {
          toast.error('Please assign all approvers for this invoice.')
          setError('approvers', { type: 'manual', message: 'Please assign all approvers for this invoice.' })
          setIsSaving(false)
          return
        }
      }

      if (nextInvoiceState === Mercoa.InvoiceStatus.Scheduled) {
        if (!invoiceData.deductionDate) {
          toast.error('Please select a payment date')
          setError('deductionDate', { type: 'manual', message: 'Please select a payment date' })
          setIsSaving(false)
          return
        }
      }

      if (destinationPaymentMethods.find((e) => e.id === data.paymentDestinationId)?.type === 'check') {
        const paymentSource = sourcePaymentMethods.find((e) => e.id === data.paymentSourceId)
        if (paymentSource?.type !== 'bankAccount') {
          setError('paymentSourceId', {
            type: 'manual',
            message: 'Please select a bank account that is authorized to send checks',
          })
          setIsSaving(false)
          return
        } else if (!paymentSource.checkOptions?.enabled) {
          setError('paymentSourceId', { type: 'manual', message: 'This bank account is not authorized to send checks' })
          setIsSaving(false)
          return
        }
      }
    }

    console.log('invoiceData before API call: ', { invoiceData })
    if (invoice) {
      mercoaSession.client?.invoice
        .update(invoice.id, invoiceData)
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
          setIsSaving(false)
        })
    }
  }

  async function getVendorLink() {
    if (!invoice?.id) return
    const url = await mercoaSession.client?.invoice.paymentLinks.getVendorLink(invoice.id)
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
              clearErrors('vendorId')
            }}
            counterparty={selectedVendor}
          />
        </div>
        {errors.vendorId?.message && (
          <p className="mercoa-text-sm mercoa-text-red-500">{errors.vendorId?.message.toString()}</p>
        )}
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
                  minDate={dayjs().toDate()}
                  filterDate={isWeekday}
                />
              )}
            />
          </div>
          {errors.deductionDate?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.deductionDate?.message.toString()}</p>
          )}
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
        {mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled && (
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
          <SelectPaymentSource
            paymentMethods={sourcePaymentMethods}
            paymentMethodSchemas={paymentMethodSchemas}
            currentPaymentMethodId={invoice?.paymentSourceId}
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
        {vendorName && !isPaymentSourceOffPlatform && (
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
                  <DocumentDuplicateIcon className="mercoa-h-5 mercoa-w-5 md:mercoa-mr-2" />{' '}
                  <span className="mercoa-hidden md:mercoa-inline-block">Get Payment Acceptance Link</span>
                </MercoaButton>
              )} */}
            {errors.paymentDestinationId?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentDestinationId?.message.toString()}</p>
            )}
          </div>
        )}

        {/* APPROVALS */}
        <div className="mercoa-col-span-full">
          {invoice && (
            <div className="mercoa-space-y-4">
              {invoice?.approvers && invoice?.approvers.length > 0 && (
                <>
                  <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900 mercoa-mt-5">
                    Approvals
                  </h2>
                  {invoice.status === Mercoa.InvoiceStatus.Draft ? (
                    <ApproversSelection
                      approvalPolicies={invoice?.approvalPolicy}
                      approverSlots={invoice?.approvers}
                      selectedApprovers={approvers}
                      setValue={setValue}
                    />
                  ) : (
                    <ApproverWells approvers={invoice.approvers} />
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
        <ActionBar
          invoice={invoice}
          refreshInvoice={refreshInvoice}
          setIsSaving={setIsSaving}
          isSaving={isSaving}
          errors={errors}
          clearErrors={clearErrors}
          setValue={setValue}
          approverSlots={approvers}
          onRedirect={onRedirect}
        />
      </form>

      {/*  GRAY border  */}
      <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-mb-4" />

      {invoice?.id && invoice.id !== 'new' ? <InvoiceComments invoice={invoice} /> : <div className="mercoa-mt-10" />}

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

// Action Bar
function ActionBar({
  invoice,
  refreshInvoice,
  setIsSaving,
  isSaving,
  errors,
  clearErrors,
  setValue,
  approverSlots,
  onRedirect,
}: {
  invoice?: Mercoa.InvoiceResponse
  refreshInvoice: (invoiceId: Mercoa.InvoiceId) => void
  setIsSaving: (isSaving: boolean) => void
  isSaving: boolean
  errors: FieldErrors
  clearErrors: Function
  setValue: Function
  approverSlots?: { approvalSlotId: string; assignedUserId: string | undefined }[]
  onRedirect?: Function
}) {
  const mercoaSession = useMercoaSession()

  const buttons: React.ReactNode[] = []

  const deleteButton = (
    <MercoaButton
      isEmphasized={false}
      type="button"
      color="red"
      onClick={() => {
        if (!invoice?.id) return
        setIsSaving(true)
        mercoaSession.client?.invoice
          .delete(invoice.id)
          .then(() => {
            toast.success('Invoice deleted')
            setIsSaving(false)
            if (onRedirect) onRedirect()
          })
          .catch((e) => {
            console.log(e.statusCode)
            console.log(e.body)
            toast.error(`There was an error deleting the invoice.\n Error: ${e.body}`)
            setIsSaving(false)
          })
      }}
    >
      Delete Invoice
    </MercoaButton>
  )

  const archiveButton = (
    <MercoaButton
      isEmphasized={false}
      type="button"
      color="red"
      onClick={() => {
        if (!invoice?.id) return
        setIsSaving(true)
        mercoaSession.client?.invoice
          .update(invoice.id, { status: Mercoa.InvoiceStatus.Archived })
          .then((resp) => {
            if (resp) {
              console.log(resp)
              toast.success('Invoice archived')
              if (onRedirect) onRedirect()
            }
            setIsSaving(false)
          })
          .catch((e) => {
            console.log(e.statusCode)
            console.log(e.body)
            toast.error(`There was an error archiving the invoice.\n Error: ${e.body}`)
            setIsSaving(false)
          })
      }}
    >
      Archive Invoice
    </MercoaButton>
  )

  const cancelButton = (
    <MercoaButton
      isEmphasized={false}
      type="button"
      color="red"
      onClick={() => {
        if (!invoice?.id) return
        setIsSaving(true)
        mercoaSession.client?.invoice
          .update(invoice.id, { status: Mercoa.InvoiceStatus.Canceled })
          .then((resp) => {
            if (resp) {
              console.log(resp)
              toast.success('Invoice canceled')
              refreshInvoice(resp.id)
            }
            setIsSaving(false)
          })
          .catch((e) => {
            console.log(e.statusCode)
            console.log(e.body)
            toast.error(`There was an error canceling the invoice.\n Error: ${e.body}`)
            setIsSaving(false)
          })
      }}
    >
      Cancel Payment
    </MercoaButton>
  )

  const saveDraftButton = (
    <MercoaButton
      isEmphasized={false}
      type="submit"
      onClick={() => {
        setValue('saveAsDraft', true)
      }}
    >
      Save Draft
    </MercoaButton>
  )

  const printCheck = (
    <MercoaButton
      type="button"
      isEmphasized
      onClick={async () => {
        if (!invoice?.id) return
        setIsSaving(true)
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
        setIsSaving(false)
      }}
    >
      {invoice?.paymentDestinationOptions?.delivery === Mercoa.CheckDeliveryMethod.Print
        ? 'Print Check'
        : 'View Mailed Check'}
    </MercoaButton>
  )

  // Creating a brand new invoice
  if (!invoice?.id) {
    buttons.push(
      <MercoaButton isEmphasized type="submit">
        Create Invoice
      </MercoaButton>,
    )
  } else {
    switch (invoice?.status) {
      case Mercoa.InvoiceStatus.Draft:
        let saveButton = <></>
        if (approverSlots && approverSlots.length > 0) {
          if (!approverSlots.every((e) => e.assignedUserId)) {
            saveButton = (
              <MercoaButton type="submit" isEmphasized disabled>
                Please assign all approvers
              </MercoaButton>
            )
          } else {
            saveButton = (
              <MercoaButton type="submit" isEmphasized onClick={() => setValue('saveAsDraft', false)}>
                Submit for Approval
              </MercoaButton>
            )
          }
        } else {
          saveButton = (
            <MercoaButton type="submit" isEmphasized onClick={() => setValue('saveAsDraft', false)}>
              Next
            </MercoaButton>
          )
        }
        buttons.push(saveButton, saveDraftButton, deleteButton)
        break

      case Mercoa.InvoiceStatus.New:
        buttons.push(
          <ApproverActionButtons invoice={invoice} refreshInvoice={refreshInvoice} setIsSaving={setIsSaving} />,
          archiveButton,
        )

        break

      case Mercoa.InvoiceStatus.Approved:
        let nextButton = <></>
        if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.OffPlatform) {
          nextButton = (
            <MercoaButton
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
          )
        } else if (
          invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Check &&
          invoice.paymentDestinationOptions?.delivery === Mercoa.CheckDeliveryMethod.Print
        ) {
          nextButton = printCheck
        } else {
          nextButton = (
            <MercoaButton isEmphasized={true} onClick={() => setValue('saveAsDraft', false)}>
              Schedule Payment
            </MercoaButton>
          )
        }
        buttons.push(nextButton, archiveButton)

        break

      case Mercoa.InvoiceStatus.Scheduled:
        buttons.push(cancelButton)
        break

      case Mercoa.InvoiceStatus.Archived:
        break

      case Mercoa.InvoiceStatus.Pending:
      case Mercoa.InvoiceStatus.Paid:
        if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Check) {
          buttons.push(printCheck)
        }
        buttons.push(archiveButton)
        break

      case Mercoa.InvoiceStatus.Failed:
        buttons.push(
          <MercoaButton
            type="submit"
            isEmphasized
            onClick={() => {
              setValue('saveAsDraft', false)
              setValue('status', Mercoa.InvoiceStatus.Scheduled)
            }}
          >
            Retry Payment
          </MercoaButton>,
        )
        buttons.push(archiveButton)
        break

      // Rejected / Cancelled
      default:
        buttons.push(archiveButton)
        break
    }
  }

  return (
    <div className="mercoa-absolute mercoa-bottom-0 mercoa-right-0 mercoa-w-full mercoa-bg-white mercoa-z-10">
      {isSaving ? (
        <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-p-2">
          <LoadingSpinnerIcon />
        </div>
      ) : (
        <>
          <ErrorOverview errors={errors} clearErrors={clearErrors} />
          <div className=" mercoa-container mercoa-mx-auto mercoa-flex mercoa-flex-row-reverse mercoa-items-center mercoa-gap-2 mercoa-py-3 mercoa-px-4 sm:mercoa-px-6 lg:mercoa-px-8">
            {buttons.map((button, index) => (
              <div key={index}>{button}</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
// Payment Source and Destination

// Create Off-Platform Payment Method
function createOffPlatformPaymentMethod({
  entityId,
  paymentMethods,
  sourceOrDestination,
  setValue,
  clearErrors,
  mercoaSession,
  refreshPaymentMethods,
}: {
  entityId: Mercoa.EntityId
  paymentMethods: Mercoa.PaymentMethodResponse[]
  sourceOrDestination: 'paymentSourceId' | 'paymentDestinationId'
  setValue: Function
  clearErrors: Function
  mercoaSession: MercoaContext
  refreshPaymentMethods: Function
}) {
  const existingOffPlatformPaymentMethod = paymentMethods.find(
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
          clearErrors(sourceOrDestination)
        }
      })
  }
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
  refreshPayerPaymentMethods,
  clearErrors,
}: {
  paymentMethods: Array<Mercoa.PaymentMethodResponse>
  paymentMethodSchemas: Array<Mercoa.CustomPaymentMethodSchemaResponse>
  watch: Function
  setValue: Function
  isSource?: boolean
  isDestination?: boolean
  vendorId?: string
  currentPaymentMethodId?: string
  refreshVendorPaymentMethods: Function
  refreshPayerPaymentMethods: Function
  clearErrors: Function
}) {
  let paymentMethodTypeKey = 'paymentMethodSourceType'
  let sourceOrDestination: 'paymentSourceId' | 'paymentDestinationId' = 'paymentSourceId'
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

  // set a default payment method type
  useEffect(() => {
    if (currentPaymentMethodId) {
      const paymentMethod = paymentMethods.find((paymentMethod) => paymentMethod.id === currentPaymentMethodId)
      if (paymentMethod) {
        if (paymentMethod.type === 'custom') setValue(paymentMethodTypeKey, paymentMethod.schemaId)
        else setValue(paymentMethodTypeKey, paymentMethod.type)
        setValue(sourceOrDestination, paymentMethod.id)
        clearErrors(sourceOrDestination)
        return
      }
    }

    // Check for default payment method
    if (isSource) {
      const defaultPm = paymentMethods.find((e) => e.isDefaultSource)
      if (defaultPm) {
        if (defaultPm.type === 'custom') setValue(paymentMethodTypeKey, defaultPm.schemaId)
        else setValue(paymentMethodTypeKey, defaultPm.type)
        setValue(sourceOrDestination, defaultPm.id)
        clearErrors(sourceOrDestination)
        return
      }
    }

    if (isDestination) {
      const defaultPm = paymentMethods.find((e) => e.isDefaultDestination)
      if (defaultPm) {
        if (defaultPm.type === 'custom') setValue(paymentMethodTypeKey, defaultPm.schemaId)
        else setValue(paymentMethodTypeKey, defaultPm.type)
        setValue(sourceOrDestination, defaultPm.id)
        clearErrors(sourceOrDestination)
        return
      }
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
  }, [paymentMethods])

  // if selectedType changes, set the payment method id to the first payment method of that type
  function setMethodOnTypeChange(selectedType: Mercoa.PaymentMethodType | string) {
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
    clearErrors(sourceOrDestination)
  }

  // For offline payments, we need to set the correct payment method id automatically
  useEffect(() => {
    if (selectedType !== Mercoa.PaymentMethodType.OffPlatform) return

    let entityId = mercoaSession.entityId
    if (isDestination) entityId = vendorId
    if (!entityId) return
    createOffPlatformPaymentMethod({
      entityId,
      paymentMethods,
      sourceOrDestination,
      setValue,
      clearErrors,
      mercoaSession,
      refreshPaymentMethods: async () => {
        await refreshPayerPaymentMethods()
        await refreshVendorPaymentMethods()
      },
    })
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
                  onSelect={() => {
                    setValue(sourceOrDestination, paymentMethod.id)
                    clearErrors(sourceOrDestination)
                  }}
                />
              </div>
            ))}
          {isDestination &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <AddBankAccountDialog
                entityId={vendorId}
                onSelect={async (paymentMethod: Mercoa.PaymentMethodResponse.BankAccount) => {
                  if (refreshVendorPaymentMethods) await refreshVendorPaymentMethods()
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
                  onSelect={() => {
                    setValue(sourceOrDestination, paymentMethod.id)
                    clearErrors(sourceOrDestination)
                  }}
                />
              </div>
            ))}
          {isDestination &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <>
                <AddCheckDialog
                  entityId={vendorId}
                  onSelect={async (paymentMethod: Mercoa.PaymentMethodResponse.Check) => {
                    if (refreshVendorPaymentMethods) await refreshVendorPaymentMethods()
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
                {/*<div className="mercoa-mt-2" />
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
                /> */}
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
                  onSelect={() => {
                    setValue(sourceOrDestination, paymentMethod.id)
                    clearErrors(sourceOrDestination)
                  }}
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
                  onSelect={() => {
                    setValue(sourceOrDestination, paymentMethod.id)
                    clearErrors(sourceOrDestination)
                  }}
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
  approvalPolicies,
  approverSlots,
  selectedApprovers,
  setValue,
}: {
  approvalPolicies: Mercoa.ApprovalPolicyResponse[]
  approverSlots: Mercoa.ApprovalSlot[]
  selectedApprovers: ({ approvalSlotId: string; assignedUserId: string | undefined } | undefined)[]
  setValue: Function
}) {
  const mercoaSession = useMercoaSession()

  return (
    <>
      {approverSlots.map((slot, index) => (
        <Fragment key={index}>
          {isUpstreamPolicyAssigned({
            policyId: slot.approvalPolicyId,
            approvalPolicies,
            approverSlots,
            selectedApprovers,
          }) && (
            <MercoaCombobox
              label={'Assigned to'}
              onChange={(e) => {
                setValue(`approvers.${index}.assignedUserId`, e.id)
                propagateApprovalPolicy({
                  userId: e.id,
                  policyId: slot.approvalPolicyId,
                  approvalPolicies,
                  approverSlots,
                  setValue,
                  users: mercoaSession.users,
                  selectedApprovers,
                })
              }}
              value={
                mercoaSession.users.filter((user) => {
                  const approverSlot = selectedApprovers.find((e) => e?.approvalSlotId === slot.approvalSlotId)
                  if (user.id === approverSlot?.assignedUserId) return true
                })[0] ?? ''
              }
              options={[
                ...filterApproverOptions({
                  approverSlotIndex: index,
                  eligibleRoles: slot.eligibleRoles,
                  eligibleUserIds: slot.eligibleUserIds,
                  users: mercoaSession.users,
                  selectedApprovers,
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

function ApproverWells({ approvers }: { approvers: Mercoa.ApprovalSlot[] }) {
  const mercoaSession = useMercoaSession()
  const seenUsers: string[] = []
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
          <div className={`mercoa-flex mercoa-items-center mercoa-rounded-md ${bgColor}`}>
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
  if (!approverSlot) {
    return (
      <span className="mercoa-text-center mercoa-text-gray-800 mercoa-font-medium mercoa-p-3 mercoa-rounded-md mercoa-bg-gray-50">
        Waiting for approval
      </span>
    )
  }

  async function approveOrReject(action: 'approve' | 'reject') {
    if (!invoice?.id) return
    const approvalData: Mercoa.ApprovalRequest = {
      userId: approverSlot?.assignedUserId ?? '',
    }
    if (approvalData.userId) {
      setIsSaving(true)
      const resp = await mercoaSession.client?.invoice.get(invoice.id)
      if (resp?.status != Mercoa.InvoiceStatus.New) {
        refreshInvoice(invoice.id)
        setIsSaving(false)
        return
      }
      if (action === 'approve') {
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
      } else {
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
  }

  return (
    <div className="mercoa-flex mercoa-items-center mercoa-justify-end mercoa-gap-x-2">
      <MercoaButton
        disabled={approverSlot.action === Mercoa.ApproverAction.Reject}
        color="red"
        isEmphasized
        onClick={() => approveOrReject('reject')}
        type="button"
      >
        Reject
      </MercoaButton>
      <MercoaButton
        disabled={approverSlot.action === Mercoa.ApproverAction.Approve}
        color="green"
        isEmphasized
        onClick={() => approveOrReject('approve')}
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
  const [entityMetadataState, setEntityMetadataState] = useState<Mercoa.EntityMetadataResponse>()

  // Filter out empty values from metadata
  useEffect(() => {
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
      setEntityMetadataState(entityMetadata)
    }
  }, [entityMetadata])

  if (
    !skipValidation &&
    !showMetadata({
      schema,
      entityMetadata: entityMetadataState,
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
        <MetadataCombobox schema={schema} setValue={setValue} value={value} values={entityMetadataState?.value ?? []} />
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
            parsedValue = dJSON.parse(value) as { key: string; value: string }
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
        dJSON.parse(
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
        ),
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
          setValue(value.key)
        }}
        displayIndex="value"
        value={valueState}
        multiple={schema.allowMultiple}
        displaySelectedAs="pill"
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
  calculateTotalAmountFromLineItems: (lineItems: Mercoa.InvoiceLineItemRequest[]) => void
}) {
  const mercoaSession = useMercoaSession()
  const lineItemsWatch = watch('lineItems')
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
                        calculateTotalAmountFromLineItems(lineItemsWatch)
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
  selectedApprovers: ({ approvalSlotId: string; assignedUserId: string | undefined } | undefined)[]
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
  selectedApprovers: ({ approvalSlotId: string; assignedUserId: string | undefined } | undefined)[]
}) {
  const policy = approvalPolicies.find((p) => p.id === policyId)
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
  selectedApprovers: ({ approvalSlotId: string; assignedUserId: string | undefined } | undefined)[]
}) {
  const downstreamPolicies = approvalPolicies.filter((p) => p.upstreamPolicyId === policyId)
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
}
