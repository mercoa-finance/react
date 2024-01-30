import { Combobox, Dialog, Transition } from '@headlessui/react'
import {
  ChevronUpDownIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusIcon,
  UserCircleIcon,
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
    if (type === 'payor') {
      mercoaSession.client.entity.counterparty
        .findPayors(mercoaSession.entityId, {
          limit: resultsPerPage,
          startingAfter: startingAfter[startingAfter.length - 1],
          ...(name && { name }),
          paymentMethods: true,
        })
        .then((entities) => {
          setEntities(entities.data)
          setHasMore(entities.hasMore)
          setCount(entities.count)
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
          console.log(entities)
          setEntities(entities.data)
          setHasMore(entities.hasMore)
          setCount(entities.count)
        })
    }
  }, [mercoaSession.client, mercoaSession.entityId, mercoaSession.refreshId, type, startingAfter])

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg p-5">
      <div className="flex mb-5 space-x-5 items-center">
        <h2 className="text-base font-semibold leading-7 text-gray-900">
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
            className="ml-2 inline-flex text-sm"
            onClick={() => {
              setAddCounterparty(true)
            }}
          >
            <PlusIcon className="-ml-1 inline-flex h-5 w-5 md:mr-2" />{' '}
            <span className="hidden md:inline-block">Add {type === 'payee' ? 'Vendor' : 'Customer'}</span>
          </MercoaButton>
        )}
      </div>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Email
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Type
            </th>
            {admin && (
              <th>
                <span className="sr-only">Hide</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white">
          {!entities && (
            <tr>
              <td colSpan={5} className="p-9 text-center">
                <LoadingSpinnerIcon />
              </td>
            </tr>
          )}
          {entities &&
            entities.map((entity, index) => (
              <CounterpartyDetails
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

export function CounterpartyDetails({
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
      <tr key={entity.email} className={`hover:bg-gray-100 ${index % 2 === 0 ? undefined : 'bg-gray-50'}`}>
        <td className="p-10 bg-gray-200" colSpan={admin ? 4 : 3}>
          <EntityCard entity={entity} admin={admin} type={type} />
        </td>
      </tr>
    )
  }

  return (
    <tr
      key={entity.email}
      className={`hover:bg-gray-100 cursor-pointer ${index % 2 === 0 ? undefined : 'bg-gray-50'}`}
      onClick={() => {
        setSelected(entity)
      }}
    >
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{entity.name}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{entity.email}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{capitalize(entity.accountType)}</td>
      {admin && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
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
        className="relative z-10"
        onClose={() => {
          mercoaSession.refresh()
          setShow(false)
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all">
                <div className="w-[600px]">
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

export function EntityCard({
  entity,
  admin,
  type,
}: {
  entity: Mercoa.CounterpartyResponse
  admin?: boolean
  type: 'payor' | 'payee'
}) {
  const mercoaSession = useMercoaSession()
  return (
    <div className="lg:col-start-3 lg:row-end-1">
      <h2 className="sr-only">Entity Summary</h2>
      <div className="rounded-lg bg-gray-50 shadow ring-1 ring-gray-900/5">
        <dl className="flex flex-wrap items-center py-6 ">
          <div className="flex flex-auto pl-6 items-center">
            <dt className="text-sm font-semibold leading-6 text-gray-900 sr-only">Entity Name</dt>
            <dd className="text-base font-semibold leading-6 text-gray-900 inline">
              {entity.profile?.business && entity?.profile.business?.legalBusinessName}
              {entity.profile?.individual &&
                `${constructFullName(
                  entity.profile?.individual?.name?.firstName,
                  entity.profile?.individual?.name?.lastName,
                  entity.profile?.individual?.name?.middleName,
                  entity.profile?.individual?.name?.suffix,
                )}`}
            </dd>
            <MercoaButton
              isEmphasized={false}
              size="sm"
              className="ml-5"
              onClick={async () => {
                if (!mercoaSession.entityId) return
                let url
                if (type === 'payor') {
                  url = await mercoaSession.client?.entity.getOnboardingLink(entity.id, {
                    expiresIn: '30d',
                    type: Mercoa.EntityOnboardingLinkType.Payor,
                  })
                } else {
                  url = await mercoaSession.client?.entity.getOnboardingLink(entity.id, {
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

          {admin && (
            <div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 px-6 pt-6">
              <dt className="flex-none">
                <span className="sr-only">ID</span>
                <UserCircleIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
              </dt>
              <dd className="text-sm leading-6 text-gray-900 select-all">{entity.id}</dd>
            </div>
          )}

          <div className="mt-4 flex w-full flex-none gap-x-4 px-6 mb-6">
            <dt className="flex-none">
              <span className="sr-only">Email</span>
              <EnvelopeIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
            </dt>
            <dd className="text-sm leading-6 text-gray-500 select-all">{entity.email}</dd>
          </div>

          <div className="flex flex-auto pl-6 pt-6 items-center">
            <dd className="text-base font-semibold leading-6 text-gray-900 inline">Payment Methods</dd>
          </div>

          {entity.paymentMethods?.map((method) => {
            let card = <></>
            if (method.type === Mercoa.PaymentMethodType.BankAccount) {
              card = <BankAccountComponent account={method} />
            } else if (method.type === Mercoa.PaymentMethodType.Card) {
              card = <CreditCardComponent account={method} />
            } else if (method.type === Mercoa.PaymentMethodType.Custom) {
              card = <CustomPaymentMethodComponent account={method} />
            }
            return (
              <div key={method.id} className="w-full p-5">
                {admin && (
                  <>
                    <p className="text-xs font-bold whitespace-nowrap">{method.type}</p>
                    <p className="text-xs whitespace-nowrap">{method.id}</p>
                  </>
                )}
                {card}
              </div>
            )
          })}
        </dl>
      </div>
    </div>
  )
}
