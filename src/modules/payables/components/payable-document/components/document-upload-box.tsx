import { PhotoIcon } from '@heroicons/react/24/outline'
import { cn } from '../../../../../lib/style'
import Dropzone from 'react-dropzone'
import { toast } from 'react-toastify'

export function DocumentUploadBox({
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
        console.log('called2')
        blobToDataUrl(acceptedFiles[0]).then((fileReaderObj) => {
          console.log('called3')
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
          className={cn(
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
