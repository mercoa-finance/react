import { Combobox } from '@headlessui/react'
import {
  CheckCircleIcon,
  ChevronUpDownIcon,
  PlusIcon,
  RocketLaunchIcon,
  SparklesIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import accounting from 'accounting'
import debounce from 'lodash/debounce'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../lib/currency'
import {
  LoadingSpinnerIcon,
  MercoaButton,
  MercoaCombobox,
  MercoaInput,
  MercoaSwitch,
  MetadataSelectionV1,
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

export function ApprovalPolicies({
  onSave,
  additionalRoles,
  restrictedRoles,
  maxRules,
  supportedCurrencies,
  allowAutoAssign = true,
}: {
  onSave?: () => void
  additionalRoles?: string[]
  restrictedRoles?: string[]
  maxRules?: number
  supportedCurrencies?: Mercoa.CurrencyCode[]
  allowAutoAssign?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [policies, setPolicies] = useState<Mercoa.ApprovalPolicyResponse[]>()
  const [isSaving, setIsSaving] = useState(false)

  const roles = useMemo(
    () =>
      [...new Set([...mercoaSession.users.map((user) => user.roles).flat(), ...(additionalRoles ?? [])])].filter(
        (role) => !restrictedRoles?.includes(role),
      ),
    [mercoaSession.users, additionalRoles, restrictedRoles],
  )

  const users = useMemo(
    () => mercoaSession.users.filter((user) => !restrictedRoles?.some((role) => user.roles.includes(role))),
    [mercoaSession.users, restrictedRoles],
  )

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

  useEffect(() => {
    getPolicies()
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
            autoAssign: data.rule.autoAssign,
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

  if (!policies || !formPolicies) return <LoadingSpinnerIcon />

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
          users={users}
          roles={roles}
          formPolicies={formPolicies}
          upstreamPolicyId="root"
          allowAutoAssign={allowAutoAssign}
          maxRules={maxRules}
          supportedCurrencies={supportedCurrencies}
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
  formPolicies,
  isFullyCollapsed,
  allowAutoAssign,
  maxRules,
  supportedCurrencies,
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
  formPolicies: Mercoa.ApprovalPolicyResponse[]
  isFullyCollapsed?: boolean
  allowAutoAssign?: boolean
  maxRules?: number
  supportedCurrencies?: Mercoa.CurrencyCode[]
}) {
  const [collapsedPolicyIds, setCollapsedPolicyIds] = useState<string[]>([])
  const policies = formPolicies.filter((e) => e.upstreamPolicyId === upstreamPolicyId)

  function CollapsedPolicy({ policy }: { policy: Mercoa.ApprovalPolicyResponse }) {
    return (
      <div
        className={`mercoa-grid mercoa-grid-cols-1 mercoa-gap-2 mercoa-p-2 mercoa-border mercoa-border-gray-200 mercoa-rounded-lg shadow-md ${
          nestedBg[!isFullyCollapsed ? 0 : level + 1]
        }`}
      >
        <p className="mercoa-text-sm mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600">
          {policy.trigger.length > 0 ? 'If' : 'Always require'}
          {policy.trigger.map((t, index) => {
            let displayText = <></>

            if (t.type === 'amount') {
              displayText = <>{`Amount ≥ ${accounting.formatMoney(t.amount, currencyCodeToSymbol(t.currency))}`}</>
            } else if (t.type === 'vendor') {
              displayText = (
                <>
                  Vendor is <CounterpartyNames vendorIds={t.vendorIds} />
                </>
              )
            } else if (t.type === 'metadata') {
              displayText = <>{`${t.key} is ${t.value}`}</>
            }

            return (
              <span key={index} className="mercoa-ml-1">
                <span className="mercoa-text-gray-800 mercoa-underline">{displayText}</span>
                {index === policy.trigger.length - 1 ? (
                  <span className="mercoa-ml-1 mercoa-text-gray-600">then require</span>
                ) : (
                  <span className="mercoa-ml-1 mercoa-text-gray-600">and</span>
                )}
              </span>
            )
          })}
          {policy.rule.type === 'approver' && (
            <>
              <span className="mercoa-ml-1">
                {policy.rule.numApprovers} approval{policy.rule.numApprovers === 1 ? '' : 's'} from
              </span>
              <span className="mercoa-ml-1 mercoa-text-gray-800 mercoa-underline">
                {policy.rule.identifierList.type === 'rolesList'
                  ? policy.rule.identifierList.value.join(', ')
                  : policy.rule.identifierList.type === 'userList' &&
                    policy.rule.identifierList.value.map((e) => users.find((u) => u.id === e)?.name).join(', ')}
              </span>
            </>
          )}
        </p>
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
          formPolicies={formPolicies}
          upstreamPolicyId={policy.id}
          isFullyCollapsed={isFullyCollapsed || collapsedPolicyIds.includes(policy.id)}
          allowAutoAssign={allowAutoAssign}
          maxRules={maxRules}
          supportedCurrencies={supportedCurrencies}
        />
      </div>
    )
  }

  if (isFullyCollapsed) {
    return (
      <>
        {policies.map((policy) => (
          <CollapsedPolicy policy={policy} key={policy.id} />
        ))}
      </>
    )
  }

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

      {policies.map((policy) => {
        return (
          <li key={policy.id} className="mercoa-relative mercoa-flex mercoa-gap-x-4">
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
                className={`font-medium mercoa-text-gray-900 mercoa-p-2 mercoa-pb-5 mercoa-rounded-mercoa mercoa-relative mercoa-pt-10 ${
                  nestedBg[level + 1]
                }`}
              >
                <div className="mercoa-absolute mercoa-top-2 mercoa-right-2 mercoa-flex mercoa-gap-2">
                  {!collapsedPolicyIds.includes(policy.id) ? (
                    <MercoaButton
                      size="sm"
                      type="button"
                      hideOutline
                      color="gray"
                      onClick={() => setCollapsedPolicyIds([...collapsedPolicyIds, policy.id])}
                    >
                      Collapse Policy
                    </MercoaButton>
                  ) : (
                    <MercoaButton
                      size="sm"
                      type="button"
                      hideOutline
                      color="gray"
                      onClick={() => setCollapsedPolicyIds(collapsedPolicyIds.filter((e) => e !== policy.id))}
                    >
                      Edit Policy
                    </MercoaButton>
                  )}
                  <button
                    className="mercoa-text-gray-400 hover:mercoa-text-gray-500"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to remove this policy?')) {
                        remove(formPolicies.findIndex((e) => e.id == policy.id))
                      }
                    }}
                  >
                    <span className="mercoa-sr-only">Remove</span>
                    <XMarkIcon className="mercoa-size-5" />
                  </button>
                </div>
                {collapsedPolicyIds.includes(policy.id) || isFullyCollapsed ? (
                  <CollapsedPolicy policy={policy} />
                ) : (
                  <>
                    <div className="mercoa-grid mercoa-grid-cols-4 mercoa-gap-2 mercoa-p-3 mercoa-border mercoa-border-gray-200 mercoa-rounded-mercoa mercoa-bg-white">
                      <Trigger
                        supportedCurrencies={supportedCurrencies}
                        control={control}
                        watch={watch}
                        register={register}
                        setValue={setValue}
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
                      noTrigger={policy.trigger.length === 0}
                      allowAutoAssign={allowAutoAssign}
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
                        formPolicies={formPolicies}
                        upstreamPolicyId={policy.id}
                        isFullyCollapsed={isFullyCollapsed || collapsedPolicyIds.includes(policy.id)}
                        allowAutoAssign={allowAutoAssign}
                        maxRules={maxRules}
                        supportedCurrencies={supportedCurrencies}
                      />
                    </div>
                  </>
                )}
              </div>
            </p>
          </li>
        )
      })}

      {!collapsedPolicyIds.includes(upstreamPolicyId) && (
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
              trigger={[]}
              watch={watch}
              maxRules={maxRules}
            />
          </p>
        </li>
      )}

      {upstreamPolicyId === 'root' && (
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
      )}
    </ul>
  )
}

