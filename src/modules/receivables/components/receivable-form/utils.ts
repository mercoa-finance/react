import dayjs from 'dayjs'
import { Mercoa } from '@mercoa/javascript'
import { MercoaContext } from '../../../../components'

const getPrefillReceivableData = ({
  destinationPaymentMethods,
  receivableData,
  supportedCurrencies,
  invoiceType = 'invoice',
}: {
  destinationPaymentMethods?: Mercoa.PaymentMethodResponse[]
  receivableData?: Mercoa.InvoiceResponse
  supportedCurrencies?: Mercoa.CurrencyCode[]
  invoiceType?: 'invoice' | 'invoiceTemplate'
}) => {
  const defaultPaymentMethodDestinationType = getDefaultDestinationType(destinationPaymentMethods ?? [])
  const defaultPaymentMethodDestination = getDefaultDestinationPaymentMethod(destinationPaymentMethods ?? [])
  const defaultPaymentSchedule =
    invoiceType === 'invoiceTemplate'
      ? {
          type: 'daily',
          repeatEvery: 1,
          ends: new Date(),
        }
      : undefined

  const prefillReceivableData = {
    id: receivableData?.id,
    status: receivableData?.status,
    invoiceNumber: receivableData?.invoiceNumber,
    amount: receivableData?.amount,
    currency: receivableData?.currency ?? supportedCurrencies?.[0] ?? 'USD',
    payer: receivableData?.payer,
    payerId: receivableData?.payer?.id,
    payerName: receivableData?.payer?.name,
    invoiceDate: receivableData?.invoiceDate ? dayjs(receivableData.invoiceDate).toDate() : undefined,
    dueDate: receivableData?.dueDate ? dayjs(receivableData.dueDate).toDate() : undefined,
    deductionDate: receivableData?.deductionDate ? dayjs(receivableData.deductionDate).toDate() : undefined,
    lineItems:
      receivableData?.lineItems?.map((lineItem) => ({
        id: lineItem.id ?? '',
        name: lineItem.name ?? '',
        description: lineItem.description ?? '',
        showDescription: lineItem.description ? true : false,
        amount: lineItem.amount ?? 0,
        category: lineItem.category ?? '',
        currency: lineItem.currency ?? supportedCurrencies?.[0] ?? 'USD',
        quantity: lineItem.quantity ?? 0,
        unitPrice: lineItem.unitPrice ?? 0,
        metadata: lineItem.metadata ?? {},
        glAccountId: lineItem.glAccountId ?? '',
        createdAt: lineItem.createdAt ?? new Date(),
        updatedAt: lineItem.updatedAt ?? new Date(),
      })) ?? [],
    paymentSourceType:
      (receivableData
        ? receivableData?.paymentSource?.type === 'custom'
          ? (receivableData.paymentSource as Mercoa.CustomPaymentMethodResponse)?.schemaId
          : receivableData?.paymentSource?.type
        : undefined) ?? (receivableData?.payer ? 'unknown' : undefined),
    paymentDestinationType: receivableData
      ? receivableData?.paymentDestination?.type === 'custom'
        ? (receivableData.paymentDestination as Mercoa.CustomPaymentMethodResponse)?.schemaId
        : receivableData?.paymentDestination?.type
      : defaultPaymentMethodDestinationType,
    paymentDestination: receivableData
      ? receivableData?.paymentDestination
      : defaultPaymentMethodDestination.paymentDestination,
    paymentDestinationId: receivableData
      ? receivableData?.paymentDestination?.id
      : defaultPaymentMethodDestination?.paymentDestinationId,
    paymentDestinationOptions: receivableData
      ? receivableData?.paymentDestinationOptions
      : defaultPaymentMethodDestination?.paymentDestinationOptions,
    paymentSourceId: receivableData ? receivableData?.paymentSource?.id : undefined,
    paymentSource: receivableData ? receivableData?.paymentSource : undefined,
    paymentSourceCheckEnabled: receivableData
      ? (receivableData?.paymentSource as Mercoa.BankAccountResponse)?.checkOptions?.enabled ?? false
      : undefined,
    paymentSchedule: receivableData?.paymentSchedule ?? defaultPaymentSchedule,
    description: receivableData?.noteToSelf ?? '',
    metadata: receivableData?.metadata ?? {},
    creatorUser: receivableData?.creatorUser,
  }

  return prefillReceivableData
}

