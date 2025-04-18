import { EnvelopeIcon, PlusIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { ReactNode, useEffect, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { postalCodeRegex } from '../lib/locations'
import {
  AddDialog,
  DefaultPaymentMethodIndicator,
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaInput,
  NoSession,
  PaymentMethodButton,
  PaymentMethodList,
  StateDropdown,
  useMercoaSession,
} from './index'

export function Checks({
  children,
  onSelect,
  showAdd,
  showEdit,
  showDelete,
  showEntityConfirmation,
  hideIndicators,
  entityId,
}: {
  children?: Function
  onSelect?: (value?: Mercoa.PaymentMethodResponse.Check) => void
  showAdd?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showEntityConfirmation?: boolean
  hideIndicators?: boolean
  entityId?: string
}) {
  const [checks, setChecks] = useState<Array<Mercoa.PaymentMethodResponse.Check>>()
  const [showDialog, setShowDialog] = useState(false)

  const mercoaSession = useMercoaSession()

  const entityIdFinal = entityId ?? mercoaSession.entity?.id

  useEffect(() => {
    if (mercoaSession.token && entityIdFinal) {
      mercoaSession.client?.entity.paymentMethod.getAll(entityIdFinal, { type: 'check' }).then((resp) => {
        setChecks(
          resp
            .filter((e) => {
              return e
            })
            .map((e) => e as Mercoa.PaymentMethodResponse.Check),
        )
      })
    }
  }, [entityIdFinal, mercoaSession.token, showDialog, mercoaSession.refreshId])

  const onClose = (account?: Mercoa.PaymentMethodResponse.Check) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  let entityConfirmation: 'view' | 'edit' | 'none' = 'none'
  if (showEntityConfirmation) {
    entityConfirmation = 'view'
  } else if (showEdit) {
    entityConfirmation = 'edit'
  }

  if (!mercoaSession.client) return <NoSession componentName="Checks" />

  if (children) return children({ checks })
  else {
    return (
      <>
        {!checks ? (
          <div className="mercoa-p-9 mercoa-text-center">
            <LoadingSpinnerIcon />
          </div>
        ) : (
          <PaymentMethodList
            accounts={checks}
            showDelete={showDelete || showEdit}
            showEntityConfirmation={entityConfirmation}
            addAccount={
              checks && showAdd ? (
                <div>
                  <AddDialog
                    show={showDialog}
                    onClose={onClose}
                    component={
                      <AddCheck
                        onSubmit={(data?: Mercoa.PaymentMethodResponse.Check) => {
                          onClose(data)
                        }}
                        entityId={entityId}
                      />
                    }
                  />
                  <Check onSelect={() => setShowDialog(true)} />
                </div>
              ) : undefined
            }
            formatAccount={(account: Mercoa.PaymentMethodResponse.Check) => (
              <Check account={account} onSelect={onSelect} showEdit={showEdit} hideDefaultIndicator={hideIndicators} />
            )}
          />
        )}
      </>
    )
  }
}

export function Check({
  account,
  onSelect,
  showEdit,
  selected,
  hideDefaultIndicator,
}: {
  children?: Function
  account?: Mercoa.PaymentMethodResponse.Check
  onSelect?: (value?: Mercoa.PaymentMethodResponse.Check) => void
  showEdit?: boolean
  selected?: boolean
  hideDefaultIndicator?: boolean
}) {
  const mercoaSession = useMercoaSession()

  if (!mercoaSession.client) return <NoSession componentName="CheckComponent" />
  if (account) {
    return (
      <div className={account.frozen ? 'mercoa-line-through pointer-events-none	' : ''}>
        <div
          onClick={() => {
            if (onSelect) onSelect(account)
          }}
          key={`${account?.addressLine1} ${account?.addressLine1}`}
          className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border ${
            selected ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
          } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 ${
            onSelect ? 'mercoa-cursor-pointer hover:mercoa-border-mercoa-primary-dark' : ''
          }`}
        >
          <div
            className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
              selected
                ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
                : 'mercoa-bg-gray-200 mercoa-text-gray-600'
            }`}
          >
            <EnvelopeIcon className="mercoa-size-5" />
          </div>
          <div className="mercoa-min-w-0 mercoa-flex-1">
            {!showEdit && <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />}
            <p
              className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
            >{`${account?.payToTheOrderOf}`}</p>
            <p
              className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
            >{`${account?.addressLine1}, ${account?.addressLine2}`}</p>
            <p
              className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${selected ? 'mercoa-underline' : ''}`}
            >{`${account?.city} ${account?.stateOrProvince}, ${account?.postalCode}`}</p>
          </div>
          {showEdit && (
            <>
              {!hideDefaultIndicator && (
                <div className="mercoa-flex-shrink-0">
                  <DefaultPaymentMethodIndicator paymentMethod={account} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  } else {
    return (
      <PaymentMethodButton
        onSelect={onSelect}
        account={account}
        selected={selected}
        icon={<PlusIcon className="mercoa-size-5" />}
        text="Add new address"
      />
    )
  }
}

export function AddCheckDialog({
  entityId,
  onSelect,
  check,
}: {
  entityId?: Mercoa.EntityId
  onSelect?: Function
  check?: Mercoa.CheckRequest
}) {
  const [showDialog, setShowDialog] = useState(false)

  const onClose = (account?: Mercoa.PaymentMethodResponse) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  return (
    <div className="mercoa-mt-2">
      <AddDialog
        show={showDialog}
        onClose={onClose}
        component={
          <AddCheck
            onSubmit={(data) => {
              onClose(data)
            }}
            entityId={entityId}
            check={check}
          />
        }
      />
      <Check onSelect={() => setShowDialog(true)} />
    </div>
  )
}

export function AddCheck({
  onSubmit,
  title,
  actions,
  check,
  entityId,
}: {
  onSubmit?: (data?: Mercoa.PaymentMethodResponse.Check) => void
  title?: ReactNode
  actions?: ReactNode
  check?: Mercoa.CheckRequest
  entityId?: Mercoa.EntityId
}) {
  const mercoaSession = useMercoaSession()

  const schema = yup
    .object({
      payToTheOrderOf: yup.string().required('Pay To The Order Of is required'),
      addressLine1: yup
        .string()
        .required('Address is required')
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
    })
    .required()

  const methods = useForm({
    defaultValues: check,
    resolver: yupResolver(schema),
  })

  async function submitCheck(check: Mercoa.CheckRequest) {
    if (mercoaSession.entity?.id) {
      check.country = 'US'
      const resp = (await mercoaSession.client?.entity.paymentMethod.create(entityId ?? mercoaSession.entity?.id, {
        ...check,
        type: 'check',
      })) as Mercoa.PaymentMethodResponse.Check
      if (!onSubmit) return
      if (resp) onSubmit(resp)
      else onSubmit()
    }
  }

  if (!mercoaSession.client) return <NoSession componentName="AddCheck" />
  return (
    <FormProvider {...methods}>
      <form className="mercoa-space-y-3 mercoa-text-left" onSubmit={methods.handleSubmit(submitCheck as any)}>
        {title || (
          <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
            Add Check Address
          </h3>
        )}
        <AddCheckForm />
        <div className="mercoa-flex mercoa-justify-end">
          {actions || <MercoaButton isEmphasized>Add Check Address</MercoaButton>}
        </div>
      </form>
    </FormProvider>
  )
}

export function AddCheckForm({ prefix }: { prefix?: string }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()

  if (!prefix) prefix = ''

  const stateOrProvince = watch(prefix + 'stateOrProvince')

  return (
    <div className="mercoa-flex mercoa-flex-col mercoa-gap-y-2">
      <MercoaInput register={register} name={prefix + 'payToTheOrderOf'} label="Pay To The Order Of" errors={errors} />
      <MercoaInput register={register} name={prefix + 'addressLine1'} label="Address Line 1" errors={errors} />
      <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-x-4">
        <MercoaInput register={register} name={prefix + 'addressLine2'} label="Address Line 2" errors={errors} />
        <MercoaInput register={register} name={prefix + 'city'} label="City" errors={errors} />
      </div>
      <div className="mercoa-grid mercoa-grid-cols-2 mercoa-gap-x-4">
        <StateDropdown
          value={stateOrProvince}
          setValue={(value) => {
            setValue(`${prefix}stateOrProvince`, value, { shouldDirty: true })
          }}
          country="US"
        />
        <MercoaInput register={register} name={prefix + 'postalCode'} label="Postal Code" errors={errors} />
      </div>
    </div>
  )
}
