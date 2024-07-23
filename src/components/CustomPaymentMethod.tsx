import { BuildingLibraryIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import { ReactNode, useEffect, useState } from 'react'
import { usePlacesWidget } from 'react-google-autocomplete'
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { toast } from 'react-toastify'
import { currencyCodeToSymbol } from '../lib/currency'
import { capitalize } from '../lib/lib'
import {
  AddDialog,
  DefaultPaymentMethodIndicator,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaInput,
  MercoaInputLabel,
  NoSession,
  PaymentMethodList,
  Tooltip,
  inputClassName,
  useMercoaSession,
} from './index'

export function CustomPaymentMethods({
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

  if (!mercoaSession.client) return <NoSession componentName="CustomPaymentMethod" />
  if (children) return children({ paymentMethods })
  else {
    return (
      <>
        {!paymentMethods && (
          <div className="mercoa-p-9 mercoa-text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        <PaymentMethodList
          accounts={paymentMethods}
          showEdit={showEdit}
          formatAccount={(account: Mercoa.PaymentMethodResponse.Custom) => (
            <CustomPaymentMethod account={account} onSelect={onSelect} schema={schema} showEdit={showEdit} />
          )}
        />
        {paymentMethods && paymentMethods?.map((account) => <div className="mercoa-mt-2" key={account.id}></div>)}
      </>
    )
  }
}

export function CustomPaymentMethod({
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
  const mercoaSession = useMercoaSession()

  if (account) {
    const { accountName, accountNumber } = findCustomPaymentMethodAccountNameAndNumber(account)
    if (!mercoaSession.client) return <NoSession componentName="CustomPaymentMethod" />
    return (
      <div className={account.frozen ? 'mercoa-line-through pointer-events-none' : ''}>
        <div
          onClick={() => {
            if (onSelect) onSelect(account)
          }}
          key={account?.id}
          className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border ${
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
                className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${
                  selected ? 'mercoa-underline' : ''
                }`}
              >{`${capitalize(accountName)} ${accountNumber ? `••••${String(accountNumber).slice(-4)}` : ''}`}</p>
            </div>
          </div>
          <div className="mercoa-flex">
            {showEdit ? (
              <>
                <DefaultPaymentMethodIndicator paymentMethod={account} />
                <MercoaButton
                  size="sm"
                  isEmphasized={false}
                  className="mercoa-mr-2 mercoa-px-[4px] mercoa-py-[4px]"
                  onClick={async () => {
                    const newBalance = prompt('Enter new balance', `${account?.availableBalance}`)
                    if (newBalance && mercoaSession.entityId) {
                      await mercoaSession.client?.entity.paymentMethod.update(mercoaSession.entityId, account?.id, {
                        type: 'custom',
                        availableBalance: Number(newBalance),
                      })
                      mercoaSession.refresh()
                      toast.success('Successfully updated balance')
                    }
                  }}
                >
                  <Tooltip title="Edit">
                    <PencilIcon className="mercoa-size-4" />
                  </Tooltip>
                </MercoaButton>
              </>
            ) : (
              <>
                {account?.availableBalance && (
                  <Tooltip title="Available balance" offset={30}>
                    <p
                      className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${
                        selected ? 'mercoa-underline' : ''
                      }`}
                    >
                      {accounting.formatMoney(
                        account?.availableBalance ?? '',
                        currencyCodeToSymbol(account.supportedCurrencies[0]),
                      )}
                    </p>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  } else if (schema) {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect()
        }}
        className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border ${
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
  entityId,
  schema,
}: {
  onSubmit?: (data: Mercoa.PaymentMethodResponse) => void
  title?: ReactNode
  actions?: ReactNode
  entityId?: string
  schema: Mercoa.CustomPaymentMethodSchemaResponse
}) {
  const mercoaSession = useMercoaSession()

  const methods = useForm()

  async function submitCPM(data: Record<string, any>) {
    const filtered: Record<string, string> = {}
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('~cpm~~')) {
        value.forEach((v: any) => {
          filtered[v.name] = `${filtered[v.name] ?? v.value}`
        })
      }
    })

    const eid = entityId ?? mercoaSession.entity?.id

    if (eid) {
      const resp = await mercoaSession.client?.entity.paymentMethod.create(eid, {
        type: 'custom',
        schemaId: schema?.id,
        data: filtered,
      })
      if (!onSubmit) return
      if (resp) onSubmit(resp)
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="AddCustomPaymentMethod" />
  return (
    <FormProvider {...methods}>
      <form className="mercoa-space-y-3 mercoa-text-left" onSubmit={methods.handleSubmit(submitCPM)}>
        {title || (
          <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
            {schema.name}
          </h3>
        )}
        <AddCustomPaymentMethodForm schema={schema} />
        <div className="mercoa-flex mercoa-flex-row-reverse">
          {actions || <MercoaButton isEmphasized>Add</MercoaButton>}
        </div>
      </form>
    </FormProvider>
  )
}

export function AddCustomPaymentMethodForm({ schema }: { schema?: Mercoa.CustomPaymentMethodSchemaResponse }) {
  const mercoaSession = useMercoaSession()
  const [schemaFields, setSchemaFields] = useState<Mercoa.CustomPaymentMethodSchemaField[]>()

  const { register, control } = useFormContext()

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
          <MercoaInputLabel label={schemaFields?.[index]?.displayName || schemaFields?.[index]?.name || ''} />
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Text && (
            <MercoaInput
              name={`~cpm~~.${index}.value`}
              register={register}
              type="text"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`${schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}`}
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Url && (
            <MercoaInput
              name={`~cpm~~.${index}.value`}
              register={register}
              type="text"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`https://example.com`}
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Email && (
            <MercoaInput
              name={`~cpm~~.${index}.value`}
              register={register}
              type="text"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`name@example.com`}
            />
          )}
          {(schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Number ||
            schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.UsBankAccountNumber ||
            schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.UsBankRoutingNumber) && (
            <MercoaInput
              type="number"
              required={schemaFields?.[index]?.optional ? false : true}
              placeholder={`${schemaFields?.[index]?.displayName || schemaFields?.[index]?.name}`}
              name={`~cpm~~.${index}.value`}
              register={register}
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Select && (
            <select
              {...register(`~cpm~~.${index}.value`)}
              required={schemaFields?.[index]?.optional ? false : true}
              className={inputClassName({})}
            >
              {schemaFields?.[index]?.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Date && (
            <MercoaInput
              control={control}
              name={`~cpm~~.${index}.value`}
              type="date"
              placeholder="Select a date"
              required={schemaFields?.[index]?.optional ? false : true}
            />
          )}
          {schemaFields?.[index]?.type === Mercoa.CustomPaymentMethodSchemaFieldType.Phone && (
            <MercoaInput
              control={control}
              name={`~cpm~~.${index}.value`}
              inputMask={'(###) ###-####'}
              required={schemaFields?.[index]?.optional ? false : true}
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
      className="mercoa-block mercoa-w-full mercoa-rounded-mercoa mercoa-border-gray-300 mercoa-shadow-sm focus:mercoa-border-indigo-500 focus:mercoa-ring-indigo-500 sm:mercoa-text-sm"
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

export function AddCustomPaymentMethodDialog({
  entityId,
  schema,
  onSelect,
}: {
  entityId?: Mercoa.EntityId
  schema?: Mercoa.CustomPaymentMethodSchemaResponse
  onSelect?: Function
}) {
  const [showDialog, setShowDialog] = useState(false)

  const onClose = (account?: Mercoa.PaymentMethodResponse) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  if (!schema) return <></>

  return (
    <div className="mercoa-mt-2">
      <AddDialog
        show={showDialog}
        onClose={onClose}
        component={
          <AddCustomPaymentMethod
            onSubmit={(data) => {
              onClose(data)
            }}
            schema={schema}
            entityId={entityId}
          />
        }
      />
      <CustomPaymentMethod onSelect={() => setShowDialog(true)} schema={schema} />
    </div>
  )
}
