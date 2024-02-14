import { Dialog, Transition } from '@headlessui/react'
import {
  CheckCircleIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
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
import { AddDialog } from './index'

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
  addressLine1: yup
    .string()
    .required('Address is required')
    .test('addressLine1', 'PO Boxes are not supported', (value) => {
      if (value?.trim().startsWith('PO') || value?.trim().startsWith('P.O.')) {
        return false
      }
      return true
    })
    .test('addressLine1', 'Address is required', (value) => {
      if (value?.trim().startsWith('undefined')) {
        return false
      }
      return true
    }),
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
  label,
  placeholder,
}: {
  register: Function
  errors: any
  watch: Function
  setValue: Function
  trigger: Function
  readOnly?: boolean
  required?: boolean
  label?: string
  placeholder?: string
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
      setValue('country', 'US', { shouldDirty: true })
      trigger()
    },
    options: {
      fields: ['address_components'],
      types: ['address'],
    },
  })

  useEffect(() => {
    setValue('country', 'US', { shouldDirty: true })
  }, [])

  const stateOrProvince = watch('stateOrProvince')
  const [showAddress, setShowAddress] = useState(!!readOnly || stateOrProvince)

  return (
    <div className="mercoa-mt-2">
      {!showAddress ? (
        <>
          <label
            htmlFor="addressLine1"
            className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
          >
            {label ?? 'Address'}
          </label>
          <div className="mercoa-mt-1">
            <input
              ref={ref as any}
              onBlur={() => {
                setShowAddress(true)
              }}
              type="text"
              placeholder={placeholder ?? 'Enter a location'}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
              required={required}
            />
          </div>
        </>
      ) : (
        <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-4 mercoa-mb-5">
          <div className="mercoa-mt-1 mercoa-col-span-2">
            <label
              htmlFor="addressLine1"
              className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              {label ?? 'Address'}
            </label>
            <input
              {...register('addressLine1')}
              readOnly={readOnly}
              required={required}
              type="text"
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            />
            {errors.addressLine1?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors.addressLine1?.message}</p>
            )}
          </div>

          <div className="mercoa-mt-1">
            <label
              htmlFor="addressLine1"
              className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              Apartment, suite, etc.
            </label>
            <input
              {...register('addressLine2')}
              readOnly={readOnly}
              type="text"
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            />
            {errors.addressLine2?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors.addressLine2?.message}</p>
            )}
          </div>

          <div className="mercoa-mt-1">
            <label
              htmlFor="addressLine1"
              className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              City
            </label>
            <input
              {...register('city')}
              readOnly={readOnly}
              required={required}
              type="text"
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            />
            {errors.city?.message && <p className="mercoa-text-sm mercoa-text-red-500">{errors.city?.message}</p>}
          </div>

          <div className="mercoa-mt-1">
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
              inputClassName="mercoa-py-2.5"
              labelClassName="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700 -mb-2"
            />
            {errors.stateOrProvince?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors.stateOrProvince?.message}</p>
            )}
          </div>

          <div className="mercoa-mt-1">
            <label
              htmlFor="addressLine1"
              className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
            >
              Postal Code
            </label>
            <input
              {...register('postalCode')}
              readOnly={readOnly}
              required={required}
              type="text"
              className="mercoa-mt-2 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            />
            {errors.postalCode?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500">{errors.postalCode?.message}</p>
            )}
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
    <div className="mercoa-mt-2 mercoa-grid mercoa-grid-cols-2 mercoa-gap-3">
      <div>
        <label
          htmlFor="firstName"
          className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          First Name
        </label>
        <div className="mercoa-mt-1">
          <input
            {...register('firstName')}
            readOnly={readOnly}
            required={required}
            type="text"
            className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
          />
        </div>
        {errors.firstName?.message && (
          <p className="mercoa-text-sm mercoa-text-red-500">{errors.firstName?.message.toString()}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="middleName"
          className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          Middle Name <span className="mercoa-text-gray-400">{'(optional)'}</span>
        </label>
        <div className="mercoa-mt-1">
          <input
            {...register('middleName')}
            readOnly={readOnly}
            type="text"
            className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="lastName"
          className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          Last Name
        </label>
        <div className="mercoa-mt-1">
          <input
            {...register('lastName')}
            readOnly={readOnly}
            type="text"
            className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
          />
        </div>
        {errors.lastName?.message && (
          <p className="mercoa-text-sm mercoa-text-red-500">{errors.lastName?.message.toString()}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="suffix"
          className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          Suffix
        </label>
        <div className="mercoa-mt-1">
          <select
            {...register('suffix')}
            readOnly={readOnly}
            className="mercoa-mt-1 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-py-2 mercoa-px-3 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-outline-none focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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

export const dateOfBirthSchema = {
  dob: yup
    .date()
    .typeError('Date of birth is required')
    .required('Date of birth is required')
    .test('dob', 'Must be at least 18 years old', (value) => {
      if (dayjs(value).isAfter(dayjs().subtract(18, 'years'))) {
        return false
      }
      return true
    }),
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
      <label
        htmlFor="dob"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Date of birth
      </label>
      <div className="mercoa-mt-1">
        <Controller
          control={control}
          name="dob"
          render={({ field }) => (
            <ReactDatePicker
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
              onChange={(date) => field.onChange(date)}
              selected={field.value}
              required={required}
              readOnly={readOnly}
            />
          )}
        />
      </div>
      {errors.dob?.message && <p className="mercoa-text-sm mercoa-text-red-500">{errors.dob?.message.toString()}</p>}
    </div>
  )
}

export const SSNSchema = {
  taxID: yup
    .string()
    .matches(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN')
    .required('SSN is required'),
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
      <label
        htmlFor="taxID"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        SSN
      </label>
      <div className="mercoa-mt-1">
        <Controller
          control={control}
          name="taxID"
          render={({ field }) => {
            if (field.value === '****') {
              return (
                <input
                  type="text"
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
                        className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                      />
                    )) as any
                  }
                </InputMask>
              )
            }
          }}
        />
      </div>
      {errors.taxID?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.taxID?.message.toString()}</p>
      )}
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
    <div className="mercoa-mt-2">
      <label
        htmlFor="email"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Email
      </label>
      <div className="mercoa-mt-1">
        <input
          type="email"
          {...register('email')}
          readOnly={readOnly}
          required={required}
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
        />
      </div>
      {errors.email?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.email?.message.toString()}</p>
      )}
    </div>
  )
}

