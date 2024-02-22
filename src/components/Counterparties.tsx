import { Combobox, Dialog, Transition } from '@headlessui/react'
import {
  ChevronUpDownIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import debounce from 'lodash/debounce'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import { capitalize, constructFullName } from '../lib/lib'
import { CreditCardComponent } from './CreditCard'
import {
  BankAccountComponent,
  CheckComponent,
  CustomPaymentMethodComponent,
  DebouncedSearch,
  LoadingSpinnerIcon,
  MercoaButton,
  TableNavigation,
  useMercoaSession,
} from './index'
const human = require('humanparser')

const schema = yup
  .object({
    name: yup.string().required(),
    email: yup.string().email().required(),
    accountType: yup.string().required(),
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    middleName: yup.string(),
    suffix: yup.string(),
    businessType: yup.string(),
    website: yup.string().url('Website must start with http:// or https:// and be a valid URL'),
    description: yup.string(),
  })
  .required()

export function CounterpartySearch({
  counterparty,
  onSelect,
  type,
}: {
  counterparty?: Mercoa.CounterpartyResponse | Mercoa.EntityResponse
  onSelect?: (counterparty: Mercoa.CounterpartyResponse | Mercoa.EntityResponse) => any
  type: 'payee' | 'payor'
}) {
  const mercoaSession = useMercoaSession()

  const buttonRef = useRef<HTMLButtonElement>(null)
  const [input, setInput] = useState<string>('')
  const [edit, setEdit] = useState<boolean>(false)
  const [search, setSearch] = useState<string>()
  const [counterparties, setCounterparties] = useState<Array<Mercoa.CounterpartyResponse>>()
  const [selectedCounterparty, setSelectedCounterparty] = useState<
    Mercoa.CounterpartyResponse | Mercoa.EntityResponse | undefined
  >()

  const [searchTerm, setSearchTerm] = useState<string>()
  const debouncedSearch = useRef(debounce(setSearch, 200)).current

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm])

  // Set selected counterparty, required for OCR
  useEffect(() => {
    if (counterparty) {
      setSelectedCounterparty(counterparty)
    }
  }, [counterparty])

  // Get all counterparties
  useEffect(() => {
    if (!mercoaSession.entity?.id) return
    const networkType: Mercoa.CounterpartyNetworkType[] = [Mercoa.CounterpartyNetworkType.Entity]
    if (
      mercoaSession.iframeOptions?.options?.vendors?.network === 'platform' ||
      mercoaSession.iframeOptions?.options?.vendors?.network === 'all'
    ) {
      networkType.push(Mercoa.CounterpartyNetworkType.Network)
    }
    if (type === 'payee') {
      mercoaSession.client?.entity.counterparty
        .findPayees(mercoaSession.entity?.id, { paymentMethods: true, networkType, name: search })
        .then((resp) => {
          setCounterparties(resp.data)
        })
    } else {
      mercoaSession.client?.entity.counterparty
        .findPayors(mercoaSession.entity?.id, { paymentMethods: true, networkType, name: search })
        .then((resp) => {
          setCounterparties(resp.data)
        })
    }
  }, [mercoaSession.entity?.id, mercoaSession.token, mercoaSession.refreshId, search])

  const isCompletedVendorProfile = !mercoaSession.iframeOptions?.options?.entity?.enableMercoaPayments
    ? true
    : !!selectedCounterparty?.email &&
      ((selectedCounterparty?.accountType === 'business' &&
        (selectedCounterparty?.profile.business?.website || selectedCounterparty?.profile.business?.description)) ||
        selectedCounterparty?.accountType === 'individual')

  let incompleteReason = ''
  if (!isCompletedVendorProfile) {
    if (!selectedCounterparty?.email) {
      incompleteReason = 'email missing'
    } else if (selectedCounterparty?.accountType === 'business') {
      incompleteReason = 'website or description missing'
    }
  }

  function setSelection(counterparty: Mercoa.CounterpartyResponse | Mercoa.EntityResponse | undefined) {
    setSelectedCounterparty(counterparty)
    if (counterparty) {
      setEdit(false)
      onSelect?.(counterparty)
    }
  }

  // vendor exists, show text info and edit button
  if (selectedCounterparty?.id && selectedCounterparty?.id !== 'new' && !edit) {
    return (
      <>
        <div className="mercoa-w-full mercoa-flex mercoa-items-center">
          <div className="mercoa-flex-auto">
            <div className="mercoa-flex mercoa-items-center mercoa-bg-gray-50 mercoa-rounded-md">
              <div className="mercoa-flex-auto mercoa-p-3">
                <div className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">
                  {selectedCounterparty?.name}
                </div>
                {!mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
                  <div className="mercoa-text-sm mercoa-text-gray-500">{selectedCounterparty?.email}</div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCounterparty(undefined)
                }}
                type="button"
                className="mercoa-ml-4 mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75"
              >
                <XCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
                <span className="mercoa-sr-only">Clear</span>
              </button>
              {!mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
                <button
                  onClick={() => {
                    setEdit(true)
                  }}
                  type="button"
                  className="mercoa-ml-4 mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75"
                >
                  <PencilSquareIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
                  <span className="mercoa-sr-only">Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {!isCompletedVendorProfile && (
          <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-bg-yellow-50">
            <ExclamationTriangleIcon
              className="mercoa-h-5 mercoa-w-5 mercoa-text-yellow-500 mercoa-mr-1"
              aria-hidden="true"
            />
            <p className="mercoa-text-sm mercoa-text-yellow-900">Profile incomplete: {incompleteReason}</p>
          </div>
        )}
      </>
    )
  }

  // Adding a counterparty
  if (selectedCounterparty?.id === 'new') {
    if (input) {
      return (
        <CounterpartyAddOrEdit
          type={type}
          name={input}
          onComplete={(e) => {
            setSelection(e)
            setTimeout(() => setEdit(true), 100)
          }}
          onExit={onSelect}
        />
      )
    } else if (selectedCounterparty) {
      return (
        <CounterpartyAddOrEdit
          counterparty={selectedCounterparty}
          onComplete={setSelection}
          type={type}
          onExit={onSelect}
        />
      )
    }
  }

  // Editing a counterparty
  else if (selectedCounterparty?.id && edit) {
    return (
      <CounterpartyAddOrEdit
        counterparty={selectedCounterparty}
        onComplete={setSelection}
        type={type}
        onExit={onSelect}
      />
    )
  }

  // if no counterparties, show loading
  if (!counterparties) {
    return (
      <div className="mercoa-relative mercoa-mt-2">
        <input
          className="mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-bg-white mercoa-py-1.5 mercoa-pl-3 mercoa-pr-10 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-indigo-600 sm:mercoa-text-sm sm:mercoa-leading-6"
          placeholder="Loading..."
          value="Loading..."
          readOnly
        />
        <button className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 focus:mercoa-outline-none">
          <ChevronUpDownIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
        </button>
      </div>
    )
  }

  // Search for a counterparty
  return (
    <Combobox as="div" value={selectedCounterparty} onChange={setSelection} nullable className="mercoa-w-full">
      {({ open }) => (
        <div className="mercoa-relative mercoa-mt-2 mercoa-w-full">
          <Combobox.Input
            autoComplete="off"
            className="mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-bg-white mercoa-py-1.5 mercoa-pl-3 mercoa-pr-10 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-indigo-600 sm:mercoa-text-sm sm:mercoa-leading-6"
            onFocus={() => {
              if (open) return // don't click button if already open, as it will close it
              setSearchTerm(undefined) // reset filter
              buttonRef.current?.click() // simulate click on button to open dropdown
            }}
            onChange={(event) => {
              setInput(event.target.value)
              setSearchTerm(event.target.value?.toLowerCase() ?? '')
            }}
            displayValue={(e: Mercoa.CounterpartyResponse) => e?.name ?? ''}
          />
          <Combobox.Button
            className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 focus:mercoa-outline-none"
            ref={buttonRef}
          >
            <ChevronUpDownIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
          </Combobox.Button>

          <Combobox.Options className="mercoa-absolute mercoa-z-10 mercoa-mt-1 mercoa-max-h-60 mercoa-w-full mercoa-overflow-auto mercoa-rounded-md mercoa-bg-white mercoa-py-1 mercoa-text-base mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none sm:mercoa-text-sm">
            {counterparties.map((cp) => (
              <Combobox.Option
                key={cp.id}
                value={cp}
                className={({ active }) =>
                  `mercoa-relative mercoa-cursor-pointer  mercoa-py-2 mercoa-pl-3 mercoa-pr-9 ${
                    active ? 'mercoa-bg-indigo-600 mercoa-text-white' : 'mercoa-text-gray-900'
                  }`
                }
              >
                <span>{cp.name}</span>
              </Combobox.Option>
            ))}
            {!mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
              <Combobox.Option value={{ id: 'new' }}>
                {({ active }) => (
                  <div
                    className={`mercoa-flex mercoa-items-center mercoa-cursor-pointer  mercoa-py-2 mercoa-pl-3 mercoa-pr-9 ${
                      active ? 'mercoa-bg-indigo-600 mercoa-text-white' : 'mercoa-text-gray-900'
                    }`}
                  >
                    <PlusIcon className="mercoa-w-5 mercoa-h-5 mercoa-pr-1" />
                    Add New
                  </div>
                )}
              </Combobox.Option>
            )}
          </Combobox.Options>
        </div>
      )}
    </Combobox>
  )
}

