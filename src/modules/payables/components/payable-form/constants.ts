import { Mercoa } from '@mercoa/javascript'
import * as yup from 'yup'
import { removeThousands } from '../../../../lib/lib'
import { PayableFormConfig } from './types'

export const counterpartyYupValidation = {
  id: yup.string().nullable(),
  name: yup.string().typeError('Please enter a name'),
  email: yup.string().email('Please enter a valid email'),
  accountType: yup.string(),
  firstName: yup.string(),
  lastName: yup.string(),
  middleName: yup.string(),
  suffix: yup.string(),
  website: yup
    .string()
    .url('Website must be a valid URL')
    .transform((currentValue) => {
      const doesNotStartWithHttp =
        currentValue && !currentValue.startsWith('http://') && !currentValue.startsWith('https://')
      if (doesNotStartWithHttp) {
        return `http://${currentValue}`
      }
      return currentValue
    }),
  description: yup.string(),
  accounts: yup.array().of(
    yup.object().shape({
      accountId: yup.string(),
      postalCode: yup.string().nullable(),
      nameOnAccount: yup.string().nullable(),
    }),
  ),
}

export const afterScheduledStatus = [
  Mercoa.InvoiceStatus.Pending,
  Mercoa.InvoiceStatus.Paid,
  Mercoa.InvoiceStatus.Canceled,
  Mercoa.InvoiceStatus.Archived,
  Mercoa.InvoiceStatus.Refused,
]

export const afterApprovedStatus = [...afterScheduledStatus, Mercoa.InvoiceStatus.Scheduled]

export const baseSchema = yup
  .object({
    id: yup.string().nullable(),
    status: yup.string(),
    amount: yup.number().transform(removeThousands).positive().typeError('Please enter a valid number'),
    invoiceNumber: yup.string(),
    description: yup.string(),
    processedAt: yup.date().nullable(),
    dueDate: yup.date().typeError('Please select a due date'),
    deductionDate: yup.date().typeError('Please select a deduction date'),
    invoiceDate: yup.date().typeError('Please select an invoice date'),
    approvers: yup.mixed(),
    lineItems: yup.array().of(
      yup.object({
        id: yup.string(),
        description: yup.string().nullable(),
        amount: yup.number().transform(removeThousands).nullable(),
        quantity: yup.number().transform(removeThousands).nullable(),
        unitPrice: yup.number().transform(removeThousands).nullable(),
        category: yup.mixed().nullable(),
        currency: yup.string().nullable(),
        metadata: yup.mixed().nullable(),
        glAccountId: yup.string().nullable(),
        createdAt: yup.date().nullable(),
        updatedAt: yup.date().nullable(),
      }),
    ),
    currency: yup.string().required(),
    payerId: yup.string(),
    vendorId: yup.string(),
    vendorName: yup.string(),
    paymentDestinationId: yup.string(),
    paymentDestinationType: yup.string(),
    paymentDestinationSchemaId: yup.string().nullable(),
    paymentDestinationOptions: yup.mixed().nullable(),
    paymentSourceId: yup.string(),
    paymentSourceType: yup.string(),
    paymentSourceOptions: yup.mixed().nullable(),
    paymentSourceCheckEnabled: yup.boolean().nullable(),
    batchPayment: yup.boolean().nullable(),
    paymentSourceSchemaId: yup.string().nullable(),
    paymentSchedule: yup.mixed().nullable(),
    hasDocuments: yup.boolean().nullable(),
    saveAsStatus: yup.string().nullable(),
    formAction: yup.string().nullable(),
    saveAsAdmin: yup.boolean(),
    metadata: yup.mixed().nullable(),
    newBankAccount: yup.mixed().nullable(),
    newCheck: yup.mixed().nullable(),
    newCounterpartyAccount: yup.mixed().nullable(),
    commentText: yup.string().nullable(),
    comments: yup.mixed().nullable(),
    creatorUser: yup.mixed().nullable(),
    creatorEntityId: yup.string().nullable(),
    approvalPolicy: yup.mixed().nullable(),
    vendor: yup.object().shape(counterpartyYupValidation),
    '~cpm~~': yup.mixed().nullable(),
    fees: yup.mixed().nullable(),
    failureType: yup.string().nullable(),
    vendorCreditIds: yup.array().nullable(),
    taxAmount: yup.number().transform(removeThousands).positive().nullable(),
    shippingAmount: yup.number().transform(removeThousands).positive().nullable(),
    ocrJobId: yup.string().nullable(),
    createdAt: yup.date().nullable(),
    updatedAt: yup.date().nullable(),
  })
  .required()

