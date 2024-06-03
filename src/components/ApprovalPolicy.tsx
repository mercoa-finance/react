import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  RocketLaunchIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { currencyCodeToSymbol } from '../lib/currency'
import { MercoaButton, MercoaCombobox, MercoaInput, MetadataSelection, inputClassName, useMercoaSession } from './index'

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

export function ApprovalPolicies() {
  const mercoaSession = useMercoaSession()

  const [policies, setPolicies] = useState<Mercoa.ApprovalPolicyResponse[]>([])
  const [users, setUsers] = useState<Mercoa.EntityUserResponse[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [counterparties, setCounterparties] = useState<Mercoa.CounterpartyResponse[]>([])
  const [metadata, setMetadata] = useState<Mercoa.EntityMetadataResponse[]>([])
  const [isEditing, setIsEditing] = useState(false)

  const { register, handleSubmit, watch, setValue, control, reset } = useForm({
    defaultValues: {
      policies,
    },
  })

  const { append, remove, fields } = useFieldArray({
    control,
    name: 'policies',
  })

  const formPolicies = watch('policies')

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    reset({
      policies,
    })
  }, [policies])

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.approvalPolicy.getAll(mercoaSession.entity.id).then((resp) => {
      if (resp) setPolicies(resp)
    })
  }, [mercoaSession.entity?.id, mercoaSession.refreshId, mercoaSession.token])

  useEffect(() => {
    if (!mercoaSession.users) return
    setUsers(mercoaSession.users)
    setRoles([...new Set(mercoaSession.users.map((user) => user.roles).flat())])
  }, [mercoaSession.users])

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.counterparty
      .findPayees(mercoaSession.entity.id, {
        limit: 100,
      })
      .then((resp) => {
        if (resp) setCounterparties(resp.data)
      })
  }, [mercoaSession.entity?.id, mercoaSession.refreshId, mercoaSession.token])

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.metadata.getAll(mercoaSession.entity.id).then((resp) => {
      if (resp) setMetadata(resp)
    })
  }, [mercoaSession.entity?.id, mercoaSession.refreshId, mercoaSession.token])

  async function onSubmit(data: { policies: Mercoa.ApprovalPolicyResponse[] }) {
    const toasts: { id: string; success: boolean }[] = []

    // Delete policies that are no longer in the form
    await Promise.all(
      policies.map(async (policy) => {
        if (!mercoaSession.entity?.id) return
        if (!data.policies.find((e) => e.id == policy.id)) {
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
      idMap[e.id] = e.id.indexOf('~') ? '' : e.id
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

        if (
          data.rule.identifierList.type === 'userList' &&
          policy.rule.numApprovers > policy.rule.identifierList.value.length
        ) {
          toast(`Error With Rule ${index + 1}: Number of approvers cannot be more than number of users`, {
            type: 'error',
          })
          return
        }

        try {
          let updatedPolicy: Mercoa.ApprovalPolicyResponse | undefined
          if (data?.id && data?.id.indexOf('~') < 0 && data?.id != 'fallback') {
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
    if (toasts.every((e) => e.success)) {
      toast('Approval Policies Saved', {
        type: 'success',
      })
      setIsEditing(false)
      mercoaSession.refresh()
    } else {
      console.error(toasts)
      toast('Error Saving Some Approval Policies', {
        type: 'error',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Level
        level={0}
        fields={formPolicies}
        remove={remove}
        append={append}
        control={control}
        watch={watch}
        register={register}
        setValue={setValue}
        users={users}
        roles={roles}
        counterparties={counterparties}
        metadata={metadata}
        formPolicies={formPolicies}
        upstreamPolicyId="root"
        isEditing={isEditing}
      />
      {isEditing ? (
        <MercoaButton isEmphasized size="md" className="mercoa-mt-5">
          Save Rules
        </MercoaButton>
      ) : (
        <MercoaButton
          isEmphasized={false}
          size="md"
          className="mercoa-mt-5"
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsEditing(true)
          }}
        >
          Edit Rules
        </MercoaButton>
      )}
    </form>
  )
}

function Level({
  level,
  upstreamPolicyId,
  fields,
  remove,
  append,
  control,
  watch,
  register,
  setValue,
  users,
  roles,
  counterparties,
  metadata,
  formPolicies,
  isEditing,
}: {
  level: number
  upstreamPolicyId: string
  fields: Mercoa.ApprovalPolicyResponse[]
  remove: any
  append: any
  control: any
  watch: any
  register: any
  setValue: any
  users: Mercoa.EntityUserResponse[]
  roles: string[]
  counterparties: Mercoa.CounterpartyResponse[]
  metadata: Mercoa.EntityMetadataResponse[]
  formPolicies: Mercoa.ApprovalPolicyResponse[]
  isEditing: boolean
}) {
  const policies = fields.filter((e) => e.upstreamPolicyId === upstreamPolicyId)
  return (
    <ul role="list" className={`mercoa-space-y-6 mercoa-max-w-[800px] ${nestedBg[level]}`}>
      <li className={`mercoa-relative mercoa-flex mercoa-gap-x-4 ${upstreamPolicyId === 'root' ? '' : 'mercoa-mt-1'}`}>
        {(isEditing || policies.length > 0) && (
          <div className="a -mercoa-bottom-6 mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center">
            <div className="mercoa-w-px mercoa-bg-gray-200" />
          </div>
        )}
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
            {isEditing && (
              <div
                className={`-mercoa-bottom-6 mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center`}
              >
                <div className="mercoa-w-px mercoa-bg-gray-200" />
              </div>
            )}
            <div
              className={`mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center ${nestedBg[level]}`}
            >
              <SparklesIcon className="mercoa-size-5 mercoa-text-gray-300" aria-hidden="true" />
            </div>
            <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
              <div
                className={`font-medium mercoa-text-gray-900 mercoa-p-2 mercoa-pb-5 mercoa-rounded-md ${
                  nestedBg[level + 1]
                }`}
              >
                <div className="mercoa-grid mercoa-grid-cols-4 mercoa-gap-2 mercoa-p-3 mercoa-border mercoa-border-gray-200 mercoa-rounded-md mercoa-relative mercoa-bg-white">
                  {isEditing && (
                    <button
                      className="mercoa-absolute mercoa-top-2 mercoa-right-2 mercoa-text-gray-400 hover:mercoa-text-gray-500"
                      type="button"
                      onClick={() => remove(fields.findIndex((e) => e.id == policy.id))}
                    >
                      <span className="mercoa-sr-only">Remove</span>
                      <XMarkIcon className="mercoa-size-5" />
                    </button>
                  )}

                  <Trigger
                    control={control}
                    watch={watch}
                    register={register}
                    setValue={setValue}
                    counterparties={counterparties}
                    index={fields.findIndex((e) => e.id == policy.id)}
                    metadata={metadata}
                    isEditing={isEditing}
                  />
                </div>
                <Rule
                  watch={watch}
                  register={register}
                  setValue={setValue}
                  users={users}
                  roles={roles}
                  index={fields.findIndex((e) => e.id == policy.id)}
                  remove={() => remove(fields.findIndex((e) => e.id == policy.id))}
                  isEditing={isEditing}
                />
                <div className="mercoa-ml-10">
                  <Level
                    level={level + 1}
                    fields={formPolicies}
                    remove={remove}
                    append={append}
                    control={control}
                    watch={watch}
                    register={register}
                    setValue={setValue}
                    users={users}
                    roles={roles}
                    counterparties={counterparties}
                    metadata={metadata}
                    formPolicies={formPolicies}
                    upstreamPolicyId={policy.id}
                    isEditing={isEditing}
                  />
                </div>
              </div>
            </p>
          </li>
        )
      })}

      {isEditing && (
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
      )}

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
                  Always apply the following rule:
                  <div className="mercoa-mt-1">
                    {isEditing && formPolicies.filter((e) => e.trigger.length === 0).length === 0 && (
                      <AddRule upstreamPolicyId="root" append={append} trigger={[]} id="fallback" />
                    )}
                  </div>
                </span>
              </p>
            </div>
            {fields.map((policy, index) => {
              if (policy.trigger.length > 0) return <></>
              return (
                <div className="mercoa-ml-10" key={index}>
                  <Rule
                    key={fields.findIndex((e) => e.id == policy.id)}
                    watch={watch}
                    register={register}
                    setValue={setValue}
                    users={users}
                    roles={roles}
                    index={fields.findIndex((e) => e.id == policy.id)}
                    noTrigger
                    remove={() => remove(fields.findIndex((e) => e.id == policy.id))}
                    isEditing={isEditing}
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
  metadata,
  isEditing,
}: {
  control: any
  watch: any
  register: any
  setValue: any
  counterparties: Mercoa.CounterpartyResponse[]
  index: number
  metadata: Mercoa.EntityMetadataResponse[]
  isEditing: boolean
}) {
  const mercoaSession = useMercoaSession()

  const { append, remove, fields } = useFieldArray({
    control,
    name: `policies.${index}.trigger`,
  })

  const triggerWatch = watch(`policies.${index}.trigger`)

  return (
    <>
      <div className="mercoa-col-span-4 mercoa-font-medium mercoa-text-gray-700 mercoa-mb-1">
        If these conditions are true:
      </div>
      {fields.map((field, triggerIndex) => {
        const previousTriggers: string[] = triggerWatch.slice(0, triggerIndex).map((t: Mercoa.Trigger) => t.type)
        return (
          <div
            key={triggerIndex}
            className="mercoa-p-3 mercoa-bg-gray-50 mercoa-rounded-md mercoa-col-span-4 mercoa-flex mercoa-items-center"
          >
            <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-mr-2">
              {triggerIndex > 0 ? 'And' : 'If'}
            </span>
            <MercoaCombobox
              readOnly={!isEditing}
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
                if (triggerWatch[triggerIndex]?.type === 'amount')
                  return {
                    displayName: 'Amount',
                    key: '~mercoa~amount',
                  }
                if (triggerWatch[triggerIndex]?.type === 'vendor')
                  return {
                    displayName: 'Vendor',
                    key: '~mercoa~vendor',
                  }
                return mercoaSession.organization?.metadataSchema?.find((e) => e.key == triggerWatch[triggerIndex]?.key)
              }}
              displayIndex="displayName"
            />
            {triggerWatch[triggerIndex]?.type == 'amount' && (
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
                        className="mercoa-h-full mercoa-rounded-md mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
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

            {triggerWatch[triggerIndex]?.type == 'vendor' && (
              <>
                <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2 mercoa-w-[100px]">
                  is one of
                </span>
                <MercoaCombobox
                  readOnly={!isEditing}
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
                  value={counterparties.filter((e) => triggerWatch[triggerIndex]?.vendorIds?.includes(e.id))}
                  displayIndex="name"
                  multiple
                  displaySelectedAs="pill"
                />
              </>
            )}

            {triggerWatch[triggerIndex]?.type == 'metadata' && (
              <>
                <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2">
                  is
                </span>
                <MetadataSelection
                  lineItem
                  setValue={(value) => {
                    setValue(`policies.${index}.trigger.${triggerIndex}.value`, value, {
                      shouldDirty: true,
                    })
                  }}
                  hasDocument
                  hasNoLineItems
                  skipValidation
                  value={watch(`policies.${index}.trigger.${triggerIndex}.value`)}
                  entityMetadata={metadata.find(
                    (e) => e.key === watch(`policies.${index}.trigger.${triggerIndex}.key`),
                  )}
                  schema={
                    mercoaSession.organization?.metadataSchema?.find(
                      (e) => e.key === watch(`policies.${index}.trigger.${triggerIndex}.key`),
                    ) ?? { key: '', displayName: '', type: 'STRING' }
                  }
                />
              </>
            )}
            {triggerIndex !== 0 && isEditing && (
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
      {isEditing && (
        <div className="mercoa-col-span-4">
          <MercoaButton
            isEmphasized={false}
            size="sm"
            type="button"
            className="mercoa-flex"
            onClick={() => {
              console.log({ triggerWatch })
              if (triggerWatch.every((e: { type: string }) => e.type != 'amount')) {
                append({
                  type: 'amount',
                  amount: 100,
                  currency: Mercoa.CurrencyCode.Usd,
                })
              } else if (triggerWatch.every((e: { type: string }) => e.type != 'vendor')) {
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
      )}
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
  isEditing,
}: {
  watch: any
  register: any
  setValue: any
  users: Mercoa.EntityUserResponse[]
  roles: string[]
  index: number
  remove: () => void
  noTrigger?: boolean
  isEditing: boolean
}) {
  const [firstRender, setFirstRender] = useState(true)

  const ruleIdType = watch(`policies.${index}.rule.identifierList.type`)

  useEffect(() => {
    if (!firstRender) {
      setValue(`policies.${index}.rule.type`, 'approver')
      setValue(`policies.${index}.rule.identifierList.value`, [])
    }
    setFirstRender(false)
  }, [ruleIdType])

  return (
    <div className="mercoa-grid mercoa-grid-cols-1 mercoa-gap-2 mercoa-p-3 mercoa-border mercoa-border-gray-200 mercoa-rounded-md mercoa-relative mercoa-mt-5 mercoa-ml-10 mercoa-bg-white">
      <ArrowDownLeftIcon className="mercoa-w-7 mercoa-h-7 mercoa-absolute -mercoa-top-2 -mercoa-left-10" />
      {noTrigger && isEditing ? (
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
            readOnly={!isEditing}
          />
        </div>
        <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2">
          approvals from the following
        </span>
        <div className="mercoa-w-[100px]">
          <select
            {...register(`policies.${index}.rule.identifierList.type`, { required: true })}
            className={`${inputClassName({})}`}
            readOnly={!isEditing}
          >
            <option value={'rolesList'}>roles</option>
            <option value={'userList'}>users</option>
          </select>
        </div>
      </div>

      <div className="mercoa-mt-1">
        {ruleIdType === 'rolesList' ? (
          <MercoaCombobox
            readOnly={!isEditing}
            options={roles.map((e) => ({
              disabled: false,
              value: e,
            }))}
            onChange={(e: string[]) => {
              if (e.length == 0) return
              setValue(
                `policies.${index}.rule.identifierList.value`,
                e.filter((e) => e),
                {
                  shouldDirty: true,
                },
              )
            }}
            value={watch(`policies.${index}.rule.identifierList.value`)}
            multiple
            displaySelectedAs="pill"
          />
        ) : (
          <MercoaCombobox
            readOnly={!isEditing}
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
