import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { getInvoiceClient } from '../../common/utils'
import {
  usePaymentLinkQuery,
  usePaymentMethodsQuery,
  useReceivableDetailQuery,
  useSupportedCurrenciesQuery,
} from '../api/queries'
import { ReceivableFormAction } from '../components/receivable-form/constants'
import { receivableFormUtils } from '../components/receivable-form/utils'
import {
  ReceivableDetailsContextValue,
  ReceivableDetailsProps,
  ReceivablePaymentMethodContext,
  ReceivableRecurringScheduleContext,
} from '../types'

export const useReceivableDetailsInternal = (props: ReceivableDetailsProps) => {
  const {
    queryOptions = { invoiceId: '', invoiceType: 'invoice' },
    handlers = {},
    config = {},
    renderCustom,
    displayOptions,
  } = props
  const { toast } = renderCustom ?? {}
  const { heightOffset } = displayOptions ?? {}
  const [height, setHeight] = useState(0)
  const mercoaSession = useMercoaSession()
  const { onInvoiceUpdate } = handlers ?? {}
  const { supportedCurrencies } = config ?? {}

  const [formLoading, setFormLoading] = useState(false)

  const { invoiceId, invoiceType } = queryOptions
  const { data: receivableData, isLoading: receivableDataLoading } = useReceivableDetailQuery(invoiceId, invoiceType)
  const { data: supportedCurrenciesFromQuery } = useSupportedCurrenciesQuery()
  const { data: paymentLink } = usePaymentLinkQuery(invoiceId, invoiceType)
  const usePrefillOnce = useRef(true)
  const useOnceAfterPayerChange = useRef(false)

  const defaultPaymentSchedule =
    invoiceType === 'invoiceTemplate'
      ? {
          type: 'daily',
          repeatEvery: 1,
          ends: new Date(),
        }
      : undefined

  const schema = yup
    .object({
      id: yup.string().nullable(),
      status: yup.string(),
      amount: yup
        .number()
        .positive('Please add a line item to the invoice. Amount must be a positive number.')
        .required()
        .typeError('Please enter a valid number'),
      invoiceNumber: yup.string(),
      description: yup.string(),
      dueDate: yup.date().required('Please select a due date').typeError('Please select a due date'),
      deductionDate: yup.date().typeError('Please select a deduction date'),
      invoiceDate: yup.date().required('Please select an invoice date').typeError('Please select an invoice date'),
      approvers: yup.mixed(),
      lineItems: yup.array().of(
        yup.object({
          id: yup.string(),
          name: yup.string().required('Name is a required field'),
          description: yup.string(),
          showDescription: yup.boolean(),
          amount: yup.number().required().typeError('Please enter a valid number'),
          currency: yup.string(),
          quantity: yup.number().required().typeError('Please enter a valid number'),
          unitPrice: yup.number().required().typeError('Please enter a valid number'),
          metadata: yup.mixed().nullable(),
          glAccountId: yup.string(),
          createdAt: yup.date(),
          updatedAt: yup.date(),
        }),
      ),
      currency: yup.string().required('Currency is a required field'),
      payer: yup.mixed().nullable(),
      payerId: yup.string(),
      payerName: yup.string(),
      paymentDestination: yup.mixed().nullable(),
      paymentDestinationId: yup.string(),
      paymentDestinationType: yup.string(),
      paymentSourceType: yup.string(),
      paymentDestinationOptions: yup.mixed().nullable(),
      paymentSourceCheckEnabled: yup.boolean(),
      paymentSourceId: yup.string(),
      paymentSchedule: yup.mixed().nullable(),
      formAction: yup.string().oneOf([...Object.values(ReceivableFormAction), '']),
      saveAsDraft: yup.boolean(),
      saveAsAdmin: yup.boolean(),
      metadata: yup.mixed().nullable(),
      creatorUser: yup.mixed().nullable(),
    })
    .required()

  const formMethods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: receivableData?.id,
      status: receivableData?.status,
      invoiceNumber: receivableData?.invoiceNumber,
      amount: receivableData?.amount,
      currency: receivableData?.currency ?? 'USD',
      payer: receivableData?.payer,
      payerId: receivableData?.payer?.id,
      payerName: receivableData?.payer?.name,
      invoiceDate: receivableData?.invoiceDate ? dayjs(receivableData?.invoiceDate).toDate() : undefined,
      dueDate: receivableData?.dueDate ? dayjs(receivableData?.dueDate).toDate() : undefined,
      deductionDate: receivableData?.deductionDate ? dayjs(receivableData?.deductionDate).toDate() : undefined,
      lineItems: receivableData?.lineItems ?? [],
      paymentDestination: receivableData?.paymentDestination,
      paymentDestinationId: receivableData?.paymentDestination?.id,
      paymentDestinationType: receivableData?.paymentDestination?.type ?? '',
      paymentDestinationOptions: receivableData?.paymentDestinationOptions,
      paymentSourceId: receivableData?.paymentSource?.id,
      paymentSourceType: receivableData?.paymentSource?.type ?? '',
      paymentSourceCheckEnabled:
        (receivableData?.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false,
      paymentSchedule: receivableData?.paymentSchedule ?? defaultPaymentSchedule,
      description: receivableData?.noteToSelf ?? '',
      formAction: '',
      saveAsDraft: false,
      metadata: receivableData?.metadata ?? {},
      creatorUser: receivableData?.creatorUser,
    },
  })

  const {
    setValue,
    reset,
    watch,
    clearErrors,
    formState: { errors },
    handleSubmit,
  } = formMethods

  const [
    payerId,
    vendorId,
    selectedSourceType,
    selectedDestinationType,
    selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId,
    paymentScheduleType,
    paymentScheduleEnds,
    paymentScheduleRepeatEvery,
    paymentScheduleRepeatOn,
    paymentScheduleRepeatOnDay,
    paymentScheduleRepeatOnMonth,
  ] = watch([
    'payerId',
    'vendorId',
    'paymentSourceType',
    'paymentDestinationType',
    'paymentSourceId',
    'paymentDestinationId',
    'paymentSchedule.type',
    'paymentSchedule.ends',
    'paymentSchedule.repeatEvery',
    'paymentSchedule.repeatOn',
    'paymentSchedule.repeatOnDay',
    'paymentSchedule.repeatOnMonth',
  ] as any)

  const { data: sourcePaymentMethods } = usePaymentMethodsQuery({
    entityId: payerId ?? receivableData?.payerId,
  })

  const { data: destinationPaymentMethods } = usePaymentMethodsQuery({
    entityId: mercoaSession.entityId,
  })

  const handleResize = useCallback(() => {
    setHeight(window.innerHeight - (heightOffset ?? 0))
  }, [heightOffset])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize, false)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [heightOffset, handleResize])

  useEffect(() => {
    if (
      !!destinationPaymentMethods &&
      (invoiceId ? !!receivableData && (receivableData.payerId ? !!sourcePaymentMethods : true) : true) &&
      (supportedCurrencies ?? supportedCurrenciesFromQuery) &&
      usePrefillOnce.current
    ) {
      const prefillReceivableData = receivableFormUtils.getPrefillReceivableData({
        destinationPaymentMethods,
        receivableData,
        supportedCurrencies: supportedCurrencies ?? supportedCurrenciesFromQuery,
        invoiceType,
      })
      reset(prefillReceivableData as any)
      usePrefillOnce.current = false
    }
  }, [
    sourcePaymentMethods,
    destinationPaymentMethods,
    receivableData,
    supportedCurrencies,
    supportedCurrenciesFromQuery,
  ])

  useEffect(() => {
    if (useOnceAfterPayerChange.current && !!sourcePaymentMethods) {
      const sourcePaymentMethod = watch('paymentSourceType')
        ? receivableFormUtils.getSourcePaymentMethodByType(watch('paymentSourceType') ?? '', sourcePaymentMethods)
        : receivableFormUtils.getDefaultSourcePaymentMethod(sourcePaymentMethods)
      mercoaSession.debug('sourcePaymentMethod', sourcePaymentMethod)
      setValue('paymentSourceId', sourcePaymentMethod.paymentSourceId)
      setValue(
        'paymentSourceType',
        (sourcePaymentMethod.paymentSourceType === 'custom'
          ? sourcePaymentMethod.paymentSourceCustomSchemaId
          : sourcePaymentMethod.paymentSource?.type) ?? 'unknown',
      )
      setValue('paymentSourceCheckEnabled', sourcePaymentMethod.paymentSourceCheckEnabled)
      useOnceAfterPayerChange.current = false
    }
  }, [payerId, sourcePaymentMethods])

  useEffect(() => {
    const subscription = watch((data, { name, type }) => {
      if (name === 'currency') {
        const lineItems = data.lineItems as Mercoa.InvoiceLineItemUpdateRequest[]
        lineItems.forEach((lineItem, index) => {
          setValue(`lineItems.${index}.currency`, data.currency ?? 'USD')
        })
      }

      if (!name?.startsWith('lineItems')) return
      if (name.endsWith('amount')) return

      // NOTE: data.lineItems is NOT ACTUALLY a Mercoa.InvoiceLineItemUpdateRequest[]!!! quantity, unitPrice, and amount can be strings
      const lineItems = data.lineItems as any[]

      let amount = lineItems.reduce((acc, lineItem, index) => {
        // Coerce quantity / unitPrice types back to number
        // NOTE: Can safely assume , is the thousands separator because this frontend is formatting it that way
        lineItem.quantity = Number(lineItem.quantity)
        lineItem.unitPrice = Number(String(lineItem.unitPrice).replace(/,/g, ''))

        lineItem.amount = Math.floor((lineItem.quantity ?? 1) * (lineItem.unitPrice ?? 1) * 100) / 100
        setValue(`lineItems.${index}.amount`, lineItem.amount)
        return acc + lineItem.amount
      }, 0)

      amount = Math.floor(amount * 100) / 100

      setValue('amount', amount)
    })

    return () => subscription.unsubscribe()
  }, [watch, setValue])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setValue('formAction', '')
    }
  }, [errors])

  const refreshReceivables = () => {
    queryClient.invalidateQueries({ queryKey: ['receivables'] })
    queryClient.invalidateQueries({ queryKey: ['recurringReceivables'] })
    queryClient.invalidateQueries({ queryKey: ['receivableMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['receivableStatusTabsMetrics'] })
  }

  const refreshInvoice = (invoiceId: string, updatedInvoice?: Mercoa.InvoiceResponse) => {
    queryClient.invalidateQueries({ queryKey: ['receivableDetail', invoiceId] })
    refreshReceivables()
    const updatedPrefillReceivableData = receivableFormUtils.getPrefillReceivableData({
      receivableData: updatedInvoice,
      supportedCurrencies: supportedCurrencies ?? supportedCurrenciesFromQuery,
      invoiceType,
    })
    reset(updatedPrefillReceivableData as any)
    if (onInvoiceUpdate) {
      onInvoiceUpdate(updatedInvoice)
    }
  }

  const handleFormSubmit = async (data: any) => {
    if (!mercoaSession.entityId && !mercoaSession.entityGroupId) return

    const invoiceClient = getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')
    if (!invoiceClient) return

    setFormLoading(true)

    try {
      const newInvoice: Mercoa.InvoiceCreationRequest | false = receivableFormUtils.validateAndConstructPayload({
        formData: data,
        mercoaSession,
        toast,
      })

      if (!newInvoice) {
        setFormLoading(false)
        setValue('formAction', '')
        return
      }

      if (newInvoice.payerId && mercoaSession.entityId) {
        try {
          await mercoaSession.client?.entity.counterparty.addPayors(mercoaSession.entityId, {
            payors: [newInvoice.payerId],
          })
        } catch (error: any) {
          // Non-critical error, log but continue
          console.error('Failed to add counterparty:', error)
        }
      }

      if (
        receivableData &&
        [ReceivableFormAction.SEND_EMAIL, ReceivableFormAction.SAVE_DRAFT].includes(data.formAction)
      ) {
        try {
          const response = await invoiceClient.update(
            receivableData.id,
            data.formAction === ReceivableFormAction.SEND_EMAIL ? { ...newInvoice, status: 'APPROVED' } : newInvoice,
          )
          mercoaSession.debug(response)

          if (!response?.id) {
            toast?.error('Invoice failed to update')
            setValue('formAction', '')
          } else {
            // If it's a SEND_EMAIL action, send the email after successful update
            if (data.formAction === ReceivableFormAction.SEND_EMAIL) {
              try {
                // Send the email only after successful update
                await mercoaSession.client?.invoice.paymentLinks.sendPayerEmail(response.id, { attachInvoice: true })
                toast?.success('Email sent')
              } catch (emailError: any) {
                const errorMessage = emailError.body?.message || emailError.message || 'Unknown error'
                toast?.error(`Email failed to send: ${errorMessage}`)
              }
            } else {
              toast?.success('Invoice updated')
            }

            refreshInvoice(receivableData.id, response)
            setValue('formAction', '')
          }
        } catch (error: any) {
          toast?.error(`Failed to update invoice: ${error.message}`)
          console.log('Failed to update invoice', error)
          setValue('formAction', '')
        }
      } else if (data.formAction === ReceivableFormAction.CREATE) {
        try {
          const response = await invoiceClient.create(newInvoice)
          mercoaSession.debug(response)

          if (response?.id) {
            toast?.success('Invoice created')
            refreshInvoice(response.id, response)
            setValue('formAction', '')
          } else {
            toast?.error('Invoice failed to create')
            setValue('formAction', '')
          }
        } catch (error: any) {
          toast?.error(`Failed to create invoice: ${error.message}`)
          setValue('formAction', '')
        }
      }
    } catch (error: any) {
      toast?.error(`An error occurred: ${error.message}`)
      setValue('formAction', '')
    } finally {
      setFormLoading(false)
    }
  }

  const handleActionClick = async (action: ReceivableFormAction) => {
    setValue('formAction', action)
    const invoiceClient = getInvoiceClient(mercoaSession, invoiceType ?? 'invoice')
    if (!mercoaSession.client || !invoiceClient) return

    try {
      switch (action) {
        case ReceivableFormAction.DELETE:
          if (!receivableData?.id) return
          if (confirm('Are you sure you want to delete this invoice? This cannot be undone.')) {
            await invoiceClient.delete(receivableData.id)
            toast?.success('Invoice deleted')
            if (onInvoiceUpdate) onInvoiceUpdate(undefined)
            setValue('formAction', '')
            refreshReceivables()
          }
          break

        case ReceivableFormAction.CANCEL:
          if (!receivableData?.id) return
          if (confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) {
            const response = await invoiceClient.update(receivableData.id, {
              status: Mercoa.InvoiceStatus.Canceled,
            })
            toast?.success('Invoice canceled')
            refreshInvoice(receivableData.id, response)
            setValue('formAction', '')
          }
          break

        case ReceivableFormAction.PREVIEW:
          if (!receivableData?.id) return
          const pdfLink = await invoiceClient.document.generateInvoicePdf(receivableData.id)
          if (pdfLink?.uri) {
            window.open(pdfLink.uri, '_blank')
            setValue('formAction', '')
          } else {
            toast?.error('There was an issue generating the Invoice PDF. Please refresh and try again.')
            setValue('formAction', '')
          }
          break

        case ReceivableFormAction.PAYMENT_LINK:
          if (invoiceType === 'invoiceTemplate') {
            toast?.error('Payment links are not available for invoice templates.')
            setValue('formAction', '')
            return
          }
          if (!receivableData?.id || !receivableData.payer) {
            toast?.error('There is no payer associated with this invoice. Please select a payer and save draft.')
            return
          }
          const paymentLink = await mercoaSession.client?.invoice.paymentLinks.getPayerLink(receivableData.id)
          if (paymentLink) {
            window.open(paymentLink, '_blank')
          } else {
            toast?.error('There was an issue creating the payment link. Please refresh and try again.')
            setValue('formAction', '')
          }
          break

        case ReceivableFormAction.RESEND_EMAIL:
          if (invoiceType === 'invoiceTemplate') {
            toast?.error('Email sending is not available for invoice templates.')
            setValue('formAction', '')
            return
          }
          if (!receivableData?.id || !receivableData.payer) {
            toast?.error('There is no payer associated with this invoice. Please select a payer and save draft.')
            setValue('formAction', '')
            return
          }
          if (!receivableData.payer.email) {
            toast?.error(
              'There is no payer email address for this invoice. Please provide an email address and save draft.',
            )
            setValue('formAction', '')
            return
          }

          try {
            await mercoaSession.client?.invoice.paymentLinks.sendPayerEmail(receivableData.id, { attachInvoice: true })
            toast?.info('Email Sent')
          } catch (error: any) {
            const errorMessage = error.body?.message || error.message || 'Unknown error'
            toast?.error(`Failed to send email: ${errorMessage}`)
          } finally {
            setValue('formAction', '')
          }
          break

        case ReceivableFormAction.MARK_AS_PAID:
          if (!receivableData?.id) return
          if (!receivableData.payerId) {
            toast?.error('There is no payer associated with this invoice. Please select a payer and save the invoice.')
            setValue('formAction', '')
            return
          }
          try {
            // if there is no payment source, or the source is not offPlatform, set it to offPlatform
            let paymentSourceId = receivableData.paymentSource?.id
            if (!paymentSourceId) {
              const offPlatformPaymentSource = await mercoaSession.client?.entity.paymentMethod.getAll(
                receivableData.payerId,
                {
                  type: Mercoa.PaymentMethodType.OffPlatform,
                },
              )

              if (offPlatformPaymentSource && offPlatformPaymentSource.length > 0) {
                paymentSourceId = offPlatformPaymentSource[0].id
              } else {
                // Create offPlatform payment method if payer entity doesn't have one
                const newPaymentMethod = await mercoaSession.client?.entity.paymentMethod.create(
                  receivableData.payerId,
                  {
                    type: Mercoa.PaymentMethodType.OffPlatform,
                  },
                )
                paymentSourceId = newPaymentMethod.id
              }
            }

            if (!paymentSourceId) {
              toast?.error('There was an issue marking the invoice as paid. Please refresh and try again.')
              setValue('formAction', '')
              return
            }

            const markedAsPaidInvoice = await invoiceClient.update(receivableData.id, {
              status: Mercoa.InvoiceStatus.Paid,
              paymentSourceId,
            })

            toast?.success('Invoice marked as paid')
            refreshInvoice(receivableData.id, markedAsPaidInvoice)
            setValue('formAction', '')
          } catch (error: any) {
            toast?.error(`Failed to mark invoice as paid: ${error.message}`)
            setValue('formAction', '')
          }
          break
        case ReceivableFormAction.SCHEDULE_RECURRING_INVOICE:
          if (!receivableData?.id) return
          try {
            // TODO: This is intentionally incorrect, and is only here to satisfy the backend's requirement of having a deductionDate
            const scheduledInvoice = await invoiceClient.update(receivableData.id, {
              status: Mercoa.InvoiceStatus.Scheduled,
              deductionDate: dayjs().toDate(),
            })
            toast?.success('Recurring invoice scheduled')
            refreshInvoice(receivableData.id, scheduledInvoice)
            setValue('formAction', '')
          } catch (error: any) {
            toast?.error(`Failed to schedule recurring invoice: ${error.message}`)
            setValue('formAction', '')
          }
          break

        case ReceivableFormAction.RESTORE_AS_DRAFT:
          if (!receivableData?.id) return
          const restoredInvoice = await invoiceClient.update(receivableData.id, {
            status: Mercoa.InvoiceStatus.Draft,
          })
          toast?.success('Invoice restored as draft')
          refreshInvoice(receivableData.id, restoredInvoice)
          setValue('formAction', '')
          break
      }
    } catch (e: any) {
      toast?.error(`There was an issue performing the action.\n Error: ${e.body}`)
    }
    setFormLoading(false)
  }

  const setMethodOnTypeChange = (
    paymentMethodType: Mercoa.PaymentMethodType | string,
    type: 'source' | 'destination',
  ) => {
    if (type === 'destination') {
      setValue('paymentDestinationOptions', undefined)
    }

    const paymentMethodPayload: any =
      type === 'destination'
        ? receivableFormUtils.getDestinationPaymentMethodByType(paymentMethodType, destinationPaymentMethods ?? [])
        : receivableFormUtils.getSourcePaymentMethodByType(paymentMethodType, sourcePaymentMethods ?? [])

    if (type === 'destination') {
      setValue('paymentDestinationId', paymentMethodPayload.paymentDestinationId)
      setValue('paymentDestinationOptions', paymentMethodPayload.paymentDestinationOptions)
      setValue('paymentDestination', paymentMethodPayload.paymentDestination)
    } else {
      setValue('paymentSourceId', paymentMethodPayload.paymentSourceId)
      setValue('paymentSourceCheckEnabled', paymentMethodPayload.paymentSourceCheckEnabled)
    }

    clearErrors(type === 'destination' ? 'paymentDestinationId' : 'paymentSourceId')
  }

  const paymentMethodContext: ReceivablePaymentMethodContext = {
    setMethodOnTypeChange: setMethodOnTypeChange,
    sourcePaymentMethods: sourcePaymentMethods,
    destinationPaymentMethods: destinationPaymentMethods,
    selectedSourcePaymentMethodId: selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId: selectedDestinationPaymentMethodId,
    setSelectedSourcePaymentMethodId: (paymentMethodId: string) => setValue('paymentSourceId', paymentMethodId),
    setSelectedDestinationPaymentMethodId: (paymentMethodId: string) =>
      setValue('paymentDestinationId', paymentMethodId),
    availableSourceTypes: receivableFormUtils.getAvailablePaymentMethodTypes(
      'source',
      sourcePaymentMethods ?? [],
      destinationPaymentMethods ?? [],
      mercoaSession,
    ),
    selectedSourceType: watch('paymentSourceType') as Mercoa.PaymentMethodType | undefined,
    setSelectedSourceType: (type: Mercoa.PaymentMethodType) => setValue('paymentSourceType', type),
    availableDestinationTypes: receivableFormUtils.getAvailablePaymentMethodTypes(
      'destination',
      sourcePaymentMethods ?? [],
      destinationPaymentMethods ?? [],
      mercoaSession,
    ),
    selectedDestinationType: watch('paymentDestinationType') as Mercoa.PaymentMethodType | undefined,
    setSelectedDestinationType: (type: Mercoa.PaymentMethodType) => setValue('paymentDestinationType', type),
    paymentLink,
  }

  const recurringScheduleContext: ReceivableRecurringScheduleContext = {
    type: paymentScheduleType as 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime',
    repeatEvery: paymentScheduleRepeatEvery as number | undefined,
    repeatOn: paymentScheduleRepeatOn as Array<Mercoa.DayOfWeek> | undefined,
    repeatOnDay: paymentScheduleRepeatOnDay as number | undefined,
    repeatOnMonth: paymentScheduleRepeatOnMonth as number | undefined,
    ends: paymentScheduleEnds as Date | undefined,
    //@ts-ignore
    setType: (type: 'weekly' | 'monthly' | 'yearly' | 'daily' | 'oneTime') => setValue('paymentSchedule.type', type),
    //@ts-ignore
    setRepeatEvery: (repeatEvery: number) => setValue('paymentSchedule.repeatEvery', repeatEvery),
    //@ts-ignore
    setRepeatOn: (repeatOn: Array<Mercoa.DayOfWeek>) => setValue('paymentSchedule.repeatOn', repeatOn),
    //@ts-ignore
    setRepeatOnDay: (repeatOnDay: number) => setValue('paymentSchedule.repeatOnDay', repeatOnDay),
    //@ts-ignore
    setRepeatOnMonth: (repeatOnMonth: number) => setValue('paymentSchedule.repeatOnMonth', repeatOnMonth),
    //@ts-ignore
    setEnds: (ends: Date | undefined) => setValue('paymentSchedule.ends', ends),
  }

  const out: ReceivableDetailsContextValue = {
    propsContextValue: props,

    displayContextValue: {
      heightOffset: heightOffset ?? 0,
      height,
    },

    formContextValue: {
      formMethods,
      handleFormSubmit,
      formLoading,
      handleActionClick,
      paymentMethodContextValue: paymentMethodContext,
      payerContextValue: {
        selectedPayer: watch('payer') as any,
        setSelectedPayer: (payer: Mercoa.EntityResponse | undefined) => {
          useOnceAfterPayerChange.current = true
          setValue('payer', payer)
        },
      },
      recurringScheduleContextValue: recurringScheduleContext,
    },

    dataContextValue: {
      invoice: receivableData,
      invoiceType: invoiceType ?? 'invoice',
      invoiceLoading: receivableDataLoading,
      refreshInvoice,
    },
  }

  return out
}