export const phoneSchema = {
  phoneNumber: yup
    .string()
    .matches(/^\(\d{3}\) \d{3}-\d{4}$/, 'Invalid phone number')
    .required('Phone number is required'),
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
    <div className="mercoa-mt-2">
      <label
        htmlFor="phoneNumber"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Phone
      </label>
      <div className="mercoa-mt-1">
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
                    className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                    placeholder="(777) 777-7777"
                  />
                )) as any
              }
            </InputMask>
          )}
        />
      </div>
      {errors.phoneNumber?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.phoneNumber?.message.toString()}</p>
      )}
    </div>
  )
}

export const accountTypeSchema = {
  accountType: yup.string().required(),
}

export function AccountTypeRadioBlock({ register, errors }: { register: Function; errors: any }) {
  return (
    <div className="mercoa-mt-3">
      <label
        htmlFor="accountType"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Account Type
      </label>
      <div className="mercoa-flex mercoa-items-center">
        <input
          {...register('accountType')}
          value={Mercoa.AccountType.Individual}
          type="radio"
          className="mercoa-h-4 mercoa-w-4 mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
        />
        <label
          htmlFor="accountType"
          className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          Individual
        </label>
      </div>
      <div className="mercoa-flex mercoa-items-center">
        <input
          {...register('accountType')}
          value={Mercoa.AccountType.Business}
          type="radio"
          className="mercoa-h-4 mercoa-w-4 mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
        />
        <label
          htmlFor="accountType"
          className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
        >
          Business
        </label>
      </div>
    </div>
  )
}

