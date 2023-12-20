import { BuildingLibraryIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { ReactNode, useEffect, useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { usePlacesWidget } from 'react-google-autocomplete'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import InputMask from 'react-input-mask'
import { capitalize } from '../lib/lib'
import { DefaultPaymentMethodIndicator, LoadingSpinnerIcon, useMercoaSession } from './index'

export function CustomPaymentMethod({
  children,
  onSelect,
  showEdit,
  schema,
}: {
  children?: Function
  onSelect?: Function
  showEdit?: boolean
  schema?: Mercoa.PaymentMethodSchemaResponse
}) {
  const [paymentMethods, setPaymentMethods] = useState<Array<Mercoa.CustomPaymentMethodResponse>>()
  const [showDialog, setShowDialog] = useState(false)

  const mercoaSession = useMercoaSession()
  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod.getAll(mercoaSession.entity?.id, { type: 'custom' }).then((resp) => {
        setPaymentMethods(resp.map((e) => e as Mercoa.CustomPaymentMethodResponse))
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
          <div className="p-9 text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        {paymentMethods &&
          paymentMethods?.map((account) => (
            <div className="mt-2" key={account.id}>
              <CustomPaymentMethodComponent account={account} onSelect={onSelect} schema={schema} showEdit={showEdit} />
            </div>
          ))}
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
  schema?: Mercoa.PaymentMethodSchemaResponse
}) {
  if (account) {
    const { accountName, accountNumber } = findCustomPaymentMethodAccountNameAndNumber(account)
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
        }}
        key={account?.id}
        className={`relative flex items-center space-x-3 rounded-lg border ${
          selected ? 'border-indigo-300' : 'border-gray-300'
        } bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
          onSelect ? 'cursor-pointer hover:border-gray-400' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <BuildingLibraryIcon className={`h-5 w-5 ${selected ? 'text-indigo-400' : ''}`} />
        </div>
        <div className="flex min-w-0 flex-1 justify-between">
          <div>
            {!showEdit && <span className="absolute inset-0" aria-hidden="true" />}
            <p className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}>{`${capitalize(
              accountName,
            )} ${accountNumber ? `••••${String(accountNumber).slice(-4)}` : ''}`}</p>
          </div>
        </div>
        {showEdit && (
          <div className="flex cursor-pointer">
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
        className={`relative flex items-center space-x-3 rounded-lg border ${
          selected ? 'border-indigo-300' : 'border-gray-300'
        } bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
          onSelect ? 'cursor-pointer hover:border-gray-400' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <BuildingLibraryIcon className={`h-5 w-5 ${selected ? 'text-indigo-400' : ''}`} />
        </div>
        <div className="flex min-w-0 flex-1 justify-between">
          <div>
            <span className="absolute inset-0" aria-hidden="true" />
            <p className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}>Add new {schema.name}</p>
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
  schema: Mercoa.PaymentMethodSchemaResponse
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
    <form className="space-y-3 text-left" onSubmit={handleSubmit((formOnlySubmit as any) || submitCPM)}>
      {title || <h3 className="text-center text-lg font-medium leading-6 text-gray-900">{schema.name}</h3>}
      <AddCustomPaymentMethodForm register={register} schema={schema} control={control} />
      {actions || (
        <button className="relative inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
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
  schema: Mercoa.PaymentMethodSchemaResponse
}) {
  const [schemaFields, setSchemaFields] = useState<Mercoa.PaymentMethodSchemaField[]>()

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
    <div className="mt-2">
      {fields?.map((field, index) => (
        <div className="mt-1" key={field.id}>
          <label htmlFor={`~cpm~~.${index}.value`} className="block text-sm font-medium text-gray-700">
            {schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}
          </label>
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Text && (
            <input
              {...register(`~cpm~~.${index}.value`)}
              type="text"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`${schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Url && (
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Email && (
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
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </>
          )}
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Number && (
            <input
              {...register(`~cpm~~.${index}.value`)}
              type="number"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`${schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Select && (
            <select
              {...register(`~cpm~~.${index}.value`)}
              required={schemaFields?.[index]?.optional ? false : true}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {schemaFields?.[index]?.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Date && (
            <Controller
              control={control}
              name={`~cpm~~.${index}.value`}
              render={({ field }) => (
                <ReactDatePicker
                  className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                  onChange={(date) => field.onChange(date)}
                  selected={field.value}
                  required={schemaFields?.[index]?.optional ? false : true}
                  placeholderText="Select a date"
                />
              )}
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Phone && (
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
                        className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="(777) 777-7777"
                      />
                    )) as any
                  }
                </InputMask>
              )}
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.PaymentMethodSchemaFieldType.Address && (
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
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
