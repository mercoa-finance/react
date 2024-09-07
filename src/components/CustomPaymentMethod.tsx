import { BuildingLibraryIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import { ReactNode, useEffect, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { toast } from 'react-toastify'
import { currencyCodeToSymbol } from '../lib/currency'
import { capitalize } from '../lib/lib'
import {
  AddDialog,
  AddressBlock,
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
  showAdd,
  showEdit,
  schema,
}: {
  children?: Function
  onSelect?: Function
  showAdd?: boolean
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

  const onClose = (account: Mercoa.PaymentMethodResponse) => {
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
          // TODO: Implement AddCustomPaymentMethod component, incorporate it correctly here
          // addAccount={
          //   paymentMethods && showAdd ? (
          //     <div className="mercoa-mt-2">
          //       <AddDialog
          //         show={showDialog}
          //         onClose={onClose}
          //         component={
          //           <AddCustomPaymentMethod
          //             onSubmit={(data) => {
          //               onClose(data)
          //             }}
          //             schema={paymentMethods[0].schema}
          //           />
          //         }
          //       />
          //       <CustomPaymentMethod onSelect={() => setShowDialog(true)} />
          //     </div>
          //   ) : undefined
          // }
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

  const [showNameEdit, setShowNameEdit] = useState(false)

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
              <AddDialog
                component={<EditCustomPaymentMethod account={account} onSubmit={() => setShowNameEdit(false)} />}
                onClose={() => setShowNameEdit(false)}
                show={showNameEdit}
              />
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
                  onClick={() => setShowNameEdit(true)}
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
    Object.entries(data['~cpm~~']).forEach(([key, value]: [string, any]) => {
      if (typeof value === 'string') {
        filtered[key] = value
      } else {
        Object.entries(value).forEach(([subKey, value]: [string, any]) => {
          if (subKey === 'full') {
            filtered[key] = value
          } else {
            filtered[key + '.' + subKey] = value
          }
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
  const schemaFields = Object.values(schema?.fields ?? {})

  const {
    watch,
    register,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = useFormContext()

  useEffect(() => {
    if (!schema?.fields) return
    schemaFields.forEach((field) => {
      setValue(`~cpm~~.${field.name}`, '')
    })
  }, [schema?.fields])

  const bankAccountData = watch('newBankAccount')

  useEffect(() => {
    if (bankAccountData?.accountNumber) {
      const field = schemaFields?.find(
        (field) => field.type === Mercoa.CustomPaymentMethodSchemaFieldType.UsBankAccountNumber,
      )
      if (field !== undefined) {
        setValue(`~cpm~~.${field.name}`, bankAccountData.accountNumber)
      }
    }
    if (bankAccountData?.routingNumber) {
      const field = schemaFields?.find(
        (field) => field.type === Mercoa.CustomPaymentMethodSchemaFieldType.UsBankRoutingNumber,
      )
      if (field !== undefined) {
        setValue(`~cpm~~.${field.name}`, bankAccountData.routingNumber)
      }
    }
  }, [bankAccountData, schemaFields])

  return (
    <div className="mercoa-mt-2">
      {schemaFields?.map((field, index) => (
        <div className="mercoa-mt-1" key={field.name}>
          <MercoaInputLabel label={field.displayName || field.name || ''} />
          {field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Text && (
            <MercoaInput
              name={`~cpm~~.${field.name}`}
              register={register}
              type="text"
              required={field.optional ? false : true}
              placeholder={`${field.displayName || field.name}`}
            />
          )}
          {field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Url && (
            <MercoaInput
              name={`~cpm~~.${field.name}`}
              register={register}
              type="text"
              required={field.optional ? false : true}
              placeholder={`https://example.com`}
            />
          )}
          {field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Email && (
            <MercoaInput
              name={`~cpm~~.${field.name}`}
              register={register}
              type="text"
              required={field.optional ? false : true}
              placeholder={`name@example.com`}
            />
          )}
          {(field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Number ||
            field.type === Mercoa.CustomPaymentMethodSchemaFieldType.UsBankAccountNumber ||
            field.type === Mercoa.CustomPaymentMethodSchemaFieldType.UsBankRoutingNumber) && (
            <MercoaInput
              type="number"
              required={field.optional ? false : true}
              placeholder={`${field.displayName || field.name}`}
              name={`~cpm~~.${field.name}`}
              register={register}
            />
          )}
          {field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Select && (
            <select
              {...register(`~cpm~~.${field.name}`)}
              required={field.optional ? false : true}
              className={inputClassName({})}
            >
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Date && (
            <MercoaInput
              control={control}
              name={`~cpm~~.${field.name}`}
              type="date"
              placeholder="Select a date"
              required={field.optional ? false : true}
            />
          )}
          {field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Phone && (
            <MercoaInput
              control={control}
              name={`~cpm~~.${field.name}`}
              inputMask={'(###) ###-####'}
              required={field.optional ? false : true}
            />
          )}
          {field.type === Mercoa.CustomPaymentMethodSchemaFieldType.Address && (
            <AddressBlock
              label={''}
              register={register}
              setValue={setValue}
              trigger={trigger}
              watch={watch}
              errors={errors}
              required={field.optional ? false : true}
              prefix={`~cpm~~.${field.name}.`}
            />
          )}
        </div>
      ))}
    </div>
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

export function EditCustomPaymentMethod({
  account,
  onSubmit,
}: {
  account: Mercoa.CustomPaymentMethodResponse
  onSubmit?: Function
}) {
  const mercoaSession = useMercoaSession()

  const methods = useForm({
    defaultValues: {
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      availableBalance: account.availableBalance,
      data: account.data,
    },
  })

  const { register, handleSubmit, watch, setValue } = methods

  function onUpdate(updateRequest: Mercoa.CustomPaymentMethodUpdateRequest) {
    if (mercoaSession.entity?.id) {
      const data: Record<string, string> = {}
      // @ts-ignore: ~cpm~~ key is set by AddCustomPaymentMethodForm
      updateRequest['~cpm~~']?.forEach(({ name, value, type }) => {
        if (value) {
          if (type === Mercoa.CustomPaymentMethodSchemaFieldType.Date) {
            data[name] = new Date(value).toISOString()
          } else {
            data[name] = value
          }
        }
      })
      mercoaSession.client?.entity.paymentMethod
        .update(mercoaSession.entity?.id, account.id, {
          type: Mercoa.PaymentMethodType.Custom,
          ...(updateRequest.accountName && { accountName: updateRequest.accountName }),
          ...(updateRequest.accountNumber && { accountNumber: updateRequest.accountNumber }),
          ...(updateRequest.availableBalance && { availableBalance: Number(updateRequest.availableBalance) }),
          ...(data && { data }),
        })
        .then(() => {
          toast.success('Custom payment method updated')
          if (onSubmit) onSubmit(updateRequest)
          mercoaSession.refresh()
        })
        .catch((err) => {
          console.error(err)
          toast.error('There was an error updating your custom payment method')
        })
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="EditBankAccount" />
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onUpdate)}>
        <MercoaInput label="Account Name" name="accountName" register={register} optional />
        <MercoaInput label="Account Number" name="accountNumber" register={register} optional />
        <MercoaInput label="Available Balance" name="availableBalance" register={register} optional />
        <div className="mercoa-bg-gray-100 mercoa-p-2 mercoa-rounded-mercoa mercoa-mt-2">
          <span className="mercoa-text-md mercoa-text-black-500">Custom Payment Method Data</span>
          <AddCustomPaymentMethodForm schema={account.schema} />
        </div>
        <div className="mercoa-flex mercoa-justify-between mercoa-mt-5">
          <MercoaButton
            isEmphasized={false}
            onClick={() => {
              if (onSubmit) onSubmit()
            }}
            type="button"
          >
            Back
          </MercoaButton>
          <MercoaButton isEmphasized>Update</MercoaButton>
        </div>
      </form>
    </FormProvider>
  )
}