export function AccountTypeSelectBlock({ register, errors }: { register: Function; errors: any }) {
  return (
    <div className="mercoa-mt-3">
      <label
        htmlFor="accountType"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Account Type
      </label>
      <select
        {...register('accountType')}
        className="mercoa-mt-1 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-py-2 mercoa-px-3 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-outline-none focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
    <div className="mercoa-mt-3">
      <label
        htmlFor="businessType"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Business Type
      </label>
      <select
        {...register('businessType')}
        readOnly={readOnly}
        required={required}
        className="mercoa-mt-1 mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-py-2 mercoa-px-3 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-outline-none focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
    <div className="mercoa-mt-2">
      <label
        htmlFor="legalBusinessName"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Business Name
      </label>
      <div className="mercoa-mt-1">
        <input
          {...register('legalBusinessName')}
          readOnly={readOnly}
          required={required}
          type="text"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
        />
      </div>
      {errors.legalBusinessName?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.legalBusinessName?.message.toString()}</p>
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
    <div className="mercoa-mt-2">
      <label
        htmlFor="doingBusinessAs"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Doing business as <span className="mercoa-text-gray-400">{'(optional)'}</span>
      </label>
      <div className="mercoa-mt-1">
        <input
          {...register('doingBusinessAs')}
          readOnly={readOnly}
          type="text"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
        />
      </div>
      {errors.doingBusinessAs?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.doingBusinessAs?.message.toString()}</p>
      )}
    </div>
  )
}

export const einSchema = {
  taxID: yup
    .string()
    .matches(/^(0[1-9]|[1-9]\d)-\d{7}|[*]{2}-[*]{7}$/, 'Invalid EIN')
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
    <div className="mercoa-mt-2">
      <label
        htmlFor="taxID"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        EIN
      </label>
      <div className="mercoa-mt-1">
        <Controller
          control={control}
          name="taxID"
          render={({ field }) => {
            if (field.value === '**-*******') {
              return (
                <input
                  type="text"
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
                        className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
      {errors.taxID?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.taxID?.message.toString()}</p>
      )}
    </div>
  )
}

export const websiteSchema = {
  website: yup
    .string()
    .url('Website must start with http:// or https:// and be a valid URL')
    .required('Website is required'),
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
    <div className="mercoa-mt-2">
      <label
        htmlFor="website"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Website
      </label>
      <div className="mercoa-mt-1">
        <input
          {...register('website')}
          type="text"
          readOnly={readOnly}
          required={required}
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
        />
      </div>
      {errors.website?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.website?.message.toString()}</p>
      )}
    </div>
  )
}

export const descriptionSchema = {
  description: yup.string().required('Description is required'),
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
    <div className="mercoa-mt-2">
      <label
        htmlFor="description"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Business Description
      </label>
      <div className="mercoa-mt-1">
        <input
          {...register('description')}
          type="text"
          className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
          readOnly={readOnly}
          required={required}
        />
      </div>
      {errors.description?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500">{errors.description?.message.toString()}</p>
      )}
    </div>
  )
}