function Trigger({
  control,
  watch,
  register,
  setValue,
  index,
  supportedCurrencies,
}: {
  control: any
  watch: any
  register: any
  setValue: any
  index: number
  supportedCurrencies?: Mercoa.CurrencyCode[]
}) {
  const mercoaSession = useMercoaSession()
  const trigger = `policies.${index}.trigger`

  const { append, remove, fields } = useFieldArray({
    control,
    name: trigger,
  })

  const triggerWatch = watch(trigger) as Mercoa.Trigger[]

  return (
    <>
      {!!fields.length && (
        <div className="mercoa-col-span-4 mercoa-font-medium mercoa-text-gray-700 mercoa-mb-1">
          If these conditions are true:
        </div>
      )}
      {fields.map((field, triggerIndex) => {
        const metadataSchema = mercoaSession.organization?.metadataSchema?.find(
          (e) => e.key === (triggerWatch[triggerIndex] as Mercoa.Trigger.Metadata)?.key,
        )
        const previousTriggers: string[] = triggerWatch?.slice(0, triggerIndex).map((t) => t?.type ?? '') ?? []
        const triggerOptions = [
          ...(previousTriggers.every((e) => e !== 'amount')
            ? [
                {
                  displayName: 'Amount',
                  key: '~mercoa~amount',
                },
              ]
            : []),
          ...(previousTriggers.every((e) => e !== 'vendor')
            ? [
                {
                  displayName: 'Vendor',
                  key: '~mercoa~vendor',
                },
              ]
            : []),
          ...(mercoaSession.organization?.metadataSchema?.filter((e) => !e.lineItem) ?? []),
        ]?.map((e) => ({
          disabled: false,
          value: e,
        }))

        return (
          <div
            key={triggerIndex}
            className="mercoa-p-3 mercoa-bg-gray-50 mercoa-rounded-mercoa mercoa-col-span-4 mercoa-flex mercoa-items-center"
          >
            <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-mr-2">
              {triggerIndex > 0 ? 'And' : 'If'}
            </span>
            <MercoaCombobox
              options={triggerOptions}
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
              showAllOptions
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
                        {(supportedCurrencies ?? Object.values(Mercoa.CurrencyCode)).map(
                          (option: Mercoa.CurrencyCode, index: number) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ),
                        )}
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
                <CounterpartySearch
                  setValue={setValue}
                  index={index}
                  triggerIndex={triggerIndex}
                  triggerWatch={triggerWatch}
                />
              </>
            )}

            {triggerWatch?.[triggerIndex]?.type === 'metadata' && (
              <>
                <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-ml-2 mercoa-mr-2">
                  {metadataSchema?.type === 'STRING' || metadataSchema?.type === 'KEY_VALUE' ? 'is one of' : 'is'}
                </span>
                <MetadataSelectionV1
                  key={watch(`policies.${index}.trigger.${triggerIndex}.key`)}
                  hideLabel
                  field={`policies.${index}.trigger.${triggerIndex}.value`}
                  skipValidation
                  schema={{
                    ...(metadataSchema ?? { key: '', displayName: '', type: 'STRING' }),
                    allowMultiple: metadataSchema?.type === 'STRING' || metadataSchema?.type === 'KEY_VALUE',
                  }}
                />
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to remove this condition?')) {
                  remove(triggerIndex)
                }
              }}
              className="mercoa-ml-2 mercoa-text-gray-400 hover:mercoa-text-gray-500"
            >
              <span className="mercoa-sr-only">Remove</span>
              <XMarkIcon className="mercoa-size-5" />
            </button>
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
  noTrigger,
  allowAutoAssign,
}: {
  watch: any
  register: any
  setValue: any
  users: Mercoa.EntityUserResponse[]
  roles: string[]
  index: number
  noTrigger?: boolean
  allowAutoAssign?: boolean
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
      {!noTrigger && <div className="mercoa-font-medium mercoa-text-gray-700">Then:</div>}
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
      {allowAutoAssign && (
        <MercoaSwitch
          tooltip={
            <span>
              If enabled, the policy will automatically assign approvers.
              <br />
              If more than one approver is eligible, the policy will assign all eligible approvers to the invoice.
              <br />
              If disabled, approvers must be manually selected from the list of eligible approvers.
            </span>
          }
          label="Automatically Assign Approvers"
          name={`policies.${index}.rule.autoAssign`}
          register={register}
        />
      )}
    </div>
  )
}