const getDefaultSourceType = (sourcePaymentMethods: Mercoa.PaymentMethodResponse[]) => {
  const defaultPm = sourcePaymentMethods.find((e) => e.isDefaultSource)
  if (defaultPm) {
    return defaultPm.type === 'custom' ? defaultPm.schemaId : defaultPm.type
  }

  if (sourcePaymentMethods.some((pm) => pm.type === 'bankAccount')) {
    return 'bankAccount'
  } else if (sourcePaymentMethods.some((pm) => pm.type === 'card')) {
    return 'card'
  } else if (sourcePaymentMethods.some((pm) => pm.type === 'check')) {
    return 'check'
  } else if (sourcePaymentMethods.some((pm) => pm.type === 'custom')) {
    const customPm = sourcePaymentMethods.find((pm) => pm.type === 'custom') as Mercoa.PaymentMethodResponse.Custom
    return customPm.schemaId
  } else {
    return 'unknown'
  }
}

const getDefaultDestinationType = (destinationPaymentMethods: Mercoa.PaymentMethodResponse[]) => {
  const defaultPm = destinationPaymentMethods.find((e) => e.isDefaultDestination)
  if (defaultPm) {
    return defaultPm.type === 'custom' ? defaultPm.schemaId : defaultPm.type
  }

  if (destinationPaymentMethods.some((pm) => pm.type === 'bankAccount')) {
    return 'bankAccount'
  } else if (destinationPaymentMethods.some((pm) => pm.type === 'card')) {
    return 'card'
  } else if (destinationPaymentMethods.some((pm) => pm.type === 'check')) {
    return 'check'
  } else if (destinationPaymentMethods.some((pm) => pm.type === 'custom')) {
    const customPm = destinationPaymentMethods.find((pm) => pm.type === 'custom') as Mercoa.PaymentMethodResponse.Custom
    return customPm.schemaId
  }
  return undefined
}

const getDefaultSourcePaymentMethod = (sourcePaymentMethods: Mercoa.PaymentMethodResponse[]) => {
  const defaultPm = sourcePaymentMethods.find((e) => e.isDefaultSource)
  if (defaultPm) {
    return getSourcePaymentMethodByType(
      defaultPm.type === 'custom' ? defaultPm.schemaId : defaultPm.type,
      sourcePaymentMethods,
    )
  }
  const type = getDefaultSourceType(sourcePaymentMethods)
  return getSourcePaymentMethodByType(type, sourcePaymentMethods)
}

const getDefaultDestinationPaymentMethod = (destinationPaymentMethods: Mercoa.PaymentMethodResponse[]) => {
  const defaultPm = destinationPaymentMethods.find((e) => e.isDefaultDestination)
  if (defaultPm) {
    return getDestinationPaymentMethodByType(
      defaultPm.type === 'custom' ? defaultPm.schemaId : defaultPm.type,
      destinationPaymentMethods,
    )
  }

  const type = getDefaultDestinationType(destinationPaymentMethods)
  if (type) {
    return getDestinationPaymentMethodByType(type, destinationPaymentMethods)
  }
  return undefined
}