function CounterpartyAddOrEdit({
  counterparty,
  name,
  onComplete,
  type,
  onExit,
}: {
  counterparty?: Mercoa.EntityResponse
  name?: string
  onComplete: (counterparty?: Mercoa.EntityResponse) => any
  type: 'payee' | 'payor'
  onExit?: (counterparty?: any) => any
}) {
  const mercoaSession = useMercoaSession()

  let counterpartyName = name
  if (!counterpartyName && counterparty?.accountType === 'business') {
    counterpartyName = counterparty?.profile?.business?.legalBusinessName
  } else if (!counterpartyName && counterparty?.accountType === 'individual' && counterparty?.profile?.individual) {
    counterpartyName = `${constructFullName(
      counterparty.profile.individual.name.firstName,
      counterparty.profile.individual.name.lastName,
      counterparty.profile.individual.name.middleName,
      counterparty.profile.individual.name.suffix,
    )}`
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      accountType: counterparty?.accountType,
      name: counterpartyName,
      firstName: counterparty?.profile?.individual?.name?.firstName,
      lastName: counterparty?.profile?.individual?.name?.lastName,
      middleName: counterparty?.profile?.individual?.name?.middleName,
      suffix: counterparty?.profile?.individual?.name?.suffix,
      email:
        counterparty?.accountType === 'business'
          ? counterparty?.profile?.business?.email
          : counterparty?.profile?.individual?.email,
      businessType: counterparty?.profile?.business?.businessType,
      website: counterparty?.profile?.business?.website,
      description: counterparty?.profile?.business?.description,
    },
  })

  const accountType = watch('accountType')
  const nameInput = watch('name')

  useEffect(() => {
    if (!nameInput && !accountType) return
    if (accountType === 'business') {
      setValue('firstName', 'business')
      setValue('lastName', 'business')
    } else {
      const { firstName, suffix, lastName, middleName } = human.parseName(nameInput)
      setValue('firstName', firstName)
      setValue('lastName', lastName)
      setValue('middleName', middleName)
      setValue('suffix', suffix)
    }
  }, [nameInput, accountType])

  const onSubmit = async (data: any) => {
    if (!mercoaSession.entity?.id) return
    const profile: Mercoa.ProfileRequest = {}

    if (data.accountType === 'individual') {
      profile.individual = {
        email: data.email,
        name: {
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          middleName: data.middleName ?? '',
          suffix: data.suffix ?? '',
        },
      }
    } else {
      profile.business = {
        email: data.email,
        description: data.description,
        website: data.website,
        businessType: data.businessType,
        legalBusinessName: data.name,
      }
      if (!profile.business.website && !profile.business.description) {
        setError('website', {
          type: 'manual',
          message: 'Website or description is required',
        })
        setError('description', {
          type: 'manual',
          message: 'Website or description is required',
        })
        return
      }
    }

    if (counterparty?.id && counterparty.id !== 'new') {
      counterparty = await mercoaSession.client?.entity.update(counterparty.id, {
        profile,
        accountType: data.accountType,
      })
    } else {
      counterparty = await mercoaSession.client?.entity.create({
        profile,
        accountType: data.accountType,
        isPayee: type === 'payee',
        isPayor: type === 'payor',
        isCustomer: false,
      })
    }

    if (!counterparty?.id) return

    if (type === 'payee') {
      await mercoaSession.client?.entity.counterparty.addPayees(mercoaSession.entity.id, {
        payees: [counterparty.id],
      })
    } else {
      await mercoaSession.client?.entity.counterparty.addPayors(mercoaSession.entity.id, {
        payors: [counterparty.id],
      })
    }
    onComplete(counterparty)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mercoa-p-3 mercoa-bg-gray-100 mercoa-rounded-md mercoa-relative mercoa-w-full"
    >
      <button
        type="button"
        className="mercoa-absolute mercoa-top-2 mercoa-right-2"
        onClick={() => {
          onComplete(undefined)
          if (counterparty?.id === 'new' && onExit) {
            onExit({
              id: '',
            })
          }
        }}
      >
        <XMarkIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
        <span className="mercoa-sr-only">Close</span>
      </button>
      <div className="mercoa-mt-1">
        <label
          htmlFor="name"
          className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          Name
        </label>
        <div className="mercoa-relative mercoa-rounded-md mercoa-shadow-sm">
          <div className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-flex mercoa-items-center mercoa-pl-3">
            <UserIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            {...register('name')}
            className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-pl-10 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
            placeholder="Name"
          />
        </div>
      </div>
      {errors?.name?.message && <p className="mercoa-text-sm mercoa-text-red-500">Please enter a name</p>}

      <div className="mercoa-mt-1">
        <label
          htmlFor="email"
          className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          Email
        </label>
        <div className="mercoa-relative mercoa-rounded-md mercoa-shadow-sm">
          <div className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-flex mercoa-items-center mercoa-pl-3">
            <EnvelopeIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="email"
            {...register('email')}
            className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-pl-10 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
            placeholder="Email"
          />
        </div>
      </div>
      {errors?.email?.message && <p className="mercoa-text-sm mercoa-text-red-500">Please enter an email</p>}

      <div className="mercoa-mt-1 mercoa-mt-2 mercoa-flex mercoa-space-x-2">
        <button
          type="button"
          onClick={() => setValue('accountType', 'individual')}
          className={`mercoa-flex-grow mercoa-rounded-lg mercoa-border mercoa-border-gray-300 mercoa-text-center mercoa-text-gray-600
            ${accountType === 'individual' ? 'mercoa-border-indigo-600 mercoa-text-gray-800' : ''} 
            ${accountType === 'business' ? 'mercoa-text-gray-300' : ''} 
          mercoa-cursor-pointer  mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm hover:mercoa-border-indigo-600 hover:mercoa-text-gray-800`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setValue('accountType', 'business')}
          className={`mercoa-flex-grow mercoa-rounded-lg mercoa-border mercoa-border-gray-300 mercoa-text-center mercoa-text-gray-600
            ${accountType === 'business' ? 'mercoa-border-indigo-600 mercoa-text-gray-800' : ''} 
            ${accountType === 'individual' ? 'mercoa-text-gray-300' : ''} 
          mercoa-cursor-pointer  mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm hover:mercoa-border-indigo-600 hover:mercoa-text-gray-800`}
        >
          Business
        </button>
      </div>

      {accountType === 'business' && (
        <>
          <div className="mercoa-mt-1">
            <label
              htmlFor="email"
              className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              Business Type
            </label>
            <select
              {...register('businessType')}
              className="mercoa-mt-1 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-py-2 mercoa-px-3 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
            >
              <option value="" disabled>
                Select an option
              </option>
              <option value="soleProprietorship">Sole proprietorship</option>
              <option value="llc">LLC</option>
              <option value="trust">Trust</option>
              <option value="publicCorporation">Public Corporation</option>
              <option value="privateCorporation">Private Corporation</option>
              <option value="partnership">Partnership</option>
              <option value="unincorporatedAssociation">Unincorporated association</option>
              <option value="unincorporatedNonProfit">Unincorporated Non-Profit </option>
              <option value="incorporatedNonProfit">Incorporated Non-Profit </option>
            </select>
          </div>
          <div className="mercoa-mt-1">
            <label
              htmlFor="email"
              className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              Business Website
            </label>
            <input
              type="text"
              {...register('website')}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              placeholder="https://www.example.com"
            />
            {errors?.website?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors?.website?.message}</p>
            )}
          </div>
          <div className="mercoa-mt-1">
            <label
              htmlFor="email"
              className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              Business Description
            </label>
            <input
              type="text"
              {...register('description')}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              placeholder=""
            />
            {errors?.description?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors?.description?.message}</p>
            )}
          </div>
        </>
      )}

      {accountType === 'individual' && (
        <div className="mercoa-mt-1">
          <label
            htmlFor="email"
            className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
          >
            Full Name
          </label>
          <div className="mercoa-grid mercoa-grid-cols-7 mercoa-gap-1">
            <input
              type="text"
              {...register('firstName')}
              required
              className="mercoa-col-span-2 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              placeholder="First Name"
            />
            <input
              type="text"
              {...register('middleName')}
              className="mercoa-col-span-2 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              placeholder="Middle Name"
            />
            <input
              type="text"
              {...register('lastName')}
              required
              className="mercoa-col-span-2 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
              placeholder="Last Name"
            />
            <select
              {...register('suffix')}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-py-2 mercoa-px-3 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-outline-none focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
            >
              <option value=""></option>
              <option value="Sr.">Sr.</option>
              <option value="Jr.">Jr.</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
            </select>
          </div>
        </div>
      )}
      {accountType && (
        <MercoaButton isEmphasized type="submit" className="mercoa-mt-2 mercoa-w-full">
          Save
        </MercoaButton>
      )}
    </form>
  )
}

