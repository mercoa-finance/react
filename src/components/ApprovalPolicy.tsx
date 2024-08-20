import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  RocketLaunchIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { currencyCodeToSymbol } from '../lib/currency'
import {
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  MercoaInput,
  MetadataSelection,
  NoSession,
  inputClassName,
  useMercoaSession,
} from './index'

const nestedBg = [
  'mercoa-bg-white',
  'mercoa-bg-gray-50',
  'mercoa-bg-indigo-50',
  'mercoa-bg-green-50',
  'mercoa-bg-yellow-50',
  'mercoa-bg-blue-50',
]

function ArrowDownLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" fill="#999999">
      <path d="m210.828 178.829-48 48a4 4 0 0 1-5.656-5.658L198.342 180H64a4 4 0 0 1-4-4V32a4 4 0 0 1 8 0v140h130.343l-41.171-41.171a4 4 0 0 1 5.656-5.658l48 48a4.028 4.028 0 0 1 .499.61c.065.099.11.205.166.307a3.971 3.971 0 0 1 .201.382 3.92 3.92 0 0 1 .126.406c.034.114.078.223.1.34a4.01 4.01 0 0 1 0 1.567c-.022.118-.066.227-.1.34a3.902 3.902 0 0 1-.126.407 3.945 3.945 0 0 1-.2.382c-.057.102-.102.208-.167.306a4.028 4.028 0 0 1-.499.61Z" />
    </svg>
  )
}

