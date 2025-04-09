import { Dialog, Transition } from '@headlessui/react'
import {
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  EyeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import get from 'lodash/get'
import { Fragment, useEffect, useMemo, useState } from 'react'
import Dropzone from 'react-dropzone'
import { usePlacesWidget } from 'react-google-autocomplete'
import { Control, Controller, FieldErrors, UseFormRegister, useForm } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { toast } from 'react-toastify'
import { Mercoa, MercoaClient } from '@mercoa/javascript'
import * as yup from 'yup'
import { blobToDataUrl, capitalize } from '../lib/lib'
import { postalCodeRegex } from '../lib/locations'
import { mccCodes } from '../lib/mccCodes'
import { onboardingOptionsToResponse } from '../lib/onboardingOptions'
import {
  AddDialog,
  CountryDropdown,
  DisbursementMethods,
  LoadingSpinner,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  MercoaInput,
  MercoaInputLabel,
  NoSession,
  PaymentMethodButton,
  PaymentMethods,
  StateDropdown,
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
  country?: string
  legalBusinessName: string
  doingBusinessAs?: string
  website?: string
  description?: string
  formationDate?: Date
  disableKYB?: 'yes' | 'no'
  emailTo?: string
  foreignId?: string
  maxTransactionSize?: number
  averageMonthlyTransactionVolume?: number
  averageTransactionSize?: number
}

// Onboarding Blocks //////////////////////////////////////////////////////////

const uploadTypeToDocumentType = {
  W9: Mercoa.DocumentType.W9,
  '1099': Mercoa.DocumentType.TenNinetyNine,
  'Bank Statement': Mercoa.DocumentType.BankStatement,
  Logo: '',
}

const uploadTypeToFormType = {
  W9: 'w9',
  '1099': 'tenNinetyNine',
  'Bank Statement': 'bankStatement',
  Logo: 'logo',
}

export function UploadBlock({
  type,
  entity,
  edit,
  errors,
}: {
  type: 'W9' | '1099' | 'Logo' | 'Bank Statement'
  entity: Mercoa.EntityResponse
  edit: boolean
  errors?: FieldErrors<any>
}) {
  const mercoaSession = useMercoaSession()

  const [existingDocumentUri, setExistingDocumentUri] = useState<string | undefined>()
  const [existingDocumentId, setExistingDocumentId] = useState<string | undefined>()
  const [isEditing, setIsEditing] = useState(true)

  useEffect(() => {
    if (!entity) return
    if (type === 'Logo') {
      setExistingDocumentUri(entity.logo)
      return
    }
    mercoaSession.client?.entity.document.getAll(entity.id, { type: uploadTypeToDocumentType[type] }).then((resp) => {
      const document = resp.find((d) => d.type === uploadTypeToDocumentType[type])
      setExistingDocumentUri(document?.uri)
      setExistingDocumentId(document?.id)
    })
  }, [entity, type])

  useEffect(() => {
    if (existingDocumentUri) {
      setIsEditing(false)
    }
  }, [existingDocumentUri])

  let defaultIcon = (
    <PhotoIcon className="mercoa-mx-auto mercoa-h-12 mercoa-w-12 mercoa-text-gray-300" aria-hidden="true" />
  )
  if (type === 'Logo') {
    if (entity?.logo) {
      defaultIcon = <img className="mercoa-mx-auto mercoa-h-12" src={entity?.logo} alt="Logo" />
    }
  }

  const embeddedDocument = useMemo(() => {
    if (existingDocumentUri) {
      return (
        <div className="mercoa-col-span-full mercoa-border mercoa-border-gray-200 mercoa-rounded-lg mercoa-p-4">
          <h3 className="mercoa-text-lg mercoa-font-medium mercoa-mb-2 mercoa-text-gray-700 mercoa-text-left">
            {type}
          </h3>
          {type === 'Logo' ? (
            <img className="mercoa-mx-auto mercoa-h-12" src={existingDocumentUri} alt="Logo" />
          ) : (
            <embed className="mercoa-w-full mercoa-h-64" src={existingDocumentUri} />
          )}
        </div>
      )
    }
    return null
  }, [existingDocumentUri])

  if (!edit) {
    if (!existingDocumentUri) {
      return <div className="mercoa-col-span-full mercoa-text-gray-500 mercoa-text-left">No {type} uploaded</div>
    } else {
      return embeddedDocument
    }
  }
  return (
    <div className="mercoa-col-span-full">
      {isEditing ? (
        <Dropzone
          onDropAccepted={async (acceptedFiles) => {
            try {
              const fileReaderObj = await blobToDataUrl(acceptedFiles[0])
              mercoaSession.debug(fileReaderObj)
              if (!entity) return

              const updateActions = {
                Logo: () => mercoaSession.client?.entity.update(entity.id, { logo: fileReaderObj }),
                W9: () =>
                  mercoaSession.client?.entity.document.upload(entity.id, { document: fileReaderObj, type: 'W9' }),
                '1099': () =>
                  mercoaSession.client?.entity.document.upload(entity.id, {
                    document: fileReaderObj,
                    type: 'TEN_NINETY_NINE',
                  }),
                'Bank Statement': () =>
                  mercoaSession.client?.entity.document.upload(entity.id, {
                    document: fileReaderObj,
                    type: 'BANK_STATEMENT',
                  }),
              }

              const action = updateActions[type]
              if (!action) return

              await action()
              if (existingDocumentId) {
                mercoaSession.debug(`Deleting existing document ${existingDocumentId}`)
                await mercoaSession.client?.entity.document.delete(entity.id, existingDocumentId)
              }
              await mercoaSession.refresh()
              toast.success(`${type} Updated`)
            } catch (error) {
              console.error('Error uploading file:', error)
              toast.error(`Failed to update ${type}`)
            }
          }}
          onDropRejected={(_, event) => {
            try {
              toast.error('Invalid file type or file is too large')
            } catch (error) {
              console.error('Error handling rejected file:', error)
              toast.error('An error occurred while processing the file')
            }
          }}
          minSize={0}
          maxSize={100_000_000}
          accept={
            type === 'Logo'
              ? {
                  'image/png': ['.png'],
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/svg+xml': ['.svg'],
                  'image/gif': ['.gif'],
                }
              : {
                  'application/pdf': ['.pdf'],
                }
          }
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              className={`mercoa-mt-2 mercoa-flex mercoa-justify-center mercoa-rounded-lg mercoa-border mercoa-border-dashed mercoa-border-gray-900/25 ${
                isDragActive ? 'mercoa-border-primary' : 'mercoa-border-gray-300'
              } mercoa-px-6 mercoa-py-10`}
              {...getRootProps()}
            >
              <div className="mercoa-text-center">
                {defaultIcon}
                <div className="mercoa-mt-4 mercoa-flex mercoa-text-sm mercoa-text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="mercoa-relative mercoa-cursor-pointer mercoa-rounded-md mercoa-bg-white mercoa-font-semibold mercoa-primary-text focus-within:mercoa-outline-none focus-within:mercoa-ring-2 focus-within:mercoa-ring-primary focus-within:mercoa-ring-offset-2 hover:mercoa-text-mercoa-primary-dark"
                  >
                    <span>Upload {type}</span>
                    <input
                      {...getInputProps()}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="mercoa-sr-only"
                    />
                  </label>
                  <p className="mercoa-pl-1">or drag and drop</p>
                </div>
                <p className="mercoa-text-xs mercoa-leading-5 mercoa-text-gray-600">
                  {type === 'Logo' ? 'PNG, JPG, GIF, or SVG' : 'PDF'} up to 1MB
                </p>
              </div>
            </div>
          )}
        </Dropzone>
      ) : (
        <div className="mercoa-relative">
          {embeddedDocument}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mercoa-absolute mercoa-top-2 mercoa-right-2 mercoa-rounded-full mercoa-bg-white mercoa-p-1 mercoa-shadow-sm mercoa-border mercoa-border-gray-300 hover:mercoa-bg-gray-50"
          >
            <PencilIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-500" />
          </button>
        </div>
      )}
      {uploadTypeToFormType[type] && get(errors, uploadTypeToFormType[type])?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500 mercoa-text-left">
          {get(errors, uploadTypeToFormType[type])?.message?.toString()}
        </p>
      )}
    </div>
  )
}

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
  prefix,
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
  prefix?: string
}) {
  if (!prefix) prefix = ''
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
      const addressLine1 = (streetNumber ? `${streetNumber} ` : '') + streetName
      const country = place.address_components.find((e: any) => e.types.includes('country'))?.short_name
      setShowAddress(true)
      setValue(`${prefix}addressLine1`, addressLine1, { shouldDirty: true })
      setValue(`${prefix}city`, city ?? '', { shouldDirty: true })
      setValue(`${prefix}stateOrProvince`, state ?? '', { shouldDirty: true })
      setValue(`${prefix}postalCode`, postalCode ?? '', { shouldDirty: true })
      setValue(`${prefix}country`, country ?? '', { shouldDirty: true })
      if (prefix) {
        setValue(`${prefix}.full`, `${addressLine1}, ${city}, ${state} ${postalCode}`, {
          shouldDirty: true,
        })
      }
      trigger()
    },
    options: {
      fields: ['address_components'],
      types: ['address'],
    },
  })

  const stateOrProvince = watch(`${prefix}stateOrProvince`)
  const country = watch(`${prefix}country`)
  const [showAddress, setShowAddress] = useState(!!readOnly || stateOrProvince)

  return (
    <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-2 mercoa-mb-5">
      <div className="mercoa-col-span-full">
        <MercoaInputLabel label={label ?? 'Address'} name="addressLine1" />
        <div className="mercoa-mt-1">
          <input
            ref={ref as any}
            onBlur={() => setShowAddress(true)}
            onChange={(e) => setValue(`${prefix}addressLine1`, e.target.value, { shouldDirty: true })}
            value={watch(`${prefix}addressLine1`)}
            type="text"
            placeholder={placeholder ?? 'Enter a location'}
            className={inputClassName({})}
            required={required}
          />
        </div>
      </div>
      {showAddress && (
        <>
          <MercoaInput
            label="Apartment, suite, etc."
            register={register}
            name={`${prefix}addressLine2`}
            className="mercoa-mt-1"
            errors={errors}
            readOnly={readOnly}
          />

          <MercoaInput
            label="City"
            register={register}
            name={`${prefix}city`}
            className="mercoa-mt-1"
            errors={errors}
            readOnly={readOnly}
            required={required}
          />

          <div className="mercoa-mt-1">
            <StateDropdown
              value={stateOrProvince}
              setValue={(value) => {
                setValue(`${prefix}stateOrProvince`, value, { shouldDirty: true })
              }}
              country={watch(`${prefix}country`)}
            />
            {errors.stateOrProvince?.message && (
              <p className="mercoa-text-sm mercoa-text-red-500 mercoa-text-left">{errors.stateOrProvince?.message}</p>
            )}
          </div>

          <MercoaInput
            label="Postal Code"
            register={register}
            name={`${prefix}postalCode`}
            className="mercoa-mt-1"
            errors={errors}
            readOnly={readOnly}
            required={required}
          />

          <div className="mercoa-mt-1 mercoa-col-span-full">
            <CountryDropdown
              value={country}
              setValue={(value) => {
                setValue(`${prefix}country`, value, { shouldDirty: true })
              }}
            />
          </div>
        </>
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
        required={false}
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
  dob: yup.lazy((value) => {
    if (value === '****') {
      return yup.string().nullable()
    }
    return yup
      .date()
      .typeError('Date of birth is required')
      .required('Date of birth is required')
      .test('dob', 'Must be at least 18 years old', (value) => {
        if (dayjs(value).isAfter(dayjs().subtract(18, 'years'))) {
          return false
        }
        return true
      })
  }),
}

export const dateOfBirthSchemaNotRequired = {
  dob: yup
    .date()
    .nullable()
    .test('dob', 'Must be at least 18 years old', (value) => {
      if (value && dayjs(value).isAfter(dayjs().subtract(18, 'years'))) {
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
    <Controller
      control={control}
      name="dob"
      render={({ field }) => {
        if (field.value === '****') {
          return (
            <div>
              <MercoaInputLabel label="Date of Birth" name="dob" />
              <div className="mercoa-mt-1">
                <input
                  type="text"
                  className={inputClassName({})}
                  placeholder="xx/xx/xxxx"
                  value={field.value}
                  onChange={() => {
                    field.onChange({
                      target: {
                        value: '',
                      },
                    })
                  }}
                  readOnly={readOnly}
                />
              </div>
            </div>
          )
        } else {
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
      }}
    />
  )
}

export const SSNSchema = {
  taxID: yup.lazy((value) => {
    if (value === '****') {
      return yup.string().nullable()
    }
    return yup
      .string()
      .matches(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN')
      .required('SSN is required')
  }),
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
          <option value="">Select an option</option>
          <option value="llc">LLC</option>
          <option value="soleProprietorship">Sole Proprietorship</option>
          <option value="privateCorporation">Private Corporation</option>
          <option value="trust">Trust</option>
          <option value="partnership">Partnership</option>
          <option value="publicCorporation">Public Corporation</option>
          <option value="unincorporatedAssociation">Unincorporated Association</option>
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
  taxID: yup.string().test('should-test-ein', 'Invalid EIN', function (code) {
    const { country } = this.parent
    if (country === 'US' || !country) {
      if (!code) return false
      const einRegex = /^(0[1-9]|[1-9]\d)-\d{7}|[*]{2}-[*]{7}$/
      return einRegex.test(code)
    }
    return true
  }),
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

export function MCCBlock({ watch, setValue, errors }: { watch: Function; setValue: Function; errors: any }) {
  const mcc = watch('mcc')

  return (
    <div>
      <MercoaCombobox
        options={mccCodes.map((value) => ({
          disabled: false,
          value,
        }))}
        showAllOptions
        displayIndex="name"
        label="Merchant Category Code"
        value={mccCodes.find((e) => e.code === mcc)}
        onChange={({ code }) => {
          setValue('mcc', code, { shouldDirty: true })
        }}
        labelClassName="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 -mercoa-mb-1"
      />
      {errors.mcc?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500 mercoa-text-left">{errors.mcc?.message}</p>
      )}
    </div>
  )
}

export const maxTransactionSizeSchema = {
  maxTransactionSize: yup.number().required('Max Transaction Size is required'),
}

export function MaxTransactionSizeBlock({
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
      label="Max Transaction Size"
      register={register}
      name="maxTransactionSize"
      type="number"
      errors={errors}
      readOnly={readOnly}
      required={required}
      leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">$</span>}
    />
  )
}

export const averageMonthlyTransactionVolumeSchema = {
  averageMonthlyTransactionVolume: yup.number().required('Avg Transaction Volume is required'),
}

export function AverageMonthlyTransactionVolumeBlock({
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
      label="Avg Transaction Volume (per month)"
      register={register}
      name="averageMonthlyTransactionVolume"
      type="number"
      errors={errors}
      readOnly={readOnly}
      required={required}
      leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">$</span>}
    />
  )
}

export const averageTransactionSizeSchema = {
  averageTransactionSize: yup.number().required('Avg Transaction Size is required'),
}

export function AverageTransactionSizeBlock({
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
      label="Avg Transaction Size"
      register={register}
      name="averageTransactionSize"
      type="number"
      errors={errors}
      readOnly={readOnly}
      required={required}
      leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">$</span>}
    />
  )
}

export const websiteSchema = {
  website: yup
    .string()
    .url('Website must be a valid URL')
    .transform((currentValue) => {
      const doesNotStartWithHttp =
        currentValue && !currentValue.startsWith('http://') && !currentValue.startsWith('https://')
      if (doesNotStartWithHttp) {
        return `https://${currentValue}`
      }
      return currentValue
    })
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

export function TosBlock({
  register,
  errors,
  readOnly,
  required,
}: {
  register: UseFormRegister<any>
  errors: any
  required?: boolean
  readOnly?: boolean
}) {
  const mercoaSession = useMercoaSession()
  return (
    <div className="mercoa-text-left mercoa-p-4 mercoa-text-sm mercoa-rounded-mercoa mercoa-bg-gray-50 mercoa-items-center">
      <div>
        <b>{capitalize(mercoaSession?.organization?.name)}</b> has partnered with Mercoa to provide financial services.
        By clicking the button below, you agree to the{' '}
        <a
          href="https://mercoa.com/legal/platform-agreement/"
          target="_blank"
          rel="noreferrer"
          className="mercoa-text-blue-500 mercoa-underline"
        >
          Platform Agreement
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
      <div className="mercoa-relative mercoa-my-4 mercoa-flex mercoa-items-center">
        <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
          <input
            {...register('tos')}
            id="tos"
            type="checkbox"
            readOnly={readOnly}
            required={required}
            className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
          />
        </div>
        <div className="mercoa-ml-3 mercoa-text-sm">
          <label htmlFor="tos" className="mercoa-font-bold mercoa-text-gray-800 mercoa-cursor-pointer">
            I have read and accept the{' '}
            <a
              href="https://mercoa.com/legal/platform-agreement/"
              target="_blank"
              rel="noreferrer"
              className="mercoa-text-blue-500 mercoa-underline"
            >
              {' '}
              terms of service
            </a>
          </label>
        </div>
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
            country: data.country,
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
      businessType: data.businessType,
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
            country: data.country,
          },
        }),
      // NOTE: This is necessary because the `OnboardingFormData` type is wrong, these can currently be strings
      maxTransactionSize: data.maxTransactionSize ? Number(data.maxTransactionSize) : undefined,
      averageMonthlyTransactionVolume: data.averageMonthlyTransactionVolume
        ? Number(data.averageMonthlyTransactionVolume)
        : undefined,
      averageTransactionSize: data.averageTransactionSize ? Number(data.averageTransactionSize) : undefined,
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
            <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-opacity-75 mercoa-transition-opacity" />
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
  representative,
}: {
  entityId: string
  title?: string
  onClose?: Function
  representative?: Mercoa.RepresentativeResponse
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    defaultValues: {
      firstName: representative?.name?.firstName,
      middleName: representative?.name?.middleName,
      lastName: representative?.name?.lastName,
      suffix: representative?.name?.suffix,
      email: representative?.email,
      addressLine1: representative?.address?.addressLine1,
      addressLine2: representative?.address?.addressLine2,
      city: representative?.address?.city,
      stateOrProvince: representative?.address?.stateOrProvince,
      postalCode: representative?.address?.postalCode,
      phoneNumber: formatPhoneNumber(representative?.phone?.number),
      jobTitle: representative?.responsibilities?.jobTitle,
      isController: representative?.responsibilities?.isController,
      ownershipPercentage: representative?.responsibilities?.ownershipPercentage,
      dob: representative?.birthDateProvided ? '****' : '',
      taxID: representative?.governmentIdProvided ? '****' : '',
    },
  })

  useEffect(() => {
    if (!representative) return
    setValue('firstName', representative.name.firstName as unknown as never)
    setValue('middleName', representative.name.middleName as unknown as never)
    setValue('lastName', representative.name.lastName as unknown as never)
    setValue('suffix', representative.name.suffix as unknown as never)
    setValue('email', representative.email as unknown as never)
    setValue('addressLine1', representative.address.addressLine1 as unknown as never)
    setValue('addressLine2', representative.address.addressLine2 as unknown as never)
    setValue('city', representative.address.city as unknown as never)
    setValue('stateOrProvince', representative.address.stateOrProvince as unknown as never)
    setValue('postalCode', representative.address.postalCode as unknown as never)
    setValue('phoneNumber', formatPhoneNumber(representative?.phone?.number) as unknown as never)
    setValue('jobTitle', representative.responsibilities.jobTitle as unknown as never)
    setValue('isController', representative.responsibilities.isController as unknown as never)
    setValue('ownershipPercentage', representative.responsibilities.ownershipPercentage as unknown as never)
    setValue('dob', (representative.birthDateProvided ? '****' : '') as unknown as never)
    setValue('taxID', (representative.governmentIdProvided ? '****' : '') as unknown as never)
  }, [representative])

  async function onSubmit(data: any) {
    setIsSubmitting(true)
    if (representative) {
      const postData: Mercoa.RepresentativeUpdateRequest = {
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
        ...(data.dob !== '****' && {
          birthDate: {
            day: dayjs(data.dob).format('D'),
            month: dayjs(data.dob).format('M'),
            year: dayjs(data.dob).format('YYYY'),
          },
        }),
        address: {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          postalCode: data.postalCode,
          stateOrProvince: data.stateOrProvince,
          city: data.city,
          country: 'US',
        },
        ...(data.taxID !== '****' && {
          governmentId: {
            ssn: data.taxID,
          },
        }),
        responsibilities: {
          isController: data.isController,
          isOwner: data.ownershipPercentage >= 25,
          ownershipPercentage: Number(data.ownershipPercentage),
          jobTitle: data.jobTitle,
        },
      }
      try {
        await mercoaSession.client?.entity.representative.update(entityId, representative.id, postData)
        await mercoaSession.refresh()
        setIsSubmitting(false)
        if (onClose) onClose(data)
      } catch (e) {
        console.error(e)
        setIsSubmitting(false)
        toast.error('There was an issue updating this representative. Please check your information and try again.')
      }
    } else {
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
          isController: !!data.isController,
          isOwner: data.ownershipPercentage >= 25,
          ownershipPercentage: Number(data.ownershipPercentage),
          jobTitle: data.jobTitle,
        },
      }
      try {
        await mercoaSession.client?.entity.representative.create(entityId, postData)
        await mercoaSession.refresh()
        setIsSubmitting(false)
        if (onClose) onClose(data)
      } catch (e) {
        console.error(e)
        setIsSubmitting(false)
        toast.error('There was an issue creating this representative. Please check your information and try again.')
      }
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
            {!isSubmitting && (
              <XMarkIcon
                className="mercoa-size-5 mercoa-cursor-pointer mercoa-rounded-mercoa mercoa-p-0.5 hover:mercoa-bg-gray-100"
                type="button"
                onClick={() => {
                  if (onClose) onClose()
                }}
              />
            )}
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
            <div className="mercoa-relative mercoa-mt-2 mercoa-flex mercoa-items-center mercoa-col-span-2">
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
        <MercoaButton isEmphasized className="mercoa-w-full" disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinnerIcon /> : representative ? 'Update' : 'Add Representative'}
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
  showView,
}: {
  children?: Function
  onSelect?: (rep?: Mercoa.RepresentativeResponse) => void
  showAdd?: boolean
  showEdit?: boolean
  showView?: boolean
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
              <RepresentativeComponent
                representative={account}
                onSelect={onSelect}
                showEdit={showEdit}
                showView={showView}
              />
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
        {mercoaSession.organization?.payeeOnboardingOptions?.business.representatives.required && (
          <>
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
  showView,
  selected,
}: {
  children?: Function
  representative?: Mercoa.RepresentativeResponse
  onSelect?: (rep?: Mercoa.RepresentativeResponse) => void
  showEdit?: boolean
  showView?: boolean
  selected?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  async function deleteAccount() {
    if (!confirm('Are you sure you want to delete this representative?')) return
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
        <div className="mercoa-flex-shrink-0 mercoa-flex mercoa-items-center mercoa-space-x-3">
          {showView && (
            <>
              <button
                className="mercoa-cursor-pointer hover:mercoa-text-red-300"
                onClick={() => setShowViewModal(true)}
              >
                <EyeIcon className="mercoa-size-5" />
              </button>
              <Transition.Root show={showViewModal} as={Fragment}>
                <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={() => setShowViewModal(false)}>
                  <Transition.Child
                    as={Fragment}
                    enter="mercoa-ease-out mercoa-duration-300"
                    enterFrom="mercoa-opacity-0"
                    enterTo="mercoa-opacity-100"
                    leave="mercoa-ease-in mercoa-duration-200"
                    leaveFrom="mercoa-opacity-100"
                    leaveTo="mercoa-opacity-0"
                  >
                    <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-opacity-75 mercoa-transition-opacity" />
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
                        <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-3xl sm:mercoa-p-6">
                          <div className="mercoa-space-y-6">
                            <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-4 mercoa-p-4 mercoa-bg-gray-50 mercoa-rounded-lg">
                              <p className="mercoa-col-span-2 mercoa-text-lg mercoa-font-semibold mercoa-text-gray-900">
                                Personal Info
                              </p>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">First Name</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.name.firstName}</p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Middle Name</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.name.middleName}</p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Last Name</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.name.lastName}</p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Suffix</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.name.suffix}</p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Email</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.email}</p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Phone</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.phone?.number}</p>
                              </div>
                            </div>

                            <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-4 mercoa-p-4 mercoa-bg-gray-50 mercoa-rounded-lg">
                              <p className="mercoa-col-span-2 mercoa-text-lg mercoa-font-semibold mercoa-text-gray-900">
                                Address
                              </p>
                              <div className="mercoa-col-span-2 mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Street Address</p>
                                <p className="mercoa-text-sm mercoa-font-medium">
                                  {representative.address.addressLine1} {representative.address.addressLine2}
                                </p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">City</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.address.city}</p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">State</p>
                                <p className="mercoa-text-sm mercoa-font-medium">
                                  {representative.address.stateOrProvince}
                                </p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Postal Code</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.address.postalCode}</p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Country</p>
                                <p className="mercoa-text-sm mercoa-font-medium">{representative.address.country}</p>
                              </div>
                            </div>

                            <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-4 mercoa-p-4 mercoa-bg-gray-50 mercoa-rounded-lg">
                              <p className="mercoa-col-span-2 mercoa-text-lg mercoa-font-semibold mercoa-text-gray-900">
                                Role & Verification
                              </p>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Job Title</p>
                                <p className="mercoa-text-sm mercoa-font-medium">
                                  {representative.responsibilities?.jobTitle}
                                </p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Ownership</p>
                                <p className="mercoa-text-sm mercoa-font-medium">
                                  {representative.responsibilities?.ownershipPercentage}%
                                </p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Controller Status</p>
                                <p className="mercoa-text-sm mercoa-font-medium">
                                  {representative.responsibilities?.isController ? 'Yes' : 'No'}
                                </p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">Date of Birth</p>
                                <p className="mercoa-text-sm mercoa-font-medium">
                                  {representative.birthDateProvided ? '****' : ''}
                                </p>
                              </div>
                              <div className="mercoa-space-y-2">
                                <p className="mercoa-text-sm mercoa-text-gray-500">SSN</p>
                                <p className="mercoa-text-sm mercoa-font-medium">
                                  {representative.governmentIdProvided ? '****' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Dialog.Panel>
                      </Transition.Child>
                    </div>
                  </div>
                </Dialog>
              </Transition.Root>
            </>
          )}
          {showEdit && (
            <>
              <button
                className="mercoa-ml-1 mercoa-cursor-pointer hover:mercoa-text-red-300"
                onClick={() => setShowEditModal(true)}
              >
                <PencilIcon className="mercoa-size-5" />
              </button>
              <button
                className="mercoa-ml-1 mercoa-cursor-pointer hover:mercoa-text-red-300"
                onClick={() => deleteAccount()}
              >
                {' '}
                <TrashIcon className="mercoa-size-5" />
              </button>
              <AddDialog
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                component={
                  <RepresentativeOnboardingForm
                    title="Create Representative"
                    onClose={() => setShowEditModal(false)}
                    entityId={mercoaSession.entity?.id ?? ''}
                    representative={representative}
                  />
                }
              />
            </>
          )}
        </div>
      </div>
    )
  } else {
    return (
      <PaymentMethodButton
        onSelect={onSelect}
        account={representative}
        selected={selected}
        icon={<PlusIcon className="mercoa-size-5" />}
        text="Add new representative"
      />
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
          try {
            await mercoaSession.client?.entity.initiateKyb(entity.id)
            toast.success('Verification Started')
          } catch (e) {
            toast.error(
              'Failed to initiate KYB. Please make sure all required fields are filled out and at least one controller is provided.',
            )
          }
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
            <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-opacity-75 mercoa-transition-opacity" />
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
        <b>{capitalize(mercoaSession.organization?.name)}</b> has partnered with Mercoa to provide financial services.
        <br />
        <br />
        By clicking the button below, you agree to the{' '}
        <a
          href="https://mercoa.com/legal/platform-agreement/"
          target="_blank"
          rel="noreferrer"
          className="mercoa-text-blue-500 mercoa-underline"
        >
          Platform Agreement
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
      <div className="mercoa-relative mercoa-mt-2 mercoa-flex mercoa-items-center">
        <div className="mercoa-flex mercoa-h-5 mercoa-items-center">
          <input
            {...register('mercoa')}
            type="checkbox"
            className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-mercoa-primary"
          />
        </div>
        <div className="mercoa-ml-3 mercoa-text-sm">
          <label htmlFor="mercoa" className="mercoa-font-medium mercoa-text-gray-700">
            I have read and accept the{' '}
            <a
              href="https://mercoa.com/legal/platform-agreement/"
              target="_blank"
              rel="noreferrer"
              className="mercoa-text-blue-500 mercoa-underline"
            >
              {' '}
              terms of service
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
  onboardingOptions,
  onOnboardingSubmit,
  onCancel,
  admin,
  readOnly,
}: {
  entity: Mercoa.EntityResponse
  type: 'payee' | 'payor'
  onboardingOptions?: Mercoa.OnboardingOptionsRequest
  onOnboardingSubmit?: (data: OnboardingFormData) => void
  onCancel?: () => void
  admin?: boolean
  readOnly?: boolean
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mercoaSession = useMercoaSession()

  const organizationOnboardingOptions =
    type === 'payee'
      ? mercoaSession.organization?.payeeOnboardingOptions
      : mercoaSession.organization?.payorOnboardingOptions

  const finalOnboardingOptions = onboardingOptions
    ? onboardingOptionsToResponse(onboardingOptions)
    : organizationOnboardingOptions

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    control,
    watch,
    setError,
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
        : entity.profile.business?.taxIdProvided && entity.profile.business?.taxId?.ein?.number
          ? entity.profile.business?.taxId?.ein?.number
          : '',
      mcc: entity.profile.business?.industryCodes?.mcc ?? '',
      dob: undefined,
      tos: entity.acceptedTos,

      businessType: entity.profile.business?.businessType,
      legalBusinessName: entity.profile.business?.legalBusinessName ?? '',
      doingBusinessAs: entity.profile.business?.doingBusinessAs,
      description: entity.profile.business?.description,
      website: entity.profile.business?.website,
      formationDate: entity.profile.business?.formationDate,
      foreignId: entity.foreignId,
      emailTo: entity.emailTo,
      isCustomer: entity.isCustomer,
      isPayor: entity.isPayor,
      isPayee: entity.isPayee,
      isOrganizationEntity: mercoaSession.organization?.organizationEntityId === entity.id,
      maxTransactionSize: entity.profile?.business?.maxTransactionSize,
      averageMonthlyTransactionVolume: entity.profile?.business?.averageMonthlyTransactionVolume,
      averageTransactionSize: entity.profile?.business?.averageTransactionSize,

      logo: entity.logo,
      w9: '',
      tenNinetyNine: '',
      bankStatement: '',
    },
    resolver: async (data, context, options) => {
      if (data.accountType === Mercoa.AccountType.Individual) {
        return yupResolver(
          yup
            .object({
              ...(finalOnboardingOptions?.individual.name.required && nameBlockSchema),
              ...(finalOnboardingOptions?.individual.email.required && emailSchema),
              ...(finalOnboardingOptions?.individual.phone.required && phoneSchema),
              ...(finalOnboardingOptions?.individual.dateOfBirth.required && dateOfBirthSchema),
              ...(finalOnboardingOptions?.individual.dateOfBirth.edit &&
                !finalOnboardingOptions?.individual.dateOfBirth.required &&
                dateOfBirthSchemaNotRequired),
              ...(finalOnboardingOptions?.individual.address.required && addressBlockSchema),
              ...(finalOnboardingOptions?.individual.ssn.required && SSNSchema),
            })
            .required(),
        )(data, context, options as any) as any
      } else {
        return yupResolver(
          yup
            .object({
              ...(finalOnboardingOptions?.business.name.required && legalBusinessNameSchema),
              ...(finalOnboardingOptions?.business.email.required && emailSchema),
              ...(finalOnboardingOptions?.business.phone.required && phoneSchema),
              ...(finalOnboardingOptions?.business.website.required && websiteSchema),
              ...(finalOnboardingOptions?.business.address.required && addressBlockSchema),
              ...(finalOnboardingOptions?.business.ein.required && einSchema),
              ...(finalOnboardingOptions?.business.mcc.required && mccSchema),
              ...(finalOnboardingOptions?.business.maxTransactionSize.required && maxTransactionSizeSchema),
              ...(finalOnboardingOptions?.business.averageMonthlyTransactionVolume.required &&
                averageMonthlyTransactionVolumeSchema),
              ...(finalOnboardingOptions?.business.averageTransactionSize.required && averageTransactionSizeSchema),
              ...(finalOnboardingOptions?.business.formationDate.required && formationDateSchema),
              ...(finalOnboardingOptions?.business.description.required && descriptionSchema),
            })
            .required(),
        )(data, context, options as any) as any
      }
    },
  })

  const accountType = watch('accountType')

  if (!mercoaSession.client) return <NoSession componentName="EntityOnboardingForm" />
  if (!mercoaSession.organization) return <LoadingSpinner />

  if (admin && finalOnboardingOptions) {
    ;(
      Object.keys(finalOnboardingOptions.individual) as Array<keyof Mercoa.IndividualOnboardingOptionsResponse>
    ).forEach((key) => {
      finalOnboardingOptions.individual[key].show = true
      finalOnboardingOptions.individual[key].edit = readOnly ? false : true
      finalOnboardingOptions.individual[key].required = false
    })
    ;(Object.keys(finalOnboardingOptions.business) as Array<keyof Mercoa.BusinessOnboardingOptionsResponse>).forEach(
      (key) => {
        finalOnboardingOptions.business[key].show = true
        finalOnboardingOptions.business[key].edit = readOnly ? false : true
        finalOnboardingOptions.business[key].required = false
      },
    )
    finalOnboardingOptions.paymentMethod = false
  }

  return (
    <form
      onSubmit={handleSubmit(async (entityData) => {
        if (!entity) return
        if (!entityData) return
        if (!mercoaSession.client) return

        // check if documents are uploaded
        if (finalOnboardingOptions?.business?.w9?.required) {
          // get w9 from entity
          const w9 = await mercoaSession.client.entity.document.getAll(entity.id, {
            type: Mercoa.DocumentType.W9,
          })
          if (w9.length === 0) {
            setError('w9', {
              message: 'W9 is required',
            })
            return
          }
        }
        if (finalOnboardingOptions?.business?.tenNinetyNine?.required) {
          // get tenNinetyNine from entity
          const tenNinetyNine = await mercoaSession.client.entity.document.getAll(entity.id, {
            type: Mercoa.DocumentType.TenNinetyNine,
          })
          if (tenNinetyNine.length === 0) {
            setError('tenNinetyNine', {
              message: '1099 is required',
            })
            return
          }
        }
        if (finalOnboardingOptions?.business?.bankStatement?.required) {
          // get bankStatement from entity
          const bankStatement = await mercoaSession.client.entity.document.getAll(entity.id, {
            type: Mercoa.DocumentType.BankStatement,
          })
          if (bankStatement.length === 0) {
            setError('bankStatement', {
              message: 'Bank Statement is required',
            })
            return
          }
        }

        setIsSubmitting(true)
        try {
          // Handle entity updates
          await createOrUpdateEntity({
            data: entityData,
            entityId: entity.id,
            mercoaClient: mercoaSession.client,
            isPayee: admin ? entityData.isPayee : type === 'payee',
            isPayor: admin ? entityData.isPayor : type === 'payor',
          })
          if (entityData.tos && !entity.acceptedTos) {
            await mercoaSession.client?.entity.acceptTermsOfService(entity.id)
          }
          // Handle organization updates (organizationEntity)
          if (entityData.isOrganizationEntity && mercoaSession.organization?.organizationEntityId !== entity.id) {
            await fetch('/api/updateOrganizationEntity', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${mercoaSession.token}`,
              },
              body: JSON.stringify({
                entityId: entity.id,
              }),
            })
          } else if (
            !entityData.isOrganizationEntity &&
            mercoaSession.organization?.organizationEntityId === entity.id
          ) {
            await fetch('/api/updateOrganizationEntity', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${mercoaSession.token}`,
              },
              body: JSON.stringify({
                entityId: null,
              }),
            })
          }
          if (admin || onCancel) {
            toast.success('Entity Updated')
          }
          if (onOnboardingSubmit) {
            onOnboardingSubmit(entityData)
          } else {
            await mercoaSession.refresh()
          }
        } finally {
          setIsSubmitting(false)
        }
      })}
    >
      <div className="sm:mercoa-grid sm:mercoa-grid-cols-2 mercoa-gap-3">
        {accountType === 'individual' && (
          <>
            {finalOnboardingOptions?.individual.email.show && (
              <div className="mercoa-col-span-2">
                <EmailBlock
                  register={register}
                  errors={errors}
                  readOnly={!finalOnboardingOptions.individual.email.edit}
                  required={finalOnboardingOptions.individual.email.required}
                />
              </div>
            )}
            {finalOnboardingOptions?.individual.name.show && (
              <div className="mercoa-col-span-2">
                <NameBlock
                  register={register}
                  errors={errors}
                  readOnly={!finalOnboardingOptions.individual.name.edit}
                  required={finalOnboardingOptions.individual.name.required}
                />
              </div>
            )}
            {finalOnboardingOptions?.individual.phone.show && (
              <PhoneBlock
                control={control}
                errors={errors}
                readOnly={!finalOnboardingOptions.individual.phone.edit}
                required={finalOnboardingOptions.individual.phone.required}
              />
            )}
            {finalOnboardingOptions?.individual.dateOfBirth.show && (
              <DateOfBirthBlock
                control={control}
                errors={errors}
                readOnly={!finalOnboardingOptions.individual.dateOfBirth.edit}
                required={finalOnboardingOptions.individual.dateOfBirth.required}
              />
            )}
            {finalOnboardingOptions?.individual.address.show && (
              <div className="mercoa-col-span-2">
                <AddressBlock
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  trigger={trigger}
                  watch={watch}
                  readOnly={!finalOnboardingOptions.individual.address.edit}
                  required={finalOnboardingOptions.individual.address.required}
                />
              </div>
            )}
            {finalOnboardingOptions?.individual.ssn.show && (
              <SSNBlock
                control={control}
                errors={errors}
                readOnly={!finalOnboardingOptions.individual.ssn.edit}
                required={finalOnboardingOptions.individual.ssn.required}
              />
            )}
            {finalOnboardingOptions?.individual.w9.show && (
              <UploadBlock type="W9" entity={entity} edit={finalOnboardingOptions.individual.w9.edit} errors={errors} />
            )}
            {finalOnboardingOptions?.individual.tenNinetyNine.show && (
              <UploadBlock
                type="1099"
                entity={entity}
                edit={finalOnboardingOptions.individual.tenNinetyNine.edit}
                errors={errors}
              />
            )}
            {finalOnboardingOptions?.individual.bankStatement.show && (
              <UploadBlock
                type="Bank Statement"
                entity={entity}
                edit={finalOnboardingOptions.individual.bankStatement.edit}
                errors={errors}
              />
            )}
            {finalOnboardingOptions?.individual.termsOfService.show && (
              <div className="mercoa-col-span-2">
                <TosBlock
                  register={register}
                  errors={errors}
                  readOnly={!finalOnboardingOptions.individual.termsOfService.edit}
                  required={finalOnboardingOptions.individual.termsOfService.required}
                />
              </div>
            )}
          </>
        )}
        {accountType === 'business' && (
          <>
            {finalOnboardingOptions?.business.logo.show && (
              <UploadBlock type="Logo" entity={entity} edit={finalOnboardingOptions.business.logo.edit} />
            )}
            {finalOnboardingOptions?.business.name.show && (
              <LegalBusinessNameBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.name.edit}
                required={finalOnboardingOptions.business.name.required}
              />
            )}
            {finalOnboardingOptions?.business.doingBusinessAs.show && (
              <DoingBusinessAsBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.doingBusinessAs.edit}
                required={finalOnboardingOptions.business.doingBusinessAs.required}
              />
            )}
            {finalOnboardingOptions?.business.email.show && (
              <EmailBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.email.edit}
                required={finalOnboardingOptions.business.email.required}
              />
            )}
            {finalOnboardingOptions?.business.phone.show && (
              <PhoneBlock
                control={control}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.phone.edit}
                required={finalOnboardingOptions.business.phone.required}
              />
            )}
            {finalOnboardingOptions?.business.website.show && (
              <WebsiteBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.website.edit}
                required={finalOnboardingOptions.business.website.required}
              />
            )}
            {finalOnboardingOptions?.business.address.show && (
              <div className="mercoa-col-span-2">
                <AddressBlock
                  label="Business Address"
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  trigger={trigger}
                  watch={watch}
                  readOnly={!finalOnboardingOptions.business.address.edit}
                  required={finalOnboardingOptions.business.address.required}
                />
              </div>
            )}
            {finalOnboardingOptions?.business.type.show && (
              <BusinessTypeBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.type.edit}
                required={finalOnboardingOptions.business.type.required}
              />
            )}
            {finalOnboardingOptions?.business.ein.show &&
              (watch('country') === 'US' || watch('country') === '' || watch('country') === undefined) && (
                <EINBlock
                  control={control}
                  errors={errors}
                  readOnly={!finalOnboardingOptions.business.ein.edit}
                  required={finalOnboardingOptions.business.ein.required}
                />
              )}
            {finalOnboardingOptions?.business.mcc.show && (
              <MCCBlock watch={watch} setValue={setValue} errors={errors} />
            )}
            {finalOnboardingOptions?.business.maxTransactionSize.show && (
              <MaxTransactionSizeBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.maxTransactionSize.edit}
                required={finalOnboardingOptions.business.maxTransactionSize.required}
              />
            )}
            {finalOnboardingOptions?.business.averageMonthlyTransactionVolume.show && (
              <AverageMonthlyTransactionVolumeBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.averageMonthlyTransactionVolume.edit}
                required={finalOnboardingOptions.business.averageMonthlyTransactionVolume.required}
              />
            )}
            {finalOnboardingOptions?.business.averageTransactionSize.show && (
              <AverageTransactionSizeBlock
                register={register}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.averageTransactionSize.edit}
                required={finalOnboardingOptions.business.averageTransactionSize.required}
              />
            )}
            {finalOnboardingOptions?.business.formationDate.show && (
              <FormationDateBlock
                control={control}
                errors={errors}
                readOnly={!finalOnboardingOptions.business.formationDate.edit}
                required={finalOnboardingOptions.business.formationDate.required}
              />
            )}
            {finalOnboardingOptions?.business.description.show && (
              <div className="mercoa-col-span-2">
                <DescriptionBlock
                  register={register}
                  errors={errors}
                  readOnly={!finalOnboardingOptions.business.description.edit}
                  required={finalOnboardingOptions.business.description.required}
                />
              </div>
            )}
            {finalOnboardingOptions?.business.w9.show && (
              <UploadBlock type="W9" entity={entity} edit={finalOnboardingOptions.business.w9.edit} errors={errors} />
            )}
            {finalOnboardingOptions?.business.tenNinetyNine.show && (
              <UploadBlock
                type="1099"
                entity={entity}
                edit={finalOnboardingOptions.business.tenNinetyNine.edit}
                errors={errors}
              />
            )}
            {finalOnboardingOptions?.business.bankStatement.show && (
              <UploadBlock
                type="Bank Statement"
                entity={entity}
                edit={finalOnboardingOptions.business.bankStatement.edit}
                errors={errors}
              />
            )}
            {finalOnboardingOptions?.business.termsOfService.show && (
              <div className="mercoa-col-span-2">
                <TosBlock
                  register={register}
                  errors={errors}
                  readOnly={!finalOnboardingOptions.business.termsOfService.edit}
                  required={finalOnboardingOptions.business.termsOfService.required}
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
            <div className="mercoa-col-span-full mercoa-grid mercoa-grid-cols-3 mercoa-gap-2">
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
              <div className="mercoa-flex mercoa-items-center mercoa-space-x-2 mercoa-rounded-mercoa mercoa-border mercoa-p-2">
                <label
                  htmlFor="isOrganizationEntity"
                  className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                >
                  Is Organization Entity
                </label>
                <input
                  type="checkbox"
                  {...register('isOrganizationEntity')}
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
          <MercoaButton isEmphasized={false} color="secondary" className="mercoa-mr-2" type="button" onClick={onCancel}>
            Cancel
          </MercoaButton>
        )}
        {!readOnly && (
          <MercoaButton isEmphasized disabled={isSubmitting}>
            {isSubmitting ? 'Loading...' : onCancel ? 'Update' : admin ? 'Submit' : 'Next'}
          </MercoaButton>
        )}
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
  type,
  connectedEntityName,
  connectedEntityId,
  entityId,
  onboardingOptions,
  hideDefaultIntroduction,
  onComplete,
  onStateChange,
}: {
  type: 'payee' | 'payor'
  connectedEntityName?: string
  connectedEntityId?: Mercoa.EntityId
  entityId?: Mercoa.EntityId
  onboardingOptions?: Mercoa.OnboardingOptionsRequest
  hideDefaultIntroduction?: boolean
  onComplete?: () => void
  onStateChange?: (state: 'entity' | 'representatives' | 'payments' | 'review' | 'complete') => void
}) {
  const [entity, setEntity] = useState<Mercoa.EntityResponse>()
  const [representatives, setRepresentatives] = useState<Mercoa.RepresentativeResponse[]>([])
  const [entityData, setEntityData] = useState<OnboardingFormData>()
  const [formState, setFormState] = useState<'entity' | 'representatives' | 'payments' | 'review' | 'complete'>(
    'entity',
  )

  const mercoaSession = useMercoaSession()

  const organizationOnboardingOptions =
    type === 'payee'
      ? mercoaSession.organization?.payeeOnboardingOptions
      : mercoaSession.organization?.payorOnboardingOptions
  const onboardingOptionsFinal = useMemo(
    () => (onboardingOptions ? onboardingOptionsToResponse(onboardingOptions) : organizationOnboardingOptions),
    [onboardingOptions, organizationOnboardingOptions],
  )

  useEffect(() => {
    onStateChange?.(formState)
  }, [formState, onStateChange])

  useEffect(() => {
    if (!mercoaSession.client) return
    if (entityId) {
      mercoaSession.client.entity.get(entityId).then((resp) => {
        setEntity(resp)
      })
    } else if (mercoaSession.entity) {
      setEntity(mercoaSession.entity)
    }
  }, [mercoaSession.client, entityId, mercoaSession.refreshId, mercoaSession.entity])

  useEffect(() => {
    if (!mercoaSession.organization) return
    if (!mercoaSession.client) return
    if (!entity) return
    let getReps = false
    if (type === 'payee' && onboardingOptionsFinal?.business.representatives.show) {
      getReps = true
    } else if (type === 'payor' && onboardingOptionsFinal?.business.representatives.show) {
      getReps = true
    }
    if (getReps) {
      mercoaSession.client.entity.representative.getAll(entity.id).then((resp) => {
        setRepresentatives(resp)
      })
    }
  }, [mercoaSession.organization, mercoaSession.client, entity, type, onboardingOptionsFinal])

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
        if (!onboardingOptionsFinal?.business.representatives.show) {
          setFormState('payments')
          return
        }
      }
      if (type === 'payor') {
        if (!onboardingOptionsFinal?.business.representatives.show) {
          setFormState('payments')
          return
        }
      }
    }
    // Payments transition function
    if (formState === 'payments') {
      // Skip payments, transition to TOS if paymentMethod not set in onboarding options
      if (type === 'payee') {
        if (!onboardingOptionsFinal?.paymentMethod) {
          setFormState('review')
          return
        }
      } else if (type === 'payor') {
        if (!onboardingOptionsFinal?.paymentMethod) {
          setFormState('review')
          return
        }
      }
    }
    if (formState === 'complete') {
      onCompleteCallback(entity, mercoaSession.client, connectedEntityId, onComplete)
    }
  }, [mercoaSession.organization, mercoaSession.client, entity, entityData, formState, type, onboardingOptionsFinal])

  async function onCompleteCallback(
    entity: Mercoa.EntityResponse,
    client: MercoaClient,
    connectedEntityId?: Mercoa.EntityId,
    onComplete?: () => void,
  ) {
    if (entity.acceptedTos) {
      try {
        await client?.entity.initiateKyb(entity.id)
      } catch (e) {
        toast.error(
          'Failed to initiate KYB. Please make sure all required fields are filled out and at least one controller is provided.',
        )
      }
    }
    if (connectedEntityId) {
      await client?.entity.update(entity.id, {
        connectedEntityId: connectedEntityId,
      })
    }
    onComplete?.()
  }

  if (!entity || !mercoaSession.organization || !mercoaSession.client)
    return (
      <div className="mercoa-text-center mercoa-pt-20 mercoa-w-full">
        <LoadingSpinnerIcon />
      </div>
    )

  const payeeIntroText = `${connectedEntityName ? connectedEntityName : 'A customer'} has opted to pay you using ${
    mercoaSession.organization.name
  }. To receive payments from ${
    mercoaSession.organization.name
  }, you'll need to provide us with a few pieces of information.`
  const payorIntroText = `To pay bills and invoices with ${mercoaSession.organization.name}, you'll need to provide us with a few pieces of information.`

  if (!mercoaSession.client) return <NoSession componentName="EntityOnboarding" />
  return (
    <div className="mercoa-flex mercoa-flex-col mercoa-p-8 mercoa-text-center mercoa-text-gray-900 mercoa-w-full">
      <div className={formState === 'entity' ? '' : 'mercoa-hidden'}>
        {!hideDefaultIntroduction && (
          <div className="mercoa-text-gray-800 mercoa-text-left">
            {/* Introduction Text */}
            <p className="mercoa-text-lg mercoa-font-normal mercoa-text-left">
              {type === 'payee' ? payeeIntroText : payorIntroText}
            </p>
            {/* Info Well */}
            <div className="mercoa-p-4 mercoa-text-sm mercoa-rounded-mercoa mercoa-bg-gray-100 mercoa-my-4 mercoa-grid mercoa-grid-cols-12 mercoa-gap-3 mercoa-items-center">
              <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
                <LockClosedIcon className="mercoa-w-[22px]" />
              </div>
              <p className="mercoa-col-span-11">
                Your information is used for verification purposes and isn&apos;t used for third-party marketing. We
                take your privacy seriously.
              </p>
              <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
                <ClockIcon className="mercoa-w-[22px]" />
              </div>
              <p className="mercoa-col-span-11" style={{ lineHeight: '48px' }}>
                This process should take approximately 5 minutes to complete.
              </p>
            </div>
          </div>
        )}
        <EntityOnboardingForm
          entity={entity}
          type={type}
          onboardingOptions={onboardingOptionsFinal}
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
          <Representatives
            showAdd={onboardingOptionsFinal?.business.representatives.edit}
            showEdit={onboardingOptionsFinal?.business.representatives.edit}
          />
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
            disabled={
              onboardingOptionsFinal?.business.representatives.required &&
              !representatives.find((e) => e.responsibilities.isController)
            }
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
            onSelect={async () => {
              await mercoaSession.refresh()
              setFormState('review')
            }}
            goToPreviousStep={async () => {
              await mercoaSession.refresh()
              setFormState('entity')
            }}
          />
        </div>
      )}

      <div className={formState === 'review' ? 'p-8 mercoa-text-center mercoa-text-lg' : 'mercoa-hidden'}>
        {onboardingOptionsFinal && (
          <OnboardingCompletedOverviewCard entity={entity} type={type} onboardingOptions={onboardingOptionsFinal} />
        )}

        <div className="mercoa-mt-10 mercoa-flex mercoa-justify-between mercoa-gap-3">
          <MercoaButton
            isEmphasized={false}
            size="md"
            onClick={async () => {
              await mercoaSession.refresh()
              setFormState('entity')
            }}
          >
            Go Back
          </MercoaButton>
          <MercoaButton
            isEmphasized
            size="md"
            onClick={async () => {
              await mercoaSession.refresh()
              setFormState('complete')
            }}
          >
            Submit and Complete
          </MercoaButton>
        </div>
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

