import { Dialog, Transition } from '@headlessui/react'
import {
  ChevronLeftIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa, MercoaClient } from '@mercoa/javascript'
import dayjs from 'dayjs'
import { Fragment, useEffect, useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { usePlacesWidget } from 'react-google-autocomplete'
import { Control, Controller, useForm } from 'react-hook-form'
import InputMask from 'react-input-mask'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import { MercoaButton, MercoaCombobox, Tooltip, useMercoaSession } from '.'
import { capitalize } from '../lib/lib'
import { postalCodeRegex, usaStates } from '../lib/locations'
import { AddDialog, LoadingSpinnerIcon } from './index'

export type OnboardingFormData = {
  email: string
  accountType: Mercoa.AccountType
  businessType?: Mercoa.BusinessType
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  dob?: Date
  taxID?: string
  phoneNumber?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  stateOrProvince?: string
  postalCode?: string
  legalBusinessName: string
  doingBusinessAs?: string
  website?: string
  description?: string
  formationDate?: Date
  disableKYB?: 'yes' | 'no'
}

// Onboarding Blocks //////////////////////////////////////////////////////////

export const addressBlockSchema = {
  addressLine1: yup.string().required('Address is required'),
  addressLine2: yup.string(),
  city: yup.string().required('City is required'),
  stateOrProvince: yup.string().length(2).required(),
  postalCode: yup.string().matches(postalCodeRegex, 'Invalid Postal Code').required(),
}

export function AddressBlock({
  register,
  errors,
  watch,
  setValue,
  trigger,
  readOnly,
  required,
}: {
  register: Function
  errors: any
  watch: Function
  setValue: Function
  trigger: Function
  readOnly?: boolean
  required?: boolean
}) {
  const mercoaSession = useMercoaSession()
  const { ref } = usePlacesWidget({
    apiKey: mercoaSession.googleMapsApiKey,
    onPlaceSelected: async (place) => {
      const streetNumber = place.address_components.find((e: any) => e.types.includes('street_number'))?.long_name
      const streetName = place.address_components.find((e: any) => e.types.includes('route'))?.long_name
      const city = place.address_components.find((e: any) => e.types.includes('locality'))?.long_name
      const state = place.address_components.find((e: any) =>
        e.types.includes('administrative_area_level_1'),
      )?.short_name
      const postalCode = place.address_components.find((e: any) => e.types.includes('postal_code'))?.long_name

      setShowAddress(true)
      setValue('addressLine1', streetNumber + ' ' + streetName, { shouldDirty: true })
      setValue('city', city ?? '', { shouldDirty: true })
      setValue('stateOrProvince', state ?? '', { shouldDirty: true })
      setValue('postalCode', postalCode ?? '', { shouldDirty: true })
      trigger()
    },
    options: {
      fields: ['address_components'],
      types: ['address'],
    },
  })

  const stateOrProvince = watch('stateOrProvince')
  const [showAddress, setShowAddress] = useState(!!readOnly || stateOrProvince)

  return (
    <div className="mt-2">
      {!showAddress ? (
        <>
          <label htmlFor="addressLine1" className="block text-left text-sm font-medium text-gray-700">
            Address
          </label>
          <div className="mt-1">
            <input
              ref={ref as any}
              onBlur={() => {
                setShowAddress(true)
              }}
              type="text"
              placeholder="Enter a location"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required={required}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="mt-1 col-span-2">
            <label htmlFor="addressLine1" className="block text-left text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              {...register('addressLine1')}
              readOnly={readOnly}
              required={required}
              type="text"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.addressLine1?.message && <p className="text-sm text-red-500">{errors.addressLine1?.message}</p>}
          </div>

          <div className="mt-1">
            <label htmlFor="addressLine1" className="block text-left text-sm font-medium text-gray-700">
              Apartment, suite, etc.
            </label>
            <input
              {...register('addressLine2')}
              readOnly={readOnly}
              type="text"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.addressLine2?.message && <p className="text-sm text-red-500">{errors.addressLine2?.message}</p>}
          </div>

          <div className="mt-1">
            <label htmlFor="addressLine1" className="block text-left text-sm font-medium text-gray-700">
              City
            </label>
            <input
              {...register('city')}
              readOnly={readOnly}
              required={required}
              type="text"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.city?.message && <p className="text-sm text-red-500">{errors.city?.message}</p>}
          </div>

          <div className="mt-1">
            <MercoaCombobox
              options={usaStates.map(({ name, abbreviation }) => ({
                disabled: false,
                value: abbreviation,
              }))}
              label="State"
              value={stateOrProvince}
              onChange={(value) => {
                setValue('stateOrProvince', value, { shouldDirty: true })
              }}
              inputClassName="py-2.5"
              labelClassName="block text-left text-sm font-medium text-gray-700 -mb-2"
            />
            {errors.stateOrProvince?.message && (
              <p className="text-sm text-red-500">{errors.stateOrProvince?.message}</p>
            )}
          </div>

          <div className="mt-1">
            <label htmlFor="addressLine1" className="block text-left text-sm font-medium text-gray-700">
              Postal Code
            </label>
            <input
              {...register('postalCode')}
              readOnly={readOnly}
              required={required}
              type="text"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.postalCode?.message && <p className="text-sm text-red-500">{errors.postalCode?.message}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export const nameBlockSchema = {
  firstName: yup.string().required('First name is required'),
  middleName: yup.string(),
  lastName: yup.string().required('Last name is required'),
  suffix: yup.string(),
}

export function NameBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: Function
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="firstName" className="block text-left text-sm font-medium text-gray-700">
          First Name
        </label>
        <div className="mt-1">
          <input
            {...register('firstName')}
            readOnly={readOnly}
            required={required}
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="middleName" className="block text-left text-sm font-medium text-gray-700">
          Middle Name <span className="text-gray-400">{'(optional)'}</span>
        </label>
        <div className="mt-1">
          <input
            {...register('middleName')}
            readOnly={readOnly}
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="lastName" className="block text-left text-sm font-medium text-gray-700">
          Last Name
        </label>
        <div className="mt-1">
          <input
            {...register('lastName')}
            readOnly={readOnly}
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="suffix" className="block text-left text-sm font-medium text-gray-700">
          Suffix
        </label>
        <div className="mt-1">
          <select
            {...register('suffix')}
            readOnly={readOnly}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">None</option>
            <option value="Sr.">Sr.</option>
            <option value="Jr.">Jr.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
            <option value="V">V</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export function DateOfBirthBlock({
  control,
  errors,
  readOnly,
  required,
}: {
  control: Control<any>
  errors: any
  required?: boolean
  readOnly?: boolean
}) {
  return (
    <div>
      <label htmlFor="dob" className="block text-left text-sm font-medium text-gray-700">
        Date of birth
      </label>
      <div className="mt-1">
        <Controller
          control={control}
          name="dob"
          render={({ field }) => (
            <ReactDatePicker
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onChange={(date) => field.onChange(date)}
              selected={field.value}
              required={required}
              readOnly={readOnly}
            />
          )}
        />
      </div>
    </div>
  )
}

export const SSNSchema = {
  dob: yup.date().required('Date of birth is required'),
  taxID: yup.string().required('SSN is required'),
}

export function SSNBlock({
  control,
  errors,
  readOnly,
  required,
}: {
  control: Control<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor="taxID" className="block text-left text-sm font-medium text-gray-700">
        SSN
      </label>
      <div className="mt-1">
        <Controller
          control={control}
          name="taxID"
          render={({ field }) => {
            if (field.value === '****') {
              return (
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="123-45-6789"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                />
              )
            } else {
              return (
                <InputMask
                  mask="999-99-9999"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                  required={required}
                >
                  {
                    ((inputProps: any) => (
                      <input
                        {...inputProps}
                        type="text"
                        placeholder="123-45-6789"
                        className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    )) as any
                  }
                </InputMask>
              )
            }
          }}
        />
      </div>
    </div>
  )
}

export const emailSchema = {
  email: yup.string().email('Email is not valid').required('Email is required'),
}

export function EmailBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: Function
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mt-2">
      <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
        Email
      </label>
      <div className="mt-1">
        <input
          type="email"
          {...register('email')}
          readOnly={readOnly}
          required={required}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      {errors.email?.message && <p className="text-sm text-red-500">{errors.email?.message.toString()}</p>}
    </div>
  )
}

