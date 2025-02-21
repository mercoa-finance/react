import { yupResolver } from '@hookform/resolvers/yup'
import { Mercoa } from '@mercoa/javascript'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { usePaymentLink, usePaymentMethods, useReceivableDetailQuery, useSupportedCurrencies } from '../api/queries'
import { ReceivableAction } from '../constants'
import { PaymentMethodContext } from '../providers/receivable-detail-provider'
import { receivableUtils } from '../utils'

export interface ReceivableDetailsHandlers {
  onUpdate: (invoice: Mercoa.InvoiceResponse | undefined) => void
}

export interface ReceivableDetailsQueryParams {
  invoiceId?: string
}

export enum ReceivableDetailsViewMode {
  Document = 'document',
  Form = 'form',
}

export interface ReceivableDetailsLayout {
  viewMode: ReceivableDetailsViewMode
  documentPosition: 'right' | 'left' | 'none'
  heightOffset?: number
}

export interface ReceivableDetailsConfig {
  supportedCurrencies?: Mercoa.CurrencyCode[]
  disableCustomerCreation?: boolean
}

export interface UseReceivableDetailsProps {
  queryParams: ReceivableDetailsQueryParams
  handlers?: ReceivableDetailsHandlers
  layout?: ReceivableDetailsLayout
  config?: ReceivableDetailsConfig
  toast: {
    error: (message: string) => void
    success: (message: string) => void
    info: (message: string) => void
  }
}
export const useReceivableDetails = ({ queryParams, toast, handlers, config }: UseReceivableDetailsProps) => {
  const mercoaSession = useMercoaSession()
  const { onUpdate } = handlers ?? {}
  const { supportedCurrencies, disableCustomerCreation } = config ?? {}

  const [formLoading, setFormLoading] = useState(false)

  const { invoiceId } = queryParams
  const { data: receivableData, isLoading: receivableDataLoading } = useReceivableDetailQuery(invoiceId)
  const { data: supportedCurrenciesFromQuery } = useSupportedCurrencies()
  const { data: paymentLink } = usePaymentLink(invoiceId)
  const usePrefillOnce = useRef(true)
  const useOnceAfterPayerChange = useRef(false)

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
      formAction: yup.string(),
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
  ] = watch([
    'payerId',
    'vendorId',
    'paymentSourceType',
    'paymentDestinationType',
    'paymentSourceId',
    'paymentDestinationId',
  ] as any)

  const { data: sourcePaymentMethods } = usePaymentMethods({
    entityId: payerId ?? receivableData?.payerId,
  })

  const { data: destinationPaymentMethods } = usePaymentMethods({
    entityId: mercoaSession.entityId,
  })

  // initial prefill
  useEffect(() => {
    if (
      !!destinationPaymentMethods &&
      (invoiceId ? !!receivableData && (receivableData.payerId ? !!sourcePaymentMethods : true) : true) &&
      (supportedCurrencies ?? supportedCurrenciesFromQuery) &&
      usePrefillOnce.current
    ) {
      const prefillReceivableData = receivableUtils.getPrefillReceivableData({
        destinationPaymentMethods,
        receivableData,
        supportedCurrencies: supportedCurrencies ?? supportedCurrenciesFromQuery,
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
        ? receivableUtils.getSourcePaymentMethodByType(watch('paymentSourceType') as string, sourcePaymentMethods)
        : receivableUtils.getDefaultSourcePaymentMethod(sourcePaymentMethods)
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

  const refreshInvoice = (invoiceId: string, updatedInvoice?: Mercoa.InvoiceResponse) => {
    queryClient.invalidateQueries({ queryKey: ['receivableDetail', invoiceId] })
    const updatedPrefillReceivableData = receivableUtils.getPrefillReceivableData({
      receivableData: updatedInvoice,
      supportedCurrencies: supportedCurrencies ?? supportedCurrenciesFromQuery,
    })
    reset(updatedPrefillReceivableData as any)
    if (onUpdate) {
      onUpdate(updatedInvoice)
    }
  }

  const handleFormSubmit = async (data: any) => {
    if (!mercoaSession.entityId && !mercoaSession.entityGroupId) return
    const createUnassignedInvoice = !!mercoaSession.entityGroupId && !mercoaSession.entityId
    const incompleteInvoiceData: Omit<Mercoa.InvoiceCreationRequest, 'creatorEntityId' | 'creatorEntityGroupId'> = {
      status: createUnassignedInvoice ? Mercoa.InvoiceStatus.Unassigned : Mercoa.InvoiceStatus.Draft,
      amount: data.amount,
      currency: data.currency ?? 'USD',
      invoiceDate: dayjs(data.invoiceDate).toDate(),
      dueDate: dayjs(data.dueDate).toDate(),
      invoiceNumber: data.invoiceNumber,
      noteToSelf: data.description,
      payerId: data.payerId,
      paymentSourceId: data.paymentSourceId,
      vendorId: mercoaSession.entityId,
      paymentDestinationId: data.paymentDestinationId,
      lineItems: data.lineItems.map((lineItem: any) => ({
        name: lineItem.name,
        description: lineItem.description,
        quantity: Number(lineItem.quantity),
        unitPrice: Number(lineItem.unitPrice),
        amount: Number(lineItem.amount),
        currency: lineItem.currency ?? 'USD',
      })),
    }

    const newInvoice: Mercoa.InvoiceCreationRequest = createUnassignedInvoice
      ? {
          ...incompleteInvoiceData,
          creatorEntityGroupId: mercoaSession.entityGroupId!,
        }
      : {
          ...incompleteInvoiceData,
          creatorEntityId: mercoaSession.entityId!,
        }

    setFormLoading(true)

    if (newInvoice.payerId && mercoaSession.entityId) {
      await mercoaSession.client?.entity.counterparty.addPayors(mercoaSession.entityId, {
        payors: [newInvoice.payerId],
      })
    }

    if (receivableData && [ReceivableAction.SendEmail, ReceivableAction.SaveDraft].includes(data.formAction)) {
      const response = await mercoaSession.client?.invoice.update(
        receivableData.id,
        data.formAction === ReceivableAction.SendEmail ? { ...newInvoice, status: 'APPROVED' } : newInvoice,
      )
      mercoaSession.debug(response)
      setFormLoading(false)
      if (response?.id) {
        toast.success('Invoice updated')
        refreshInvoice(receivableData.id, response)
        if (data.formAction === ReceivableAction.SaveDraft) {
          setValue('formAction', '')
        }
      } else {
        toast.error('Invoice failed to update')
        setValue('formAction', '')
      }
    } else if (data.formAction === ReceivableAction.Create) {
      const response = await mercoaSession.client?.invoice.create(newInvoice)
      mercoaSession.debug(response)
      setFormLoading(false)
      if (response?.id) {
        toast.success('Invoice created')
        refreshInvoice(response.id, response)
        setValue('formAction', '')
      } else {
        toast.error('Invoice failed to create')
        setValue('formAction', '')
      }
    }
  }
  const handleActionClick = async (action: ReceivableAction) => {
    setValue('formAction', action)
    if (!mercoaSession.client) return

    try {
      switch (action) {
        case ReceivableAction.Delete:
          if (!receivableData?.id) return
          if (confirm('Are you sure you want to delete this invoice? This cannot be undone.')) {
            await mercoaSession.client.invoice.delete(receivableData.id)
            toast.success('Invoice deleted')
            if (onUpdate) onUpdate(undefined)
            setValue('formAction', '')
          }
          break

        case ReceivableAction.Cancel:
          if (!receivableData?.id) return
          if (confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) {
            const response = await mercoaSession.client.invoice.update(receivableData.id, {
              status: Mercoa.InvoiceStatus.Canceled,
            })
            toast.success('Invoice canceled')
            refreshInvoice(receivableData.id, response)
            setValue('formAction', '')
          }
          break

        case ReceivableAction.Preview:
          if (!receivableData?.id) return
          const pdfLink = await mercoaSession.client.invoice.document.generateInvoicePdf(receivableData.id)
          if (pdfLink?.uri) {
            window.open(pdfLink.uri, '_blank')
            setValue('formAction', '')
          } else {
            toast.error('There was an issue generating the Invoice PDF. Please refresh and try again.')
            setValue('formAction', '')
          }
          break

        case ReceivableAction.PaymentLink:
          if (!receivableData?.id || !receivableData.payer) {
            toast.error('There is no payer associated with this invoice. Please select a payer and save draft.')
            return
          }
          const paymentLink = await mercoaSession.client.invoice.paymentLinks.getPayerLink(receivableData.id)
          if (paymentLink) {
            window.open(paymentLink, '_blank')
          } else {
            toast.error('There was an issue creating the payment link. Please refresh and try again.')
            setValue('formAction', '')
          }
          break

        case ReceivableAction.SendEmail:
        case ReceivableAction.ResendEmail:
          if (!receivableData?.id || !receivableData.payer) {
            toast.error('There is no payer associated with this invoice. Please select a payer and save draft.')
            return
          }
          if (!receivableData.payer.email) {
            toast.error(
              'There is no payer email address for this invoice. Please provide an email address and save draft.',
            )
            setValue('formAction', '')
            return
          }
          await mercoaSession.client.invoice.paymentLinks.sendPayerEmail(receivableData.id, { attachInvoice: true })
          toast.info('Email Sent')
          setValue('formAction', '')
          break

        case ReceivableAction.MarkAsPaid:
          if (!receivableData?.id) return
          try {
            const markedAsPaidInvoice = await mercoaSession.client.invoice.update(receivableData.id, {
              status: Mercoa.InvoiceStatus.Paid,
            })
            toast.success('Invoice marked as paid')
            refreshInvoice(receivableData.id, markedAsPaidInvoice)
            setValue('formAction', '')
          } catch (error: any) {
            toast.error(`Failed to mark invoice as paid: ${error.message}`)
            setValue('formAction', '')
          }
          break
        case ReceivableAction.SchedulePayment:
          if (!receivableData?.id) return
          try {
            const scheduledInvoice = await mercoaSession.client.invoice.update(receivableData.id, {
              status: Mercoa.InvoiceStatus.Scheduled,
            })
            toast.success('Invoice scheduled')
            refreshInvoice(receivableData.id, scheduledInvoice)
            setValue('formAction', '')
          } catch (error: any) {
            toast.error(`Failed to schedule invoice: ${error.message}`)
            setValue('formAction', '')
          }
          break

        case ReceivableAction.RestoreAsDraft:
          if (!receivableData?.id) return
          const restoredInvoice = await mercoaSession.client.invoice.update(receivableData.id, {
            status: Mercoa.InvoiceStatus.Draft,
          })
          toast.success('Invoice restored as draft')
          refreshInvoice(receivableData.id, restoredInvoice)
          setValue('formAction', '')
          break
      }
    } catch (e: any) {
      toast.error(`There was an issue performing the action.\n Error: ${e.body}`)
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
        ? receivableUtils.getDestinationPaymentMethodByType(paymentMethodType, destinationPaymentMethods ?? [])
        : receivableUtils.getSourcePaymentMethodByType(paymentMethodType, sourcePaymentMethods ?? [])

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

  const paymentMethodContext: PaymentMethodContext = {
    setMethodOnTypeChange: setMethodOnTypeChange,
    sourcePaymentMethods: sourcePaymentMethods,
    destinationPaymentMethods: destinationPaymentMethods,
    selectedSourcePaymentMethodId: selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId: selectedDestinationPaymentMethodId,
    setSelectedSourcePaymentMethodId: (paymentMethodId: string) => setValue('paymentSourceId', paymentMethodId),
    setSelectedDestinationPaymentMethodId: (paymentMethodId: string) =>
      setValue('paymentDestinationId', paymentMethodId),
    availableSourceTypes: receivableUtils.getAvailablePaymentMethodTypes(
      'source',
      sourcePaymentMethods ?? [],
      destinationPaymentMethods ?? [],
      mercoaSession,
    ),
    selectedSourceType: watch('paymentSourceType') as Mercoa.PaymentMethodType | undefined,
    setSelectedSourceType: (type: Mercoa.PaymentMethodType) => setValue('paymentSourceType', type),
    availableDestinationTypes: receivableUtils.getAvailablePaymentMethodTypes(
      'destination',
      sourcePaymentMethods ?? [],
      destinationPaymentMethods ?? [],
      mercoaSession,
    ),
    selectedDestinationType: watch('paymentDestinationType') as Mercoa.PaymentMethodType | undefined,
    setSelectedDestinationType: (type: Mercoa.PaymentMethodType) => setValue('paymentDestinationType', type),
  }

  return {
    receivableData,
    selectedPayer: watch('payer') as any,
    setSelectedPayer: (payer: Mercoa.EntityResponse | undefined) => {
      useOnceAfterPayerChange.current = true
      setValue('payer', payer)
    },
    formMethods,
    handleFormSubmit,
    formLoading,
    handleActionClick,
    refreshInvoice,
    disableCustomerCreation: disableCustomerCreation ?? false,
    supportedCurrencies: supportedCurrencies ?? supportedCurrenciesFromQuery,
    paymentLink,
    ...paymentMethodContext,
  }
}
