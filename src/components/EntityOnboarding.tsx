import { Dialog, Transition } from '@headlessui/react'
import {
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import { Fragment, useEffect, useState } from 'react'
import { usePlacesWidget } from 'react-google-autocomplete'
import { Control, Controller, UseFormRegister, useForm } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { toast } from 'react-toastify'
import { Mercoa, MercoaClient } from '@mercoa/javascript'
import * as yup from 'yup'
import { capitalize } from '../lib/lib'
import { postalCodeRegex, usaStates } from '../lib/locations'
import { mccCodes } from '../lib/mccCodes'
import {
  AddDialog,
  DisbursementMethods,
  LoadingSpinner,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  MercoaInput,
  MercoaInputLabel,
  NoSession,
  Tooltip,
  inputClassName,
  useMercoaSession,
} from './index'

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
  mcc?: string
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
  emailTo?: string
  foreignId?: string
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
  register: UseFormRegister<any>
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
      if (!place) return
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
    <div>
      {!showAddress ? (
        <>
          <MercoaInputLabel label={label ?? 'Address'} name="addressLine1" />
          <div className="mercoa-mt-1">
            <input
              ref={ref as any}
              onBlur={() => {
                setShowAddress(true)
              }}
              type="text"
              placeholder={placeholder ?? 'Enter a location'}
              className={inputClassName({})}
              required={required}
            />
          </div>
        </>
      ) : (
        <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-3 mercoa-mb-5">
          <MercoaInput
            label={label ?? 'Address'}
            register={register}
            name="addressLine1"
            className="mercoa-mt-1 mercoa-col-span-2"
            errors={errors}
            readOnly={readOnly}
            required={required}
          />
          <MercoaInput
            label="Apartment, suite, etc."
            register={register}
            name="addressLine2"
            className="mercoa-mt-1"
            errors={errors}
            readOnly={readOnly}
          />

          <MercoaInput
            label="City"
            register={register}
            name="city"
            className="mercoa-mt-1"
            errors={errors}
            readOnly={readOnly}
            required={required}
          />

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
              labelClassName="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700 -mercoa-mb-1"
            />
            {errors.stateOrProvince?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500 mercoa-text-left">{errors.stateOrProvince?.message}</p>
            )}
          </div>
          <MercoaInput
            label="Postal Code"
            register={register}
            name="postalCode"
            className="mercoa-mt-1"
            errors={errors}
            readOnly={readOnly}
            required={required}
          />
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
  register: UseFormRegister<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-3">
      <MercoaInput
        label="First Name"
        register={register}
        name="firstName"
        errors={errors}
        readOnly={readOnly}
        required={required}
      />
      <MercoaInput
        label="Middle Name"
        register={register}
        name="middleName"
        errors={errors}
        readOnly={readOnly}
        required={required}
        optional
      />
      <MercoaInput
        label="Last Name"
        register={register}
        name="lastName"
        errors={errors}
        readOnly={readOnly}
        required={required}
      />
      <div>
        <MercoaInputLabel label="Suffix" name="suffix" />
        <div className="mercoa-mt-1">
          <select {...register('suffix')} disabled={readOnly} className={inputClassName({})}>
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
    <MercoaInput
      type="date"
      label="Date of Birth"
      name="dob"
      errors={errors}
      readOnly={readOnly}
      required={required}
      control={control}
    />
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
      <MercoaInputLabel label="SSN" name="taxID" />
      <div className="mercoa-mt-1">
        <Controller
          control={control}
          name="taxID"
          render={({ field }) => {
            if (field.value === '****') {
              return (
                <input
                  type="text"
                  className={inputClassName({})}
                  placeholder="123-45-6789"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                />
              )
            } else {
              return (
                <PatternFormat
                  format={'###-##-####'}
                  allowEmptyFormatting
                  mask="_"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                  required={required}
                  placeholder="123-45-6789"
                  className={inputClassName({})}
                />
              )
            }
          }}
        />
      </div>
      {errors.taxID?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500 mercoa-text-left">{errors.taxID?.message.toString()}</p>
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
  register: UseFormRegister<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <MercoaInput
      label="Email"
      register={register}
      name="email"
      errors={errors}
      readOnly={readOnly}
      required={required}
    />
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
    <MercoaInput
      label="Phone"
      control={control}
      name="phoneNumber"
      errors={errors}
      readOnly={readOnly}
      required={required}
      inputMask={'(###) ###-####'}
    />
  )
}

export const accountTypeSchema = {
  accountType: yup.string().required(),
}

export function AccountTypeRadioBlock({ register, errors }: { register: UseFormRegister<any>; errors: any }) {
  return (
    <div className="mercoa-mt-1">
      <MercoaInputLabel label="Account Type" name="accountType" />
      <div className="mercoa-flex mercoa-items-center">
        <input
          {...register('accountType')}
          value={Mercoa.AccountType.Individual}
          type="radio"
          className={inputClassName({})}
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
          className={inputClassName({})}
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

export function AccountTypeSelectBlock({ register, errors }: { register: UseFormRegister<any>; errors: any }) {
  return (
    <div className="mercoa-mt-1">
      <MercoaInputLabel label="Account Type" name="accountType" />
      <div className="mercoa-mt-1">
        <select {...register('accountType')} className={inputClassName({})}>
          <option value={Mercoa.AccountType.Individual}>Individual</option>
          <option value={Mercoa.AccountType.Business}>Business</option>
        </select>
      </div>
    </div>
  )
}

export function BusinessTypeBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: UseFormRegister<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <div>
      <MercoaInputLabel label="Business Type" name="businessType" />
      <div className="mercoa-mt-1">
        <select {...register('businessType')} disabled={readOnly} required={required} className={inputClassName({})}>
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
  register: UseFormRegister<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <MercoaInput
      label="Business Name"
      register={register}
      name="legalBusinessName"
      errors={errors}
      readOnly={readOnly}
      required={required}
    />
  )
}

export const doingBusinessAsSchema = {
  doingBusinessAs: yup.string(),
}

export function DoingBusinessAsBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: UseFormRegister<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <MercoaInput
      label="Doing Business As"
      register={register}
      name="doingBusinessAs"
      errors={errors}
      readOnly={readOnly}
      required={required}
    />
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
    <div>
      <MercoaInputLabel label="EIN" name="taxID" />
      <div className="mercoa-mt-1">
        <Controller
          control={control}
          name="taxID"
          render={({ field }) => {
            if (field.value === '**-*******') {
              return (
                <input
                  type="text"
                  className={inputClassName({})}
                  placeholder="12-3456789"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                />
              )
            } else {
              return (
                <PatternFormat
                  format={'##-#######'}
                  allowEmptyFormatting
                  mask="_"
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                  required={required}
                  placeholder="12-3456789"
                  className={inputClassName({})}
                />
              )
            }
          }}
        />
      </div>
      {errors.taxID?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500 mercoa-text-left">{errors.taxID?.message.toString()}</p>
      )}
    </div>
  )
}

