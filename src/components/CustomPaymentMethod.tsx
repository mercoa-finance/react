import { BuildingLibraryIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { ReactNode, useEffect, useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { usePlacesWidget } from 'react-google-autocomplete'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import InputMask from 'react-input-mask'
import { capitalize } from '../lib/lib'
import { DefaultPaymentMethodIndicator, LoadingSpinnerIcon, PaymentMethodList, useMercoaSession } from './index'

export function CustomPaymentMethod({
  children,
  onSelect,
  showEdit,
  schema,
}: {
  children?: Function
  onSelect?: Function
  showEdit?: boolean
  schema?: Mercoa.CustomPaymentMethodSchemaResponse
}) {
  const [paymentMethods, setPaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse.Custom>>()
  const [showDialog, setShowDialog] = useState(false)

  const mercoaSession = useMercoaSession()
  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod.getAll(mercoaSession.entity?.id, { type: 'custom' }).then((resp) => {
        setPaymentMethods(resp.map((e) => e as Mercoa.PaymentMethodResponse.Custom))
      })
    }
  }, [mercoaSession.entity?.id, mercoaSession.token, showDialog, mercoaSession.refreshId])

  const onClose = (account: Mercoa.PaymentMethodRequest) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  if (children) return children({ paymentMethods })
  else {
    return (
      <>
        {!paymentMethods && (
          <div className="mercoa-p-9 mercoa-text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        <PaymentMethodList accounts={paymentMethods} showEdit={showEdit}>
          {(account: Mercoa.PaymentMethodResponse.Custom) => (
            <CustomPaymentMethodComponent account={account} onSelect={onSelect} schema={schema} showEdit={showEdit} />
          )}
        </PaymentMethodList>
        {paymentMethods && paymentMethods?.map((account) => <div className="mercoa-mt-2" key={account.id}></div>)}
      </>
    )
  }
}

export function CustomPaymentMethodComponent({
  children,
  account,
  onSelect,
  selected,
  showEdit,
  schema,
}: {
  children?: Function
  account?: Mercoa.CustomPaymentMethodResponse
  onSelect?: Function
  selected?: boolean
  showEdit?: boolean
  schema?: Mercoa.CustomPaymentMethodSchemaResponse
}) {
  if (account) {
    const { accountName, accountNumber } = findCustomPaymentMethodAccountNameAndNumber(account)
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
        }}
        key={account?.id}
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-lg mercoa-border ${
          selected ? 'mercoa-border-gray-600' : 'mercoa-border-gray-300'
        } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-indigo-500 focus-within:mercoa-ring-offset-2 ${
          onSelect ? 'mercoa-cursor-pointer  hover:mercoa-border-gray-400' : ''
        }`}
      >
        <div
          className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
            selected
              ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
              : 'mercoa-bg-gray-200 mercoa-text-gray-600'
          }`}
        >
          <BuildingLibraryIcon className="mercoa-size-5" />
        </div>
        <div className="mercoa-flex mercoa-min-w-0 mercoa-flex-1 mercoa-justify-between">
          <div>
            {!showEdit && <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />}
            <p
              className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
            >{`${capitalize(accountName)} ${accountNumber ? `••••${String(accountNumber).slice(-4)}` : ''}`}</p>
          </div>
        </div>
        {showEdit && (
          <div className="mercoa-flex">
            <DefaultPaymentMethodIndicator paymentMethod={account} />
          </div>
        )}
      </div>
    )
  } else if (schema) {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect()
        }}
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-lg mercoa-border ${
          selected ? 'mercoa-border-gray-600' : 'mercoa-border-gray-300'
        } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-indigo-500 focus-within:mercoa-ring-offset-2 ${
          onSelect ? 'mercoa-cursor-pointer  hover:mercoa-border-gray-400' : ''
        }`}
      >
        <div
          className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
            selected
              ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
              : 'mercoa-bg-gray-200 mercoa-text-gray-600'
          }`}
        >
          <BuildingLibraryIcon className="mercoa-size-5" />
        </div>
        <div className="mercoa-flex mercoa-min-w-0 mercoa-flex-1 mercoa-justify-between">
          <div>
            <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />
            <p
              className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
            >
              Add new {schema.name}
            </p>
          </div>
        </div>
      </div>
    )
  } else {
    return <></>
  }
}