export const phoneSchema = {
  phoneNumber: yup.string().required('Phone number is required'),
}

export function PhoneBlock({
  control,
  errors,
  readOnly,
  required,
}: {
  control: Control<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mt-2">
      <label htmlFor="phoneNumber" className="block text-left text-sm font-medium text-gray-700">
        Phone
      </label>
      <div className="mt-1">
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <InputMask
              mask="(999) 999-9999"
              value={field.value}
              onChange={field.onChange}
              readOnly={readOnly}
              required={required}
            >
              {
                ((inputProps: any) => (
                  <input
                    {...inputProps}
                    type="text"
                    className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="(777) 777-7777"
                  />
                )) as any
              }
            </InputMask>
          )}
        />
      </div>
      {errors.phoneNumber?.message && <p className="text-sm text-red-500">{errors.phoneNumber?.message.toString()}</p>}
    </div>
  )
}

export const accountTypeSchema = {
  accountType: yup.string().required(),
}

export function AccountTypeRadioBlock({ register, errors }: { register: Function; errors: any }) {
  return (
    <div className="mt-3">
      <label htmlFor="accountType" className="block text-left text-sm font-medium text-gray-700">
        Account Type
      </label>
      <div className="flex items-center">
        <input
          {...register('accountType')}
          value={Mercoa.AccountType.Individual}
          type="radio"
          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="accountType" className="ml-3 block text-sm font-medium text-gray-700">
          Individual
        </label>
      </div>
      <div className="flex items-center">
        <input
          {...register('accountType')}
          value={Mercoa.AccountType.Business}
          type="radio"
          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="accountType" className="ml-3 block text-sm font-medium text-gray-700">
          Business
        </label>
      </div>
    </div>
  )
}

export function AccountTypeSelectBlock({ register, errors }: { register: Function; errors: any }) {
  return (
    <div className="mt-3">
      <label htmlFor="accountType" className="block text-left text-sm font-medium text-gray-700">
        Account Type
      </label>
      <select
        {...register('accountType')}
        className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        <option value={Mercoa.AccountType.Individual}>Individual</option>
        <option value={Mercoa.AccountType.Business}>Business</option>
      </select>
    </div>
  )
}

export function BusinessTypeBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: Function
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mt-3">
      <label htmlFor="businessType" className="block text-left text-sm font-medium text-gray-700">
        Business Type
      </label>
      <select
        {...register('businessType')}
        readOnly={readOnly}
        required={required}
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
  )
}

export const legalBusinessNameSchema = {
  legalBusinessName: yup.string().required('Business name is required'),
}

export function LegalBusinessNameBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: Function
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mt-2">
      <label htmlFor="legalBusinessName" className="block text-left text-sm font-medium text-gray-700">
        Business Name
      </label>
      <div className="mt-1">
        <input
          {...register('legalBusinessName')}
          readOnly={readOnly}
          required={required}
          type="text"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      {errors.legalBusinessName?.message && (
        <p className="text-sm text-red-500">{errors.legalBusinessName?.message.toString()}</p>
      )}
    </div>
  )
}

export const doingBusinessAsSchema = {
  doingBusinessAs: yup.string(),
}