const getSourcePaymentMethodByType = (
  type: Mercoa.PaymentMethodType | string,
  sourcePaymentMethods: Mercoa.PaymentMethodResponse[],
) => {
  const sourcePaymentMethodPayload: any = {
    paymentSource: undefined,
    paymentSourceId: '',
    paymentSourceType: '',
    paymentSourceCheckEnabled: false,
    paymentSourceCustomSchemaId: '',
  }

  if (type === Mercoa.PaymentMethodType.BankAccount) {
    const account = sourcePaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount,
    ) as Mercoa.PaymentMethodResponse.BankAccount
    sourcePaymentMethodPayload.paymentSourceId = account?.id ?? ''
    sourcePaymentMethodPayload.paymentSourceType = Mercoa.PaymentMethodType.BankAccount
    sourcePaymentMethodPayload.paymentSource = account
  } else if (type === Mercoa.PaymentMethodType.Card) {
    const card = sourcePaymentMethods?.find((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Card)
    sourcePaymentMethodPayload.paymentSourceId = card?.id ?? ''
    sourcePaymentMethodPayload.paymentSourceType = Mercoa.PaymentMethodType.Card
    sourcePaymentMethodPayload.paymentSource = card
  } else if (type === Mercoa.PaymentMethodType.Check) {
    const check = sourcePaymentMethods?.find((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Check)
    sourcePaymentMethodPayload.paymentSourceId = check?.id ?? ''
    sourcePaymentMethodPayload.paymentSourceType = Mercoa.PaymentMethodType.Check
    sourcePaymentMethodPayload.paymentSource = check
  } else if (type === Mercoa.PaymentMethodType.OffPlatform) {
    const offPlatform = sourcePaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.OffPlatform,
    )
    sourcePaymentMethodPayload.paymentSourceId = offPlatform?.id ?? ''
    sourcePaymentMethodPayload.paymentSourceType = Mercoa.PaymentMethodType.OffPlatform
    sourcePaymentMethodPayload.paymentSource = offPlatform
  } else {
    const custom = sourcePaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Custom && paymentMethod.schemaId === type,
    )
    sourcePaymentMethodPayload.paymentSourceId = custom?.id ?? ''
    sourcePaymentMethodPayload.paymentSourceType = Mercoa.PaymentMethodType.Custom
    sourcePaymentMethodPayload.paymentSourceCustomSchemaId = type
    sourcePaymentMethodPayload.paymentSource = custom
  }
  return sourcePaymentMethodPayload
}

const getDestinationPaymentMethodByType = (
  type: Mercoa.PaymentMethodType | string,
  destinationPaymentMethods: Mercoa.PaymentMethodResponse[],
) => {
  const destinationPaymentMethodPayload: any = {
    paymentDestination: undefined,
    paymentDestinationId: '',
    paymentDestinationType: '',
    paymentDestinationOptions: undefined,
    paymentDestinationCustomSchemaId: '',
  }

  if (type === Mercoa.PaymentMethodType.BankAccount) {
    const account = destinationPaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount,
    ) as Mercoa.PaymentMethodResponse.BankAccount
    destinationPaymentMethodPayload.paymentDestinationId = account?.id ?? ''
    destinationPaymentMethodPayload.paymentDestinationType = Mercoa.PaymentMethodType.BankAccount
    destinationPaymentMethodPayload.paymentDestination = account
  } else if (type === Mercoa.PaymentMethodType.Card) {
    const card = destinationPaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Card,
    )
    destinationPaymentMethodPayload.paymentDestinationId = card?.id ?? ''
    destinationPaymentMethodPayload.paymentDestinationType = Mercoa.PaymentMethodType.Card
    destinationPaymentMethodPayload.paymentDestination = card
  } else if (type === Mercoa.PaymentMethodType.Check) {
    const check = destinationPaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Check,
    )
    destinationPaymentMethodPayload.paymentDestinationId = check?.id ?? ''
    destinationPaymentMethodPayload.paymentDestinationType = Mercoa.PaymentMethodType.Check
    destinationPaymentMethodPayload.paymentDestination = check
  } else if (type === Mercoa.PaymentMethodType.OffPlatform) {
    const offPlatform = destinationPaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.OffPlatform,
    )
    destinationPaymentMethodPayload.paymentDestinationId = offPlatform?.id ?? ''
    destinationPaymentMethodPayload.paymentDestinationType = Mercoa.PaymentMethodType.OffPlatform
    destinationPaymentMethodPayload.paymentDestination = offPlatform
  } else {
    const custom = destinationPaymentMethods?.find(
      (paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Custom && paymentMethod.schemaId === type,
    )
    destinationPaymentMethodPayload.paymentDestinationId = custom?.id ?? ''
    destinationPaymentMethodPayload.paymentDestinationType = Mercoa.PaymentMethodType.Custom
    destinationPaymentMethodPayload.paymentDestinationCustomSchemaId = type
    destinationPaymentMethodPayload.paymentDestination = custom
  }

  return destinationPaymentMethodPayload
}

