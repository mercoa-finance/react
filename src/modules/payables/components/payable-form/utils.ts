
import { currencyCodeToSymbol } from '../../../../lib/currency'
import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { MercoaContext } from '../../../../components'
import {
  baseSaveDraftSchema,
  baseSchedulePaymentSchema,
  baseSchema,
  baseSubmitForApprovalSchema,
  INVOICE_FIELDS,
  PayableAction,
} from './constants'
import { PayableFormConfig, PayableFormData } from './types'
import accounting from 'accounting'
import Big from 'big.js'

export async function onSubmitCounterparty({
  data,
  profile,
  mercoaSession,
  type,
  onSelect,
}: {
  data: any
  profile: Mercoa.EntityRequest | Mercoa.EntityUpdateRequest
  mercoaSession: MercoaContext
  type: 'payee' | 'payor'
  onSelect?: (counterparty: Mercoa.CounterpartyResponse | undefined) => any
}) {
  if (!mercoaSession.entity?.id) return

  let counterparty: Mercoa.CounterpartyResponse | undefined = undefined

  if (data?.id && data.id !== 'new') {
    counterparty = await mercoaSession.client?.entity.update(data.id, profile)
  } else {
    counterparty = await mercoaSession.client?.entity.create(profile as Mercoa.EntityRequest)
  }

  if (!counterparty?.id) return

  if (type === 'payee') {
    await mercoaSession.client?.entity.counterparty.addPayees(mercoaSession.entity.id, {
      payees: [counterparty.id],
    })
  } else {
    await mercoaSession.client?.entity.counterparty.addPayors(mercoaSession.entity.id, {
      payors: [counterparty.id],
    })
  }
  if (onSelect) onSelect(counterparty)
}

export function createCounterpartyRequest({
  data,
  setError,
  type,
}: {
  data: any
  setError: any
  type: 'payee' | 'payor'
}): Mercoa.EntityRequest | Mercoa.EntityUpdateRequest | undefined {
  const profile: Mercoa.ProfileRequest = {}

  if (data.accountType === 'individual') {
    profile.individual = {
      email: data.email,
      name: {
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        middleName: data.middleName ?? '',
        suffix: data.suffix ?? '',
      },
    }

    if (!profile.individual.name.firstName) {
      setError('vendor.firstName', {
        type: 'manual',
        message: 'First Name is required',
      })
      return
    }
    if (!profile.individual.name.lastName) {
      setError('vendor.lastName', {
        type: 'manual',
        message: 'Last Name is required',
      })
      return
    }
  } else {
    profile.business = {
      email: data.email,
      description: data.description,
      website: data.website,
      legalBusinessName: data.name,
      ...(data.addressLine1 && {
        address: {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          stateOrProvince: data.stateOrProvince,
          postalCode: data.postalCode,
          country: 'US',
        },
      }),
    }
    if (!profile.business?.legalBusinessName) {
      setError('vendor.name', {
        type: 'manual',
        message: 'Name is required',
      })
      return
    }
    if (!profile.business?.website && !profile.business?.description) {
      setError('vendor.website', {
        type: 'manual',
        message: 'Website or description is required',
      })
      setError('vendor.description', {
        type: 'manual',
        message: 'Website or description is required',
      })
      return
    }
  }
  if (data?.id && data.id !== 'new') {
    return {
      profile,
      accountType: data.accountType,
    }
  } else {
    return {
      profile,
      accountType: data.accountType,
      isPayee: type === 'payee',
      isPayor: type === 'payor',
      isCustomer: false,
    }
  }
}