export const baseSaveDraftSchema = baseSchema.shape({})

export const baseSubmitForApprovalSchema = baseSchema.shape({
  amount: yup
    .number()
    .typeError('Please enter an amount')
    .min(0, 'Amount must be at least 0.00')
    .required('Amount is required'),
  invoiceDate: yup.date().required('Please select an invoice date'),
  dueDate: yup.date().required('Please select a due date'),
  vendorId: yup.string().required('Please select a vendor').notOneOf(['new'], 'Please select a valid vendor'),
})

export const baseSchedulePaymentSchema = baseSubmitForApprovalSchema.shape({
  deductionDate: yup.date().required('Deduction date is required'),
  paymentDestinationId: yup.string().when('paymentSourceType', {
    is: 'offPlatform',
    then: (schema) => schema.nullable(), // Allow null for off-platform sources since we auto-create
    otherwise: (schema) => schema.required('Please select how the vendor wants to get paid'),
  }),
  paymentSourceId: yup.string().required('Please select how you want to pay'),
})

export enum PayableFormAction {
  CREATE = 'create',
  SAVE_AS_DRAFT = 'saveDraft',
  SUBMIT_FOR_APPROVAL = 'submitForApproval',
  SCHEDULE_PAYMENT = 'schedulePayment',
  RETRY_PAYMENT = 'retryPayment',
  CANCEL = 'cancel',
  ARCHIVE = 'archive',
  REJECT = 'reject',
  APPROVE = 'approve',
  CREATE_UPDATE_COUNTERPARTY = 'createUpdateCounterparty',
  CREATE_UPDATE_COUNTERPARTY_AND_SEND_ONBOARDING_LINK = 'createUpdateCounterpartyAndSendOnboardingLink',
  CREATE_COUNTERPARTY_ACCOUNT = 'createCounterpartyAccount',
  CREATE_BANK_ACCOUNT = 'createBankAccount',
  CREATE_CHECK = 'createCheck',
  CREATE_CUSTOM = 'createCustom',
  DELETE = 'delete',
  PRINT_CHECK = 'printCheck',
  COMMENT = 'comment',
  CLOSE_INLINE_FORM = 'closeInlineForm',
  MARK_PAID = 'markPaid',
  ASSIGN_TO_ENTITY = 'assignToEntity',
  GENERATE_CHECK = 'generateCheck',
  VOID_CHECK = 'voidCheck',
}

export enum INVOICE_FIELDS {
  AMOUNT = 'amount',
  VENDOR = 'vendor',
  INVOICE_DATE = 'invoiceDate',
  DUE_DATE = 'dueDate',
  DEDUCTION_DATE = 'deductionDate',
  PAYMENT_DESTINATION = 'paymentDestination',
  PAYMENT_SOURCE = 'paymentSource',
  LINE_ITEMS = 'lineItems',
  LINE_ITEM_DESCRIPTION = 'description',
  LINE_ITEM_AMOUNT = 'amount',
}

export const DEFAULT_PAYABLE_FORM_CONFIG: PayableFormConfig = {
  [Mercoa.InvoiceStatus.Draft]: {},
  [Mercoa.InvoiceStatus.Approved]: {
    [INVOICE_FIELDS.AMOUNT]: {
      required: true,
    },
    [INVOICE_FIELDS.INVOICE_DATE]: {
      required: true,
    },
    [INVOICE_FIELDS.DUE_DATE]: {
      required: true,
    },
    [INVOICE_FIELDS.VENDOR]: {
      required: true,
    },
  },
  [Mercoa.InvoiceStatus.Scheduled]: {
    [INVOICE_FIELDS.AMOUNT]: {
      required: true,
    },
    [INVOICE_FIELDS.INVOICE_DATE]: {
      required: true,
    },
    [INVOICE_FIELDS.DEDUCTION_DATE]: {
      required: true,
    },
    [INVOICE_FIELDS.PAYMENT_DESTINATION]: {
      required: true,
    },
    [INVOICE_FIELDS.PAYMENT_SOURCE]: {
      required: true,
    },
  },
}