export function DoingBusinessAsBlock({
  register,
  errors,
  readOnly,
}: {
  register: Function
  errors: any
  readOnly?: boolean
}) {
  return (
    <div className="mt-2">
      <label htmlFor="doingBusinessAs" className="block text-left text-sm font-medium text-gray-700">
        Doing business as <span className="text-gray-400">{'(optional)'}</span>
      </label>
      <div className="mt-1">
        <input
          {...register('doingBusinessAs')}
          readOnly={readOnly}
          type="text"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      {errors.doingBusinessAs?.message && (
        <p className="text-sm text-red-500">{errors.doingBusinessAs?.message.toString()}</p>
      )}
    </div>
  )
}

export const einSchema = {
  taxID: yup
    .string()
    .matches(/^(0[1-9]|[1-9]\d)-\d{7}$/, 'Invalid EIN')
    .required('EIN is required'),
}

export function EINBlock({
  control,
  errors,
  readOnly,
  required,
}: {
  control: Control<any>
  errors: any
  required?: boolean
  readOnly?: boolean
}) {
  return (
    <div className="mt-2">
      <label htmlFor="taxID" className="block text-left text-sm font-medium text-gray-700">
        EIN
      </label>
      <div className="mt-1">
        <Controller
          control={control}
          name="taxID"
          render={({ field }) => {
            if (field.value === '**-*******') {
              return (
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="12-3456789"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                />
              )
            } else {
              return (
                <InputMask
                  mask="99-9999999"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                  required={required}
                >
                  {
                    ((inputProps: any) => (
                      <input
                        {...inputProps}
                        type="text"
                        className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="12-3456789"
                      />
                    )) as any
                  }
                </InputMask>
              )
            }
          }}
        />
      </div>
      {errors.taxID?.message && <p className="text-sm text-red-500">{errors.taxID?.message.toString()}</p>}
    </div>
  )
}

export const websiteSchema = {
  website: yup.string().url('Website is not valid').required('Website is required'),
}

export function WebsiteBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: Function
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mt-2">
      <label htmlFor="website" className="block text-left text-sm font-medium text-gray-700">
        Website
      </label>
      <div className="mt-1">
        <input
          {...register('website')}
          type="text"
          readOnly={readOnly}
          required={required}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      {errors.website?.message && <p className="text-sm text-red-500">{errors.website?.message.toString()}</p>}
    </div>
  )
}

export const descriptionSchema = {
  website: yup.string().required('Description is required'),
}

export function DescriptionBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: Function
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mt-2">
      <label htmlFor="description" className="block text-left text-sm font-medium text-gray-700">
        Business Description
      </label>
      <div className="mt-1">
        <input
          {...register('description')}
          type="text"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          readOnly={readOnly}
          required={required}
        />
      </div>
      {errors.description?.message && <p className="text-sm text-red-500">{errors.description?.message.toString()}</p>}
    </div>
  )
}

export function FormationDateBlock({
  control,
  errors,
  readOnly,
  required,
}: {
  control: Control<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor="formationDate" className="block text-left text-sm font-medium text-gray-700">
        Business Formation Date
      </label>
      <div className="mt-1 text-left">
        <Controller
          control={control}
          name="formationDate"
          render={({ field }) => (
            <ReactDatePicker
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onChange={(date) => field.onChange(date)}
              selected={field.value}
              required={required}
              readOnly={readOnly}
            />
          )}
        />
      </div>
    </div>
  )
}

export async function createOrUpdateEntity({
  entityId,
  onClose,
  data,
  isPayee,
  isPayor,
  mercoaClient,
}: {
  entityId?: string
  onClose?: Function
  data: OnboardingFormData
  isPayee: boolean
  isPayor: boolean
  mercoaClient: MercoaClient
}) {
  const profile: Mercoa.ProfileRequest = {}

  if (data.accountType === 'individual') {
    profile.individual = {
      email: data.email,
      ...(data.phoneNumber && {
        phone: {
          number: data.phoneNumber,
          countryCode: '1',
        },
      }),
      ...(data.taxID &&
        data.taxID != '****' && {
          governmentId: {
            ssn: data.taxID,
          },
        }),
      name: {
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        middleName: data.middleName ?? '',
        suffix: data.suffix ?? '',
      },
      ...(data.dob && {
        birthDate: {
          day: dayjs(data.dob).format('D'),
          month: dayjs(data.dob).format('M'),
          year: dayjs(data.dob).format('YYYY'),
        },
      }),
      ...(data.addressLine1 &&
        data.city &&
        data.stateOrProvince &&
        data.postalCode && {
          address: {
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            postalCode: data.postalCode,
            stateOrProvince: data.stateOrProvince,
            city: data.city,
            country: 'US',
          },
        }),
    }
  } else {
    profile.business = {
      email: data.email,
      ...(data.phoneNumber && {
        phone: {
          number: data.phoneNumber,
          countryCode: '1',
        },
      }),
      businessType: data.businessType ?? 'llc',
      legalBusinessName: data.legalBusinessName,
      doingBusinessAs: data.doingBusinessAs,
      website: data.website,
      description: data.description,
      formationDate: data.formationDate ? dayjs(data.formationDate).toDate() : undefined,
      ...(data.taxID &&
        data.taxID != '**-*******' && {
          taxId: {
            ein: {
              number: data.taxID,
            },
          },
        }),
      ...(data.addressLine1 &&
        data.city &&
        data.stateOrProvince &&
        data.postalCode && {
          address: {
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            postalCode: data.postalCode,
            stateOrProvince: data.stateOrProvince,
            city: data.city,
            country: 'US',
          },
        }),
    }
  }

  const postData: Mercoa.EntityRequest = {
    isCustomer: true,
    accountType: data.accountType,
    profile,
    isPayee,
    isPayor,
  }

  let resp: Mercoa.EntityResponse | undefined = undefined

  try {
    if (entityId) {
      resp = await mercoaClient?.entity.update(entityId, postData)
    } else {
      resp = await mercoaClient?.entity.create(postData)
    }
    if (onClose) onClose(postData)
  } catch (e) {
    toast.error('Error creating entity. Most likely the email is already in use.')
    console.error(e)
  }

  return resp
}

////////////////////////////////////////////////////////////////////////////////