export const formationDateSchema = {
  formationDate: yup.date().required('Formation date is required'),
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
      <label
        htmlFor="formationDate"
        className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
      >
        Business Formation Date
      </label>
      <div className="mercoa-mt-1 mercoa-text-left">
        <Controller
          control={control}
          name="formationDate"
          render={({ field }) => (
            <ReactDatePicker
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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
  } catch (e: any) {
    toast.error(`There was an error saving your data.\n Error: ${e.body}`)
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
  const mercoaSession = useMercoaSession()

  function setShowAdd(state: boolean) {
    setShowAddLocal(state)
    if (!state && onClose) onClose()
  }

  const { register, handleSubmit, watch, formState } = useForm({
    defaultValues: {
      accountType: Mercoa.AccountType.Business,
      legalBusinessName: '',
      email: '',
      firstName: '',
      lastName: '',
    },
    resolver: async (data, context, options) => {
      if (data.accountType === Mercoa.AccountType.Business) {
        return await yupResolver(
          yup.object({
            ...accountTypeSchema,
            ...legalBusinessNameSchema,
            ...emailSchema,
          }),
        )(data, context, options as any)
      } else {
        return await yupResolver(
          yup.object({
            ...accountTypeSchema,
            ...nameBlockSchema,
            ...emailSchema,
          }),
        )(data, context, options as any)
      }
    },
  })

  const accountType = watch('accountType')

  return (
    <>
      <button
        onClick={() => {
          setShowAdd(true)
        }}
        className={
          className ||
          'mercoa-inline-flex mercoa-items-center mercoa-justify-center mercoa-rounded-md mercoa-border mercoa-border-transparent mercoa-bg-mercoa-primary mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-mercoa-primary-dark focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-mercoa-primary focus:mercoa-ring-offset-2 sm:mercoa-w-auto'
        }
      >
        {buttonText || 'Get Started'}
      </button>
      <Transition.Root show={showAdd} as={Fragment}>
        <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={setShowAdd}>
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
                <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-sm sm:mercoa-p-6">
                  <form
                    onSubmit={handleSubmit(async (data) => {
                      if (!mercoaSession.client) return
                      const entity = await createOrUpdateEntity({
                        data,
                        onClose: setShowAdd,
                        isPayee,
                        isPayor,
                        mercoaClient: mercoaSession.client,
                      })
                      if (entity) {
                        const onboard = confirm('Do you want to onboard the entity?')
                        if (onboard) {
                          const link = await mercoaSession.client.entity.getOnboardingLink(entity.id, {
                            type: isPayee ? 'PAYEE' : 'PAYOR',
                          })
                          window.location.href = link
                        }
                      }
                    })}
                  >
                    <div>
                      <AccountTypeSelectBlock register={register} errors={formState.errors} />
                      {accountType === Mercoa.AccountType.Business ? (
                        <LegalBusinessNameBlock register={register} errors={formState.errors} />
                      ) : (
                        <NameBlock register={register} errors={formState.errors} />
                      )}
                      <EmailBlock register={register} errors={formState.errors} />
                    </div>
                    <div className="mercoa-mt-4">
                      <button
                        type="submit"
                        className="mercoa-w-full mercoa-inline-flex mercoa-justify-center mercoa-rounded-md mercoa-border mercoa-border-transparent mercoa-bg-mercoa-primary mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-mercoa-primary-dark focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-mercoa-primary focus:mercoa-ring-offset-2 sm:mercoa-w-auto"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
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
      ...phoneSchema,
      ...addressBlockSchema,
      ...nameBlockSchema,
      ...dateOfBirthSchema,
      ...SSNSchema,
      jobTitle: yup.string().required('Job title is required'),
      ownershipPercentage: yup
        .number()
        .typeError('Ownership percentage is required')
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
        <div className="mercoa-mt-1">
          <div className="mercoa-flex">
            <div className="mercoa-flex-1" />
            <Dialog.Title as="h3" className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
              <button></button>
              {title || 'Create Account'}
            </Dialog.Title>
            <div className="mercoa-flex-1" />
            <XMarkIcon
              className="mercoa-h-5 mercoa-w-5 mercoa-cursor-pointer  mercoa-rounded-md mercoa-p-0.5 hover:mercoa-bg-gray-100"
              type="button"
              onClick={() => {
                if (onClose) onClose()
              }}
            />
          </div>

          <NameBlock register={register} errors={errors} />

          <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-3">
            <EmailBlock register={register} errors={errors} />
            <PhoneBlock control={control} errors={errors} />
            <DateOfBirthBlock control={control} errors={errors} />
            <SSNBlock control={control} errors={errors} />

            <div className="mercoa-mt-2">
              <label
                htmlFor="jobTitle"
                className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
              >
                Job Title
              </label>
              <div className="mercoa-mt-1">
                <input
                  {...register('jobTitle')}
                  type="text"
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                />
              </div>
              {errors.jobTitle?.message && (
                <p className="mercoa-text-sm mercoa-text-red-500">{errors.jobTitle?.message.toString()}</p>
              )}
            </div>

            <div className="mercoa-mt-2">
              <label
                htmlFor="ownershipPercentage"
                className="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
              >
                Percent Ownership
              </label>
              <div className="mercoa-mt-1">
                <input
                  {...register('ownershipPercentage')}
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                />
              </div>
              {errors.ownershipPercentage?.message && (
                <p className="mercoa-text-sm mercoa-text-red-500">{errors.ownershipPercentage?.message.toString()}</p>
              )}
            </div>
          </div>
          <AddressBlock
            register={register}
            errors={errors}
            setValue={setValue}
            trigger={trigger}
            watch={watch}
            label="Residential Address"
          />
          <div className="mercoa-relative mercoa-mt-2 mercoa-flex mercoa-items-start mercoa-items-center">
            <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
              <input
                {...register('isController')}
                type="checkbox"
                className="mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
              />
            </div>
            <div className="mercoa-ml-3 mercoa-text-sm">
              {/* @ts-ignore:next-line */}
              <Tooltip title="Every business requires a controller. Examples include the CEO, COO, Treasurer, President, Vice President, or Managing Partner.">
                <label htmlFor="isController" className="mercoa-font-medium mercoa-text-gray-700">
                  This person is a company controller{' '}
                  <InformationCircleIcon className="mercoa-inline mercoa-h-5 mercoa-w-5" />
                </label>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      <div className="mercoa-mt-5 sm:mercoa-mt-6">
        <button
          disabled={!isValid}
          className="mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-rounded-md mercoa-border mercoa-border-transparent mercoa-bg-mercoa-primary mercoa-px-4 mercoa-py-2 mercoa-text-base mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-mercoa-primary-dark focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-mercoa-primary focus:mercoa-ring-offset-2 disabled:mercoa-bg-mercoa-primary-light sm:mercoa-text-sm"
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
            <div className="mercoa-mt-2" key={account.id}>
              <RepresentativeComponent representative={account} onSelect={onSelect} showEdit={showEdit} />
            </div>
          ))}
        {showAdd && (
          <div className="mercoa-mt-2">
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
        <div className="mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-mt-5">
          {reps?.some((e) => e.responsibilities.isController) ? (
            <>
              <CheckCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-green-400" />
              <p className="mercoa-font-gray-700 mercoa-text-sm">At least one controller is added</p>
            </>
          ) : (
            <>
              <XCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-red-400" />
              <p className="mercoa-font-gray-700 mercoa-text-sm">At least one controller needs to be added</p>
            </>
          )}
        </div>
        <div className="mercoa-flex mercoa-items-center mercoa-space-x-3">
          {reps && reps?.length > 0 ? (
            <>
              <CheckCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-green-400" />
              <p className="mercoa-font-gray-700 mercoa-text-sm">At least one representative is added</p>
            </>
          ) : (
            <>
              <XCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-red-400" />
              <p className="mercoa-font-gray-700 mercoa-text-sm">At least one representative needs to be added</p>
            </>
          )}
        </div>
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
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-lg mercoa-border ${
          selected ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
        } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 ${
          onSelect ? 'mercoa-cursor-pointer hover:mercoa-border-gray-400' : ''
        }`}
      >
        <div
          className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
            selected
              ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
              : 'mercoa-bg-gray-200 mercoa-text-gray-600'
          }`}
        >
          <UserIcon className="mercoa-h-5 mercoa-w-5" />
        </div>
        <div className="mercoa-min-w-0 mercoa-flex-1">
          {!showEdit && <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />}
          <p className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}>
            {representative.name.firstName} {representative.name.lastName} - {representative.responsibilities?.jobTitle}
          </p>
          <p className={`mercoa-text-xs mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}>
            Ownership: {representative.responsibilities?.ownershipPercentage}%
          </p>
          {representative.responsibilities?.isController && (
            <p
              className={`mercoa-text-xs mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
            >
              Controller
            </p>
          )}
        </div>
        {showEdit && (
          <div className="mercoa-flex-shrink-0">
            <button
              className="mercoa-ml-1 mercoa-cursor-pointer hover:mercoa-text-red-300"
              onClick={() => deleteAccount()}
            >
              {' '}
              <TrashIcon className="mercoa-h-5 mercoa-w-5" />
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
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-lg mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 hover:mercoa-border-gray-400 ${
          onSelect ? 'mercoa-cursor-pointer ' : ''
        }`}
      >
        <div
          className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
            selected
              ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
              : 'mercoa-bg-gray-200 mercoa-text-gray-600'
          }`}
        >
          <PlusIcon className="mercoa-h-5 mercoa-w-5" />
        </div>
        <div className="mercoa-min-w-0 mercoa-flex-1">
          <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />
          <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">Add new representative</p>
          <p className="mercoa-truncate mercoa-text-sm mercoa-text-gray-500"></p>
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
      className="mercoa-mt-2"
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
        <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={setShowAdd}>
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
                <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-md sm:mercoa-p-6">
                  <Dialog.Title className="mercoa-mb-3 mercoa-w-full mercoa-text-center mercoa-text-xl mercoa-text-gray-800 mercoa-underline">
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
      <div className="mercoa-mb-10 mercoa-text-sm">
        <b>{capitalize(mercoaSession.organization?.name)}</b> has partnered with{' '}
        <a href="https://mercoa.com" target="_blank" rel="noreferrer" className="mercoa-text-blue-500 mercoa-underline">
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
          className="mercoa-text-blue-500 mercoa-underline"
        >
          Mercoa Platform Agreement
        </a>{' '}
        and{' '}
        <a
          href="https://mercoa.com/legal/privacy-policy/"
          target="_blank"
          rel="noreferrer"
          className="mercoa-text-blue-500 mercoa-underline"
        >
          Privacy Policy
        </a>
        .
      </div>
      <div className="mercoa-relative mercoa-mt-2 mercoa-flex mercoa-items-start mercoa-items-center">
        <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
          <input
            {...register('mercoa')}
            type="checkbox"
            className="mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
          />
        </div>
        <div className="mercoa-ml-3 mercoa-text-sm">
          <label htmlFor="isController" className="mercoa-font-medium mercoa-text-gray-700">
            I have read and accept the{' '}
            <a
              href="https://mercoa.com/legal/platform-agreement/"
              target="_blank"
              rel="noreferrer"
              className="mercoa-text-blue-500 mercoa-underline"
            >
              {' '}
              Mercoa terms of service
            </a>
          </label>
        </div>
      </div>
      <MercoaButton isEmphasized disabled={!data.mercoa} className="mercoa-mt-5" size="md">
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

      firstName: entity.profile.individual?.name.firstName ?? '',
      middleName: entity.profile.individual?.name.middleName,
      lastName: entity.profile.individual?.name.lastName ?? '',
      suffix: entity.profile.individual?.name.suffix,

      phoneNumber: formatPhoneNumber(
        entity.profile.individual?.phone?.number ?? entity.profile.business?.phone?.number,
      ),

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
    resolver: async (data, context, options) => {
      if (data.accountType === Mercoa.AccountType.Individual) {
        return yupResolver(
          yup
            .object({
              ...(onboardingOptions?.individual.name.required && nameBlockSchema),
              ...(onboardingOptions?.individual.email.required && emailSchema),
              ...(onboardingOptions?.individual.phone.required && phoneSchema),
              ...(onboardingOptions?.individual.dateOfBirth.required && dateOfBirthSchema),
              ...(onboardingOptions?.individual.address.required && addressBlockSchema),
              ...(onboardingOptions?.individual.ssn.required && SSNSchema),
            })
            .required(),
        )(data, context, options as any) as any
      } else {
        return yupResolver(
          yup
            .object({
              ...(onboardingOptions?.business.name.required && legalBusinessNameSchema),
              ...(onboardingOptions?.business.email.required && emailSchema),
              ...(onboardingOptions?.business.phone.required && phoneSchema),
              ...(onboardingOptions?.business.website.required && websiteSchema),
              ...(onboardingOptions?.business.address.required && addressBlockSchema),
              ...(onboardingOptions?.business.ein.required && einSchema),
              ...(onboardingOptions?.business.formationDate.required && formationDateSchema),
              ...(onboardingOptions?.business.description.required && descriptionSchema),
            })
            .required(),
        )(data, context, options as any) as any
      }
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
      <div className="sm:mercoa-grid sm:mercoa-grid-cols-2 mercoa-gap-4">
        {onboardingOptions?.enableBusiness && onboardingOptions?.enableIndividual && (
          <div className="mercoa-col-span-2">
            <AccountTypeSelectBlock register={register} errors={errors} />
          </div>
        )}
        {accountType === 'individual' && (
          <>
            {onboardingOptions?.individual.email.show && (
              <div className="mercoa-col-span-2">
                <EmailBlock
                  register={register}
                  errors={errors}
                  readOnly={!onboardingOptions.individual.email.edit}
                  required={onboardingOptions.individual.email.required}
                />
              </div>
            )}
            {onboardingOptions?.individual.name.show && (
              <div className="mercoa-col-span-2">
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
              <div className="mercoa-col-span-2">
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
              <div className="mercoa-col-span-2">
                <AddressBlock
                  label="Business Address"
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
              <div className="mercoa-col-span-2">
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
      <div className="mercoa-mt-8 mercoa-flex">
        <div className="mercoa-flex-1" />
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
      <div className="mercoa-gap-4">
        {onboardingOptions?.enableBusiness && onboardingOptions?.enableIndividual && (
          <div className="mercoa-col-span-2">
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
      <div className="mercoa-mt-8 mercoa-flex">
        <div className="mercoa-flex-1" />
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

function formatPhoneNumber(phoneNumberString?: string) {
  var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
  var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }
  return phoneNumberString
}