export function AddCustomPaymentMethod({
  onSubmit,
  title,
  actions,
  formOnlySubmit,
  custom,
  schema,
}: {
  onSubmit?: Function
  title?: ReactNode
  actions?: ReactNode
  formOnlySubmit?: Function
  custom?: Mercoa.CustomPaymentMethodRequest
  schema: Mercoa.CustomPaymentMethodSchemaResponse
}) {
  const mercoaSession = useMercoaSession()

  const { register, handleSubmit, control } = useForm()

  async function submitCPM(data: Record<string, any>) {
    const filtered: Record<string, string> = {}
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('~cpm~~')) {
        value.forEach((v: any) => {
          filtered[v.name] = `${filtered[v.name] ?? v.value}`
        })
      }
    })

    if (mercoaSession.entity?.id) {
      const resp = await mercoaSession.client?.entity.paymentMethod.create(mercoaSession.entity?.id, {
        type: 'custom',
        schemaId: schema?.id,
        data: filtered,
        foreignId: Math.random().toString(36).substring(7),
      })
      if (!onSubmit) return
      if (resp) onSubmit(resp)
      else onSubmit()
    }
  }

  return (
    <form className="mercoa-space-y-3 mercoa-text-left" onSubmit={handleSubmit((formOnlySubmit as any) || submitCPM)}>
      {title || (
        <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          {schema.name}
        </h3>
      )}
      <AddCustomPaymentMethodForm register={register} schema={schema} control={control} />
      {actions || (
        <button className="mercoa-relative mercoa-inline-flex mercoa-items-center mercoa-rounded-md mercoa-border mercoa-border-transparent mercoa-bg-indigo-600 mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-medium mercoa-text-white mercoa-shadow-sm hover:mercoa-bg-indigo-700 focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-indigo-500 focus:mercoa-ring-offset-2">
          Add
        </button>
      )}
    </form>
  )
}

export function AddCustomPaymentMethodForm({
  register,
  control,
  schema,
}: {
  register: Function
  control: any
  schema: Mercoa.CustomPaymentMethodSchemaResponse
}) {
  const [schemaFields, setSchemaFields] = useState<Mercoa.CustomPaymentMethodSchemaField[]>()

  const { append, fields } = useFieldArray({
    control,
    name: '~cpm~~',
  })

  useEffect(() => {
    if (schemaFields) return
    if (schema) {
      setSchemaFields(Object.values(schema?.fields ?? {}))
    }
  }, [schema, schemaFields])

  useEffect(() => {
    if (schemaFields) {
      schemaFields.forEach((field) => {
        append(field, { focusIndex: 0 })
      })
    }
  }, [schemaFields])

  return (
    <div className="mercoa-mt-2">
      {fields?.map((field, index) => (
        <div className="mercoa-mt-1" key={field.id}>
          <label
            htmlFor={`~cpm~~.${index}.value`}
            className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700"
          >
            {schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}
          </label>
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Text && (
            <input
              {...register(`~cpm~~.${index}.value`)}
              type="text"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`${schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}`}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Url && (
            <input
              {...register(`~cpm~~.${index}.value`, {
                pattern: {
                  value:
                    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
                  message: 'Invalid URL',
                  // https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
                },
              })}
              type="text"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`https://example.com`}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Email && (
            <>
              <input
                {...register(`~cpm~~.${index}.value`, {
                  pattern: {
                    value:
                      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
                    message: 'Invalid email',
                    // https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
                  },
                })}
                type="text"
                required={schemaFields?.[index]?.optional ? false : true}
                placeholder={`name@example.com`}
                className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
              />
            </>
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Number && (
            <input
              {...register(`~cpm~~.${index}.value`)}
              type="number"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`${schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}`}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Select && (
            <select
              {...register(`~cpm~~.${index}.value`)}
              required={schemaFields?.[index]?.optional ? false : true}
              className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            >
              {schemaFields?.[index]?.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Date && (
            <Controller
              control={control}
              name={`~cpm~~.${index}.value`}
              render={({ field }) => (
                <ReactDatePicker
                  className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                  onChange={(date) => field.onChange(date)}
                  selected={field.value}
                  required={schemaFields?.[index]?.optional ? false : true}
                  placeholderText="Select a date"
                />
              )}
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Phone && (
            <Controller
              control={control}
              name={`~cpm~~.${index}.value`}
              render={({ field }) => (
                <InputMask
                  mask="(999) 999-9999"
                  value={field.value}
                  onChange={field.onChange}
                  required={schemaFields?.[index]?.optional ? false : true}
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
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Address && (
            <Controller
              control={control}
              name={`~cpm~~.${index}.value`}
              render={({ field }) => (
                <CustomAddressBlock
                  setValue={field.onChange}
                  trigger={field.onBlur}
                  required={schemaFields?.[index]?.optional ? false : true}
                />
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CustomAddressBlock({
  setValue,
  trigger,
  required,
}: {
  setValue: Function
  trigger: Function
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
      setValue(`${streetNumber} ${streetName}, ${city}, ${state} ${postalCode}}`)
      trigger()
    },
    options: {
      fields: ['address_components'],
      types: ['address'],
    },
  })
  return (
    <input
      ref={ref as any}
      type="text"
      placeholder="Enter a location"
      className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
      required={required}
    />
  )
}

export function findCustomPaymentMethodAccountNameAndNumber(account: Mercoa.CustomPaymentMethodResponse) {
  let accountName = account?.accountName

  if (!accountName) {
    account.schema?.fields?.forEach((field) => {
      if (field.useAsAccountName) accountName = account?.data[field.name]
    })
  }
  if (!accountName) accountName = capitalize(Object.values(account?.data ?? ['Account'])[0])

  let accountNumber = account?.accountNumber
  if (!accountNumber) {
    account.schema?.fields?.forEach((field) => {
      if (field.useAsAccountNumber) accountNumber = account?.data[field.name]
    })
  }

  return { accountName, accountNumber }
}