export function EntityOnboardingButton({
  className,
  buttonText,
  title,
  onClose,
  isPayee,
  isPayor,
}: {
  className?: string
  buttonText?: string
  title?: string
  onClose?: Function
  isPayee: boolean
  isPayor: boolean
}) {
  const [showAdd, setShowAddLocal] = useState(false)

  function setShowAdd(state: boolean) {
    setShowAddLocal(state)
    if (!state && onClose) onClose()
  }

  return (
    <>
      <button
        onClick={() => {
          setShowAdd(true)
        }}
        className={
          className ||
          'inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto'
        }
      >
        {buttonText || 'Get Started'}
      </button>
      <Transition.Root show={showAdd} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setShowAdd}>
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
                <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                  <EntityOnboardingForm
                    title={title}
                    onClose={() => {
                      setShowAdd(false)
                    }}
                    isPayee={isPayee}
                    isPayor={isPayor}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

export function EntityOnboardingForm({
  title,
  onClose,
  isPayee,
  isPayor,
}: {
  title?: string
  onClose?: Function
  isPayee: boolean
  isPayor: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [step, setStep] = useState(0)
  const [data, setData] = useState<any>({})

  function StepOne() {
    const schema = yup
      .object({
        ...emailSchema,
        ...accountTypeSchema,
        businessType: yup.string(),
        disableKYB: yup.string(),
      })
      .required()

    const {
      register,
      watch,
      handleSubmit,
      formState: { errors, isValid },
    } = useForm({
      mode: 'onChange',
      resolver: yupResolver(schema),
      defaultValues: {
        accountType: data.accountType,
        email: data.email,
        businessType: data.businessType,
        disableKYB: data.disableKYB || 'no',
      },
    })

    const accountType = watch('accountType')

    return (
      <form
        style={{ display: step === 0 ? 'block' : 'none' }}
        onSubmit={handleSubmit((newData) => {
          setData({ ...data, ...newData })
          setStep(1)
        })}
      >
        <EmailBlock register={register} errors={errors} />

        <div className="mt-3">
          <label htmlFor="disableKYB" className="block text-left text-sm font-medium text-gray-700">
            Enable Payments
          </label>
          <div className="flex items-center">
            <input
              {...register('disableKYB')}
              value="no"
              type="radio"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="disableKYB" className="ml-3 block text-sm font-medium text-gray-700">
              Yes
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...register('disableKYB')}
              value="yes"
              type="radio"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="disableKYB" className="ml-3 block text-sm font-medium text-gray-700">
              No
            </label>
          </div>
        </div>
        <AccountTypeRadioBlock register={register} errors={errors} />

        {accountType === 'business' && <BusinessTypeBlock register={register} errors={errors} />}

        <div className="mt-5 sm:mt-6">
          <button
            disabled={!isValid}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
          >
            Continue
          </button>
        </div>
      </form>
    )
  }

  function IndStepTwo({ disableKYB }: { disableKYB: boolean }) {
    const {
      register,
      handleSubmit,
      control,
      formState: { errors, isValid },
    } = useForm({
      mode: 'onChange',
      resolver: yupResolver(yup.object(disableKYB ? nameBlockSchema : { ...SSNSchema, ...nameBlockSchema }).required()),
      defaultValues: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        suffix: data.suffix,
        ...(!disableKYB && {
          dob: data.dob,
          taxID: data.taxID,
        }),
      },
    })

    return (
      <form
        style={{ display: step === 1 ? 'block' : 'none' }}
        onSubmit={handleSubmit((newData) => {
          setData({ ...data, ...newData })
          if (!mercoaSession.client) return
          if (disableKYB)
            createOrUpdateEntity({
              data: { ...data, ...newData },
              mercoaClient: mercoaSession.client,
              onClose,
              isPayee,
              isPayor,
            })
          else setStep(2)
        })}
      >
        <NameBlock register={register} errors={errors} />
        {!disableKYB && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <DateOfBirthBlock control={control} errors={errors} />
            <SSNBlock control={control} errors={errors} />
            {JSON.stringify(errors)}
          </div>
        )}
        <div className="mt-5 sm:mt-6">
          <button
            disabled={!isValid}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
          >
            Continue
          </button>
        </div>
      </form>
    )
  }

  function IndStepThree() {
    const schema = yup
      .object({
        ...phoneSchema,
        ...addressBlockSchema,
      })
      .required()

    const {
      control,
      register,
      handleSubmit,
      setValue,
      trigger,
      watch,
      formState: { errors, isValid },
    } = useForm({
      mode: 'onChange',
      resolver: yupResolver(schema),
      defaultValues: {
        phoneNumber: data.phoneNumber,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        stateOrProvince: data.stateOrProvince,
        postalCode: data.postalCode,
      },
    })

    return (
      <form
        style={{ display: step === 2 ? 'block' : 'none' }}
        onSubmit={handleSubmit((newData) => {
          setData({ ...data, ...newData })
          if (!mercoaSession.client) return
          createOrUpdateEntity({
            data: { ...data, ...newData },
            mercoaClient: mercoaSession.client,
            onClose,
            isPayee,
            isPayor,
          })
        })}
      >
        <PhoneBlock control={control} errors={errors} />
        <AddressBlock register={register} errors={errors} setValue={setValue} trigger={trigger} watch={watch} />
        <div className="mt-5 sm:mt-6">
          <button
            disabled={!isValid}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
          >
            Continue
          </button>
        </div>
      </form>
    )
  }

  function BizStepTwo({ disableKYB }: { disableKYB: boolean }) {
    const schema = yup
      .object({
        ...legalBusinessNameSchema,
        ...doingBusinessAsSchema,
        ...(!disableKYB && einSchema),
      })
      .required()

    const {
      control,
      register,
      handleSubmit,
      formState: { errors, isValid },
    } = useForm({
      mode: 'onChange',
      resolver: yupResolver(schema),
      defaultValues: {
        legalBusinessName: data.legalBusinessName,
        doingBusinessAs: data.doingBusinessAs,
        taxID: data.taxID,
      },
    })

    return (
      <form
        style={{ display: step === 1 ? 'block' : 'none' }}
        onSubmit={handleSubmit((newData) => {
          setData({ ...data, ...newData })
          if (!mercoaSession.client) return
          if (disableKYB)
            createOrUpdateEntity({
              data: { ...data, ...newData },
              mercoaClient: mercoaSession.client,
              onClose,
              isPayee,
              isPayor,
            })
          else setStep(2)
        })}
      >
        <LegalBusinessNameBlock register={register} errors={errors} required />
        <DoingBusinessAsBlock register={register} errors={errors} />
        {!disableKYB && <EINBlock control={control} errors={errors} />}
        <div className="mt-5 sm:mt-6">
          <button
            disabled={!isValid}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
          >
            Continue
          </button>
        </div>
      </form>
    )
  }

  function BizStepThree() {
    const schema = yup
      .object({
        ...phoneSchema,
        ...websiteSchema,
        ...addressBlockSchema,
      })
      .required()

    const {
      control,
      register,
      handleSubmit,
      setValue,
      trigger,
      watch,
      formState: { errors, isValid },
    } = useForm({
      mode: 'onChange',
      resolver: yupResolver(schema),
      defaultValues: {
        phoneNumber: data.phoneNumber,
        website: data.website,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        stateOrProvince: data.stateOrProvince,
        postalCode: data.postalCode,
      },
    })

    return (
      <form
        style={{ display: step === 2 ? 'block' : 'none' }}
        onSubmit={handleSubmit((newData) => {
          setData({ ...data, ...newData })
          if (!mercoaSession.client) return
          createOrUpdateEntity({
            data: { ...data, ...newData },
            mercoaClient: mercoaSession.client,
            onClose,
            isPayee,
            isPayor,
          })
        })}
      >
        <PhoneBlock control={control} errors={errors} />
        <WebsiteBlock register={register} errors={errors} />
        <AddressBlock register={register} errors={errors} setValue={setValue} trigger={trigger} watch={watch} />
        <div className="mt-5 sm:mt-6">
          <button
            disabled={!isValid}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
          >
            Continue
          </button>
        </div>
      </form>
    )
  }

  if (!mercoaSession.token) return <LoadingSpinnerIcon />

  return (
    <div>
      <div className="flex">
        <ChevronLeftIcon
          className="h-5 w-5 cursor-pointer rounded-md p-0.5 hover:bg-gray-100"
          type="button"
          onClick={() => {
            setStep(Math.max(0, step - 1))
          }}
          style={{ visibility: step > 0 ? 'visible' : 'hidden' }}
        />
        <div className="flex-1" />
        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
          <button></button>
          {title || 'Create Account'}
        </Dialog.Title>
        <div className="flex-1" />
        <XMarkIcon
          className="h-5 w-5 cursor-pointer rounded-md p-0.5 hover:bg-gray-100"
          type="button"
          onClick={() => {
            if (onClose) onClose()
          }}
        />
      </div>
      <div className="mt-1">
        <StepOne />
        {data.accountType === 'individual' ? (
          <>
            <IndStepTwo disableKYB={data.disableKYB === 'yes'} />
            {data.disableKYB != 'yes' && <IndStepThree />}
          </>
        ) : (
          <>
            <BizStepTwo disableKYB={data.disableKYB === 'yes'} />
            {data.disableKYB != 'yes' && <BizStepThree />}
          </>
        )}
      </div>
    </div>
  )
}