const getAvailablePaymentMethodTypes = (
  type: 'source' | 'destination',
  sourcePaymentMethods: Mercoa.PaymentMethodResponse[],
  destinationPaymentMethods: Mercoa.PaymentMethodResponse[],
  mercoaSession: MercoaContext,
) => {
  const availableTypes: Array<{ key: string; value: string }> = []
  const methods = type === 'source' ? sourcePaymentMethods : destinationPaymentMethods

  if (methods?.some((paymentMethod) => paymentMethod.type === 'bankAccount')) {
    availableTypes.push({ key: 'bankAccount', value: 'Bank Account' })
  }

  if (methods?.some((paymentMethod) => paymentMethod.type === 'card') && type === 'source') {
    availableTypes.push({ key: 'card', value: 'Card' })
  }
  if (methods?.some((paymentMethod) => paymentMethod.type === 'check') && type === 'destination') {
    availableTypes.push({ key: 'check', value: 'Check' })
  }

  methods?.forEach((paymentMethod) => {
    if (paymentMethod.type === 'custom') {
      if (availableTypes.some((type) => type.key === paymentMethod.schemaId)) return
      availableTypes.push({ key: paymentMethod.schemaId ?? '', value: paymentMethod.schema.name ?? '' })
    }
  })

  const offPlatform = mercoaSession.organization?.paymentMethods?.payerPayments.find(
    (e) => e.type === Mercoa.PaymentMethodType.OffPlatform,
  )
  if (offPlatform && offPlatform.active) {
    availableTypes.push({
      key: offPlatform.type,
      value: offPlatform.name,
    })
  }

  if (type === 'source') {
    availableTypes.push({
      key: 'unknown',
      value: 'Request payment information from customer',
    })
  }

  return availableTypes
}

const validateAndFormatPaymentSchedule = (data: any, toast: any) => {
  if (data.paymentSchedule?.type) {
    if (
      isNaN(data.paymentSchedule.repeatEvery) ||
      data.paymentSchedule.repeatEvery < 1 ||
      !data.paymentSchedule.repeatEvery
    ) {
      data.paymentSchedule.repeatEvery = 1
    }
    if (!data.paymentSchedule) {
      toast.error('Please select a payment schedule')
      return false
    }
    if (data.paymentSchedule.type === 'weekly') {
      if (data.paymentSchedule.repeatOn === undefined || data.paymentSchedule.repeatOn.length === 0) {
        toast.error('Please select a day of the week')
        return false
      }
      const out: Mercoa.PaymentSchedule = {
        type: 'weekly',
        repeatOn: data.paymentSchedule.repeatOn,
        repeatEvery: Number(data.paymentSchedule.repeatEvery),
        ends: data.paymentSchedule.ends,
      }
      data.paymentSchedule = out
    } else if (data.paymentSchedule.type === 'monthly') {
      if (isNaN(data.paymentSchedule.repeatOnDay) || !data.paymentSchedule.repeatOnDay) {
        data.paymentSchedule.repeatOnDay = 1
      }
      const out: Mercoa.PaymentSchedule = {
        type: 'monthly',
        repeatOnDay: Number(data.paymentSchedule.repeatOnDay),
        repeatEvery: Number(data.paymentSchedule.repeatEvery),
        ends: data.paymentSchedule.ends,
      }
      data.paymentSchedule = out
    } else if (data.paymentSchedule.type === 'yearly') {
      if (isNaN(data.paymentSchedule.repeatOnDay) || !data.paymentSchedule.repeatOnDay) {
        data.paymentSchedule.repeatOnDay = 1
      }
      if (
        isNaN(data.paymentSchedule.repeatOnMonth) ||
        data.paymentSchedule.repeatOnMonth < 1 ||
        !data.paymentSchedule.repeatOnMonth
      ) {
        data.paymentSchedule.repeatOnMonth = 1
      }
      const out: Mercoa.PaymentSchedule = {
        type: 'yearly',
        repeatOnDay: Number(data.paymentSchedule.repeatOnDay),
        repeatOnMonth: Number(data.paymentSchedule.repeatOnMonth),
        repeatEvery: Number(data.paymentSchedule.repeatEvery),
        ends: data.paymentSchedule.ends,
      }
      data.paymentSchedule = out
    } else if (data.paymentSchedule.type === 'daily') {
      const out: Mercoa.PaymentSchedule = {
        type: 'daily',
        repeatEvery: Number(data.paymentSchedule.repeatEvery),
        ends: data.paymentSchedule.ends,
      }
      data.paymentSchedule = out
    } else {
      const out: Mercoa.PaymentSchedule = {
        type: 'oneTime',
        repeatEvery: 1,
      }
      data.paymentSchedule = out
    }
  } else {
    const out: Mercoa.PaymentSchedule = {
      type: 'oneTime',
      repeatEvery: 1,
    }
    data.paymentSchedule = out
  }
  return true
}