export function showMetadata({
  schema,
  hasDocument,
  hasNoLineItems,
  entityMetadata,
  lineItem,
  paymentDestinationType,
  paymentSourceType,
}: {
  schema: Mercoa.MetadataSchema
  hasDocument: boolean
  hasNoLineItems: boolean
  entityMetadata?: string[]
  lineItem?: boolean
  paymentDestinationType?: Mercoa.PaymentMethodType
  paymentSourceType?: Mercoa.PaymentMethodType
}) {
  if (schema.showConditions?.hasDocument && !hasDocument) {
    return false
  }

  if (schema.showConditions?.hasNoLineItems && !hasNoLineItems) {
    return false
  }

  if (schema.type === Mercoa.MetadataType.KeyValue && (!entityMetadata || entityMetadata.length === 0)) {
    return false
  }

  if (schema.showConditions?.hasOptions && (!entityMetadata || entityMetadata.length === 0)) {
    return false
  }

  if (schema.lineItem && !lineItem) {
    return false
  }

  if (schema.showConditions?.paymentDestinationTypes && schema.showConditions.paymentDestinationTypes.length > 0) {
    if (!paymentDestinationType) return false
    if (schema.showConditions.paymentDestinationTypes.includes('custom')) {
      if (!paymentDestinationType.startsWith('cpms_')) return false
      if (!schema.showConditions?.paymentDestinationCustomSchemaIds?.includes(paymentDestinationType)) return false
    } else if (!schema.showConditions.paymentDestinationTypes.includes(paymentDestinationType)) {
      return false
    }
  }

  if (schema.showConditions?.paymentSourceTypes && schema.showConditions.paymentSourceTypes.length > 0) {
    if (!paymentSourceType) return false
    if (schema.showConditions.paymentSourceTypes.includes('custom')) {
      if (!paymentSourceType.startsWith('cpms_')) return false
      if (!schema.showConditions?.paymentSourceCustomSchemaIds?.includes(paymentSourceType)) return false
    } else if (!schema.showConditions.paymentSourceTypes.includes(paymentSourceType)) {
      return false
    }
  }

  return true
}

export function getValidationSchema({ action, config }: { action: PayableAction; config: object }) {
  if (action === PayableAction.SAVE_AS_DRAFT) return baseSaveDraftSchema
  if (action === PayableAction.SUBMIT_FOR_APPROVAL) return baseSubmitForApprovalSchema
  if (action === PayableAction.SCHEDULE_PAYMENT) return baseSchedulePaymentSchema
  return baseSchema
}

export async function validateSchema({
  setError,
  schema,
  data,
}: {
  setError: any
  schema: yup.ObjectSchema<any>
  data: Record<string, any>
}): Promise<boolean> {
  try {
    await schema.validate(data, { abortEarly: false })
    return true
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      err.inner.forEach((error) => {
        if (error.path) {
          setError(error.path, { type: 'manual', message: error.message })
        }
      })
    }
    return false
  }
}

