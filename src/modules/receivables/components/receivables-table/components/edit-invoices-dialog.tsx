import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { DialogTitle } from '@radix-ui/react-dialog'
import dayjs from 'dayjs'
import React from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceStatusPill, MercoaButton } from '../../../../../components'
import { Dialog } from '../../../../../lib/components'
import { ReceivableDetails } from '../../receivable-details'

interface EditInvoicesDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  selectedInvoices: Mercoa.InvoiceResponse[]
  setSelectedInvoices: (invoices: Mercoa.InvoiceResponse[]) => void
}

export const EditInvoicesDialog: React.FC<EditInvoicesDialogProps> = ({
  open,
  setOpen,
  selectedInvoices,
  setSelectedInvoices,
}) => {
  const [activeInvoiceIndex, setActiveInvoiceIndex] = React.useState(0)
  const activeInvoice = selectedInvoices[activeInvoiceIndex]
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [toastMessage, setToastMessage] = React.useState<{ type: 'success' | 'error' | 'info'; message: string }>()

  const handleNext = () => {
    if (activeInvoiceIndex < selectedInvoices.length - 1) {
      setActiveInvoiceIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (activeInvoiceIndex > 0) {
      setActiveInvoiceIndex((prev) => prev - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="mercoa-w-[95vw] mercoa-h-[95vh] mercoa-flex mercoa-flex-col mercoa-bg-white mercoa-text-[#1A1919] mercoa-p-6 mercoa-rounded-lg mercoa-shadow-xl">
        <div className="mercoa-flex mercoa-justify-between mercoa-items-center mercoa-border-b mercoa-border-gray-200 mercoa-pb-4 mercoa-relative">
          {toastMessage && (
            <div
              className={`mercoa-absolute mercoa-left-1/2 mercoa-w-fit mercoa-transform mercoa--translate-x-1/2 mercoa-text-sm mercoa-px-4 mercoa-py-2 mercoa-rounded-lg mercoa-shadow-lg mercoa-z-50 ${
                toastMessage.type === 'success'
                  ? 'mercoa-bg-green-50 mercoa-text-green-700'
                  : toastMessage.type === 'error'
                  ? 'mercoa-bg-red-50 mercoa-text-red-700'
                  : 'mercoa-bg-blue-50 mercoa-text-blue-700'
              }`}
            >
              {toastMessage.message}
            </div>
          )}
          <DialogTitle>
            <h2 className="mercoa-text-2xl mercoa-font-semibold mercoa-text-[#1A1919]">Edit Invoices</h2>
          </DialogTitle>
          <MercoaButton
            isEmphasized={false}
            hideOutline={true}
            color="gray"
            onClick={() => setOpen(false)}
            className="mercoa-text-[14px] mercoa-font-medium mercoa-text-[#1A1919] hover:mercoa-underline"
          >
            Close
          </MercoaButton>
        </div>

        <div className="mercoa-flex mercoa-flex-1 mercoa-relative mercoa-border mercoa-border-gray-100">
          <div
            className={` mercoa-overflow-y-auto mercoa-transition-all ${
              isSidebarOpen ? 'mercoa-w-[15%]' : 'mercoa-w-0'
            }`}
          >
            <div className="mercoa-overflow-y-auto mercoa-max-h-[calc(95vh-120px)] [&::-webkit-scrollbar]:mercoa-w-1 [&::-webkit-scrollbar-thumb]:mercoa-bg-gray-300 [&::-webkit-scrollbar-track]:mercoa-bg-gray-100">
              {selectedInvoices.map((invoice, index) => (
                <div
                  key={invoice.id}
                  onClick={() => setActiveInvoiceIndex(index)}
                  className={`mercoa-p-2 mercoa-cursor-pointer hover:mercoa-bg-gray-50 mercoa-border-b mercoa-border-gray-200 ${
                    index === activeInvoiceIndex ? 'mercoa-bg-gray-100' : ''
                  } ${!isSidebarOpen ? 'mercoa-hidden' : ''}`}
                >
                  <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                    <span className="mercoa-text-xs mercoa-bg-indigo-100 mercoa-px-2 mercoa-py-0.5 mercoa-rounded-md mercoa-truncate mercoa-max-w-[100px]">
                      {invoice.invoiceNumber || invoice.id}
                    </span>
                    <span className="mercoa-text-xs mercoa-bg-yellow-100 mercoa-px-2 mercoa-py-0.5 mercoa-rounded-xl">
                      ${invoice.amount?.toFixed(2)}
                    </span>
                  </div>

                  <div className="mercoa-flex mercoa-justify-between mercoa-items-center mercoa-mt-1">
                    <div className="mercoa-font-medium mercoa-truncate mercoa-text-sm">
                      {invoice.payer?.name || '-'}
                    </div>
                    <InvoiceStatusPill
                      status={invoice.status}
                      failureType={invoice.failureType}
                      amount={invoice.amount}
                      payerId={invoice.payerId}
                      vendorId={invoice.vendorId}
                      dueDate={invoice.dueDate}
                      paymentSourceId={invoice.paymentSourceId}
                      paymentDestinationId={invoice.paymentDestinationId}
                      type="receivable"
                    />
                  </div>

                  <div className="mercoa-text-xs mercoa-text-gray-500">
                    Due: {invoice.dueDate ? dayjs(invoice.dueDate).format('MMM DD') : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mercoa-flex-1 mercoa-flex mercoa-flex-col mercoa-relative">
            <div
              className="mercoa-absolute mercoa-left-0 mercoa-top-2 mercoa-z-10 mercoa-cursor-pointer mercoa-transform mercoa-translate-x-[-50%] mercoa-overflow-visible"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <div className="mercoa-rounded-full mercoa-bg-gray-100 mercoa-p-1 hover:mercoa-bg-gray-200 mercoa-shadow-sm">
                {isSidebarOpen ? (
                  <ChevronLeftIcon className="mercoa-w-4 mercoa-h-4 mercoa-text-gray-600" />
                ) : (
                  <ChevronRightIcon className="mercoa-w-4 mercoa-h-4 mercoa-text-gray-600" />
                )}
              </div>
            </div>
            <div className="mercoa-flex-1 mercoa-overflow-auto mercoa-py-4 mercoa-pl-4 mercoa-border mercoa-border-gray-100">
              <ReceivableDetails
                queryOptions={{
                  invoiceId: activeInvoice?.id,
                  invoiceType: 'invoice',
                }}
                handlers={{
                  onInvoiceUpdate: (invoice) => {
                    if (invoice) {
                      setSelectedInvoices(
                        selectedInvoices.map((inv, index) => (index === activeInvoiceIndex ? invoice : inv)),
                      )
                    }
                  },
                }}
                displayOptions={{
                  heightOffset: 280,
                }}
                renderCustom={{
                  toast: {
                    success: (message) => {
                      toast.success(message)
                      setToastMessage({ type: 'success', message })
                      setTimeout(() => {
                        setToastMessage(undefined)
                      }, 3000)
                    },
                    error: (message) => {
                      toast.error(message)
                      setToastMessage({ type: 'error', message })
                      setTimeout(() => {
                        setToastMessage(undefined)
                      }, 3000)
                    },
                    info: (message) => {
                      toast.info(message)
                      setToastMessage({ type: 'info', message })
                      setTimeout(() => {
                        setToastMessage(undefined)
                      }, 3000)
                    },
                  },
                }}
              />
            </div>

            {/* Navigation Controls */}
            <div className="mercoa-flex mercoa-justify-between mercoa-p-2 mercoa-border mercoa-border-gray-100">
              <MercoaButton onClick={handlePrev} disabled={activeInvoiceIndex === 0} isEmphasized={true}>
                Previous
              </MercoaButton>
              <div className="mercoa-text-sm mercoa-text-gray-500">
                {activeInvoiceIndex + 1} of {selectedInvoices.length}
              </div>
              <MercoaButton
                onClick={handleNext}
                disabled={activeInvoiceIndex === selectedInvoices.length - 1}
                isEmphasized={true}
              >
                Next
              </MercoaButton>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
