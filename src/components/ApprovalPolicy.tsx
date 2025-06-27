import { Combobox } from '@headlessui/react'
import {
  CheckCircleIcon,
  ChevronUpDownIcon,
  ClockIcon,
  PlusIcon,
  RocketLaunchIcon,
  SparklesIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { DialogTitle } from '@radix-ui/react-dialog'
import accounting from 'accounting'
import dayjs from 'dayjs'
import debounce from 'lodash/debounce'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { Dialog } from '../lib/components'
import { currencyCodeToSymbol } from '../lib/currency'
import {
  ButtonLoadingSpinner,
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

function ApprovalPolicyHistoryDialog({
  isOpen,
  setIsOpen,
  history,
  readOnly,
  onRestore,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  history: Mercoa.ApprovalPolicyHistoryResponse[]
  readOnly: boolean
  onRestore: (approvalPolicyHistoryId: string) => Promise<void>
}) {
  const mercoaSession = useMercoaSession()
  const [selectedHistory, setSelectedHistory] = useState<Mercoa.ApprovalPolicyHistoryResponse | null>(
    history[0] ?? null,
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="mercoa-w-[95vw] mercoa-h-[95vh] mercoa-flex mercoa-flex-col mercoa-bg-white mercoa-text-[#1A1919] mercoa-p-6 mercoa-rounded-lg mercoa-shadow-xl">
        <div className="mercoa-flex mercoa-justify-between mercoa-items-center mercoa-border-b mercoa-border-gray-200 mercoa-pb-4 mercoa-relative">
          <DialogTitle>
            <h2 className="mercoa-text-2xl mercoa-font-semibold mercoa-text-[#1A1919]">Policy History</h2>
          </DialogTitle>
          <MercoaButton
            isEmphasized={false}
            hideOutline={true}
            color="gray"
            onClick={() => setIsOpen(false)}
            className="mercoa-text-[14px] mercoa-font-medium mercoa-text-[#1A1919] hover:mercoa-underline"
          >
            Close
          </MercoaButton>
        </div>

        <div className="mercoa-flex mercoa-flex-1 mercoa-relative mercoa-border mercoa-border-gray-100 mercoa-overflow-hidden">
          <div className="mercoa-w-[30%] mercoa-border-r mercoa-overflow-y-auto mercoa-p-4">
            <div className="mercoa-text-lg mercoa-font-semibold mercoa-mb-4">History</div>
            <div className="mercoa-space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={`mercoa-p-3 mercoa-rounded-lg mercoa-cursor-pointer ${
                    selectedHistory?.id === entry.id
                      ? 'mercoa-bg-mercoa-primary mercoa-text-white'
                      : 'mercoa-bg-gray-50 hover:mercoa-bg-gray-100'
                  }`}
                  onClick={() => setSelectedHistory(entry)}
                >
                  <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                    <ClockIcon className="mercoa-w-5 mercoa-h-5" />
                    <div>
                      <div className="mercoa-font-medium">{dayjs(entry.createdAt).format('MMM D, YYYY h:mm A')}</div>
                      <div className="mercoa-text-sm mercoa-opacity-80">
                        By {mercoaSession.users.find((user) => user.id === entry.userId)?.email ?? 'admin'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mercoa-flex-1 mercoa-overflow-y-auto mercoa-p-4">
            {selectedHistory ? (
              <>
                {!readOnly && (
                  <div className="mercoa-mt-4 mercoa-flex mercoa-justify-end">
                    <MercoaButton
                      isEmphasized
                      onClick={() => {
                        onRestore(selectedHistory.id)
                      }}
                    >
                      Restore This Version
                    </MercoaButton>
                  </div>
                )}
                <ApprovalPolicies approvalPolicies={selectedHistory.policies} readOnly={true} resourceLabel="invoice" />
              </>
            ) : (
              <div className="mercoa-text-gray-500 mercoa-text-center mercoa-mt-8">Select a history entry to view</div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export function ApprovalPolicies({
  onSave,
  resourceLabel = 'invoice',
  additionalRoles,
  restrictedRoles,
  maxRules,
  maxNestedLevels,
  supportedCurrencies,
  allowAutoAssign = true,
  showHistory = false,
  approvalPolicies,
  readOnly = false,
}: {
  onSave?: () => void
  resourceLabel?: string
  additionalRoles?: string[]
  restrictedRoles?: string[]
  maxRules?: number
  maxNestedLevels?: number
  supportedCurrencies?: Mercoa.CurrencyCode[]
  allowAutoAssign?: boolean
  showHistory?: boolean
  approvalPolicies?: Mercoa.ApprovalPolicyResponse[]
  readOnly?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const [policies, setPolicies] = useState<Mercoa.ApprovalPolicyResponse[]>()
  const [isSaving, setIsSaving] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [history, setHistory] = useState<Mercoa.ApprovalPolicyHistoryResponse[]>([])

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
    if (approvalPolicies) {
      setPolicies(approvalPolicies)
      reset({ policies: approvalPolicies })
    } else {
      getPolicies()
    }
  }, [approvalPolicies, mercoaSession.entity?.id, mercoaSession.token])

  useEffect(() => {
    if (showHistory && mercoaSession.entity?.id) {
      fetchHistory()
    }
  }, [showHistory, mercoaSession.entity?.id])

  const fetchHistory = async () => {
    if (!mercoaSession.entity?.id) return
    try {
      const response = await mercoaSession.client?.entity.approvalPolicy.history(mercoaSession.entity.id)
      if (response) {
        setHistory(response)
      }
    } catch (error) {
      console.error('Failed to fetch approval policy history:', error)
    }
  }

  async function onSubmit(data: { policies: Mercoa.ApprovalPolicyResponse[] }) {
    if (isSaving || !policies) return
    setIsSaving(true)
    const toasts: { id: string; success: boolean }[] = []

    const validRules = data.policies.every((policy, index) => {
      if (policy.rule.type === 'approver') {
        if (policy.rule.identifierList.value.filter((e: string) => !!e).length < 1) {
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
            await new Promise((r) => setTimeout(r, 10))
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

    for (const currentPolicy of data.policies.sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)))) {
      if (!mercoaSession.entity?.id) continue

      const trigger: Mercoa.Trigger[] = currentPolicy.trigger.map((t: Mercoa.Trigger) => {
        if (t.type === 'amount') {
          return {
            type: t.type,
            amount: Number(t.amount),
            currency: t.currency,
            comparison: t.comparison ?? 'gte',
          }
        } else if (t.type === 'vendor') {
          return {
            type: t.type,
            vendorIds: t.vendorIds,
          }
        } else if (t.type === 'metadata') {
          return {
            type: t.type,
            key: t.key,
            value: t.value,
          }
        } else if (t.type === 'catchall') {
          return {
            type: 'catchall',
          }
        } else {
          return t
        }
      })

      const upstreamPolicyId = idMap[currentPolicy.upstreamPolicyId]

      const policyRequest: Mercoa.ApprovalPolicyRequest = {
        upstreamPolicyId,
        trigger,
        rule: {
          ...(currentPolicy.rule.type === 'approver'
            ? {
                type: 'approver',
                numApprovers: Number(currentPolicy.rule.numApprovers),
                identifierList: {
                  type: currentPolicy.rule.identifierList.type,
                  value: currentPolicy.rule.identifierList.value,
                },
              }
            : {
                type: 'automatic',
              }),
        },
      }

      try {
        let updatedPolicy: Mercoa.ApprovalPolicyResponse | undefined
        if (currentPolicy.id && !currentPolicy.id.includes('~') && !currentPolicy.id.startsWith('fallback')) {
          updatedPolicy = await mercoaSession.client?.entity.approvalPolicy.update(
            mercoaSession.entity.id,
            currentPolicy.id,
            policyRequest,
          )
        } else {
          updatedPolicy = await mercoaSession.client?.entity.approvalPolicy.create(
            mercoaSession.entity.id,
            policyRequest,
          )
        }
        idMap[currentPolicy.id] = updatedPolicy?.id ?? ''
        toasts.push({ id: currentPolicy.id, success: true })
      } catch (e: any) {
        toasts.push({ id: currentPolicy.id, success: false })
      }
      await new Promise((r) => setTimeout(r, 10))
    }

    await getPolicies()
    await fetchHistory()
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
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={readOnly || isSaving ? 'mercoa-pointer-events-none' : ''}>
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
              resourceLabel={resourceLabel}
              supportedCurrencies={supportedCurrencies}
              maxNestedLevels={maxNestedLevels}
            />
          </div>

          {!readOnly && (
            <div className="mercoa-flex mercoa-gap-2 mercoa-mt-5">
              <MercoaButton isEmphasized size="md" disabled={isSaving}>
                <ButtonLoadingSpinner isLoading={isSaving}>Save Rules</ButtonLoadingSpinner>
              </MercoaButton>
              {showHistory && (
                <MercoaButton
                  onClick={() => setIsHistoryModalOpen(true)}
                  size="md"
                  disabled={isSaving}
                  className="mercoa-flex mercoa-items-center mercoa-gap-2"
                >
                  History
                  <ClockIcon className="mercoa-size-5" />
                </MercoaButton>
              )}
            </div>
          )}
        </form>
      </FormProvider>
      {showHistory && isHistoryModalOpen && history && (
        <ApprovalPolicyHistoryDialog
          isOpen={isHistoryModalOpen}
          setIsOpen={setIsHistoryModalOpen}
          history={history}
          readOnly={readOnly}
          onRestore={async (approvalPolicyHistoryId: string) => {
            if (!mercoaSession.entity?.id) return
            await mercoaSession.client?.entity.approvalPolicy.restore(mercoaSession.entity.id, approvalPolicyHistoryId)
            await getPolicies()
            await fetchHistory()
            toast.success('Successfully restored approval policy')
            setIsHistoryModalOpen(false)
          }}
        />
      )}
    </>
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
  resourceLabel = 'invoice',
  maxNestedLevels,
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
  resourceLabel?: string
  maxNestedLevels?: number
}) {
  const [collapsedPolicyIds, setCollapsedPolicyIds] = useState<string[]>([])
  const policies = formPolicies
    .filter((e) => e.upstreamPolicyId === upstreamPolicyId)
    .sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)))

  function CollapsedPolicy({ policy }: { policy: Mercoa.ApprovalPolicyResponse }) {
    return (
      <div
        className={`mercoa-grid mercoa-grid-cols-1 mercoa-gap-2 mercoa-p-2 mercoa-border mercoa-border-gray-200 mercoa-rounded-lg shadow-md ${
          nestedBg[!isFullyCollapsed ? 0 : level + 1]
        }`}
      >
        <p className="mercoa-text-sm mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600">
          {policy.trigger.some((t) => t.type === 'catchall') ? (
            <>
              If <span className="mercoa-text-gray-800 mercoa-underline">no other policies</span> on this level match
              then require
            </>
          ) : (
            <>
              {policy.trigger.length > 0 ? 'If' : 'Always require'}
              {policy.trigger.map((t: Mercoa.Trigger, index: number) => {
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
            </>
          )}
          {policy.rule.type === 'approver' && (
            <>
              <span className="mercoa-ml-1">
                {policy.rule.numApprovers} approval{policy.rule.numApprovers === 1 ? '' : 's'} from
              </span>
              <span className="mercoa-ml-1 mercoa-text-gray-800 mercoa-underline">
                {policy.rule.identifierList.type === 'rolesList'
                  ? policy.rule.identifierList.value.join(', ')
                  : policy.rule.identifierList.type === 'userList' &&
                    policy.rule.identifierList.value.map((e: string) => users.find((u) => u.id === e)?.name).join(', ')}
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
          resourceLabel={resourceLabel}
          supportedCurrencies={supportedCurrencies}
          maxNestedLevels={maxNestedLevels}
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
            {upstreamPolicyId === 'root'
              ? `When a${/^[aeiou]/i.test(resourceLabel) ? 'n' : ''} ${resourceLabel} is sent for approval:`
              : ''}
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
                <div className="mercoa-absolute mercoa-top-2 mercoa-right-0 mercoa-flex mercoa-justify-between mercoa-w-full mercoa-px-2">
                  <div className="mercoa-text-xs mercoa-select-all mercoa-opacity-0 mercoa-mt-1">{policy.id}</div>
                  <div className="mercoa-flex mercoa-gap-2">
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
                      resourceLabel={resourceLabel}
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
                        resourceLabel={resourceLabel}
                        supportedCurrencies={supportedCurrencies}
                        maxNestedLevels={maxNestedLevels}
                      />
                    </div>
                  </>
                )}
              </div>
            </p>
          </li>
        )
      })}
      {!collapsedPolicyIds.includes(upstreamPolicyId) &&
        (maxNestedLevels !== undefined ? level < maxNestedLevels + 1 : true) && (
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
                id={upstreamPolicyId + '~' + Math.random().toString(36)}
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
            <span className="mercoa-font-medium mercoa-text-gray-900"> Approve {resourceLabel}</span>
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
          {
            displayName: 'No other policies match',
            key: '~mercoa~catchall',
          },
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
                if (e.key == '~mercoa~catchall') {
                  // First, remove all existing triggers
                  const currentTriggers = watch(`policies.${index}.trigger`) as Mercoa.Trigger[]
                  currentTriggers.forEach((_, triggerIndex) => {
                    remove(triggerIndex)
                  })

                  // Then add the catchall trigger
                  setValue(
                    `policies.${index}.trigger`,
                    [
                      {
                        type: 'catchall',
                      },
                    ],
                    {
                      shouldDirty: true,
                    },
                  )
                } else {
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
                }
              }}
              className={triggerWatch?.[triggerIndex]?.type === 'catchall' ? 'mercoa-w-[250px]' : ''}
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
                } else if (triggerWatch?.[triggerIndex]?.type === 'catchall') {
                  return {
                    displayName: 'No other policies match',
                    key: '~mercoa~catchall',
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
                <div className="mercoa-w-[200px]">
                  <select
                    {...register(`policies.${index}.trigger.${triggerIndex}.comparison`)}
                    className="mercoa-h-full mercoa-rounded-mercoa mercoa-border-0 mercoa-bg-transparent mercoa-py-0 mercoa-pl-2 mercoa-pr-7 mercoa-text-gray-500 focus:mercoa-ring-1 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
                  >
                    <option value={Mercoa.Comparison.Eq}>equal to</option>
                    <option value={Mercoa.Comparison.Gt}>greater than</option>
                    <option value={Mercoa.Comparison.Gte}>greater than or equal to</option>
                    <option value={Mercoa.Comparison.Lt}>less than</option>
                    <option value={Mercoa.Comparison.Lte}>less than or equal to</option>
                  </select>
                </div>
                <MercoaInput
                  leadingIcon={
                    <span className="mercoa-text-gray-500 sm:mercoa-text-sm">
                      {currencyCodeToSymbol((triggerWatch[triggerIndex] as Mercoa.Trigger.Amount).currency)}
                    </span>
                  }
                  name={`policies.${index}.trigger.${triggerIndex}.amount`}
                  register={register}
                  min="0.01"
                  type="number"
                  step="0.01"
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

      {(() => {
        const hasCatchall = triggerWatch?.some((t) => t?.type === 'catchall')
        if (hasCatchall) {
          return (
            <div className="mercoa-col-span-4 mercoa-text-sm mercoa-text-gray-500">
              If no other policies at this level trigger, this policy will be triggered.
            </div>
          )
        }

        const hasAmount =
          triggerWatch &&
          Array.isArray(triggerWatch) &&
          (triggerWatch as Mercoa.Trigger[]).filter((e) => e).some((e) => e?.type === 'amount')

        const hasVendor =
          triggerWatch &&
          Array.isArray(triggerWatch) &&
          (triggerWatch as Mercoa.Trigger[]).filter((e) => e).some((e) => e?.type === 'vendor')

        const metadataSchemas = mercoaSession.organization?.metadataSchema?.filter((e) => !e.lineItem) || []
        const hasAllMetadata = metadataSchemas.every(
          (schema) =>
            triggerWatch &&
            Array.isArray(triggerWatch) &&
            (triggerWatch as Mercoa.Trigger[]).some(
              (trigger) => trigger?.type === 'metadata' && trigger?.key === schema.key,
            ),
        )

        if (hasAmount && hasVendor && hasAllMetadata) {
          return null
        }

        return (
          <div className="mercoa-col-span-4">
            <MercoaButton
              isEmphasized={false}
              size="sm"
              type="button"
              className="mercoa-flex"
              onClick={() => {
                mercoaSession.debug({ onClick: true, triggerWatch })
                if (!hasAmount) {
                  append({
                    type: 'amount',
                    amount: 100,
                    currency: Mercoa.CurrencyCode.Usd,
                    comparison: 'gte',
                  })
                } else if (!hasVendor) {
                  append({
                    type: 'vendor',
                    vendorIds: [],
                  })
                } else {
                  const unusedMetadataSchema = metadataSchemas.find(
                    (schema) =>
                      !(triggerWatch as Mercoa.Trigger[])?.some(
                        (trigger) => trigger?.type === 'metadata' && trigger?.key === schema.key,
                      ),
                  )
                  if (unusedMetadataSchema) {
                    append({
                      type: 'metadata',
                      key: unusedMetadataSchema.key,
                      value: '',
                    })
                  }
                }
              }}
            >
              <PlusIcon className="mercoa-size-4 mercoa-mr-1" /> Add Condition
            </MercoaButton>
          </div>
        )
      })()}
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
  resourceLabel = 'invoice',
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
  resourceLabel?: string
}) {
  const [ruleIdType, setRuleIdType] = useState('rolesList')
  const ruleType = watch(`policies.${index}.rule.type`)

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
      {!noTrigger && (
        <div className="mercoa-font-medium mercoa-text-gray-700 mercoa-flex mercoa-items-center mercoa-gap-2">
          Then:
          <div className="mercoa-flex mercoa-items-center">
            <div className="mercoa-w-[200px]">
              <select
                {...register(`policies.${index}.rule.type`, { required: true })}
                className={`${inputClassName({})}`}
              >
                <option value="approver">Require Approval From</option>
                <option value="automatic">Automatically Approve</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {ruleType === 'approver' && (
        <>
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
                  If more than one approver is eligible, the policy will assign all eligible approvers to the{' '}
                  {resourceLabel}.
                  <br />
                  If disabled, approvers must be manually selected from the list of eligible approvers.
                </span>
              }
              label="Automatically Assign Approvers"
              name={`policies.${index}.rule.autoAssign`}
              register={register}
            />
          )}
        </>
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
            autoAssign: false,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