export const validateAndFormatPaymentSchedule = (data: any, toast: any) => {
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

export const validatePaymentDestinationOptions = (data: any) => {
  if (
    data.paymentDestinationOptions?.type === Mercoa.PaymentMethodType.BankAccount &&
    data.paymentDestinationType !== Mercoa.PaymentMethodType.BankAccount
  ) {
    data.paymentDestinationOptions = undefined
  } else if (
    data.paymentDestinationOptions?.type === Mercoa.PaymentMethodType.Check &&
    data.paymentDestinationType !== Mercoa.PaymentMethodType.Check
  ) {
    data.paymentDestinationOptions = undefined
  }
  return true
}

export const validateMetadata = (
  data: PayableFormData,
  invoiceData: Mercoa.InvoiceCreationRequest,
  mercoaSession: MercoaContext,
  toast: any,
  setError: any,
  uploadedDocument?: string,
) => {
  if (mercoaSession.organization?.metadataSchema) {
    if (!invoiceData.metadata) invoiceData.metadata = {}
    for (const [key, value] of Object.entries(invoiceData.metadata)) {
      const metadataSchema = mercoaSession.organization?.metadataSchema?.find((e) => e.key === key)
      if (metadataSchema && metadataSchema.validationRules?.regex) {
        if (
          showMetadata({
            schema: metadataSchema,
            entityMetadata: [],
            lineItem: false,
            hasDocument: !!uploadedDocument,
            hasNoLineItems: data.lineItems?.length === 0,
            paymentDestinationType: data.paymentDestinationType as Mercoa.PaymentMethodType,
            paymentSourceType: data.paymentSourceType as Mercoa.PaymentMethodType,
          })
        ) {
          const regex = new RegExp(metadataSchema.validationRules.regex)
          if (!regex.test(value)) {
            toast.error(metadataSchema.validationRules.errorMessage)
            setError('metadata', { type: 'manual', message: metadataSchema.validationRules.errorMessage })
            return false
          }
        } else {
          delete invoiceData.metadata[key]
        }
      }
    }
  }
  return true
}

export const validateCheckPaymentSource = (data: PayableFormData, mercoaSession: MercoaContext, setError: any) => {
  if (data.paymentDestinationType === 'check') {
    if (data.paymentSourceType !== 'bankAccount') {
      setError('paymentSourceId', {
        type: 'manual',
        message: 'Please select a bank account that is authorized to send checks',
      })
      return false
    } else if (!data.paymentSourceCheckEnabled) {
      setError('paymentSourceId', { type: 'manual', message: 'This bank account is not authorized to send checks' })
      return false
    }
  }
  return true
}

export const validatePaymentSchemaIds = (data: PayableFormData, setError: any) => {
  if (data.paymentDestinationSchemaId && !data.paymentSourceSchemaId) {
    setError('paymentSourceId', { type: 'manual', message: 'These payment types cannot be used together!' })
    setError('paymentDestinationId', { type: 'manual', message: 'These payment types cannot be used together!' })
    return false
  }
  return true
}

export const validateVendorDetails = (
  data: PayableFormData,
  mercoaSession: MercoaContext,
  setError: any,
  selectedVendor?: Mercoa.CounterpartyResponse,
) => {
  if (data.paymentDestinationType === 'bankAccount') {
    if (selectedVendor?.accountType === 'business') {
      if (!selectedVendor?.profile?.business?.description && !selectedVendor?.profile?.business?.website) {
        setError('vendor', { type: 'manual', message: 'Please provide the vendor business description or website' })
        return false
      }
    } else {
      if (!selectedVendor?.profile?.individual?.email && !selectedVendor?.profile?.individual?.phone?.number) {
        setError('vendor', { type: 'manual', message: 'Please provide the vendor email or phone number' })
        return false
      }
    }
  }
  return true
}

export const validateUtilityPaymentSource = (data: PayableFormData, mercoaSession: MercoaContext, setError: any) => {
  if (data.paymentDestinationType === 'utility') {
    if (data.paymentSourceType !== 'bankAccount' && !data.paymentSourceType?.startsWith('cpms_')) {
      setError('paymentSourceId', {
        type: 'manual',
        message: 'Please select a payment source that can make utility payments',
      })
      return false
    }
  }
  return true
}

export const autoAssignVendorCredits = async (
  invoiceData: Mercoa.InvoiceCreationRequest,
  mercoaSession: MercoaContext,
  nextInvoiceState: Mercoa.InvoiceStatus,
  toast: any,
  invoice?: Mercoa.InvoiceResponse,
) => {
  const vendorCreditUpdateStatuses: Mercoa.InvoiceStatus[] = [
    Mercoa.InvoiceStatus.New,
    Mercoa.InvoiceStatus.Approved,
    Mercoa.InvoiceStatus.Scheduled,
  ]

  if (vendorCreditUpdateStatuses.includes(nextInvoiceState)) {
    if (invoiceData.payerId && invoiceData.vendorId && invoiceData.amount) {
      const vendorCreditUsage = await mercoaSession.client?.entity.counterparty.vendorCredit.estimateUsage(
        invoiceData.payerId,
        invoiceData.vendorId,
        {
          amount: Number(invoiceData.amount),
          currency: 'USD',
          ...(invoice?.id && { excludedInvoiceIds: [invoice.id] }),
        },
      )
      const vendorCredits = vendorCreditUsage?.vendorCredits
      if (vendorCredits && vendorCredits.length > 0) {
        invoiceData.vendorCreditIds = vendorCredits.map((vendorCredit) => vendorCredit.id)
      }
    }
  }
  return true
}

export const validateLineItems = (
  invoiceData: Mercoa.InvoiceCreationRequest,
  mercoaSession: MercoaContext,
  setError: any,
  lineItemDescriptionOptional?: boolean,
) => {
  // amount and description are required if line items are required
  if (
    ![Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Unassigned].includes(invoiceData.status as any) &&
    mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled &&
    invoiceData.lineItems &&
    invoiceData.lineItems.length > 0
  ) {
    for (let index = 0; index < invoiceData.lineItems.length; index++) {
      const lineItem = invoiceData.lineItems[index]
      if (!lineItem.amount && lineItem.amount !== 0) {
        setError(`lineItems.${index}.amount`, {
          type: 'manual',
          message: 'Please enter an amount',
        })
        return false
      }

      if (!lineItem.description && !lineItemDescriptionOptional) {
        setError(`lineItems.${index}.description`, {
          type: 'manual',
          message: 'Please enter a description',
        })
        return false
      }
    }
  }

  // amount should match sum of line items, tax, and shipping
  if (
    ![Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Unassigned].includes(invoiceData.status as any) &&
    mercoaSession.iframeOptions?.options?.invoice?.lineItems != Mercoa.LineItemAvailabilities.Disabled &&
    ((invoiceData.lineItems && invoiceData.lineItems.length > 0) || invoiceData.taxAmount || invoiceData.shippingAmount)
  ) {
    let lineItemsTotal = new Big(0)
    invoiceData.lineItems?.forEach((lineItem, index) => {
      lineItemsTotal = lineItemsTotal.add(Number(lineItem.amount))
    })
    lineItemsTotal = lineItemsTotal.add(Number(invoiceData.taxAmount ?? 0)).add(Number(invoiceData.shippingAmount ?? 0))
    if (lineItemsTotal.toNumber() !== Number(invoiceData.amount)) {
      setError('amount', {
        type: 'manual',
        message: `Sum of line item, tax, and shipping amounts does not match total amount.\nSum: ${accounting.formatMoney(
          lineItemsTotal.toNumber(),
          currencyCodeToSymbol(invoiceData.currency),
        )}, Invoice Total: ${accounting.formatMoney(
          Number(invoiceData.amount),
          currencyCodeToSymbol(invoiceData.currency),
        )}`,
      })
      return false
    }
  }

  // at least one line items is required
  if (
    mercoaSession.iframeOptions?.options?.invoice?.lineItems === Mercoa.LineItemAvailabilities.Required &&
    invoiceData.lineItems?.length === 0
  ) {
    setError('lineItems', { type: 'manual', message: 'At least one line item is required' })
    return false
  }

  return true
}

export const validateAmount = (invoiceData: Mercoa.InvoiceCreationRequest, setError: any) => {
  if (Number(invoiceData.amount) < 0.01) {
    setError('amount', { type: 'manual', message: 'Amount must be at least 0.01' })
    return false
  }
  return true
}

export const validatePaymentMethods = (
  invoiceData: Mercoa.InvoiceCreationRequest,
  invoice: Mercoa.InvoiceResponse,
  mercoaSession: MercoaContext,
  setError: any,
  nextInvoiceState: Mercoa.InvoiceStatus,
  toast: any,
) => {
  // Check if payment methods are selected
  if (!invoiceData.paymentSourceId && invoice?.id) {
    toast.error('Please select a payment source')
    setError('paymentSourceId', { type: 'manual', message: 'Please select how you want to pay' })
    return false
  }
  if (!invoiceData.paymentDestinationId && invoice?.id) {
    // if the organization does not allow for na payment destination, check if the payment destination is set
    if (
      !mercoaSession.organization?.paymentMethods?.backupDisbursements?.find((e) => e.type === 'na')?.active ||
      nextInvoiceState === 'SCHEDULED'
    ) {
      toast.error('Please select a payment destination')
      setError('paymentDestinationId', {
        type: 'manual',
        message:
          'Please select how the vendor wants to get paid' +
          (mercoaSession.organization?.paymentMethods?.backupDisbursements?.find((e) => e.type === 'na')?.active
            ? ' or send the vendor an email for their payment details'
            : ''),
      })
      return false
    }
  }
  return true
}

export const validateApprovers = (
  invoiceData: Mercoa.InvoiceCreationRequest,
  invoice: Mercoa.InvoiceResponse,
  setError: any,
) => {
  if (invoiceData.status !== Mercoa.InvoiceStatus.Draft) {
    if (invoiceData.approvers?.length !== invoice?.approvers.length) {
      setError('approvers', { type: 'manual', message: 'Please assign all approvers for this invoice.' })
      return false
    }
  }
  return true
}

export const validateDeductionDate = (
  finalStatus: Mercoa.InvoiceStatus,
  invoiceData: Mercoa.InvoiceCreationRequest,
  setError: any,
) => {
  if (
    (finalStatus === Mercoa.InvoiceStatus.Scheduled || finalStatus === Mercoa.InvoiceStatus.Paid) &&
    !invoiceData.deductionDate
  ) {
    setError('deductionDate', { type: 'manual', message: 'Please select a payment date' })
    return false
  }
  return true
}

export const validateAndConstructPayload = (props: {
  formData: PayableFormData
  invoice?: Mercoa.InvoiceResponse
  saveAsStatus: Mercoa.InvoiceStatus
  action?: PayableAction
  mercoaSession: MercoaContext
  uploadedDocument?: string
  toast: any
  setError: any
  selectedVendor?: Mercoa.CounterpartyResponse
  lineItemDescriptionOptional?: boolean
}) => {
  const {
    formData,
    action,
    saveAsStatus,
    mercoaSession,
    uploadedDocument,
    toast,
    setError,
    selectedVendor,
    invoice,
    lineItemDescriptionOptional,
  } = props

  if (!payableFormUtils.validateAndFormatPaymentSchedule(formData, toast)) {
    return false
  }

  if (!payableFormUtils.validatePaymentDestinationOptions(formData)) {
    return false
  }

  const incompleteInvoiceData: Omit<Mercoa.InvoiceCreationRequest, 'creatorEntityId' | 'creatorEntityGroupId'> = {
    status: saveAsStatus,
    amount: Number(formData.amount),
    taxAmount: typeof formData.taxAmount !== 'undefined' ? Number(formData.taxAmount ?? 0) : undefined,
    shippingAmount: typeof formData.shippingAmount !== 'undefined' ? Number(formData.shippingAmount ?? 0) : undefined,
    currency: formData.currency as Mercoa.CurrencyCode,
    invoiceDate: formData.invoiceDate,
    deductionDate: formData.deductionDate,
    dueDate: formData.dueDate,
    invoiceNumber: formData.invoiceNumber,
    noteToSelf: formData.description,
    payerId: mercoaSession.entity?.id,
    paymentSourceId: formData.paymentSourceId,
    approvers: formData.approvers.filter((e: { assignedUserId: string }) => e.assignedUserId),
    vendorId: formData.vendorId,
    paymentSchedule: formData.paymentSchedule as Mercoa.PaymentSchedule,
    paymentDestinationId: formData.paymentDestinationId,
    batchPayment: formData.batchPayment ?? undefined,
    ...(formData.paymentDestinationType === Mercoa.PaymentMethodType.Check && {
      paymentDestinationOptions: formData.paymentDestinationOptions ?? {
        type: 'check',
        delivery: 'MAIL',
      },
    }),
    ...(formData.paymentDestinationType === Mercoa.PaymentMethodType.BankAccount && {
      paymentDestinationOptions: formData.paymentDestinationOptions ?? {
        type: 'bankAccount',
        delivery: 'ACH_SAME_DAY',
      },
    }),
    ...(formData.paymentDestinationType === Mercoa.PaymentMethodType.Utility &&
      formData.paymentDestinationOptions && {
        paymentDestinationOptions: {
          type: 'utility',
          accountId: (formData.paymentDestinationOptions as any)?.accountId,
        },
      }),
    lineItems: formData.lineItems?.map((lineItem: any) => {
      const out: Mercoa.InvoiceLineItemUpdateRequest = {
        ...(lineItem.id && { id: lineItem.id }),
        description: lineItem.description,
        amount: Number(lineItem.amount),
        quantity: Number(lineItem.quantity),
        unitPrice: Number(lineItem.unitPrice),
        category: lineItem.category ?? 'EXPENSE',
        metadata: lineItem.metadata
          ? (JSON.parse(JSON.stringify(lineItem.metadata)) as unknown as Record<string, string>)
          : {},
        currency: (formData.currency as Mercoa.CurrencyCode) ?? 'USD',
        glAccountId: lineItem.glAccountId,
      }
      return out
    }),
    metadata: JSON.parse(JSON.stringify(formData.metadata)) as unknown as Record<string, string>,
    document: uploadedDocument,
    creatorUserId: mercoaSession.user?.id,
  } as any
  // Note: Typescript isn't smart enough to know that entityGroupId and entityId must be set at these points
  const createUnassignedInvoice = !!mercoaSession.entityGroup?.id && !mercoaSession.entity?.id
  const invoiceRequestData: Mercoa.InvoiceCreationRequest = createUnassignedInvoice
    ? {
        ...incompleteInvoiceData,
        creatorEntityGroupId: mercoaSession.entityGroup?.id ?? '',
      }
    : {
        ...incompleteInvoiceData,
        creatorEntityId: mercoaSession.entity?.id ?? '',
      }

  if (
    [PayableAction.SUBMIT_FOR_APPROVAL, PayableAction.SCHEDULE_PAYMENT, PayableAction.RETRY_PAYMENT].includes(action!)
  ) {
    if (
      !payableFormUtils.validateSchema({
        setError,
        schema: action === PayableAction.SUBMIT_FOR_APPROVAL ? baseSubmitForApprovalSchema : baseSchedulePaymentSchema,
        data: invoiceRequestData,
      })
    ) {
      return false
    }

    if (!payableFormUtils.validateLineItems(invoiceRequestData, mercoaSession, setError, lineItemDescriptionOptional)) {
      return false
    }

    if (!payableFormUtils.validateAmount(invoiceRequestData, setError)) {
      return false
    }

    if (
      !payableFormUtils.validatePaymentMethods(
        invoiceRequestData,
        invoice!,
        mercoaSession,
        setError,
        saveAsStatus,
        toast,
      )
    ) {
      return false
    }

    if (!payableFormUtils.validateApprovers(invoiceRequestData, invoice!, setError)) {
      return false
    }
  }

  if (!payableFormUtils.validateDeductionDate(saveAsStatus, invoiceRequestData, setError)) {
    return false
  }

  if (
    !payableFormUtils.validateMetadata(formData, invoiceRequestData, mercoaSession, toast, setError, uploadedDocument)
  ) {
    return false
  }

  if (!payableFormUtils.validateCheckPaymentSource(formData, mercoaSession, setError)) {
    return false
  }

  if (!payableFormUtils.validatePaymentSchemaIds(formData, setError)) {
    return false
  }

  if (!payableFormUtils.validateVendorDetails(formData, mercoaSession, setError, selectedVendor)) {
    return false
  }

  if (!payableFormUtils.autoAssignVendorCredits(invoiceRequestData, mercoaSession, saveAsStatus, toast, invoice)) {
    return false
  }

  return invoiceRequestData
}

export const getNextInvoiceStatus = (action: PayableAction, mercoaSession: MercoaContext) => {
  if (action === PayableAction.CREATE) {
    return !!mercoaSession.entityGroup?.id && !mercoaSession.entity?.id
      ? Mercoa.InvoiceStatus.Unassigned
      : Mercoa.InvoiceStatus.Draft
  }
  if (
    action === PayableAction.SUBMIT_FOR_APPROVAL ||
    action === PayableAction.APPROVE ||
    action === PayableAction.REJECT
  ) {
    return Mercoa.InvoiceStatus.New
  }
  if (action === PayableAction.SCHEDULE_PAYMENT || action === PayableAction.RETRY_PAYMENT) {
    return Mercoa.InvoiceStatus.Scheduled
  }
  if (action === PayableAction.MARK_PAID || action === PayableAction.PRINT_CHECK) {
    return Mercoa.InvoiceStatus.Paid
  }
  return Mercoa.InvoiceStatus.Draft
}

export const payableFormUtils = {
  validateAndConstructPayload,
  validateAndFormatPaymentSchedule,
  validatePaymentDestinationOptions,
  validateMetadata,
  validateCheckPaymentSource,
  validatePaymentSchemaIds,
  validateVendorDetails,
  autoAssignVendorCredits,
  validateLineItems,
  validateAmount,
  validatePaymentMethods,
  validateApprovers,
  validateDeductionDate,
  validateSchema,
  getNextInvoiceStatus,
}

export const getSchema = (config: PayableFormConfig, baseSchema: any, invoice?: Mercoa.InvoiceResponse) => {
  if (!invoice || [Mercoa.InvoiceStatus.Draft, Mercoa.InvoiceStatus.Unassigned].includes(invoice.status as any)) {
    return getDraftSchema(config, baseSchema)
  }
  if (Mercoa.InvoiceStatus.New === invoice?.status) {
    return getApprovalSchema(config, baseSchema)
  }
  if (Mercoa.InvoiceStatus.Approved === invoice?.status) {
    return getScheduledSchema(config, baseSchema)
  }
}

export const getDraftSchema = (config: PayableFormConfig, baseSchema: any) => {
  const draftConfig = config[Mercoa.InvoiceStatus.Draft]
  const draftSchema = baseSchema.shape({
    ...Object.keys(draftConfig).reduce((acc: any, key: any) => {
      acc[key] = (draftConfig[key as INVOICE_FIELDS] as { required: boolean }).required
        ? yup.string().required()
        : yup.string()
      return acc
    }, {}),
  })

  return draftSchema as typeof baseSchema
}

export const getApprovalSchema = (config: PayableFormConfig, baseSchema: any) => {
  const approvalConfig = config[Mercoa.InvoiceStatus.Approved]
  const approvalSchema = baseSchema.shape({
    ...Object.keys(approvalConfig).reduce((acc: any, key: any) => {
      acc[key] = (approvalConfig[key as INVOICE_FIELDS] as { required: boolean }).required
        ? yup.string().required()
        : yup.string()
      return acc
    }, {}),
  })
  return approvalSchema as typeof baseSchema
}

export const getScheduledSchema = (config: PayableFormConfig, baseSchema: any) => {
  const scheduledConfig = config[Mercoa.InvoiceStatus.Scheduled]
  const scheduledSchema = baseSchema.shape({
    ...Object.keys(scheduledConfig).reduce((acc: any, key: any) => {
      acc[key] = (scheduledConfig[key as INVOICE_FIELDS] as { required: boolean }).required
        ? yup.string().required()
        : yup.string()
      return acc
    }, {}),
  })
  return scheduledSchema as typeof baseSchema
}
