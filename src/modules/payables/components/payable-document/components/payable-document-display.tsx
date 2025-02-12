import {
  ArrowDownTrayIcon,
  ArrowPathRoundedSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
  EnvelopeIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import useResizeObserver from '@react-hook/resize-observer'
import dayjs from 'dayjs'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import { Mercoa } from '@mercoa/javascript'
import {
  inputClassName,
  LoadingSpinnerIcon,
  MercoaButton,
  NoSession,
  useDebounce,
  useMercoaSession,
} from '../../../../../components'

export function PayableDocumentDisplay({
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
