import dayjs from 'dayjs'
import { Mercoa } from '@mercoa/javascript'
import { MercoaContext } from '../../components'

export const getPrefillReceivableData = ({
  destinationPaymentMethods,
  receivableData,
  supportedCurrencies,
}: {
  destinationPaymentMethods?: Mercoa.PaymentMethodResponse[]
  receivableData?: Mercoa.InvoiceResponse
  supportedCurrencies?: Mercoa.CurrencyCode[]
}) => {
  const defaultPaymentMethodDestinationType = getDefaultDestinationType(destinationPaymentMethods ?? [])
  const defaultPaymentMethodDestination = getDefaultDestinationPaymentMethod(destinationPaymentMethods ?? [])

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
    description: receivableData?.noteToSelf ?? '',
    metadata: receivableData?.metadata ?? {},
    creatorUser: receivableData?.creatorUser,
  }

  return prefillReceivableData
}

export const getDefaultSourceType = (sourcePaymentMethods: Mercoa.PaymentMethodResponse[]) => {
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

export const getDefaultDestinationType = (destinationPaymentMethods: Mercoa.PaymentMethodResponse[]) => {
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

export const getDefaultSourcePaymentMethod = (sourcePaymentMethods: Mercoa.PaymentMethodResponse[]) => {
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

export const getDefaultDestinationPaymentMethod = (destinationPaymentMethods: Mercoa.PaymentMethodResponse[]) => {
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

export const getSourcePaymentMethodByType = (
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

export const getDestinationPaymentMethodByType = (
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

export const receivableUtils = {
  getPrefillReceivableData,
  getDefaultSourcePaymentMethod,
  getDefaultDestinationPaymentMethod,
  getSourcePaymentMethodByType,
  getDestinationPaymentMethodByType,
  getAvailablePaymentMethodTypes,
}