export function Counterparties({ type, admin }: { type: 'payor' | 'payee'; admin?: boolean }) {
  const mercoaSession = useMercoaSession()
  const [entities, setEntities] = useState<Mercoa.CounterpartyResponse[] | undefined>(undefined)
  const [addCounterparty, setAddCounterparty] = useState(false)
  const [startingAfter, setStartingAfter] = useState<string[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [resultsPerPage, setResultsPerPage] = useState<number>(20)
  const [count, setCount] = useState<number>(0)

  const [name, setName] = useState<string>()
  const [selected, setSelected] = useState<Mercoa.CounterpartyResponse | undefined>(undefined)

  useEffect(() => {
    if (!mercoaSession.client || !mercoaSession.entityId) return
    let isCurrent = true
    if (type === 'payor') {
      mercoaSession.client.entity.counterparty
        .findPayors(mercoaSession.entityId, {
          limit: resultsPerPage,
          startingAfter: startingAfter[startingAfter.length - 1],
          ...(name && { name }),
          paymentMethods: true,
        })
        .then((entities) => {
          if (entities && isCurrent) {
            setEntities(entities.data)
            setHasMore(entities.hasMore)
            setCount(entities.count)
          }
        })
    } else {
      mercoaSession.client.entity.counterparty
        .findPayees(mercoaSession.entityId, {
          limit: resultsPerPage,
          startingAfter: startingAfter[startingAfter.length - 1],
          ...(name && { name }),
          paymentMethods: true,
        })
        .then((entities) => {
          if (entities && isCurrent) {
            setEntities(entities.data)
            setHasMore(entities.hasMore)
            setCount(entities.count)
          }
        })
    }
    return () => {
      isCurrent = false
    }
  }, [mercoaSession.client, mercoaSession.entityId, mercoaSession.refreshId, type, startingAfter])

  function CounterpartyRow({
    entity,
    index,
    type,
    setSelected,
    selectedId,
    admin,
  }: {
    entity: Mercoa.CounterpartyResponse
    index: number
    type: 'payor' | 'payee'
    setSelected: (entity?: Mercoa.CounterpartyResponse) => void
    selectedId?: Mercoa.EntityId
    admin?: boolean
  }) {
    const mercoaSession = useMercoaSession()

    if (selectedId === entity.id) {
      return (
        <tr
          key={entity.email}
          className={`hover:mercoa-bg-gray-100 ${index % 2 === 0 ? undefined : 'mercoa-bg-gray-50'}`}
        >
          <td className="mercoa-p-10 mercoa-bg-gray-200" colSpan={admin ? 4 : 3}>
            <div className="mercoa-rounded-lg mercoa-bg-gray-50 mercoa-shadow mercoa-ring-1 mercoa-ring-gray-900/5">
              <CounterpartyDetails counterparty={entity} admin={admin} type={type} />
            </div>
          </td>
        </tr>
      )
    }

    return (
      <tr
        key={entity.email}
        className={`hover:mercoa-bg-gray-100 mercoa-cursor-pointer  ${
          index % 2 === 0 ? undefined : 'mercoa-bg-gray-50'
        }`}
        onClick={() => {
          setSelected(entity)
        }}
      >
        <td className="mercoa-whitespace-nowrap mercoa-py-4 mercoa-pl-4 mercoa-pr-3 mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 sm:mercoa-pl-6">
          {entity.name}
        </td>
        <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900">
          {entity.email}
        </td>
        <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900">
          {capitalize(entity.accountType)}
        </td>
        {admin && (
          <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900">
            <MercoaButton
              isEmphasized={false}
              color="red"
              size="sm"
              onClick={async () => {
                if (!mercoaSession.entityId) return
                if (type === 'payor') {
                  await mercoaSession.client?.entity.counterparty.hidePayors(mercoaSession.entityId, {
                    payors: [entity.id],
                  })
                } else {
                  await mercoaSession.client?.entity.counterparty.hidePayees(mercoaSession.entityId, {
                    payees: [entity.id],
                  })
                }
                mercoaSession.refresh()
              }}
            >
              Hide
            </MercoaButton>
          </td>
        )}
      </tr>
    )
  }

  return (
    <div className="mercoa-overflow-hidden mercoa-shadow mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 md:mercoa-rounded-lg mercoa-p-5">
      <div className="mercoa-flex mercoa-mb-5 mercoa-space-x-5 mercoa-items-center">
        <h2 className="mercoa-text-base mercoa-font-semibold mercoa-leading-7 mercoa-text-gray-900">
          {type === 'payor' ? 'Customers' : 'Vendors'}
        </h2>
        <DebouncedSearch
          placeholder={`Search ${type === 'payor' ? 'Customers' : 'Vendors'}`}
          onSettle={(name) => {
            setName(name)
            setPage(1)
            setStartingAfter([])
          }}
        />
        {(admin || !mercoaSession.iframeOptions?.options?.vendors?.disableCreation) && (
          <MercoaButton
            isEmphasized
            type="button"
            className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
            onClick={() => {
              setAddCounterparty(true)
            }}
          >
            <PlusIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-h-5 mercoa-w-5 md:mercoa-mr-2" />{' '}
            <span className="mercoa-hidden md:mercoa-inline-block">Add {type === 'payee' ? 'Vendor' : 'Customer'}</span>
          </MercoaButton>
        )}
      </div>
      <table className="mercoa-min-w-full mercoa-divide-y mercoa-divide-gray-300">
        <thead className="mercoa-bg-gray-50">
          <tr>
            <th
              scope="col"
              className="mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-6"
            >
              Name
            </th>
            <th
              scope="col"
              className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
            >
              Email
            </th>
            <th
              scope="col"
              className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
            >
              Type
            </th>
            {admin && (
              <th>
                <span className="mercoa-sr-only">Hide</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="mercoa-bg-white">
          {!entities && (
            <tr>
              <td colSpan={5} className="mercoa-p-9 mercoa-text-center">
                <LoadingSpinnerIcon />
              </td>
            </tr>
          )}
          {entities &&
            entities.map((entity, index) => (
              <CounterpartyRow
                key={entity.id}
                entity={entity}
                index={index}
                type={type}
                setSelected={setSelected}
                selectedId={selected?.id}
                admin={admin}
              />
            ))}
        </tbody>
      </table>
      {entities && (
        <TableNavigation
          data={entities}
          page={page}
          setPage={setPage}
          hasMore={hasMore}
          startingAfter={startingAfter}
          setStartingAfter={setStartingAfter}
          count={count}
          resultsPerPage={resultsPerPage}
          setResultsPerPage={setResultsPerPage}
        />
      )}

      <AddCounterpartyModal type={type} show={addCounterparty} setShow={setAddCounterparty} />
    </div>
  )
}

export function AddCounterpartyModal({
  type,
  show,
  setShow,
}: {
  type: 'payor' | 'payee'
  show: boolean
  setShow: (show: boolean) => void
}) {
  const mercoaSession = useMercoaSession()

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog
        as="div"
        className="mercoa-relative mercoa-z-10"
        onClose={() => {
          mercoaSession.refresh()
          setShow(false)
        }}
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
              <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-text-left mercoa-shadow-xl mercoa-transition-all">
                <div className="mercoa-w-[600px]">
                  <CounterpartyAddOrEdit
                    type={type}
                    onComplete={() => {
                      setShow(false)
                      mercoaSession.refresh()
                    }}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export function CounterpartyDetails({
  counterparty,
  admin,
  type,
}: {
  counterparty: Mercoa.CounterpartyResponse
  admin?: boolean
  type: 'payor' | 'payee'
}) {
  const mercoaSession = useMercoaSession()

  const phoneNumber = counterparty.profile?.business?.phone?.number ?? counterparty.profile?.individual?.phone?.number
  const countryCode =
    counterparty.profile?.business?.phone?.countryCode ?? counterparty.profile?.individual?.phone?.countryCode ?? '1'
  const phone = `+${countryCode} ${phoneNumber}`
  const address = counterparty.profile?.business?.address ?? counterparty.profile?.individual?.address
  const addressString = `${address?.addressLine1 ?? ''} ${address?.addressLine2 ?? ''}, ${address?.city ?? ''}, ${
    address?.stateOrProvince ?? ''
  } ${address?.postalCode ?? ''}`

  function PaymentMethodCard({ method }: { method: Mercoa.PaymentMethodResponse }) {
    let card = <></>
    if (method.type === Mercoa.PaymentMethodType.BankAccount) {
      card = <BankAccountComponent account={method} />
    } else if (method.type === Mercoa.PaymentMethodType.Card) {
      card = <CreditCardComponent account={method} />
    } else if (method.type === Mercoa.PaymentMethodType.Custom) {
      card = <CustomPaymentMethodComponent account={method} />
    } else if (method.type === Mercoa.PaymentMethodType.Check) {
      card = <CheckComponent account={method} />
    }
    return (
      <div key={method.id}>
        {admin && (
          <>
            <p className="mercoa-text-xs mercoa-font-bold mercoa-whitespace-nowrap">{method.type}</p>
            <p className="mercoa-text-xs mercoa-whitespace-nowrap">{method.id}</p>
          </>
        )}
        {card}
      </div>
    )
  }

  return (
    <div className="mercoa-py-6 ">
      <div className="mercoa-flex mercoa-flex-auto mercoa-px-6 mercoa-items-center">
        <dt className="mercoa-sr-only">Vendor Name</dt>
        <div>
          <dd className="mercoa-text-xl mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900 mercoa-inline">
            {counterparty.profile?.business && counterparty?.profile.business?.legalBusinessName}
            {counterparty.profile?.individual &&
              `${constructFullName(
                counterparty.profile?.individual?.name?.firstName,
                counterparty.profile?.individual?.name?.lastName,
                counterparty.profile?.individual?.name?.middleName,
                counterparty.profile?.individual?.name?.suffix,
              )}`}
          </dd>
          {!admin && (
            <div className="mercoa-text-sm mercoa-leading-6 mercoa-text-gray-400 mercoa-select-all">
              {counterparty.id}
            </div>
          )}
        </div>
        <div className="mercoa-flex-grow"></div>
        <MercoaButton
          isEmphasized={false}
          size="sm"
          className="mercoa-ml-5"
          onClick={async () => {
            if (!mercoaSession.entityId) return
            let url
            if (type === 'payor') {
              url = await mercoaSession.client?.entity.getOnboardingLink(counterparty.id, {
                expiresIn: '30d',
                type: Mercoa.EntityOnboardingLinkType.Payor,
              })
            } else {
              url = await mercoaSession.client?.entity.getOnboardingLink(counterparty.id, {
                expiresIn: '30d',
                type: Mercoa.EntityOnboardingLinkType.Payee,
              })
            }
            if (url) {
              navigator.clipboard.writeText(url).then(
                function () {
                  toast.info('Link Copied')
                },
                function (err) {
                  toast.error('There was an issue generating the onboarding link. Please refresh and try again.')
                },
              )
            } else {
              toast.error('There was an issue generating the onboarding link. Please refresh and try again.')
              mercoaSession.refresh()
            }
            mercoaSession.refresh()
          }}
        >
          Onboarding Link
        </MercoaButton>
      </div>

      <div className="mercoa-flex mercoa-w-full mercoa-flex-none mercoa-gap-x-2 mercoa-px-6 mercoa-border-t mercoa-border-gray-900/5 mercoa-mt-3 mercoa-pt-2">
        <dt className="mercoa-flex-none">
          <span className="mercoa-sr-only">Email</span>
          <EnvelopeIcon className="mercoa-h-6 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
        </dt>
        <dd className="mercoa-text-sm mercoa-leading-6 mercoa-text-gray-500 mercoa-select-all">{counterparty.email}</dd>
      </div>
      {phoneNumber && (
        <div className="mercoa-flex mercoa-w-full mercoa-flex-none mercoa-gap-x-2 mercoa-px-6 mercoa-mt-1">
          <dt className="mercoa-flex-none">
            <span className="mercoa-sr-only">Email</span>
            <DevicePhoneMobileIcon className="mercoa-h-6 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
          </dt>
          <dd className="mercoa-text-sm mercoa-leading-6 mercoa-text-gray-500 mercoa-select-all">
            <a
              className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-blue-400"
              href={`tel:${phone}`}
            >
              {phone}
            </a>
          </dd>
        </div>
      )}
      {address?.addressLine1 && (
        <div className="mercoa-flex mercoa-w-full mercoa-flex-none mercoa-gap-x-2 mercoa-px-6 mercoa-mt-1">
          <dt className="mercoa-flex-none">
            <span className="mercoa-sr-only">Address</span>
            <MapPinIcon className="mercoa-h-6 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
          </dt>
          <dd className="mercoa-text-sm mercoa-leading-6 mercoa-text-gray-500 mercoa-select-all">{addressString}</dd>
        </div>
      )}

      <div className="mercoa-flex mercoa-flex-auto mercoa-pl-6 mercoa-pt-6 mercoa-items-center">
        <dd className="mercoa-text-lg mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-800 mercoa-inline">
          Payment Methods
        </dd>
      </div>

      <div className="mercoa-flex mercoa-flex-auto mercoa-pl-6 mercoa-mt-2 mercoa-pt-2 mercoa-items-center  mercoa-border-t mercoa-border-gray-900/5 ">
        <dd className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-800 mercoa-inline">
          ACH
        </dd>
      </div>
      <div className="mercoa-grid mercoa-grid-cols-3 mercoa-gap-2 mercoa-ml-4 mercoa-p-2">
        {counterparty.paymentMethods
          .filter((e) => e.type === Mercoa.PaymentMethodType.BankAccount)
          ?.map((method) => (
            <PaymentMethodCard method={method} key={method.id} />
          ))}
      </div>
      <div className="mercoa-flex mercoa-flex-auto mercoa-pl-6 mercoa-mt-2 mercoa-pt-2 mercoa-items-center  mercoa-border-t mercoa-border-gray-900/5 ">
        <dd className="mercoa-text-base mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-800 mercoa-inline">
          Check
        </dd>
      </div>
      <div className="mercoa-grid mercoa-grid-cols-3 mercoa-gap-2 mercoa-ml-4 mercoa-p-2">
        {counterparty.paymentMethods
          .filter((e) => e.type === Mercoa.PaymentMethodType.Check)
          ?.map((method) => (
            <PaymentMethodCard method={method} key={method.id} />
          ))}
      </div>

      <div className="mercoa-flex mercoa-flex-auto mercoa-pl-6 mercoa-mt-2 mercoa-pt-2 mercoa-items-center mercoa-border-t mercoa-border-gray-900/5 " />
      <div className="mercoa-grid mercoa-grid-cols-3 mercoa-gap-2 mercoa-ml-4 mercoa-p-2">
        {counterparty.paymentMethods
          .filter((e) => e.type === Mercoa.PaymentMethodType.Custom)
          ?.map((method) => (
            <PaymentMethodCard method={method} key={method.id} />
          ))}
      </div>
    </div>
  )
}