export function ApprovalPolicies({ onSave }: { onSave?: () => void }) {
  const mercoaSession = useMercoaSession()

  const [policies, setPolicies] = useState<Mercoa.ApprovalPolicyResponse[]>()
  const [counterparties, setCounterparties] = useState<Mercoa.CounterpartyResponse[]>()
  const [isSaving, setIsSaving] = useState(false)

  const roles = useMemo(() => [...new Set(mercoaSession.users.map((user) => user.roles).flat())], [mercoaSession.users])

  const methods = useForm({
    defaultValues: {
      policies: policies ?? [],
    },
  })

  const { register, handleSubmit, watch, setValue, control, reset } = methods

  const { append, remove } = useFieldArray({
    control,
    name: 'policies',
  })

  const formPolicies = watch('policies')

  async function getPolicies() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.entity.approvalPolicy.getAll(mercoaSession.entity.id)
    if (resp) {
      setPolicies(resp)
      reset({
        policies: resp,
      })
    }
  }

  async function getCounterparties() {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    const resp = await mercoaSession.client?.entity.counterparty.findPayees(mercoaSession.entity.id, {
      limit: 100,
    })
    if (resp) setCounterparties(resp.data)
  }

  useEffect(() => {
    getPolicies()
    getCounterparties()
  }, [mercoaSession.entity?.id, mercoaSession.token])

  async function onSubmit(data: { policies: Mercoa.ApprovalPolicyResponse[] }) {
    if (isSaving || !policies) return
    setIsSaving(true)
    const toasts: { id: string; success: boolean }[] = []

    const validRules = data.policies.every((policy, index) => {
      if (policy.rule.identifierList.value.filter((e) => e).length < 1) {
        toast(`Error With Rule ${index + 1}: Number of approvers cannot be less than 1`, {
          type: 'error',
        })
        return false
      }

      if (
        policy.rule.identifierList.type === 'userList' &&
        policy.rule.numApprovers > policy.rule.identifierList.value.length
      ) {
        toast(`Error With Rule ${index + 1}: Number of approvers cannot be more than number of users`, {
          type: 'error',
        })
        return false
      }
      return true
    })

    if (!validRules) {
      setIsSaving(false)
      return
    }

    // Delete policies that are no longer in the form
    await Promise.all(
      policies.map(async (policy) => {
        if (!mercoaSession.entity?.id) return
        if (!data.policies.find((e) => e.id === policy.id)) {
          try {
            await mercoaSession.client?.entity.approvalPolicy.delete(mercoaSession.entity.id, policy.id)
            toasts.push({ id: policy.id, success: true })
          } catch (e: any) {
            console.log(e)
            toasts.push({ id: policy.id, success: false })
          }
        }
      }),
    )

    // Create mapping between temp ids and new ids
    const idMap: { [key: string]: string } = {
      root: 'root',
    }
    data.policies.forEach((e) => {
      idMap[e.id] = e.id.includes('~') ? '' : e.id
    })

    await Promise.all(
      data.policies.map(async (data, index) => {
        if (!mercoaSession.entity?.id) return
        const trigger: Mercoa.Trigger[] = data.trigger.map((t) => {
          if (t.type == 'amount') {
            return {
              type: t.type,
              amount: Number(t.amount),
              currency: t.currency,
            }
          } else if (t.type == 'vendor') {
            return {
              type: t.type,
              vendorIds: t.vendorIds,
            }
          } else if (t.type == 'metadata') {
            return {
              type: t.type,
              key: t.key,
              value: t.value,
            }
          } else {
            return t
          }
        })

        // Wait for upstream policy to be created if it doesn't exist yet
        let upstreamPolicyId = idMap[data.upstreamPolicyId]
        while (!upstreamPolicyId) {
          await new Promise((r) => setTimeout(r, 100))
          upstreamPolicyId = idMap[data.upstreamPolicyId]
        }

        const policy: Mercoa.ApprovalPolicyRequest = {
          upstreamPolicyId,
          trigger,
          rule: {
            type: data.rule.type,
            numApprovers: Number(data.rule.numApprovers),
            identifierList: {
              type: data.rule.identifierList.type,
              value: data.rule.identifierList.value,
            },
          },
        }

        try {
          let updatedPolicy: Mercoa.ApprovalPolicyResponse | undefined
          if (data?.id && data?.id.indexOf('~') < 0 && !data?.id.startsWith('fallback')) {
            updatedPolicy = await mercoaSession.client?.entity.approvalPolicy.update(
              mercoaSession.entity.id,
              data.id,
              policy,
            )
          } else {
            updatedPolicy = await mercoaSession.client?.entity.approvalPolicy.create(mercoaSession.entity.id, policy)
          }
          idMap[data.id] = updatedPolicy?.id ?? ''
          toasts.push({ id: data.id, success: true })
        } catch (e: any) {
          console.log(e)
          toasts.push({ id: data.id, success: false })
        }
      }),
    )
    await getPolicies()
    if (toasts.every((e) => e.success)) {
      toast('Approval Policies Saved', {
        type: 'success',
      })
      if (onSave) onSave()
    } else {
      console.error(toasts)
      toast('Error Saving Some Approval Policies', {
        type: 'error',
      })
    }
    setIsSaving(false)
  }

  if (!mercoaSession.client) return <NoSession componentName="ApprovalPolicies" />

  if (!policies || !counterparties || !formPolicies) return <LoadingSpinnerIcon />

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Level
          level={0}
          remove={remove}
          append={append}
          control={control}
          watch={watch}
          register={register}
          setValue={setValue}
          users={mercoaSession.users}
          roles={roles}
          counterparties={counterparties}
          formPolicies={formPolicies}
          upstreamPolicyId="root"
        />
        <MercoaButton isEmphasized size="md" className="mercoa-mt-5" disabled={isSaving}>
          Save Rules
        </MercoaButton>
      </form>
    </FormProvider>
  )
}

