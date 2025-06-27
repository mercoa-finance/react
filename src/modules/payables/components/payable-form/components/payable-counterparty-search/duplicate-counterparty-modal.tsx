import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton } from '../../../../../../components'
import { capitalize } from '../../../../../../lib/lib'

interface DuplicateCounterpartyModalProps {
  isOpen: boolean
  onCreateNew: () => void
  onUseExisting: (counterparty: Mercoa.CounterpartyResponse) => void
  duplicateInfo?: {
    duplicates: Mercoa.CounterpartyResponse[]
    foundType: string
    foundString: string
    type: 'payee' | 'payor'
  }
}

export function DuplicateCounterpartyModal({
  isOpen,
  onCreateNew,
  onUseExisting,
  duplicateInfo,
}: DuplicateCounterpartyModalProps) {
  const [selectedDuplicate, setSelectedDuplicate] = useState<Mercoa.CounterpartyResponse | undefined>(
    duplicateInfo?.duplicates[0],
  )

  useEffect(() => {
    if (duplicateInfo?.duplicates.length && duplicateInfo.duplicates.length > 0) {
      setSelectedDuplicate(duplicateInfo.duplicates[0])
    }
  }, [duplicateInfo])

  if (!duplicateInfo) return null

  const entityType = duplicateInfo.type === 'payee' ? 'vendor' : 'customer'

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-black mercoa-bg-opacity-25" />
        </Transition.Child>

        <div className="mercoa-fixed mercoa-inset-0 mercoa-overflow-y-auto">
          <div className="mercoa-flex mercoa-min-h-full mercoa-items-center mercoa-justify-center mercoa-p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mercoa-w-full mercoa-max-w-md mercoa-transform mercoa-overflow-hidden mercoa-rounded-2xl mercoa-bg-white mercoa-p-6 mercoa-text-left mercoa-align-middle mercoa-shadow-xl mercoa-transition-all">
                <Dialog.Title
                  as="h3"
                  className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                >
                  {duplicateInfo.duplicates.length === 1
                    ? `Duplicate ${capitalize(entityType)} Found`
                    : `Duplicate ${capitalize(entityType)}s Found`}
                </Dialog.Title>
                <div className="mercoa-mt-2">
                  <p className="mercoa-text-sm mercoa-text-gray-500 mercoa-leading-relaxed">
                    {duplicateInfo.duplicates.length === 1 ? (
                      <>
                        A {entityType} with the same {duplicateInfo.foundType}{' '}
                        <strong>{duplicateInfo.foundString}</strong> already exists. Would you like to use this existing{' '}
                        {entityType}?
                      </>
                    ) : (
                      <>
                        We found {duplicateInfo.duplicates.length} {entityType}s with the same {duplicateInfo.foundType}{' '}
                        <strong>{duplicateInfo.foundString}</strong>. Would you like to use one of these existing{' '}
                        {entityType}s?
                      </>
                    )}
                  </p>
                  <div className="mercoa-mt-4">
                    <h4 className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">
                      Existing {entityType} details:
                    </h4>
                    <div className="mercoa-space-y-2 mercoa-max-h-60 mercoa-overflow-y-auto">
                      {duplicateInfo.duplicates.map((counterparty, index) => (
                        <label
                          key={index}
                          className={`mercoa-flex mercoa-items-center mercoa-p-4 mercoa-rounded-lg mercoa-bg-gray-50 mercoa-cursor-pointer hover:mercoa-bg-gray-100 mercoa-transition-all`}
                        >
                          <input
                            type="radio"
                            name="duplicate"
                            checked={selectedDuplicate?.id === counterparty.id}
                            onChange={() => setSelectedDuplicate(counterparty)}
                            className="mercoa-h-4 mercoa-w-4 mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-1 focus:mercoa-ring-mercoa-primary"
                          />
                          <div className="mercoa-ml-4 mercoa-text-sm mercoa-text-gray-500">
                            <p>Name: {counterparty.name}</p>
                            {counterparty.email && <p>Email: {counterparty.email}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mercoa-mt-6 mercoa-flex mercoa-justify-end mercoa-gap-3">
                  <MercoaButton onClick={onCreateNew} isEmphasized={false}>
                    Create New
                  </MercoaButton>
                  <MercoaButton
                    onClick={() => selectedDuplicate && onUseExisting(selectedDuplicate)}
                    isEmphasized
                    disabled={!selectedDuplicate}
                  >
                    Use Existing
                  </MercoaButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
