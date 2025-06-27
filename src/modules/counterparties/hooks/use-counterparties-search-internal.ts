import { yupResolver } from '@hookform/resolvers/yup'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import {
  createCounterpartyRequest,
  findExistingCounterparties,
  onSubmitCounterparty,
} from '../../payables/components/payable-form/utils'
import { useCounterpartiesQuery } from '../api/queries'
import { CounterpartyFormAction } from '../constants'
import { CounterpartySearchContextValue, CounterpartySearchProps } from '../types'

export const useCounterpartiesSearchInternal = (props: CounterpartySearchProps): CounterpartySearchContextValue => {
  const mercoaSession = useMercoaSession()
  const { queryOptions, handlers, config } = props
  const { selectedCounterparty: defaultSelectedCounterparty, type } = config ?? {}

  const [selectedCounterparty, setSelectedCounterpartyInternal] = useState<Mercoa.CounterpartyResponse | undefined>(
    defaultSelectedCounterparty,
  )

  const [isLoading, setIsLoading] = useState(false)
  const [duplicateVendorModalOpen, setDuplicateVendorModalOpen] = useState(false)
  const [duplicateVendorInfo, setDuplicateVendorInfo] = useState<{
    duplicates: Mercoa.CounterpartyResponse[]
    foundType: 'name' | 'email'
    foundString: string
    type: 'payee' | 'payor'
  }>()

  const setSelectedCounterparty = useCallback(
    (counterparty: Mercoa.CounterpartyResponse | undefined) => {
      setSelectedCounterpartyInternal(counterparty)
      if (handlers?.onCounterpartySelect) {
        handlers.onCounterpartySelect(counterparty)
      }
      setEdit(false)
    },
    [handlers?.onCounterpartySelect],
  )

  // Form state
  const formMethods = useForm({
    resolver: yupResolver(
      yup.object({
        vendor: yup.object().shape({
          id: yup.string(),
          accountType: yup.string(),
          name: yup.string(),
          firstName: yup.string(),
          lastName: yup.string(),
          middleName: yup.string(),
          suffix: yup.string(),
          email: yup.string().email(),
        }),
        formAction: yup.string(),
      }),
    ),
    defaultValues: {
      vendor: {
        id: defaultSelectedCounterparty?.id ?? selectedCounterparty?.id,
        accountType: defaultSelectedCounterparty?.accountType ?? selectedCounterparty?.accountType,
        name: defaultSelectedCounterparty?.name ?? selectedCounterparty?.name,
        firstName:
          defaultSelectedCounterparty?.profile?.individual?.name?.firstName ??
          selectedCounterparty?.profile?.individual?.name?.firstName,
        lastName:
          defaultSelectedCounterparty?.profile?.individual?.name?.lastName ??
          selectedCounterparty?.profile?.individual?.name?.lastName,
        middleName:
          defaultSelectedCounterparty?.profile?.individual?.name?.middleName ??
          selectedCounterparty?.profile?.individual?.name?.middleName,
        suffix:
          defaultSelectedCounterparty?.profile?.individual?.name?.suffix ??
          selectedCounterparty?.profile?.individual?.name?.suffix,
        email:
          defaultSelectedCounterparty?.accountType === 'business'
            ? defaultSelectedCounterparty?.profile?.business?.email
            : selectedCounterparty?.profile?.individual?.email,
      },
      formAction: '',
    },
  })

  const {
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = formMethods

  // Search state
  const [search, setSearch] = useState(queryOptions?.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [edit, setEdit] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const useOnce = useRef(false)

  // Query counterparties
  const {
    data,
    isLoading: isQueryLoading,
    isError,
    refetch,
  } = useCounterpartiesQuery(mercoaSession.entityId || '', config?.type || 'payee', {
    search: debouncedSearch,
    networkType: queryOptions?.network,
    paymentMethods: queryOptions?.paymentMethods ?? true,
    invoiceMetrics: queryOptions?.invoiceMetrics ?? true,
    returnMetadata: queryOptions?.returnMetadata,
    limit: queryOptions?.limit,
  })

  const counterparties = useMemo(() => {
    return data?.pages[0]?.counterparties
  }, [data])

  const hasMore = useMemo(() => {
    if (!data?.pages?.[0]?.nextCursor) return false
    return true
  }, [data?.pages])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search)
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [search])
  useEffect(() => {
    if (defaultSelectedCounterparty && !useOnce.current) {
      setSelectedCounterparty(defaultSelectedCounterparty)
      useOnce.current = true
    }
  }, [defaultSelectedCounterparty])

  const refreshCounterparties = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['counterparties'] })
  }, [refetch])

  // Handle form submission
  const onSubmit = useCallback(
    async (formData: any, formAction: string) => {
      if (!mercoaSession.entity?.id) return
      setIsLoading(true)

      try {
        let data = formData.vendor
        let profile = createCounterpartyRequest({ data, setError, type: config?.type || 'payee' })

        if (!duplicateVendorInfo && profile && data.id === 'new') {
          const duplicateCheck = await findExistingCounterparties({
            entityId: mercoaSession.entity?.id,
            mercoaSession,
            type: type || 'payee',
            entityRequest: profile,
          })

          if (duplicateCheck?.duplicates) {
            setDuplicateVendorInfo({
              duplicates: duplicateCheck.duplicates,
              foundType: duplicateCheck.foundType! as any,
              foundString: duplicateCheck.foundString!,
              type: type || 'payee',
            })
            setDuplicateVendorModalOpen(true)
            setIsLoading(false)
            setValue('formAction', '')
            return
          }
        }

        if (handlers?.onCounterpartyPreSubmit) {
          profile = await handlers.onCounterpartyPreSubmit(profile, data.id)
        }

        if (data && profile) {
          await onSubmitCounterparty({
            data,
            mercoaSession,
            profile,
            type: config?.type || 'payee',
            onSelect: async (counterparty) => {
              await mercoaSession.refresh()
              setTimeout(() => {
                mercoaSession.debug('counterparty', counterparty)
                setSelectedCounterparty(counterparty)
                if (config?.enableOnboardingLinkOnCreate && counterparty) {
                  mercoaSession.client?.entity.sendOnboardingLink(counterparty.id, {
                    type: config?.type === 'payor' ? 'PAYOR' : 'PAYEE',
                  })
                }
                setValue('formAction', '')
              }, 100)
            },
          })
          refreshCounterparties()
          setValue('formAction', '')
          setIsLoading(false)
          setDuplicateVendorModalOpen(false)
          if (formAction === CounterpartyFormAction.CREATE_DUPLICATE_COUNTERPARTY) {
            setDuplicateVendorInfo(undefined)
          }
        }
      } catch (e: any) {
        toast?.error(e.body ?? 'Error creating/updating counterparty')
        setError('vendor', { message: e.body ?? 'Error creating/updating counterparty' })
        setValue('formAction', '')
        setIsLoading(false)
        if (formAction === CounterpartyFormAction.CREATE_DUPLICATE_COUNTERPARTY) {
          setDuplicateVendorInfo(undefined)
        }
      }
    },
    [
      mercoaSession,
      duplicateVendorInfo,
      setDuplicateVendorInfo,
      config?.type,
      config?.enableOnboardingLinkOnCreate,
      handlers?.onCounterpartyPreSubmit,
      handlers?.onCounterpartySelect,
      setError,
      setValue,
    ],
  )

  // Handle form actions
  const handleFormAction = useCallback(
    async (formData: any, action: string) => {
      if (!mercoaSession.entity?.id) return
      await onSubmit(formData, action)
    },
    [mercoaSession.entity?.id, onSubmit],
  )

  // Reset form action on errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setValue('formAction' as any, '')
    }
  }, [errors, setValue])

  return {
    dataContextValue: {
      counterparties,
      selectedCounterparty,
      setSelectedCounterparty,
      search,
      setSearch,
      duplicateVendorInfo,
      setDuplicateVendorInfo,
      hasMore,
      isLoading: isQueryLoading || isLoading,
      isError,
      refreshCounterparties: refetch,
    },
    formContextValue: {
      formMethods,
      handleFormAction,
      formActionLoading: isLoading,
      edit,
      setEdit,
      errors,
    },
    displayContextValue: {
      isDropdownOpen,
      setIsDropdownOpen,
      duplicateVendorModalOpen,
      setDuplicateVendorModalOpen,
      inputValue,
      setInputValue,
    },
    propsContextValue: props,
  }
}