export const mccSchema = {
  mcc: yup.string().required('MCC is required'),
}

export function MCCBlock({ watch, setValue }: { watch: Function; setValue: Function }) {
  const mcc = watch('mcc')

  return (
    <MercoaCombobox
      options={mccCodes.map((value) => ({
        disabled: false,
        value,
      }))}
      displayIndex="name"
      label="Merchant Categorization Code"
      value={mccCodes.find((e) => e.code === mcc)}
      onChange={({ code }) => {
        setValue('mcc', code, { shouldDirty: true })
      }}
      labelClassName="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-700 -mercoa-mb-1"
    />
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
  register: UseFormRegister<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <MercoaInput
      label="Website"
      register={register}
      name="website"
      errors={errors}
      readOnly={readOnly}
      required={required}
    />
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
  register: UseFormRegister<any>
  errors: any
  readOnly?: boolean
  required?: boolean
}) {
  return (
    <MercoaInput
      label="Business Description"
      register={register}
      name="description"
      errors={errors}
      readOnly={readOnly}
      required={required}
    />
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
    <MercoaInput
      type="date"
      label="Business Formation Date"
      name="formationDate"
      errors={errors}
      readOnly={readOnly}
      required={required}
      control={control}
    />
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
  onClose?: (entity: Mercoa.EntityResponse) => void
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
      ...(data.mcc && {
        industryCodes: {
          mcc: data.mcc,
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
    foreignId: data.foreignId,
    emailTo: data.emailTo,
  }

  let resp: Mercoa.EntityResponse | undefined = undefined

  try {
    if (entityId) {
      resp = await mercoaClient?.entity.update(entityId, postData)
    } else {
      resp = await mercoaClient?.entity.create(postData)
    }
    if (onClose) onClose(resp)
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
  onClose?: (entity: Mercoa.EntityResponse) => void
  isPayee: boolean
  isPayor: boolean
}) {
  const [showAdd, setShowAdd] = useState(false)
  const mercoaSession = useMercoaSession()

  const { register, handleSubmit, watch, formState, reset } = useForm({
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

  if (!mercoaSession.client) return <NoSession componentName="EntityOnboardingButton" />
  return (
    <>
      <button
        onClick={() => {
          setShowAdd(true)
        }}
        className={
          className ||
          'mercoa-inline-flex mercoa-items-center mercoa-justify-center mercoa-rounded-mercoa mercoa-border mercoa-border-transparent mercoa-bg-mercoa-primary mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-mercoa-primary-dark focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-mercoa-primary focus:mercoa-ring-offset-2 sm:mercoa-w-auto'
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
                <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-sm sm:mercoa-p-6">
                  <form
                    onSubmit={handleSubmit(async (data) => {
                      if (!mercoaSession.client) return
                      await createOrUpdateEntity({
                        data,
                        onClose: (entity) => {
                          reset()
                          setShowAdd(false)
                          if (onClose) {
                            onClose(entity)
                          }
                        },
                        isPayee,
                        isPayor,
                        mercoaClient: mercoaSession.client,
                      })
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
                        className="mercoa-w-full mercoa-inline-flex mercoa-justify-center mercoa-rounded-mercoa mercoa-border mercoa-border-transparent mercoa-bg-mercoa-primary mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-mercoa-primary-dark focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-mercoa-primary focus:mercoa-ring-offset-2 sm:mercoa-w-auto"
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

  if (!mercoaSession.client) return <NoSession componentName="RepresentativeOnboardingForm" />
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <div className="mercoa-mt-1">
          <div className="mercoa-flex">
            <div className="mercoa-flex-1" />
            <h3 className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
              <button></button>
              {title || 'Create Account'}
            </h3>
            <div className="mercoa-flex-1" />
            <XMarkIcon
              className="mercoa-size-5 mercoa-cursor-pointer mercoa-rounded-mercoa mercoa-p-0.5 hover:mercoa-bg-gray-100"
              type="button"
              onClick={() => {
                if (onClose) onClose()
              }}
            />
          </div>

          <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-3">
            <div className="mercoa-col-span-2">
              <NameBlock register={register} errors={errors} />
            </div>
            <EmailBlock register={register} errors={errors} />
            <PhoneBlock control={control} errors={errors} />
            <DateOfBirthBlock control={control} errors={errors} />
            <SSNBlock control={control} errors={errors} />
            <MercoaInput label="Job Title" register={register} name="jobTitle" errors={errors} />
            <MercoaInput
              label="Percent Ownership"
              register={register}
              name="ownershipPercentage"
              errors={errors}
              type="number"
              min={0}
              max={100}
              placeholder="0-100"
            />
            <div className="mercoa-col-span-2">
              <AddressBlock
                register={register}
                errors={errors}
                setValue={setValue}
                trigger={trigger}
                watch={watch}
                label="Residential Address"
              />
            </div>
            <div className="mercoa-relative mercoa-mt-2 mercoa-flex mercoa-items-start mercoa-items-center mercoa-col-span-2">
              <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
                <input
                  {...register('isController')}
                  type="checkbox"
                  className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
                />
              </div>
              <div className="mercoa-ml-3 mercoa-text-sm">
                {/* @ts-ignore:next-line */}
                <Tooltip title="Every business requires a controller. Examples include the CEO, COO, Treasurer, President, Vice President, or Managing Partner.">
                  <label htmlFor="isController" className="mercoa-font-medium mercoa-text-gray-700">
                    This person is a company controller{' '}
                    <InformationCircleIcon className="mercoa-inline mercoa-size-5" />
                  </label>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mercoa-mt-5 sm:mercoa-mt-6">
        <MercoaButton isEmphasized className="mercoa-w-full">
          Add Representative
        </MercoaButton>
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

  if (!mercoaSession.client) return <NoSession componentName="Representatives" />
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
              <CheckCircleIcon className="mercoa-size-5 mercoa-text-green-400" />
              <p className="mercoa-font-gray-700 mercoa-text-sm">At least one controller is added</p>
            </>
          ) : (
            <>
              <XCircleIcon className="mercoa-size-5 mercoa-text-red-400" />
              <p className="mercoa-font-gray-700 mercoa-text-sm">At least one controller needs to be added</p>
            </>
          )}
        </div>
        <div className="mercoa-flex mercoa-items-center mercoa-space-x-3">
          {reps && reps?.length > 0 ? (
            <>
              <CheckCircleIcon className="mercoa-size-5 mercoa-text-green-400" />
              <p className="mercoa-font-gray-700 mercoa-text-sm">At least one representative is added</p>
            </>
          ) : (
            <>
              <XCircleIcon className="mercoa-size-5 mercoa-text-red-400" />
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
      await mercoaSession.client?.entity.representative?.delete(mercoaSession.entity.id, representative?.id ?? '')
      await mercoaSession.refresh()
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="RepresentativeComponent" />
  if (representative) {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(representative)
        }}
        key={representative?.id}
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border ${
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
          <UserIcon className="mercoa-size-5" />
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
              <TrashIcon className="mercoa-size-5" />
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
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 hover:mercoa-border-gray-400 ${
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
          <PlusIcon className="mercoa-size-5" />
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

  if (!mercoaSession.client) return <NoSession componentName="VerifyOwnersButton" />
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
        await mercoaSession.refresh()
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
  const [show, setShow] = useState(false)
  function close() {
    setShow(false)
    if (onClose) onClose()
  }

  return (
    <>
      <MercoaButton
        onClick={() => {
          setShow(true)
        }}
        isEmphasized
        size="md"
      >
        {buttonText || 'Terms of Service'}
      </MercoaButton>
      <Transition.Root show={show} as={Fragment}>
        <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={close}>
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
                <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-md sm:mercoa-p-6">
                  <Dialog.Title className="mercoa-mb-3 mercoa-w-full mercoa-text-center mercoa-text-xl mercoa-text-gray-800 mercoa-underline">
                    {title || 'Terms of Service'}
                  </Dialog.Title>
                  <AcceptTosForm
                    entity={entity}
                    onComplete={async () => {
                      close
                    }}
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

export function AcceptTosForm({
  entity,
  onComplete,
}: {
  entity: Mercoa.EntityResponse
  onComplete: () => Promise<void>
}) {
  const mercoaSession = useMercoaSession()
  const { register, watch, handleSubmit } = useForm()

  const data = watch()

  if (!mercoaSession.client) return <NoSession componentName="AcceptTosForm" />
  return (
    <form
      onSubmit={handleSubmit(async () => {
        if (!entity.id) {
          toast.error('Entity not found')
          return
        }
        await mercoaSession.client?.entity.acceptTermsOfService(entity.id)
        if (onComplete) {
          await onComplete()
        }
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
            className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
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

export function EntityOnboardingForm({
  entity,
  type,
  onOnboardingSubmit,
  onCancel,
  admin,
}: {
  entity: Mercoa.EntityResponse
  type: 'payee' | 'payor'
  onOnboardingSubmit?: (data: OnboardingFormData) => void
  onCancel?: () => void
  admin?: boolean
}) {
  const mercoaSession = useMercoaSession()

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
      mcc: entity.profile.business?.industryCodes?.mcc ?? '',
      dob: new Date(),

      legalBusinessName: entity.profile.business?.legalBusinessName ?? '',
      doingBusinessAs: entity.profile.business?.doingBusinessAs,
      description: entity.profile.business?.description,
      website: entity.profile.business?.website,
      formationDate: new Date(),
      foreignId: entity.foreignId,
      emailTo: entity.emailTo,
      isCustomer: entity.isCustomer,
      isPayor: entity.isPayor,
      isPayee: entity.isPayee,
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
              ...(onboardingOptions?.business.mcc.required && mccSchema),
              ...(onboardingOptions?.business.formationDate.required && formationDateSchema),
              ...(onboardingOptions?.business.description.required && descriptionSchema),
            })
            .required(),
        )(data, context, options as any) as any
      }
    },
  })

  const accountType = watch('accountType')

  if (!mercoaSession.client) return <NoSession componentName="EntityOnboardingForm" />
  if (!mercoaSession.organization) return <LoadingSpinner />

  const onboardingOptions =
    type === 'payee'
      ? mercoaSession.organization?.payeeOnboardingOptions
      : mercoaSession.organization?.payorOnboardingOptions

  if (admin && onboardingOptions) {
    ;(Object.keys(onboardingOptions.individual) as Array<keyof Mercoa.IndividualOnboardingOptions>).forEach((key) => {
      onboardingOptions.individual[key].show = true
      onboardingOptions.individual[key].edit = true
      onboardingOptions.individual[key].required = false
    })
    ;(Object.keys(onboardingOptions.business) as Array<keyof Mercoa.BusinessOnboardingOptions>).forEach((key) => {
      onboardingOptions.business[key].show = true
      onboardingOptions.business[key].edit = true
      onboardingOptions.business[key].required = false
    })
    onboardingOptions.paymentMethod = false
  }

  return (
    <form
      onSubmit={handleSubmit(async (entityData) => {
        if (!entity) return
        if (!entityData) return
        if (!mercoaSession.client) return
        await createOrUpdateEntity({
          data: entityData,
          entityId: entity.id,
          mercoaClient: mercoaSession.client,
          isPayee: admin ? entityData.isPayee : type === 'payee',
          isPayor: admin ? entityData.isPayor : type === 'payor',
        })
        if (admin) {
          toast.success('Entity Updated')
        }
        if (onOnboardingSubmit) {
          onOnboardingSubmit(entityData)
        } else {
          await mercoaSession.refresh()
        }
      })}
    >
      <div className="sm:mercoa-grid sm:mercoa-grid-cols-2 mercoa-gap-3">
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
            {onboardingOptions?.business.doingBusinessAs.show && (
              <DoingBusinessAsBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.doingBusinessAs.edit}
                required={onboardingOptions.business.doingBusinessAs.required}
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
            {onboardingOptions?.business.mcc.show && <MCCBlock watch={watch} setValue={setValue} />}
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
        {admin && (
          <>
            <h3 className="mercoa-col-span-2 mercoa-text-lg mercoa-font-medium mercoa-text-gray-900 mercoa-my-2 mercoa-pt-3 mercoa-border-t-2">
              Admin Options
            </h3>
            <MercoaInput
              register={register}
              name="emailTo"
              label={'Email Inbox Address'}
              type="text"
              trailingIcon={
                <span className="mercoa-px-2 mercoa-text-sm mercoa-text-gray-600">
                  @{mercoaSession.organization.emailProvider?.inboxDomain}
                </span>
              }
            />
            <MercoaInput register={register} name="foreignId" label="Foreign ID" type="text" />
            <div className="mercoa-col-span-full mercoa-grid mercoa-grid-cols-3 mercoa-space-x-2">
              <div className="mercoa-flex mercoa-items-center mercoa-space-x-2 mercoa-rounded-mercoa mercoa-border mercoa-p-2">
                <label
                  htmlFor="isCustomer"
                  className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                >
                  Customer
                </label>
                <input
                  type="checkbox"
                  {...register('isCustomer')}
                  className={'mercoa-size-4 mercoa-rounded mercoa-border-gray-300 focus:mercoa-ring-mercoa-primary'}
                />
              </div>
              <div className="mercoa-flex mercoa-items-center mercoa-space-x-2 mercoa-rounded-mercoa mercoa-border mercoa-p-2">
                <label
                  htmlFor="isPayor"
                  className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                >
                  Payor
                </label>
                <input
                  type="checkbox"
                  {...register('isPayor')}
                  className={'mercoa-size-4 mercoa-rounded mercoa-border-gray-300 focus:mercoa-ring-mercoa-primary'}
                />
              </div>
              <div className="mercoa-flex mercoa-items-center mercoa-space-x-2 mercoa-rounded-mercoa mercoa-border mercoa-p-2">
                <label
                  htmlFor="isPayee"
                  className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                >
                  Payee
                </label>
                <input
                  type="checkbox"
                  {...register('isPayee')}
                  className={'mercoa-size-4 mercoa-rounded mercoa-border-gray-300 focus:mercoa-ring-mercoa-primary'}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mercoa-mt-8 mercoa-flex">
        <div className="mercoa-flex-1" />

        {onCancel && (
          <MercoaButton isEmphasized={false} color="red" className="mercoa-mr-2" type="button" onClick={onCancel}>
            Cancel
          </MercoaButton>
        )}
        <MercoaButton isEmphasized>{onCancel ? 'Update' : admin ? 'Submit' : 'Next'}</MercoaButton>
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
      <div className="mercoa-gap-3">
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
            {onboardingOptions?.business.doingBusinessAs.show && (
              <DoingBusinessAsBlock
                register={register}
                errors={errors}
                readOnly={!onboardingOptions.business.doingBusinessAs.edit}
                required={onboardingOptions.business.doingBusinessAs.required}
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

export function EntityOnboarding({
  entityId,
  connectedEntityName,
  type,
}: {
  type: 'payee' | 'payor'
  connectedEntityName?: string
  entityId?: Mercoa.EntityId
}) {
  const [entity, setEntity] = useState<Mercoa.EntityResponse>()
  const [representatives, setRepresentatives] = useState<Mercoa.RepresentativeResponse[]>([])
  const [entityData, setEntityData] = useState<OnboardingFormData>()
  const [formState, setFormState] = useState<'entity' | 'representatives' | 'payments' | 'tos' | 'complete'>('entity')
  const [loading, setLoading] = useState(false)

  const mercoaSession = useMercoaSession()

  useEffect(() => {
    if (!mercoaSession.client || !entityId) return
    mercoaSession.client.entity.get(entityId).then((resp) => {
      setEntity(resp)
    })
  }, [mercoaSession.client, entityId, mercoaSession.refreshId])

  useEffect(() => {
    if (!mercoaSession.organization) return
    if (!mercoaSession.client) return
    if (!entity) return
    let getReps = false
    if (type === 'payee' && mercoaSession.organization.payeeOnboardingOptions?.business.representatives.show) {
      getReps = true
    } else if (type === 'payor' && mercoaSession.organization.payorOnboardingOptions?.business.representatives.show) {
      getReps = true
    }
    if (getReps) {
      mercoaSession.client.entity.representative.getAll(entity.id).then((resp) => {
        setRepresentatives(resp)
      })
    }
  }, [mercoaSession.organization, mercoaSession.client, entity, type])

  useEffect(() => {
    if (!mercoaSession.organization) return
    if (!mercoaSession.client) return
    if (!entity) return
    // Representatives transition function
    if (formState === 'representatives') {
      // Skip representatives, transition to payments if entity is individual
      if (entityData?.accountType === 'individual') {
        setFormState('payments')
        return
      }
      // If not, still transition if business representatives is not shown
      if (type === 'payee') {
        if (!mercoaSession.organization.payeeOnboardingOptions?.business.representatives.show) {
          setFormState('payments')
          return
        }
      }
      if (type === 'payor') {
        if (!mercoaSession.organization.payorOnboardingOptions?.business.representatives.show) {
          setFormState('payments')
          return
        }
      }
    }
    // Payments transition function
    if (formState === 'payments') {
      // Skip payments, transition to TOS if paymentMethod not set in onboarding options
      if (type === 'payee') {
        if (!mercoaSession.organization.payeeOnboardingOptions?.paymentMethod) {
          setFormState('tos')
          return
        }
      } else if (type === 'payor') {
        if (!mercoaSession.organization.payorOnboardingOptions?.paymentMethod) {
          setFormState('tos')
          return
        }
      }
    }
    // TOS transition function
    if (formState === 'tos' && !needsToAcceptTos()) {
      onSubmit()
    }
  }, [mercoaSession.organization, mercoaSession.client, entity, entityData, formState, type])

  function needsToAcceptTos() {
    if (entity?.acceptedTos) {
      return false
    }
    if (type === 'payee') {
      if (entity?.accountType === 'business') {
        if (!mercoaSession.organization?.payeeOnboardingOptions?.business.termsOfService.required) {
          return false
        }
      } else {
        if (!mercoaSession.organization?.payeeOnboardingOptions?.individual.termsOfService.required) {
          return false
        }
      }
    }
    if (type === 'payor') {
      if (entity?.accountType === 'business') {
        if (!mercoaSession.organization?.payorOnboardingOptions?.business.termsOfService.required) {
          return false
        }
      } else {
        if (!mercoaSession.organization?.payorOnboardingOptions?.individual.termsOfService.required) {
          return false
        }
      }
    }
    return true
  }

  async function onSubmit(method?: Mercoa.PaymentMethodResponse) {
    if (!entity) return
    if (!entityData) return
    if (!mercoaSession.client) return

    const isPayee = type === 'payee' || entity.isPayee
    const isPayor = type === 'payor' || entity.isPayor

    await createOrUpdateEntity({
      data: entityData,
      entityId: entity.id,
      mercoaClient: mercoaSession.client,
      isPayee,
      isPayor,
    })

    if (method) {
      await mercoaSession.client.entity.paymentMethod.update(entity.id, method.id, {
        type: method.type,
        defaultDestination: true,
      })
    }
    setFormState('complete')
  }

  if (loading || !entity || !mercoaSession.organization || !mercoaSession.client)
    return (
      <div className="mercoa-text-center mercoa-pt-20 mercoa-w-full">
        <LoadingSpinnerIcon />
      </div>
    )

  const infoWell = (
    <div className="mercoa-p-4 mercoa-text-sm mercoa-rounded-mercoa mercoa-bg-gray-100 mercoa-my-4 mercoa-grid mercoa-grid-cols-12 mercoa-gap-3 mercoa-items-center">
      <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
        <LockClosedIcon className="mercoa-w-[22px]" />
      </div>
      <p className="mercoa-col-span-11">
        Your information is used for verification purposes and isn&apos;t used for third-party marketing. We take your
        privacy seriously.
      </p>
      <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
        <ClockIcon className="mercoa-w-[22px]" />
      </div>
      <p className="mercoa-col-span-11" style={{ lineHeight: '48px' }}>
        This process should take approximately 5 minutes to complete.
      </p>
    </div>
  )

  if (!mercoaSession.client) return <NoSession componentName="EntityOnboarding" />
  return (
    <div className="mercoa-flex mercoa-flex-col mercoa-rounded-l-md mercoa-p-8 mercoa-text-center mercoa-text-gray-900 mercoa-shadow-sm mercoa-w-full">
      <div className={formState === 'entity' ? '' : 'mercoa-hidden'}>
        {type === 'payee' ? (
          <div className="mercoa-text-gray-800 mercoa-text-left">
            <p className="mercoa-text-lg mercoa-font-normal mercoa-text-left">
              {connectedEntityName ? connectedEntityName : 'A customer'} has opted to pay you using{' '}
              {mercoaSession.organization.name}. To receive payments from {mercoaSession.organization.name}, you&apos;ll
              need to provide us with a few pieces of information.
            </p>
            {infoWell}
          </div>
        ) : (
          <div className="mercoa-text-gray-800 mercoa-text-left">
            <p className="mercoa-text-lg mercoa-font-normal mercoa-text-left">
              To pay bills and invoices with {mercoaSession.organization.name}, you&apos;ll need to provide us with a
              few pieces of information.
            </p>
            {infoWell}
          </div>
        )}
        <EntityOnboardingForm
          entity={entity}
          type={type}
          onOnboardingSubmit={(data) => {
            setEntityData(data)
            setFormState('representatives')
          }}
        />
      </div>

      <div className={formState === 'representatives' ? 'mercoa-text-center mercoa-text-lg' : 'mercoa-hidden'}>
        <div className="mercoa-text-left">
          <h2 className="mercoa-font-gray-800 mercoa-text-xl mercoa-font-normal mercoa-text-center">
            Representative Verification
          </h2>
          <div className="mercoa-p-4 mercoa-text-sm mercoa-rounded-mercoa mercoa-bg-gray-100 mercoa-my-4 mercoa-grid mercoa-grid-cols-12 mercoa-gap-3 mercoa-items-center">
            <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
              <BuildingLibraryIcon className="mercoa-w-[22px]" />
            </div>
            <p className="mercoa-col-span-11">
              Banking regulations require that we perform a &quot;Know Your Customer&quot; (KYC) process to verify
              account identity before enabling the ability to pay bills or send invoices.
            </p>
            <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
              <UserGroupIcon className="mercoa-w-[22px]" />
            </div>
            <p className="mercoa-col-span-11">
              Individuals with significant ownership in the business (over 25%) must be added as representatives.
            </p>
            <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
              <ExclamationCircleIcon className="mercoa-w-[22px]" />
            </div>
            <p className="mercoa-col-span-11">
              At least one controller must be added as a representative. Examples include the CEO, COO, Treasurer,
              President, Vice President, or Managing Partner.
            </p>
          </div>
        </div>{' '}
        <div className="mercoa-mt-10">
          <Representatives showAdd showEdit />
        </div>
        <div className="mercoa-flex mercoa-justify-between">
          <MercoaButton
            className="mercoa-mt-10"
            isEmphasized={false}
            size="md"
            onClick={() => {
              setFormState('entity')
            }}
          >
            Go Back
          </MercoaButton>
          <MercoaButton
            className="mercoa-mt-10 mercoa-ml-5"
            isEmphasized
            size="md"
            disabled={!representatives.find((e) => e.responsibilities.isController)}
            onClick={() => {
              setFormState('payments')
            }}
          >
            Continue
          </MercoaButton>
        </div>
      </div>

      {formState === 'payments' && (
        <div className="mercoa-p-8 mercoa-text-center mercoa-text-lg">
          <DisbursementMethods
            type={type === 'payor' ? 'payment' : 'disbursement'}
            entity={entity}
            onSelect={() => {
              if (needsToAcceptTos()) {
                setFormState('tos')
              } else {
                setFormState('complete')
              }
            }}
            goToPreviousStep={async () => {
              await mercoaSession.refresh()
              setFormState('entity')
            }}
          />
        </div>
      )}

      <div className={formState === 'tos' ? 'p-8 mercoa-text-center mercoa-text-lg' : 'mercoa-hidden'}>
        <AcceptTosForm
          entity={entity}
          onComplete={async () => {
            setLoading(true)
            if (entity.accountType === 'business') {
              try {
                await mercoaSession.client?.entity.initiateKyb(entity.id)
              } catch (e) {
                console.error(e)
              }
            }
            await mercoaSession.refresh()
            setLoading(false)
            setFormState('complete')
          }}
        />
      </div>

      <div className={formState === 'complete' ? 'p-8 mercoa-text-center mercoa-text-lg' : 'mercoa-hidden'}>
        <h1 className="mercoa-text-2xl mercoa-font-medium mercoa-text-gray-900">Thank you!</h1>
        <p className="mercoa-text-gray-700">Your information has been submitted.</p>
        <MercoaButton
          className="mercoa-mt-10"
          isEmphasized
          size="md"
          onClick={async () => {
            await mercoaSession.refresh()
            setFormState('entity')
          }}
        >
          Edit your information
        </MercoaButton>
      </div>
    </div>
  )
}

function formatPhoneNumber(phoneNumberString?: string) {
  var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
  var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }
  return phoneNumberString
}