function Level({
  level,
  upstreamPolicyId,
  remove,
  append,
  control,
  watch,
  register,
  setValue,
  users,
  roles,
  counterparties,
  formPolicies,
}: {
  level: number
  upstreamPolicyId: string
  remove: any
  append: any
  control: any
  watch: any
  register: any
  setValue: any
  users: Mercoa.EntityUserResponse[]
  roles: string[]
  counterparties: Mercoa.CounterpartyResponse[]
  formPolicies: Mercoa.ApprovalPolicyResponse[]
}) {
  const policies = formPolicies.filter((e) => e.upstreamPolicyId === upstreamPolicyId)
  return (
    <ul role="list" className={`mercoa-space-y-6 mercoa-max-w-[800px] ${nestedBg[level]}`}>
      <li className={`mercoa-relative mercoa-flex mercoa-gap-x-4 ${upstreamPolicyId === 'root' ? '' : 'mercoa-mt-1'}`}>
        <div className="a -mercoa-bottom-6 mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center">
          <div className="mercoa-w-px mercoa-bg-gray-200" />
        </div>
        {upstreamPolicyId === 'root' && (
          <div
            className={`mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center ${nestedBg[level]}`}
          >
            <RocketLaunchIcon className="mercoa-size-5 mercoa-text-gray-300" aria-hidden="true" />
          </div>
        )}
        <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
          <span className="mercoa-font-medium mercoa-text-gray-900">
            {upstreamPolicyId === 'root' ? 'When an invoice is sent for approval:' : ''}
          </span>
        </p>
      </li>

      {policies.map((policy, index) => {
        if (policy.trigger.length === 0) return <></>
        return (
          <li key={index} className="mercoa-relative mercoa-flex mercoa-gap-x-4">
            <div
              className={`-mercoa-bottom-6 mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center`}
            >
              <div className="mercoa-w-px mercoa-bg-gray-200" />
            </div>
            <div
              className={`mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center ${nestedBg[level]}`}
            >
              <SparklesIcon className="mercoa-size-5 mercoa-text-gray-300" aria-hidden="true" />
            </div>
            <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
              <div
                className={`font-medium mercoa-text-gray-900 mercoa-p-2 mercoa-pb-5 mercoa-rounded-mercoa ${
                  nestedBg[level + 1]
                }`}
              >
                <div className="mercoa-grid mercoa-grid-cols-4 mercoa-gap-2 mercoa-p-3 mercoa-border mercoa-border-gray-200 mercoa-rounded-mercoa mercoa-relative mercoa-bg-white">
                  <button
                    className="mercoa-absolute mercoa-top-2 mercoa-right-2 mercoa-text-gray-400 hover:mercoa-text-gray-500"
                    type="button"
                    onClick={() => remove(formPolicies.findIndex((e) => e.id == policy.id))}
                  >
                    <span className="mercoa-sr-only">Remove</span>
                    <XMarkIcon className="mercoa-size-5" />
                  </button>

                  <Trigger
                    control={control}
                    watch={watch}
                    register={register}
                    setValue={setValue}
                    counterparties={counterparties}
                    index={formPolicies.findIndex((e) => e.id == policy.id)}
                  />
                </div>
                <Rule
                  watch={watch}
                  register={register}
                  setValue={setValue}
                  users={users}
                  roles={roles}
                  index={formPolicies.findIndex((e) => e.id == policy.id)}
                  remove={() => remove(formPolicies.findIndex((e) => e.id == policy.id))}
                />
                <div className="mercoa-ml-10">
                  <Level
                    level={level + 1}
                    remove={remove}
                    append={append}
                    control={control}
                    watch={watch}
                    register={register}
                    setValue={setValue}
                    users={users}
                    roles={roles}
                    counterparties={counterparties}
                    formPolicies={formPolicies}
                    upstreamPolicyId={policy.id}
                  />
                </div>
              </div>
            </p>
          </li>
        )
      })}

      <li className="mercoa-relative mercoa-flex mercoa-gap-x-4">
        {upstreamPolicyId === 'root' && (
          <div className="-mercoa-bottom-6 mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center">
            <div className="mercoa-w-px mercoa-bg-gray-200" />
          </div>
        )}
        <div
          className={`mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center ${nestedBg[level]}`}
        >
          <div className="mercoa-h-1.5 mercoa-w-1.5 mercoa-rounded-full mercoa-bg-gray-100 mercoa-ring-1 mercoa-ring-gray-300" />
        </div>
        <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
          <AddRule
            id={upstreamPolicyId + '~' + policies.length}
            upstreamPolicyId={upstreamPolicyId}
            append={append}
            trigger={[{ type: 'amount', amount: 100, currency: Mercoa.CurrencyCode.Usd }]}
          />
        </p>
      </li>

      {upstreamPolicyId === 'root' && (
        <>
          <li className="mercoa-relative  mercoa-gap-x-4">
            <div className="mercoa-flex">
              <div className="-mercoa-bottom-6 mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center">
                <div className="mercoa-w-px mercoa-bg-gray-200" />
              </div>
              <div className="mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center mercoa-bg-white">
                <ExclamationTriangleIcon className="mercoa-size-5 mercoa-text-gray-300" aria-hidden="true" />
              </div>
              <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500 mercoa-ml-4">
                <span className="mercoa-font-medium mercoa-text-gray-900 ">
                  Always apply the following rules:
                  <div className="mercoa-mt-1">
                    <AddRule upstreamPolicyId="root" append={append} trigger={[]} id={'fallback-' + Math.random()} />
                  </div>
                </span>
              </p>
            </div>
            {formPolicies.map((policy, index) => {
              if (policy.trigger.length > 0) return <></>
              return (
                <div className="mercoa-ml-10" key={index}>
                  <Rule
                    key={formPolicies.findIndex((e) => e.id == policy.id)}
                    watch={watch}
                    register={register}
                    setValue={setValue}
                    users={users}
                    roles={roles}
                    index={formPolicies.findIndex((e) => e.id == policy.id)}
                    noTrigger
                    remove={() => remove(formPolicies.findIndex((e) => e.id == policy.id))}
                  />
                </div>
              )
            })}
          </li>

          <li className="mercoa-relative mercoa-flex mercoa-gap-x-4">
            <div className="mercoa-h-6 mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center">
              <div className="mercoa-w-px mercoa-bg-gray-200" />
            </div>
            <div
              className={`mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center ${nestedBg[level]}`}
            >
              <CheckCircleIcon className="mercoa-size-5 mercoa-text-green-400" aria-hidden="true" />
            </div>
            <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
              <span className="mercoa-font-medium mercoa-text-gray-900"> Approve Invoice</span>
            </p>
          </li>
        </>
      )}
    </ul>
  )
}