function AddRule({
  id,
  upstreamPolicyId,
  append,
  trigger,
  watch,
  maxRules,
}: {
  id: string
  upstreamPolicyId: string
  append: any
  trigger: Mercoa.Trigger[]
  maxRules?: number
  watch: any
}) {
  const noOfPrimaryRules = (watch(`policies`) as Mercoa.ApprovalPolicyResponse[]).filter(
    (e) => e.upstreamPolicyId === 'root',
  ).length

  return (
    <MercoaButton
      isEmphasized
      disabled={upstreamPolicyId === 'root' && maxRules ? noOfPrimaryRules >= maxRules : false}
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

function CounterpartyNames({ vendorIds }: { vendorIds: string[] }) {
  const mercoaSession = useMercoaSession()

  const [counterparties, setCounterparties] = useState<Mercoa.CounterpartyResponse[]>([])

  useEffect(() => {
    if (!mercoaSession.entity?.id) return
    mercoaSession.client?.entity.counterparty
      .findPayees(mercoaSession.entity?.id, {
        limit: 100,
        counterpartyId: vendorIds,
      })
      .then((resp) => {
        setCounterparties(resp.data)
      })
  }, [vendorIds, mercoaSession.entity?.id, mercoaSession.token])

  return (
    <>
      {counterparties.map((cp, index) => (
        <span key={cp.id} className="mercoa-ml-1">
          {cp.name}
          {index === counterparties.length - 2 ? (
            <span className="mercoa-text-gray-600"> or</span>
          ) : (
            <span className="mercoa-text-gray-600">,</span>
          )}
        </span>
      ))}
    </>
  )
}

function CounterpartySearch({
  setValue,
  index,
  triggerIndex,
  triggerWatch,
}: {
  setValue: any
  index: number
  triggerIndex: number
  triggerWatch: any
}) {
  const mercoaSession = useMercoaSession()

  const [selectedCounterparties, setSelectedCounterparties] = useState<Mercoa.CounterpartyResponse[]>([])

  const [counterparties, setCounterparties] = useState<Mercoa.CounterpartyResponse[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [search, setSearch] = useState<string>()
  const [searchTerm, setSearchTerm] = useState<string>()
  const debouncedSearch = useRef(debounce(setSearch, 200)).current

  const vendorIds = (triggerWatch[triggerIndex] as Mercoa.Trigger.Vendor)?.vendorIds

  useEffect(() => {
    if (!mercoaSession.entity?.id) return

    if (vendorIds && vendorIds.length > 0) {
      mercoaSession.client?.entity.counterparty
        .findPayees(mercoaSession.entity?.id, {
          limit: 100,
          counterpartyId: vendorIds,
        })
        .then((resp) => {
          setSelectedCounterparties(resp.data)
        })
    } else {
      setSelectedCounterparties([])
    }
  }, [vendorIds, mercoaSession.entity?.id, mercoaSession.token])

  // Get all counterparties
  useEffect(() => {
    if (!mercoaSession.entity?.id) return
    let networkType: Mercoa.CounterpartyNetworkType[] = [Mercoa.CounterpartyNetworkType.Entity]
    mercoaSession.client?.entity.counterparty
      .findPayees(mercoaSession.entity?.id, { paymentMethods: true, networkType, search })
      .then((resp) => {
        setCounterparties(resp.data)
      })
  }, [mercoaSession.entity?.id, mercoaSession.token, mercoaSession.refreshId, search])

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm])

  return (
    <div className="mercoa-grid mercoa-grid-cols-3 mercoa-gap-2 mercoa-w-full">
      {selectedCounterparties.map((cp) => (
        <div
          key={cp.id}
          className="mercoa-bg-gray-200 mercoa-rounded-mercoa mercoa-p-2 mercoa-text-sm mercoa-flex mercoa-items-center mercoa-justify-between"
        >
          <span className="mercoa-truncate">{cp.name}</span>
          <button
            onClick={() => {
              setValue(
                `policies.${index}.trigger.${triggerIndex}.vendorIds`,
                selectedCounterparties.filter((e) => e.id != cp.id).map((e) => e.id),
                {
                  shouldDirty: true,
                },
              )
            }}
            type="button"
            className="mercoa-flex-shrink-0 mercoa-p-1 mercoa-text-mercoa-primary-text hover:mercoa-opacity-75"
          >
            <XCircleIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
            <span className="mercoa-sr-only">Clear</span>
          </button>
        </div>
      ))}
      <Combobox
        value={null}
        as="div"
        onChange={(e: Mercoa.CounterpartyResponse) => {
          if (!e || !e.id) return
          setValue(
            `policies.${index}.trigger.${triggerIndex}.vendorIds`,
            [...new Set([...((triggerWatch[triggerIndex] as Mercoa.Trigger.Vendor)?.vendorIds ?? []), e.id])],
            {
              shouldDirty: true,
            },
          )
          setSearchTerm(undefined)
        }}
        nullable
        className="mercoa-col-span-full"
      >
        {({ open }) => (
          <div className="mercoa-relative mercoa-w-full">
            <Combobox.Input
              placeholder="Enter a company name..."
              autoComplete="off"
              className="mercoa-w-full mercoa-rounded-mercoa mercoa-border-0 mercoa-bg-white mercoa-py-1.5 mercoa-pl-3 mercoa-pr-10 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
              onFocus={() => {
                if (open) return // don't click button if already open, as it will close it
                setSearchTerm(undefined) // reset filter
                buttonRef.current?.click() // simulate click on button to open dropdown
              }}
              onChange={(event) => {
                setSearchTerm(event.target.value?.toLowerCase() ?? '')
              }}
              displayValue={(e: Mercoa.CounterpartyResponse) => e?.name ?? ''}
            />
            <Combobox.Button
              className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 focus:mercoa-outline-none"
              ref={buttonRef}
            >
              <ChevronUpDownIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
            </Combobox.Button>

            <Combobox.Options className="mercoa-absolute mercoa-z-10 mercoa-mt-1 mercoa-max-h-60 mercoa-w-full mercoa-overflow-auto mercoa-rounded-mercoa mercoa-bg-white mercoa-py-1 mercoa-text-base mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none sm:mercoa-text-sm">
              {counterparties.map((cp) => (
                <Combobox.Option
                  key={cp.id}
                  value={cp}
                  className={({ active }) =>
                    `mercoa-relative mercoa-cursor-pointer  mercoa-py-2 mercoa-pl-3 mercoa-pr-9 ${
                      active
                        ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
                        : 'mercoa-text-gray-900'
                    }`
                  }
                >
                  <span>{cp.name}</span>
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </div>
        )}
      </Combobox>
    </div>
  )
}