export function RepresentativeOnboardingForm({
  entityId,
  title,
  onClose,
}: {
  entityId: string
  title?: string
  onClose?: Function
}) {
  const mercoaSession = useMercoaSession()

  const schema = yup
    .object({
      email: yup.string().email('Email is not valid').required('Email is required'),
      phoneNumber: yup.string().required('Phone number is required'),
      ...addressBlockSchema,
      ...nameBlockSchema,
      jobTitle: yup.string().required('Job title is required'),
      ownershipPercentage: yup
        .number()
        .min(0, 'Ownership percentage must be greater than 0')
        .max(100, 'Ownership percentage must be less than 100')
        .required('Ownership percentage is required'),
      isController: yup.boolean().required(),
    })
    .required()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(schema),
  })

  async function onSubmit(data: any) {
    const postData: Mercoa.RepresentativeRequest = {
      email: data.email,
      phone: {
        number: data.phoneNumber,
        countryCode: '1',
      },
      name: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        suffix: data.suffix,
      },
      birthDate: {
        day: dayjs(data.dob).format('D'),
        month: dayjs(data.dob).format('M'),
        year: dayjs(data.dob).format('YYYY'),
      },
      address: {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        postalCode: data.postalCode,
        stateOrProvince: data.stateOrProvince,
        city: data.city,
        country: 'US',
      },
      governmentId: {
        ssn: data.taxID,
      },
      responsibilities: {
        isController: data.isController,
        isOwner: data.ownershipPercentage >= 25,
        ownershipPercentage: Number(data.ownershipPercentage),
        jobTitle: data.jobTitle,
      },
    }

    try {
      await mercoaSession.client?.entity.representative.create(entityId, postData)
      await mercoaSession.refresh()
      if (onClose) onClose(data)
    } catch (e) {
      console.error(e)
      toast.error('There was an issue creating this representative. Please check your information and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <div className="mt-1">
          <div className="flex">
            <div className="flex-1" />
            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
              <button></button>
              {title || 'Create Account'}
            </Dialog.Title>
            <div className="flex-1" />
            <XMarkIcon
              className="h-5 w-5 cursor-pointer rounded-md p-0.5 hover:bg-gray-100"
              type="button"
              onClick={() => {
                if (onClose) onClose()
              }}
            />
          </div>

          <NameBlock register={register} errors={errors} />

          <div className="grid grid-cols-2 gap-3">
            <EmailBlock register={register} errors={errors} />
            <PhoneBlock control={control} errors={errors} />
            <DateOfBirthBlock control={control} errors={errors} />
            <SSNBlock control={control} errors={errors} />

            <div className="mt-2">
              <label htmlFor="jobTitle" className="block text-left text-sm font-medium text-gray-700">
                Job Title
              </label>
              <div className="mt-1">
                <input
                  {...register('jobTitle')}
                  required
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              {errors.jobTitle?.message && (
                <p className="text-sm text-red-500">{errors.jobTitle?.message.toString()}</p>
              )}
            </div>

            <div className="mt-2">
              <label htmlFor="ownershipPercentage" className="block text-left text-sm font-medium text-gray-700">
                Percent Ownership
              </label>
              <div className="mt-1">
                <input
                  {...register('ownershipPercentage')}
                  required
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              {errors.ownershipPercentage?.message && (
                <p className="text-sm text-red-500">{errors.ownershipPercentage?.message.toString()}</p>
              )}
            </div>
          </div>
          <AddressBlock register={register} errors={errors} setValue={setValue} trigger={trigger} watch={watch} />
          <div className="relative mt-2 flex items-start items-center">
            <div className="flex h-5 items-center">
              <input
                {...register('isController')}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              {/* @ts-ignore:next-line */}
              <Tooltip title="Every business requires a controller. Examples include the CEO, COO, Treasurer, President, Vice President, or Managing Partner.">
                <label htmlFor="isController" className="font-medium text-gray-700">
                  This person is a company controller <InformationCircleIcon className="inline h-5 w-5" />
                </label>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">
        <button
          disabled={!isValid}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
        >
          Add Representative
        </button>
      </div>
    </form>
  )
}