function Trigger({
  control,
  watch,
  register,
  setValue,
  counterparties,
  index,
}: {
  control: any
  watch: any
  register: any
  setValue: any
  counterparties: Mercoa.CounterpartyResponse[]
  index: number
}) {
  const mercoaSession = useMercoaSession()
  const trigger = `policies.${index}.trigger`

  const { append, remove, fields } = useFieldArray({
    control,
    name: trigger,
  })

  const triggerWatch = watch(trigger) as Mercoa.Trigger[] | undefined | Array<undefined>

  mercoaSession.debug({ render: true, triggerWatch })

  return (
    <>
      <div className="mercoa-col-span-4 mercoa-font-medium mercoa-text-gray-700 mercoa-mb-1">
        If these conditions are true:
      </div>
      {fields.map((field, triggerIndex) => {
        const previousTriggers: string[] = triggerWatch?.slice(0, triggerIndex).map((t) => t?.type ?? '') ?? []
        return (
          <div
            key={triggerIndex}
            className="mercoa-p-3 mercoa-bg-gray-50 mercoa-rounded-mercoa mercoa-col-span-4 mercoa-flex mercoa-items-center"
          >
            <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-mr-2">
              {triggerIndex > 0 ? 'And' : 'If'}
            </span>
            <MercoaCombobox
              options={[
                ...(previousTriggers.every((e) => e != 'amount')
                  ? [
                      {
                        displayName: 'Amount',
                        key: '~mercoa~amount',
                      },
                    ]
                  : []),
                ...(previousTriggers.every((e) => e != 'vendor')
                  ? [
                      {
                        displayName: 'Vendor',
                        key: '~mercoa~vendor',
                      },
                    ]
                  : []),
                ...(mercoaSession.organization?.metadataSchema ?? []),
              ]?.map((e) => ({
                disabled: false,
                value: e,
              }))}
              onChange={(e: Mercoa.MetadataSchema) => {
                setValue(`policies.${index}.trigger.${triggerIndex}`, undefined, {
                  shouldDirty: true,
                })
                if (e.key == '~mercoa~amount') {
                  setValue(`policies.${index}.trigger.${triggerIndex}.type`, 'amount', {
                    shouldDirty: true,
                  })
                } else if (e.key == '~mercoa~vendor') {
                  setValue(`policies.${index}.trigger.${triggerIndex}.type`, 'vendor', {
                    shouldDirty: true,
                  })
                } else {
                  setValue(`policies.${index}.trigger.${triggerIndex}.type`, 'metadata', {
                    shouldDirty: true,
                  })
                  setValue(`policies.${index}.trigger.${triggerIndex}.key`, e.key, {
                    shouldDirty: true,
                  })
                  setValue(`policies.${index}.trigger.${triggerIndex}.value`, '', {
                    shouldDirty: true,
                  })
                }
              }}
              value={() => {
                if (triggerWatch?.[triggerIndex]?.type === 'amount') {
                  return {
                    displayName: 'Amount',
                    key: '~mercoa~amount',
                  }
                } else if (triggerWatch?.[triggerIndex]?.type === 'vendor') {
                  return {
                    displayName: 'Vendor',
                    key: '~mercoa~vendor',
                  }
                } else if (triggerWatch?.[triggerIndex]?.type === 'metadata') {
                  return mercoaSession.organization?.metadataSchema?.find(
                    (e) => e.key == (triggerWatch?.[triggerIndex] as Mercoa.Trigger.Metadata)?.key,
                  )
                } else {
                  return {
                    displayName: 'Amount',
                    key: '~mercoa~amount',
                  }
                }
              }}
              displayIndex="displayName"
            />
            {triggerWatch?.[triggerIndex]?.type === 'amount' && (
              <>
                <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2">
                  more than or equal to
                </span>
                <MercoaInput
                  leadingIcon={
                    <span className="mercoa-text-gray-500 sm:mercoa-text-sm">
                      {currencyCodeToSymbol((triggerWatch[triggerIndex] as Mercoa.Trigger.Amount).currency)}
                    </span>
                  }
                  name={`policies.${index}.trigger.${triggerIndex}.amount`}
                  register={register}
                  trailingIcon={
                    <>
                      <label htmlFor="currency" className="mercoa-sr-only">
                        Currency
                      </label>
                      <select
                        {...register(`policies.${index}.trigger.${triggerIndex}.currency`)}
                        className="mercoa-h-full mercoa-rounded-mercoa mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                      >
                        {Object.values(Mercoa.CurrencyCode).map((option: Mercoa.CurrencyCode, index: number) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </>
                  }
                />
              </>
            )}

            {triggerWatch?.[triggerIndex]?.type === 'vendor' && (
              <>
                <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2 mercoa-w-[100px]">
                  is one of
                </span>
                <MercoaCombobox
                  className="mercoa-w-full"
                  options={counterparties?.map((e) => ({
                    disabled: false,
                    value: e,
                  }))}
                  onChange={(e: Mercoa.CounterpartyResponse[]) => {
                    if (e.length == 0) return
                    setValue(
                      `policies.${index}.trigger.${triggerIndex}.vendorIds`,
                      e.filter((e) => e).map((e) => e.id),
                      {
                        shouldDirty: true,
                      },
                    )
                  }}
                  value={counterparties.filter((e) =>
                    (triggerWatch[triggerIndex] as Mercoa.Trigger.Vendor)?.vendorIds?.includes(e.id),
                  )}
                  displayIndex="name"
                  multiple
                  displaySelectedAs="pill"
                />
              </>
            )}

            {triggerWatch?.[triggerIndex]?.type === 'metadata' && (
              <>
                <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2">
                  is
                </span>
                <MetadataSelection
                  hideLabel
                  field={`policies.${index}.trigger.${triggerIndex}.value`}
                  skipValidation
                  schema={
                    mercoaSession.organization?.metadataSchema?.find(
                      (e) => e.key === (triggerWatch[triggerIndex] as Mercoa.Trigger.Metadata)?.key,
                    ) ?? { key: '', displayName: '', type: 'STRING' }
                  }
                />
              </>
            )}
            {triggerIndex !== 0 && (
              <button
                type="button"
                onClick={() => remove(triggerIndex)}
                className="mercoa-ml-2 mercoa-text-gray-400 hover:mercoa-text-gray-500"
              >
                <span className="mercoa-sr-only">Remove</span>
                <XMarkIcon className="mercoa-size-5" />
              </button>
            )}
          </div>
        )
      })}

      <div className="mercoa-col-span-4">
        <MercoaButton
          isEmphasized={false}
          size="sm"
          type="button"
          className="mercoa-flex"
          onClick={() => {
            mercoaSession.debug({ onClick: true, triggerWatch })
            if (
              triggerWatch &&
              Array.isArray(triggerWatch) &&
              (triggerWatch as Mercoa.Trigger[]).filter((e) => e).every((e) => e?.type != 'amount')
            ) {
              append({
                type: 'amount',
                amount: 100,
                currency: Mercoa.CurrencyCode.Usd,
              })
            } else if (
              triggerWatch &&
              Array.isArray(triggerWatch) &&
              (triggerWatch as Mercoa.Trigger[]).filter((e) => e).every((e) => e?.type != 'vendor')
            ) {
              append({
                type: 'vendor',
                vendorIds: [],
              })
            } else {
              append({})
            }
          }}
        >
          <PlusIcon className="mercoa-size-4 mercoa-mr-1" /> Add Condition
        </MercoaButton>
      </div>
    </>
  )
}

function Rule({
  watch,
  register,
  setValue,
  users,
  roles,
  index,
  remove,
  noTrigger,
}: {
  watch: any
  register: any
  setValue: any
  users: Mercoa.EntityUserResponse[]
  roles: string[]
  index: number
  remove: () => void
  noTrigger?: boolean
}) {
  const [ruleIdType, setRuleIdType] = useState('rolesList')

  const ruleIdTypeWatch = watch(`policies.${index}.rule.identifierList.type`)

  const listValueName = `policies.${index}.rule.identifierList.value`
  const listValue = watch(listValueName)

  useEffect(() => {
    if (ruleIdTypeWatch === 'rolesList' && listValue?.[0]?.startsWith('user_')) {
      setValue(listValueName, [])
    } else if (ruleIdTypeWatch === 'userList' && !listValue?.[0]?.startsWith('user_')) {
      setValue(listValueName, [])
    }
    setTimeout(() => {
      setRuleIdType(ruleIdTypeWatch)
    }, 10)
  }, [ruleIdTypeWatch])

  return (
    <div className="mercoa-grid mercoa-grid-cols-1 mercoa-gap-2 mercoa-p-3 mercoa-border mercoa-border-gray-200 mercoa-rounded-mercoa mercoa-relative mercoa-mt-5 mercoa-ml-10 mercoa-bg-white">
      <ArrowDownLeftIcon className="mercoa-w-7 mercoa-h-7 mercoa-absolute -mercoa-top-2 -mercoa-left-10" />
      {noTrigger ? (
        <button
          className="mercoa-absolute mercoa-top-2 mercoa-right-2 mercoa-text-gray-400 hover:mercoa-text-gray-500"
          type="button"
          onClick={remove}
        >
          <span className="mercoa-sr-only">Remove</span>
          <XMarkIcon className="mercoa-size-5" />
        </button>
      ) : (
        <div className="mercoa-font-medium mercoa-text-gray-700">Then:</div>
      )}
      <div className="mercoa-flex mercoa-items-center">
        <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-mr-2">
          Require
        </span>
        <div className="mercoa-w-[50px]">
          <input
            {...register(`policies.${index}.rule.numApprovers`, { required: true })}
            min="1"
            type="number"
            className={`${inputClassName({})}`}
          />
        </div>
        <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2">
          approvals from the following
        </span>
        <div className="mercoa-w-[100px]">
          <select
            {...register(`policies.${index}.rule.identifierList.type`, { required: true })}
            className={`${inputClassName({})}`}
          >
            <option value={'rolesList'}>roles</option>
            <option value={'userList'}>users</option>
          </select>
        </div>
      </div>

      <div className="mercoa-mt-1">
        {ruleIdType === 'rolesList' ? (
          <MercoaCombobox
            options={roles.map((e) => ({
              disabled: false,
              value: e,
            }))}
            onChange={(e: string[]) => {
              if (e.length == 0) return
              setValue(
                listValueName,
                e.filter((e) => e),
                {
                  shouldDirty: true,
                },
              )
            }}
            value={listValue}
            multiple
            displaySelectedAs="pill"
          />
        ) : (
          <MercoaCombobox
            options={users.map((e) => ({
              disabled: false,
              value: e,
            }))}
            onChange={(e: Mercoa.EntityUserResponse[]) => {
              if (e.length == 0) return
              setValue(
                `policies.${index}.rule.identifierList.value`,
                e.filter((e) => e).map((e) => e.id),
                {
                  shouldDirty: true,
                },
              )
            }}
            value={watch(`policies.${index}.rule.identifierList.value`)?.map((v: string) =>
              users.find((u) => u.id == v.trim()),
            )}
            displayIndex="name"
            secondaryDisplayIndex="email"
            multiple
            displaySelectedAs="pill"
          />
        )}
      </div>
    </div>
  )
}

function AddRule({
  id,
  upstreamPolicyId,
  append,
  trigger,
}: {
  id: string
  upstreamPolicyId: string
  append: any
  trigger: Mercoa.Trigger[]
}) {
  return (
    <MercoaButton
      isEmphasized
      size="sm"
      type="button"
      className="mercoa-flex"
      onClick={() => {
        append({
          id,
          upstreamPolicyId,
          trigger,
          rule: {
            type: 'approver',
            numApprovers: 1,
            identifierList: {
              type: 'rolesList',
              value: [''],
            },
          },
        })
      }}
    >
      <PlusIcon className="mercoa-size-4 mercoa-mr-1" /> Add Rule
    </MercoaButton>
  )
}
