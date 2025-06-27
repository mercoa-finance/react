import { Combobox } from '@headlessui/react'
import { ChevronUpDownIcon, PencilSquareIcon, PlusIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { CounterpartyAddOrEditForm } from '../../../../components/Counterparties'
import { inputClassName, NoSession } from '../../../../components/generics'
import { useMercoaSession } from '../../../../components/Mercoa'
import { DuplicateCounterpartyModal } from '../../../payables/components/payable-form/components/payable-counterparty-search/duplicate-counterparty-modal'
import { PayableFormData } from '../../../payables/components/payable-form/types'
import { CounterpartyFormAction } from '../../constants'
import { useCounterpartySearch } from '../../hooks/use-counterparty-search'

export function CounterpartySearchBase() {
  const mercoaSession = useMercoaSession()
  const {
    dataContextValue: {
      counterparties: counterpartyData,
      selectedCounterparty,
      setSelectedCounterparty,
      hasMore,
      search,
      setSearch,
    },
    formContextValue: { edit, setEdit },
    propsContextValue: { config, handlers, renderCustom },
  } = useCounterpartySearch()

  const [counterparties, setCounterparties] = useState<Mercoa.CounterpartyResponse[]>([])

  useEffect(() => {
    if (!counterpartyData) return
    setCounterparties(counterpartyData)
  }, [counterpartyData])

  const buttonRef = useRef<HTMLButtonElement>(null)

  // Handle custom rendering
  if (renderCustom?.counterpartySearchBase) {
    return renderCustom.counterpartySearchBase({
      counterparties,
      selectedCounterparty,
      onSearchChangeCb: (search) => {
        setSearch(search.toLowerCase() ?? '')
      },
      setSelectedCounterparty,
    })
  }

  // Show selected counterparty
  if (selectedCounterparty?.id && selectedCounterparty?.id !== 'new' && !edit) {
    return renderCustom?.selectedCounterparty ? (
      renderCustom.selectedCounterparty({
        selectedCounterparty,
        clearSelection: () => setSelectedCounterparty(undefined),
        readOnly: config?.readOnly,
        disableCreation: config?.disableCreation,
      })
    ) : (
      <div className="mercoa-w-full mercoa-flex mercoa-items-center">
        <div className="mercoa-flex-auto">
          <div className="mercoa-flex mercoa-items-center mercoa-rounded-mercoa">
            <div className="mercoa-flex-auto mercoa-p-3">
              <div className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">{selectedCounterparty?.name}</div>
              {!config?.disableCreation && (
                <div className="mercoa-text-sm mercoa-text-gray-500">{selectedCounterparty?.email}</div>
              )}
            </div>
            {!config?.readOnly && (
              <>
                <button
                  onClick={() => setSelectedCounterparty(undefined)}
                  type="button"
                  className="mercoa-ml-4 mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75"
                >
                  <XCircleIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
                  <span className="mercoa-sr-only">Clear</span>
                </button>
                {!config?.disableCreation && (
                  <button
                    onClick={() => setEdit(true)}
                    type="button"
                    className="mercoa-ml-4 mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75"
                  >
                    <PencilSquareIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
                    <span className="mercoa-sr-only">Edit</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Adding a counterparty
  if (selectedCounterparty?.id === 'new') {
    if (search) {
      return (
        <CounterpartyAddOrEditForm
          name={search}
          onComplete={(e) => {
            setSelectedCounterparty(e)
            setTimeout(() => setEdit(true), 100)
          }}
          onExit={setSelectedCounterparty}
          enableOnboardingLinkOnCreate={config?.enableOnboardingLinkOnCreate}
        />
      )
    } else if (selectedCounterparty) {
      return (
        <CounterpartyAddOrEditForm
          counterparty={selectedCounterparty}
          onComplete={setSelectedCounterparty}
          onExit={setSelectedCounterparty}
          enableOnboardingLinkOnCreate={config?.enableOnboardingLinkOnCreate}
        />
      )
    }
  }

  // Editing a counterparty
  else if (selectedCounterparty?.id && edit) {
    return (
      <CounterpartyAddOrEditForm
        counterparty={selectedCounterparty}
        onComplete={setSelectedCounterparty}
        onExit={setSelectedCounterparty}
        enableOnboardingLinkOnCreate={config?.enableOnboardingLinkOnCreate}
      />
    )
  }

  // Show loading state
  if (!counterparties) {
    return (
      <div className="mercoa-relative mercoa-mt-2">
        <input className={inputClassName({})} placeholder="Loading..." readOnly />
        <button className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 focus:mercoa-outline-none">
          <ChevronUpDownIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
        </button>
      </div>
    )
  }

  if (!mercoaSession.client) return <NoSession componentName="CounterpartySearch" />

  // Show search dropdown
  return (
    <>
      {renderCustom?.counterpartySearchDropdown ? (
        renderCustom.counterpartySearchDropdown({
          counterparties,
          selectedCounterparty,
          onSearchChangeCb: (search) => {
            setSearch(search.toLowerCase() ?? '')
          },
          setSelectedCounterparty,
        })
      ) : (
        <Combobox
          as="div"
          value={selectedCounterparty}
          onChange={setSelectedCounterparty}
          nullable
          className="mercoa-w-full"
        >
          {({ open }) => (
            <div className="mercoa-relative mercoa-mt-2 mercoa-w-full">
              <Combobox.Input
                placeholder="Enter a company name..."
                autoComplete="off"
                className="mercoa-w-full mercoa-rounded-mercoa mercoa-border-0 mercoa-bg-white mercoa-py-1.5 mercoa-pl-3 mercoa-pr-10 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
                onFocus={() => {
                  if (open) return
                  setSearch('')
                  buttonRef.current?.click()
                }}
                onChange={(event) => {
                  setSearch(event.target.value?.toLowerCase() ?? '')
                }}
                displayValue={(e: Mercoa.CounterpartyResponse) => e?.name ?? ''}
              />
              <Combobox.Button
                className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 focus:mercoa-outline-none"
                ref={buttonRef}
              >
                <ChevronUpDownIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
              </Combobox.Button>

              <Combobox.Options className="mercoa-absolute mercoa-z-10 mercoa-mt-1 mercoa-max-h-60 mercoa-w-full mercoa-overflow-auto mercoa-rounded-mercoa mercoa-bg-white mercoa-py-1 mercoa-text-base mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none sm:mercoa-text-sm">
                {counterparties.map((cp) => (
                  <Combobox.Option
                    key={cp.id}
                    value={cp}
                    className={({ active }) =>
                      `mercoa-relative mercoa-cursor-pointer mercoa-py-2 mercoa-pl-3 mercoa-pr-9 ${
                        active
                          ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
                          : 'mercoa-text-gray-900'
                      }`
                    }
                  >
                    <span>{cp.name}</span>
                  </Combobox.Option>
                ))}
                {hasMore && (
                  <Combobox.Option
                    className="mercoa-relative mercoa-cursor-default mercoa-select-none mercoa-py-2 mercoa-pl-3 mercoa-pr-9 mercoa-bg-gray-200 mercoa-text-gray-600"
                    disabled
                    value=""
                  >
                    <div className="mercoa-flex mercoa-justify-center mercoa-py-2">
                      <span className="mercoa-text-gray-500">
                        Showing first 10 results. Type to search all{' '}
                        {config?.type === 'payor' ? 'customers' : 'vendors'}.
                      </span>
                    </div>
                  </Combobox.Option>
                )}
                {!config?.disableCreation && (
                  <Combobox.Option value={{ id: 'new' }}>
                    {({ active }) => (
                      <div
                        className={`mercoa-flex mercoa-items-center mercoa-cursor-pointer mercoa-py-2 mercoa-pl-3 mercoa-pr-9 ${
                          active
                            ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
                            : 'mercoa-text-gray-900'
                        }`}
                      >
                        <PlusIcon className="mercoa-size-5 mercoa-pr-1" />
                        Add New
                      </div>
                    )}
                  </Combobox.Option>
                )}
              </Combobox.Options>
            </div>
          )}
        </Combobox>
      )}
    </>
  )
}

export function CounterpartySearchInternal() {
  const {
    dataContextValue: { duplicateVendorInfo, setSelectedCounterparty, setDuplicateVendorInfo },
    formContextValue: { formMethods, handleFormAction },
    displayContextValue: { duplicateVendorModalOpen, setDuplicateVendorModalOpen },
  } = useCounterpartySearch()

  const { handleSubmit, setValue } = formMethods

  return (
    <>
      <FormProvider {...formMethods}>
        <form
          onSubmit={formMethods.handleSubmit((data) => handleFormAction(data, data.vendor.formAction))}
          className="mercoa-p-3 mercoa-bg-gray-100 mercoa-rounded-mercoa mercoa-relative mercoa-w-full"
        >
          <CounterpartySearchBase />
        </form>
      </FormProvider>
      <DuplicateCounterpartyModal
        isOpen={duplicateVendorModalOpen}
        onCreateNew={async () => {
          setDuplicateVendorModalOpen(false)
          setValue('formAction', CounterpartyFormAction.CREATE_DUPLICATE_COUNTERPARTY)
          handleSubmit((data: PayableFormData) =>
            handleFormAction(data, CounterpartyFormAction.CREATE_DUPLICATE_COUNTERPARTY),
          )()
        }}
        onUseExisting={(counterparty) => {
          setDuplicateVendorModalOpen(false)
          setSelectedCounterparty(counterparty)
          setDuplicateVendorInfo(undefined)
        }}
        duplicateInfo={duplicateVendorInfo}
      />
    </>
  )
}