export function Representatives({
  children,
  onSelect,
  showAdd,
  showEdit,
}: {
  children?: Function
  onSelect?: Function
  showAdd?: boolean
  showEdit?: boolean
}) {
  const [reps, setReps] = useState<Array<Mercoa.RepresentativeResponse>>()
  const [showDialog, setShowDialog] = useState(false)

  const mercoaSession = useMercoaSession()
  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
      mercoaSession.client?.entity.representative.getAll(mercoaSession.entity.id).then((resp) => {
        setReps(resp)
      })
    }
  }, [mercoaSession.entity, mercoaSession.token, showDialog, mercoaSession.refreshId])

  const onClose = () => {
    setShowDialog(false)
  }

  if (children) return children({ representatives: reps })
  else {
    return (
      <>
        {reps &&
          reps.map((account) => (
            <div className="mt-2" key={account.id}>
              <RepresentativeComponent representative={account} onSelect={onSelect} showEdit={showEdit} />
            </div>
          ))}
        {showAdd && (
          <div className="mt-2">
            <AddDialog
              show={showDialog}
              onClose={onClose}
              component={
                <RepresentativeOnboardingForm
                  title="Create Representative"
                  onClose={onClose}
                  entityId={mercoaSession.entity?.id ?? ''}
                />
              }
            />
            <RepresentativeComponent onSelect={() => setShowDialog(true)} />
          </div>
        )}
      </>
    )
  }
}

