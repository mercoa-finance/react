import { Combobox } from '@headlessui/react'
import {
  ChevronUpDownIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import debounce from 'lodash/debounce'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { constructFullName } from '../lib/lib'
import { MercoaButton, useMercoaSession } from './index'
const human = require('humanparser')

const schema = yup
  .object({
    name: yup.string().required(),
    email: yup.string().email(),
    accountType: yup.string().required(),
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    middleName: yup.string(),
    suffix: yup.string(),
    businessType: yup.string(),
    website: yup.string(),
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
        <div className="w-full flex items-center">
          <div className="flex-auto">
            <div className="flex items-center bg-gray-50 rounded-md">
              <div className="flex-auto p-3">
                <div className="text-sm font-medium text-gray-900">{selectedCounterparty?.name}</div>
                {!mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
                  <div className="text-sm text-gray-500">{selectedCounterparty?.email}</div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCounterparty(undefined)
                }}
                type="button"
                className="ml-4 flex-shrink-0 p-1 text-mercoa-primary-text hover:opacity-75"
              >
                <XCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                <span className="sr-only">Clear</span>
              </button>
              {!mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
                <button
                  onClick={() => {
                    setEdit(true)
                  }}
                  type="button"
                  className="ml-4 flex-shrink-0 p-1 text-mercoa-primary-text hover:opacity-75"
                >
                  <PencilSquareIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  <span className="sr-only">Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {!isCompletedVendorProfile && (
          <div className="flex items-center justify-center bg-yellow-50">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-1" aria-hidden="true" />
            <p className="text-sm text-yellow-900">Profile incomplete: {incompleteReason}</p>
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
      <div className="relative mt-2">
        <input
          className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="Loading..."
          value="Loading..."
          readOnly
        />
        <button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </button>
      </div>
    )
  }

  // Search for a counterparty
  return (
    <Combobox as="div" value={selectedCounterparty} onChange={setSelection} nullable className="w-full">
      {({ open }) => (
        <div className="relative mt-2 w-full">
          <Combobox.Input
            autoComplete="off"
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
            className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
            ref={buttonRef}
          >
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Combobox.Button>

          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {counterparties.map((cp) => (
              <Combobox.Option
                key={cp.id}
                value={cp}
                className={({ active }) =>
                  `relative cursor-pointer py-2 pl-3 pr-9 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`
                }
              >
                <span>{cp.name}</span>
              </Combobox.Option>
            ))}
            {!mercoaSession.iframeOptions?.options?.vendors?.disableCreation && (
              <Combobox.Option value={{ id: 'new' }}>
                {({ active }) => (
                  <div
                    className={`flex items-center cursor-pointer py-2 pl-3 pr-9 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`}
                  >
                    <PlusIcon className="w-5 h-5 pr-1" />
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
    <form onSubmit={handleSubmit(onSubmit)} className="p-3 bg-gray-100 rounded-md relative w-full">
      <button
        type="button"
        className="absolute top-2 right-2"
        onClick={() => {
          onComplete(undefined)
          if (counterparty?.id === 'new' && onExit) {
            onExit({
              id: '',
            })
          }
        }}
      >
        <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        <span className="sr-only">Close</span>
      </button>
      <div className="mt-1">
        <label htmlFor="name" className="block text-left text-sm font-medium text-gray-700">
          Name
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            {...register('name')}
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Name"
          />
        </div>
      </div>
      {errors?.name?.message && <p className="text-sm text-red-500">Please enter a name</p>}

      <div className="mt-1">
        <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="email"
            {...register('email')}
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Email"
          />
        </div>
      </div>

      <div className="mt-1 mt-2 flex space-x-2">
        <button
          type="button"
          onClick={() => setValue('accountType', 'individual')}
          className={`flex-grow rounded-lg border border-gray-300 text-center text-gray-600
            ${accountType === 'individual' ? 'border-indigo-600 text-gray-800' : ''} 
            ${accountType === 'business' ? 'text-gray-300' : ''} 
          cursor-pointer bg-white px-6 py-5 shadow-sm hover:border-indigo-600 hover:text-gray-800`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setValue('accountType', 'business')}
          className={`flex-grow rounded-lg border border-gray-300 text-center text-gray-600
            ${accountType === 'business' ? 'border-indigo-600 text-gray-800' : ''} 
            ${accountType === 'individual' ? 'text-gray-300' : ''} 
          cursor-pointer bg-white px-6 py-5 shadow-sm hover:border-indigo-600 hover:text-gray-800`}
        >
          Business
        </button>
      </div>

      {accountType === 'business' && (
        <>
          <div className="mt-1">
            <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
              Business Type
            </label>
            <select
              {...register('businessType')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
          <div className="mt-1">
            <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
              Business Website
            </label>
            <input
              type="text"
              {...register('website')}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="https://www.example.com"
            />
          </div>
          <div className="mt-1">
            <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
              Business Description
            </label>
            <input
              type="text"
              {...register('description')}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder=""
            />
          </div>
        </>
      )}

      {accountType === 'individual' && (
        <div className="mt-1">
          <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
            Full Name
          </label>
          <div className="grid grid-cols-7 gap-1">
            <input
              type="text"
              {...register('firstName')}
              required
              className="col-span-2 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="First Name"
            />
            <input
              type="text"
              {...register('middleName')}
              className="col-span-2 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Middle Name"
            />
            <input
              type="text"
              {...register('lastName')}
              required
              className="col-span-2 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Last Name"
            />
            <select
              {...register('suffix')}
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
        <MercoaButton isEmphasized type="submit" className="mt-2 w-full">
          Save
        </MercoaButton>
      )}
    </form>
  )
}