export function OnboardingCompletedOverviewCard({
  entity,
  type,
  onboardingOptions,
}: {
  entity: Mercoa.EntityResponse
  type: 'payee' | 'payor'
  onboardingOptions: Mercoa.OnboardingOptionsResponse
}) {
  const fields: {
    label: string
    value: string | string[]
  }[] = []

  if (entity.accountType === 'business' && onboardingOptions.business) {
    if (onboardingOptions.business.name?.show) {
      fields.push({
        label: 'Business Name',
        value: entity.profile.business?.legalBusinessName || '',
      })
    }
    if (onboardingOptions.business.doingBusinessAs?.show) {
      fields.push({
        label: 'DBA',
        value: entity.profile.business?.doingBusinessAs || '',
      })
    }
    if (onboardingOptions.business.email?.show) {
      fields.push({
        label: 'Email',
        value: entity.email,
      })
    }
    if (onboardingOptions.business.address?.show) {
      fields.push({
        label: 'Address',
        value: [
          entity.profile.business?.address?.addressLine1 || '',
          entity.profile.business?.address?.city || '',
          entity.profile.business?.address?.stateOrProvince || '',
          entity.profile.business?.address?.postalCode || '',
        ]
          .filter(Boolean)
          .join(', '),
      })
    }
    if (onboardingOptions.business.phone?.show) {
      fields.push({
        label: 'Phone',
        value: entity.profile.business?.phone?.number || '',
      })
    }
    if (onboardingOptions.business.ein?.show) {
      fields.push({
        label: 'EIN',
        value: entity.profile.business?.taxId?.ein?.number || '',
      })
    }
    if (onboardingOptions.business.website?.show) {
      fields.push({
        label: 'Website',
        value: entity.profile.business?.website || '',
      })
    }
    if (onboardingOptions.business.description?.show) {
      fields.push({
        label: 'Description',
        value: entity.profile.business?.description || '',
      })
    }
    if (onboardingOptions.business.type?.show) {
      fields.push({
        label: 'Business Type',
        value: entity.profile.business?.businessType || '',
      })
    }
    if (onboardingOptions.business.mcc?.show) {
      fields.push({
        label: 'MCC',
        value: entity.profile.business?.industryCodes?.mcc || '',
      })
    }
  } else if (entity.accountType === 'individual' && onboardingOptions.individual) {
    if (onboardingOptions.individual.name?.show) {
      fields.push({
        label: 'Name',
        value: `${entity.profile.individual?.name.firstName || ''} ${entity.profile.individual?.name.lastName || ''}`,
      })
    }
    if (onboardingOptions.individual.email?.show) {
      fields.push({
        label: 'Email',
        value: entity.email,
      })
    }
    if (onboardingOptions.individual.address?.show) {
      fields.push({
        label: 'Address',
        value: [
          entity.profile.individual?.address?.addressLine1 || '',
          entity.profile.individual?.address?.city || '',
          entity.profile.individual?.address?.stateOrProvince || '',
          entity.profile.individual?.address?.postalCode || '',
        ]
          .filter(Boolean)
          .join(', '),
      })
    }
    if (onboardingOptions.individual.phone?.show) {
      fields.push({
        label: 'Phone',
        value: entity.profile.individual?.phone?.number || '',
      })
    }
    if (onboardingOptions.individual.dateOfBirth?.show) {
      fields.push({
        label: 'Date of Birth',
        value: entity.profile.individual?.birthDateProvided ? `Provided` : 'Not Provided',
      })
    }
    if (onboardingOptions.individual.ssn?.show) {
      fields.push({
        label: 'SSN',
        value: entity.profile.individual?.governmentIdProvided ? `Provided` : 'Not Provided',
      })
    }
  }

  return (
    <div className="mercoa-bg-white mercoa-shadow-sm mercoa-rounded-lg mercoa-overflow-hidden">
      <div className="mercoa-px-6 mercoa-py-4 mercoa-border-b mercoa-border-gray-200">
        <div className="mercoa-flex mercoa-items-center mercoa-gap-3">
          <UserCircleIcon className="mercoa-w-8 mercoa-h-8 mercoa-text-gray-400" />
          <h3 className="mercoa-text-lg mercoa-font-medium mercoa-text-gray-900">Account Information</h3>
        </div>
      </div>
      <div className="mercoa-px-6 mercoa-py-4">
        <div className="mercoa-divide-y mercoa-divide-gray-200 mercoa-text-left">
          {fields.map((field) => (
            <div key={field.label} className="mercoa-py-3 mercoa-grid mercoa-grid-cols-2 mercoa-gap-4">
              <dt className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">{field.label}</dt>
              <dd className="mercoa-text-sm mercoa-text-gray-700 ">{field.value || 'Not provided'}</dd>
            </div>
          ))}
        </div>
      </div>
      {onboardingOptions.paymentMethod && (
        <>
          <div className="mercoa-px-6 mercoa-py-4 mercoa-border-t-2 mercoa-border-gray-200">
            <div className="mercoa-flex mercoa-items-center mercoa-gap-3">
              <BuildingLibraryIcon className="mercoa-w-8 mercoa-h-8 mercoa-text-gray-400" />
              <h3 className="mercoa-text-lg mercoa-font-medium mercoa-text-gray-900">Payment Methods</h3>
            </div>
          </div>
          <div className="mercoa-px-6 mercoa-py-4 mercoa-bg-gray-50 mercoa-border-t mercoa-border-gray-200 mercoa-text-left">
            <PaymentMethods
              entityId={entity.id}
              showAdd={false}
              showEdit={false}
              showDelete={false}
              hideIndicators={true}
            />
          </div>
        </>
      )}
      {onboardingOptions.business.representatives.required && (
        <>
          <div className="mercoa-px-6 mercoa-py-4 mercoa-border-t-2 mercoa-border-gray-200">
            <div className="mercoa-flex mercoa-items-center mercoa-gap-3">
              <BuildingLibraryIcon className="mercoa-w-8 mercoa-h-8 mercoa-text-gray-400" />
              <h3 className="mercoa-text-lg mercoa-font-medium mercoa-text-gray-900">Representatives</h3>
            </div>
          </div>
          <div className="mercoa-px-6 mercoa-py-4 mercoa-bg-gray-50 mercoa-border-t mercoa-border-gray-200">
            <Representatives showAdd={false} showEdit={false} />
          </div>
        </>
      )}
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
