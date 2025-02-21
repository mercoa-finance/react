import { NoSession, useMercoaSession, usePayableDetailsContext } from '../../../../components'
import { DocumentUploadBox } from './components/document-upload-box'
import { OcrProgressBar } from './components/ocr-progress-bar'
import { PayableDocumentDisplay } from './components/payable-document-display'

export function PayableDocument() {
  const mercoaSession = useMercoaSession()

  const { handleFileUpload, ocrProcessing, documents, sourceEmails, invoice, height } = usePayableDetailsContext()

  if (!mercoaSession.client) return <NoSession componentName="PayableDocument" />

  return (
    <div className={`mercoa-p-5 mercoa-rounded-mercoa`}>
      {documents && documents.length > 0 ? (
        <>
          <OcrProgressBar ocrProcessing={ocrProcessing} />
          <PayableDocumentDisplay
            documents={documents}
            invoice={invoice}
            height={height}
            showSourceEmail
            sourceEmails={sourceEmails}
          />
        </>
      ) : (
        <div className={`mercoa-min-w-[340px]`}>
          <DocumentUploadBox onFileUpload={handleFileUpload} />
        </div>
      )}
    </div>
  )
}
