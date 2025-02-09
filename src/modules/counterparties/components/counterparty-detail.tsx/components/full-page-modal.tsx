import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

function FullPageModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="mercoa-ease-out mercoa-duration-300"
          enterFrom="mercoa-opacity-0"
          enterTo="mercoa-opacity-100"
          leave="mercoa-ease-in mercoa-duration-200"
          leaveFrom="mercoa-opacity-100"
          leaveTo="mercoa-opacity-0"
        >
          <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-opacity-75" />
        </Transition.Child>

        <div className="mercoa-fixed mercoa-inset-0 mercoa-z-10 mercoa-overflow-y-scroll">
          <div className="mercoa-flex mercoa-min-h-full mercoa-items-center mercoa-justify-center mercoa-p-4">
            <Transition.Child
              as={Fragment}
              enter="mercoa-ease-out mercoa-duration-300"
              enterFrom="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
              enterTo="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
              leave="mercoa-ease-in mercoa-duration-200"
              leaveFrom="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
              leaveTo="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
            >
              <Dialog.Panel className="mercoa-relative mercoa-w-[90vw] mercoa-h-[90vh] mercoa-overflow-hidden mercoa-rounded-lg mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-shadow-xl mercoa-transition-all">
                <div className="mercoa-flex mercoa-justify-end mercoa-p-4">
                  <button
                    onClick={onClose}
                    className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-gray-500 mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-white hover:mercoa-bg-gray-600"
                  >
                    Close
                  </button>
                </div>
                <div className="mercoa-overflow-auto mercoa-h-[calc(100%-64px)] mercoa-p-6">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export { FullPageModal }