export function RepresentativeComponent({
  children,
  representative,
  onSelect,
  showEdit,
  selected,
}: {
  children?: Function
  representative?: Mercoa.RepresentativeResponse
  onSelect?: Function
  showEdit?: boolean
  selected?: boolean
}) {
  const mercoaSession = useMercoaSession()

  async function deleteAccount() {
    if (mercoaSession.token) {
      if (!mercoaSession.entity?.id) {
        toast.error('Entity not found')
        return
      }
      mercoaSession.client?.entity.representative?.delete(mercoaSession.entity.id, representative?.id ?? '')
      mercoaSession.refresh()
    }
  }

  if (representative) {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(representative)
        }}
        key={representative?.id}
        className={`relative flex items-center space-x-3 rounded-lg border ${
          selected ? 'border-indigo-300' : 'border-gray-300'
        } bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
          onSelect ? 'cursor-pointer hover:border-gray-400' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <UserIcon className={`h-5 w-5 ${selected ? 'text-indigo-400' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          {!showEdit && <span className="absolute inset-0" aria-hidden="true" />}
          <p className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}>
            {representative.name.firstName} {representative.name.lastName} - {representative.responsibilities?.jobTitle}
          </p>
          <p className={`text-xs font-medium text-gray-900 ${selected ? 'underline' : ''}`}>
            Ownership: {representative.responsibilities?.ownershipPercentage}%
          </p>
          {representative.responsibilities?.isController && (
            <p className={`text-xs font-medium text-gray-900 ${selected ? 'underline' : ''}`}>Controller</p>
          )}
        </div>
        {showEdit && (
          <div className="flex-shrink-0">
            <button className="ml-1 cursor-pointer hover:text-red-300" onClick={() => deleteAccount()}>
              {' '}
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    )
  } else {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(representative)
        }}
        className={`relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 ${
          onSelect ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <PlusIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-900">Add new representative</p>
          <p className="truncate text-sm text-gray-500"></p>
        </div>
      </div>
    )
  }
}

export function VerifyOwnersButton({ entity }: { entity: Mercoa.EntityResponse }) {
  const mercoaSession = useMercoaSession()

  const [reps, setReps] = useState<Array<Mercoa.RepresentativeResponse>>()

  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
      mercoaSession.client?.entity.representative.getAll(mercoaSession.entity.id).then((resp) => {
        setReps(resp)
      })
    }
  }, [mercoaSession.entity, mercoaSession.token, mercoaSession.refreshId])

  const hasController = reps?.some((rep) => rep.responsibilities.isController)

  if (!entity || entity.profile?.business?.ownersProvided) return <></>
  return (
    <MercoaButton
      onClick={async () => {
        if (entity.accountType === 'business') {
          await mercoaSession.client?.entity.initiateKyb(entity.id)
          toast.success('Verification Started')
        } else if (entity.accountType === 'individual') {
          toast.error('not implemented yet!')
        }
        mercoaSession.refresh()
      }}
      disabled={!hasController}
      tooltip={hasController ? undefined : 'Please add at least one representative who is a controller'}
      isEmphasized
      className="mt-2"
    >
      Verify Account
    </MercoaButton>
  )
}

export function AcceptToSButton({
  className,
  buttonText,
  title,
  onClose,
  entity,
}: {
  className?: string
  buttonText?: string
  title?: string
  onClose?: Function
  entity: Mercoa.EntityResponse
}) {
  const [showAdd, setShowAddLocal] = useState(false)
  function setShowAdd(state: boolean) {
    setShowAddLocal(state)
    if (!state && onClose) onClose()
  }

  return (
    <>
      <MercoaButton
        onClick={() => {
          setShowAdd(true)
        }}
        isEmphasized
        size="md"
      >
        {buttonText || 'Terms of Service'}
      </MercoaButton>
      <Transition.Root show={showAdd} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setShowAdd}>
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
                <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                  <Dialog.Title className="mb-3 w-full text-center text-xl text-gray-800 underline">
                    {title || 'Terms of Service'}
                  </Dialog.Title>
                  <AcceptTosForm entity={entity} onComplete={setShowAdd} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

export function AcceptTosForm({
  entity,
  onComplete,
}: {
  entity: Mercoa.EntityResponse
  onComplete?: (val: boolean) => void
}) {
  const mercoaSession = useMercoaSession()
  const { register, watch, handleSubmit } = useForm()

  const data = watch()

  return (
    <form
      onSubmit={handleSubmit(async () => {
        if (!entity.id) {
          toast.error('Entity not found')
          return
        }
        await mercoaSession.client?.entity.acceptTermsOfService(entity.id)
        if (onComplete) {
          onComplete(false)
        }
        mercoaSession.refresh()
      })}
    >
      <div className="mb-10 text-sm">
        <b>{capitalize(mercoaSession.organization?.name)}</b> has partnered with{' '}
        <a href="https://mercoa.com" target="_blank" rel="noreferrer" className="text-blue-500 underline">
          Mercoa
        </a>{' '}
        to provide financial services.
        <br />
        <br />
        By clicking the button below, you agree to the{' '}
        <a
          href="https://mercoa.com/legal/platform-agreement/"
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 underline"
        >
          Mercoa Platform Agreement
        </a>{' '}
        and{' '}
        <a
          href="https://mercoa.com/legal/privacy-policy/"
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 underline"
        >
          Privacy Policy
        </a>
        .
      </div>
      <div className="relative mt-2 flex items-start items-center">
        <div className="flex h-5 items-center">
          <input
            {...register('mercoa')}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isController" className="font-medium text-gray-700">
            I have read and accept the{' '}
            <a
              href="https://mercoa.com/legal/platform-agreement/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline"
            >
              {' '}
              Mercoa terms of service
            </a>
          </label>
        </div>
      </div>
      <MercoaButton isEmphasized disabled={!data.mercoa} className="mt-5" size="md">
        Confirm
      </MercoaButton>
    </form>
  )
}

export function EntityOnboarding({
  entity,
  organization,
  type,
  setEntityData,
}: {
  entity: Mercoa.EntityResponse
  organization: Mercoa.OrganizationResponse
  type?: string
  setEntityData: (data: OnboardingFormData) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      accountType: entity.accountType,
      email: entity.email,

      firstName: entity.profile.individual?.name.firstName,
      middleName: entity.profile.individual?.name.middleName,
      lastName: entity.profile.individual?.name.lastName,
      suffix: entity.profile.individual?.name.suffix,

      phoneNumber: entity.profile.individual?.phone?.number ?? entity.profile.business?.phone?.number,

      addressLine1: entity.profile.individual?.address?.addressLine1 ?? entity.profile.business?.address?.addressLine1,
      addressLine2: entity.profile.individual?.address?.addressLine2 ?? entity.profile.business?.address?.addressLine2,
      city: entity.profile.individual?.address?.city ?? entity.profile.business?.address?.city,
      stateOrProvince:
        entity.profile.individual?.address?.stateOrProvince ?? entity.profile.business?.address?.stateOrProvince,
      postalCode: entity.profile.individual?.address?.postalCode ?? entity.profile.business?.address?.postalCode,
      country: entity.profile.individual?.address?.country ?? entity.profile.business?.address?.country ?? 'US',
      taxID: entity.profile.individual?.governmentIdProvided
        ? '****'
        : entity.profile.business?.taxIdProvided
        ? '**-*******'
        : '',
      dob: new Date(),

      legalBusinessName: entity.profile.business?.legalBusinessName ?? '',
      doingBusinessAs: entity.profile.business?.doingBusinessAs,
      description: entity.profile.business?.description,
      website: entity.profile.business?.website,
      formationDate: new Date(),
    },
  })

  const accountType = watch('accountType')

  const onboardingOptions = type === 'payee' ? organization.payeeOnboardingOptions : organization.payorOnboardingOptions

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setEntityData(data)
      })}
    >
      <div className="sm:grid sm:grid-cols-2 gap-4">
        {onboardingOptions?.enableBusiness && onboardingOptions?.enableIndividual && (
          <div className="col-span-2">
            <AccountTypeSelectBlock register={register} errors={errors} />
          </div>
        )}
        {accountType === 'individual' && (
          <>
            {onboardingOptions?.individual.email.show && (
              <div className="col-span-2">
                <EmailBlock
                  register={register}
                  errors={errors}
                  readOnly={!onboardingOptions.individual.email.edit}
                  required={onboardingOptions.individual.email.required}
                />
              </div>
            )}
            {onboardingOptions?.individual.name.show && (
              <div className="col-span-2">
                <NameBlock
                  register={register}
                  errors={errors}
                  readOnly={!onboardingOptions.individual.name.edit}
                  required={onboardingOptions.individual.name.required}
                />
              </div>
            )}
            {onboardingOptions?.individual.phone.show && (
              <PhoneBlock
                control={control}
                errors={errors}
                readOnly={!onboardingOptions.individual.phone.edit}
                required={onboardingOptions.individual.phone.required}
              />
            )}
            {onboardingOptions?.individual.dateOfBirth.show && (
              <DateOfBirthBlock
                control={control}
                errors={errors}
                readOnly={!onboardingOptions.individual.dateOfBirth.edit}
                required={onboardingOptions.individual.dateOfBirth.required}
              />
            )}
            {onboardingOptions?.individual.address.show && (
              <div className="col-span-2">
                <AddressBlock
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  trigger={trigger}
                  watch={watch}
                  readOnly={!onboardingOptions.individual.address.edit}
                  required={onboardingOptions.individual.address.required}
                />
              </div>
            )}
            {onboardingOptions?.individual.ssn.show && (
              <SSNBlock
                control={control}
                errors={errors}
                readOnly={!onboardingOptions.individual.ssn.edit}
                required={onboardingOptions.individual.ssn.required}
              />
            )}
          </>
        )}
        {accountType === 'business' && (
          <>
            {onboardingOptions?.business.name.show && (
              <LegalBusinessNameBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.name.edit}
                required={onboardingOptions.business.name.required}
              />
            )}
            {onboardingOptions?.business.email.show && (
              <EmailBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.email.edit}
                required={onboardingOptions.business.email.required}
              />
            )}
            {onboardingOptions?.business.phone.show && (
              <PhoneBlock
                control={control}
                errors={errors}
                readOnly={!onboardingOptions.business.phone.edit}
                required={onboardingOptions.business.phone.required}
              />
            )}
            {onboardingOptions?.business.website.show && (
              <WebsiteBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.website.edit}
                required={onboardingOptions.business.website.required}
              />
            )}
            {onboardingOptions?.business.address.show && (
              <div className="col-span-2">
                <AddressBlock
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  trigger={trigger}
                  watch={watch}
                  readOnly={!onboardingOptions.business.address.edit}
                  required={onboardingOptions.business.address.required}
                />
              </div>
            )}
            {onboardingOptions?.business.type.show && (
              <BusinessTypeBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.type.edit}
                required={onboardingOptions.business.type.required}
              />
            )}
            {onboardingOptions?.business.ein.show && (
              <EINBlock
                control={control}
                errors={errors}
                readOnly={!onboardingOptions.business.ein.edit}
                required={onboardingOptions.business.ein.required}
              />
            )}
            {onboardingOptions?.business.formationDate.show && (
              <FormationDateBlock
                control={control}
                errors={errors}
                readOnly={!onboardingOptions.business.formationDate.edit}
                required={onboardingOptions.business.formationDate.required}
              />
            )}
            {onboardingOptions?.business.description.show && (
              <div className="col-span-2">
                <DescriptionBlock
                  register={register}
                  errors={errors}
                  readOnly={!onboardingOptions.business.description.edit}
                  required={onboardingOptions.business.description.required}
                />
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-8 flex">
        <div className="flex-1" />
        <MercoaButton isEmphasized>Next</MercoaButton>
      </div>
    </form>
  )
}

export function EntityCreation({
  organization,
  type,
  setEntityData,
}: {
  organization: Mercoa.OrganizationResponse
  type?: 'payee' | 'payor'
  setEntityData: (data: OnboardingFormData) => void
}) {
  const onboardingOptions = type === 'payee' ? organization.payeeOnboardingOptions : organization.payorOnboardingOptions

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      accountType: onboardingOptions?.enableBusiness ? Mercoa.AccountType.Business : Mercoa.AccountType.Individual,
      email: '',
      legalBusinessName: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
    },
  })

  const accountType = watch('accountType')

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setEntityData(data)
      })}
    >
      <div className="gap-4">
        {onboardingOptions?.enableBusiness && onboardingOptions?.enableIndividual && (
          <div className="col-span-2">
            <AccountTypeSelectBlock register={register} errors={errors} />
          </div>
        )}
        {accountType === 'individual' && (
          <>
            {onboardingOptions?.individual.email.show && (
              <EmailBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.individual.email.edit}
                required={onboardingOptions.individual.email.required}
              />
            )}
            {onboardingOptions?.individual.name.show && (
              <NameBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.individual.name.edit}
                required={onboardingOptions.individual.name.required}
              />
            )}
          </>
        )}
        {accountType === 'business' && (
          <>
            {onboardingOptions?.business.name.show && (
              <LegalBusinessNameBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.name.edit}
                required={onboardingOptions.business.name.required}
              />
            )}
            {onboardingOptions?.business.email.show && (
              <EmailBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.email.edit}
                required={onboardingOptions.business.email.required}
              />
            )}
          </>
        )}
      </div>
      <div className="mt-8 flex">
        <div className="flex-1" />
        <MercoaButton isEmphasized>Next</MercoaButton>
      </div>
    </form>
  )
}

export function entityDetailsForMercoaPaymentsCompleted(entity: Mercoa.EntityResponse) {
  if (!entity.profile) return false
  if (entity.accountType === 'business') {
    if (!entity.profile.business) return false
    if (!entity.profile.business.address) return false
    if (!entity.profile.business.legalBusinessName) return false
    if (!entity.profile.business.taxIdProvided) return false
    if (!entity.profile.business.businessType) return false
    if (!(entity.profile.business.description || entity.profile.business.website)) return false
  } else if (entity.accountType === 'individual') {
    if (!entity.profile.individual) return false
    if (!entity.profile.individual.address) return false
    if (!entity.profile.individual.name) return false
    if (!entity.profile.individual.phone) return false
    if (!entity.profile.individual.birthDateProvided) return false
    if (!entity.profile.individual.governmentIdProvided) return false
  }
  return true
}
