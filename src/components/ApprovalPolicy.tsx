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
import { MetadataSelection } from './InvoiceDetails'
import { useMercoaSession } from './Mercoa'
import { MercoaButton, MercoaCombobox } from './generics'

const nestedBg = ['bg-white', 'bg-gray-50', 'bg-indigo-50', 'bg-green-50', 'bg-yellow-50', 'bg-blue-50']

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
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.user.getAll(mercoaSession.entity.id).then((resp) => {
      if (resp) {
        setUsers(resp)
        setRoles([...new Set(resp.map((user) => user.roles).flat())])
      }
    })
  }, [mercoaSession.entity?.id, mercoaSession.refreshId, mercoaSession.token])

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
          if (data?.id && data?.id.indexOf('~') < 0) {
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
      mercoaSession.refresh()
    } else {
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
      />
      <MercoaButton isEmphasized size="md" className="mt-5">
        Save Rules
      </MercoaButton>
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
}) {
  const policies = fields.filter((e) => e.upstreamPolicyId === upstreamPolicyId)
  return (
    <ul role="list" className={`space-y-6 max-w-[800px] ${nestedBg[level]}`}>
      <li className={`relative flex gap-x-4 ${upstreamPolicyId === 'root' ? '' : 'mt-1'}`}>
        <div className="-bottom-6 absolute left-0 top-0 flex w-6 justify-center">
          <div className="w-px bg-gray-200" />
        </div>
        {upstreamPolicyId === 'root' && (
          <div className={`relative flex h-6 w-6 flex-none items-center justify-center ${nestedBg[level]}`}>
            <RocketLaunchIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
          </div>
        )}
        <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
          <span className="font-medium text-gray-900">
            {upstreamPolicyId === 'root' ? 'When an invoice is sent for approval:' : ''}
          </span>
        </p>
      </li>

      {policies.map((policy, index) => {
        if (policy.trigger.length === 0) return <></>
        return (
          <li key={index} className="relative flex gap-x-4">
            <div className={`-bottom-6 absolute left-0 top-0 flex w-6 justify-center`}>
              <div className="w-px bg-gray-200" />
            </div>
            <div className={`relative flex h-6 w-6 flex-none items-center justify-center ${nestedBg[level]}`}>
              <SparklesIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
            </div>
            <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
              <div className={`font-medium text-gray-900 p-2 pb-5 rounded-md ${nestedBg[level + 1]}`}>
                <div className="grid grid-cols-4 gap-2 p-3 border border-gray-200 rounded-md relative bg-white">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
                    type="button"
                    onClick={() => remove(fields.findIndex((e) => e.id == policy.id))}
                  >
                    <span className="sr-only">Remove</span>
                    <XMarkIcon className="h-5 w-5" />
                  </button>

                  <Trigger
                    control={control}
                    watch={watch}
                    register={register}
                    setValue={setValue}
                    counterparties={counterparties}
                    index={fields.findIndex((e) => e.id == policy.id)}
                    metadata={metadata}
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
                />
                <div className="ml-10">
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
                  />
                </div>
              </div>
            </p>
          </li>
        )
      })}

      <li className="relative flex gap-x-4">
        {upstreamPolicyId === 'root' && (
          <div className="-bottom-6 absolute left-0 top-0 flex w-6 justify-center">
            <div className="w-px bg-gray-200" />
          </div>
        )}
        <div className={`relative flex h-6 w-6 flex-none items-center justify-center ${nestedBg[level]}`}>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
        </div>
        <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
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
          <li className="relative  gap-x-4">
            <div className="flex">
              <div className="-bottom-6 absolute left-0 top-0 flex w-6 justify-center">
                <div className="w-px bg-gray-200" />
              </div>
              <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                <ExclamationTriangleIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
              </div>
              <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500 ml-4">
                <span className="font-medium text-gray-900 ">
                  Always apply the following rule:
                  <div className="mt-1">
                    {formPolicies.filter((e) => e.trigger.length === 0).length === 0 && (
                      <AddRule upstreamPolicyId="root" append={append} trigger={[]} id="fallback" />
                    )}
                  </div>
                </span>
              </p>
            </div>
            {fields.map((policy, index) => {
              if (policy.trigger.length > 0) return <></>
              return (
                <div className="ml-10" key={index}>
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
                  />
                </div>
              )
            })}
          </li>

          <li className="relative flex gap-x-4">
            <div className="h-6 absolute left-0 top-0 flex w-6 justify-center">
              <div className="w-px bg-gray-200" />
            </div>
            <div className={`relative flex h-6 w-6 flex-none items-center justify-center ${nestedBg[level]}`}>
              <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
              <span className="font-medium text-gray-900"> Approve Invoice</span>
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
}: {
  control: any
  watch: any
  register: any
  setValue: any
  counterparties: Mercoa.CounterpartyResponse[]
  index: number
  metadata: Mercoa.EntityMetadataResponse[]
}) {
  const mercoaSession = useMercoaSession()

  const { append, remove, fields } = useFieldArray({
    control,
    name: `policies.${index}.trigger`,
  })

  const triggerWatch = watch(`policies.${index}.trigger`)

  return (
    <>
      <div className="col-span-4 font-medium text-gray-700 mb-1 ">If these conditions are true:</div>
      {fields.map((field, triggerIndex) => {
        const previousTriggers: string[] = triggerWatch.slice(0, triggerIndex).map((t: Mercoa.Trigger) => t.type)
        return (
          <div key={triggerIndex} className="p-3 bg-gray-50 rounded-md col-span-4 flex items-center">
            <span className="text-sm font-medium leading-6 text-gray-900 mr-2">{triggerIndex > 0 ? 'And' : 'If'}</span>
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
                <span className="text-sm font-medium leading-6 text-gray-900 ml-2 mr-2">more than or equal to</span>
                <div className="relative rounded-md shadow-sm inline-block">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">
                      {currencyCodeToSymbol((triggerWatch[triggerIndex] as Mercoa.Trigger.Amount).currency)}
                    </span>
                  </div>
                  <input
                    type="text"
                    {...register(`policies.${index}.trigger.${triggerIndex}.amount`)}
                    className={`block rounded-md border-0 py-1.5 pr-[4.4rem] text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6
                 ${
                   currencyCodeToSymbol((triggerWatch[triggerIndex] as Mercoa.Trigger.Amount).currency).length > 1
                     ? 'pl-12'
                     : 'pl-6'
                 }`}
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <label htmlFor="currency" className="sr-only">
                      Currency
                    </label>
                    <select
                      {...register(`policies.${index}.trigger.${triggerIndex}.currency`)}
                      className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                    >
                      {Object.values(Mercoa.CurrencyCode).map((option: Mercoa.CurrencyCode, index: number) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {triggerWatch[triggerIndex]?.type == 'vendor' && (
              <>
                <span className="text-sm font-medium leading-6 text-gray-900 ml-2 mr-2 w-[100px]">is one of</span>
                <MercoaCombobox
                  className="w-full"
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
                />
              </>
            )}

            {triggerWatch[triggerIndex]?.type == 'metadata' && (
              <>
                <span className="text-sm font-medium leading-6 text-gray-900 ml-2 mr-2">is</span>
                <MetadataSelection
                  lineItem
                  setValue={(value) => {
                    setValue(`policies.${index}.trigger.${triggerIndex}.value`, value, {
                      shouldDirty: true,
                    })
                  }}
                  hasDocument
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
            {triggerIndex !== 0 && (
              <button
                type="button"
                onClick={() => remove(triggerIndex)}
                className="ml-2 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Remove</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )
      })}
      <div className="col-span-4">
        <MercoaButton
          isEmphasized={false}
          size="sm"
          type="button"
          className="flex"
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
          <PlusIcon className="h-4 w-4 mr-1" /> Add Condition
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
    <div className="grid grid-cols-1 gap-2 p-3 border border-gray-200 rounded-md relative mt-5 ml-10 bg-white">
      <ArrowDownLeftIcon className="w-7 h-7 absolute -top-2 -left-10" />
      {noTrigger ? (
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-500" type="button" onClick={remove}>
          <span className="sr-only">Remove</span>
          <XMarkIcon className="h-5 w-5" />
        </button>
      ) : (
        <div className="font-medium text-gray-700">Then:</div>
      )}
      <div className="flex items-center">
        <span className="text-sm font-medium leading-6 text-gray-900 mr-2">Require</span>
        <input
          {...register(`policies.${index}.rule.numApprovers`, { required: true })}
          min="1"
          type="number"
          className={`block rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 w-[50px]`}
        />
        <span className="text-sm font-medium leading-6 text-gray-900 ml-2 mr-2">approvals from the following</span>
        <select
          {...register(`policies.${index}.rule.identifierList.type`, { required: true })}
          className={`block rounded-md border-0 py-1.5 pr-[4.4rem] text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6`}
        >
          <option value={'rolesList'}>roles</option>
          <option value={'userList'}>users</option>
        </select>
      </div>

      <div className="mt-1">
        {ruleIdType === 'rolesList' ? (
          <MercoaCombobox
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
            secondaryDisplayIndex="id"
            multiple
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
      className="flex"
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
      <PlusIcon className="h-4 w-4 mr-1" /> Add Rule
    </MercoaButton>
  )
}