// NOTE: Based loosely on PayableFormUtils.validateAndConstructPayload, with just the minimal functionality
//       needed to pass payment schedules to the backend correctly
// TODO: Type formData as ReceivableFormData when we create that type
const validateAndConstructPayload = (props: { formData: any; mercoaSession: MercoaContext; toast: any }) => {
  const { formData, mercoaSession, toast } = props

  if (!validateAndFormatPaymentSchedule(formData, toast)) {
    return false
  }

  const createUnassignedInvoice = !!mercoaSession.entityGroupId && !mercoaSession.entityId
  const incompleteInvoiceData: Omit<Mercoa.InvoiceCreationRequest, 'creatorEntityId' | 'creatorEntityGroupId'> = {
    status: createUnassignedInvoice ? Mercoa.InvoiceStatus.Unassigned : Mercoa.InvoiceStatus.Draft,
    amount: formData.amount,
    currency: formData.currency ?? 'USD',
    invoiceDate: dayjs(formData.invoiceDate).toDate(),
    dueDate: dayjs(formData.dueDate).toDate(),
    invoiceNumber: formData.invoiceNumber,
    noteToSelf: formData.description,
    payerId: formData.payerId,
    paymentSourceId: formData.paymentSourceId,
    vendorId: mercoaSession.entityId,
    paymentSchedule: formData.paymentSchedule,
    paymentDestinationId: formData.paymentDestinationId,
    lineItems: formData.lineItems.map((lineItem: any) => ({
      name: lineItem.name,
      description: lineItem.description,
      quantity: Number(lineItem.quantity),
      unitPrice: Number(lineItem.unitPrice),
      amount: Number(lineItem.amount),
      currency: lineItem.currency ?? 'USD',
    })),
  }

  const invoiceRequestData: Mercoa.InvoiceCreationRequest = createUnassignedInvoice
    ? {
        ...incompleteInvoiceData,
        creatorEntityGroupId: mercoaSession.entityGroupId!,
      }
    : {
        ...incompleteInvoiceData,
        creatorEntityId: mercoaSession.entityId!,
      }

  return invoiceRequestData
}

export const receivableFormUtils = {
  getPrefillReceivableData,
  getDefaultSourcePaymentMethod,
  getDefaultDestinationPaymentMethod,
  getSourcePaymentMethodByType,
  getDestinationPaymentMethodByType,
  getAvailablePaymentMethodTypes,
  validateAndConstructPayload,
}
