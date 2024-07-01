import { Mercoa } from '@mercoa/javascript'
import { DefaultBodyType, HttpResponse, StrictRequest, http } from 'msw'
const sign = require('jwt-encode')

const basePath = 'https://api.mercoa.com'

const organization: Mercoa.OrganizationResponse = {
  id: 'org_test_70b8b77d-9cbc-4871-948e-235417c16677',
  name: 'Acme Inc',
  logoUrl: '',
  websiteUrl: 'https://acme.com',
  supportEmail: 'support@acme.com',
  sandbox: true,
  paymentMethods: {
    payerPayments: [
      {
        type: 'bankAccount',
        name: 'Bank Account',
        active: true,
      },
      {
        type: 'card',
        name: 'Card',
        active: true,
      },
      {
        type: 'bnpl',
        name: 'BNPL',
        active: true,
      },
      {
        type: 'offPlatform',
        name: 'Off-Platform',
        active: true,
      },
      {
        type: 'custom',
        name: 'cpms_0968a2ec-f59e-49b4-b6b0-bfd46133ed7a',
        active: true,
      },
    ],
    backupDisbursements: [
      {
        type: 'bankAccount',
        name: 'Bank Account',
        active: true,
      },
      {
        type: 'check',
        name: 'Check',
        active: true,
      },
      {
        type: 'offPlatform',
        name: 'Off-Platform',
        active: true,
      },
      {
        type: 'custom',
        name: 'cpms_0968a2ec-f59e-49b4-b6b0-bfd46133ed7a',
        active: true,
      },
    ],
    vendorDisbursements: [
      {
        type: 'bankAccount',
        name: 'Bank Account',
        active: true,
      },
      {
        type: 'check',
        name: 'Check',
        active: true,
      },
      {
        type: 'virtualCard',
        name: 'Virtual Card',
        active: true,
      },
      {
        type: 'custom',
        name: 'cpms_0968a2ec-f59e-49b4-b6b0-bfd46133ed7a',
        active: true,
      },
    ],
  },
  emailProvider: {
    sender: {
      provider: 'sendgrid',
      fromEmail: 'ap@mercoa.com',
      fromName: 'Mercoa BillPay',
      hasApiKey: true,
    },
    inboxDomain: 'ap.mercoa.com',
  },
  colorScheme: {
    primaryColor: '',
    secondaryColor: '',
    logoBackgroundColor: '',
    roundedCorners: 6,
  },
  payeeOnboardingOptions: {
    enableBusiness: true,
    enableIndividual: false,
    paymentMethod: true,
    business: {
      name: {
        edit: true,
        show: true,
        required: true,
      },
      address: {
        edit: true,
        show: true,
        required: true,
      },
      phone: {
        edit: true,
        show: true,
        required: true,
      },
      email: {
        edit: true,
        show: true,
        required: true,
      },
      ein: {
        edit: true,
        show: true,
        required: true,
      },
      website: {
        edit: true,
        show: true,
        required: true,
      },
      description: {
        edit: true,
        show: true,
        required: true,
      },
      doingBusinessAs: {
        edit: true,
        show: true,
        required: true,
      },
      type: {
        edit: true,
        show: true,
        required: true,
      },
      formationDate: {
        edit: true,
        show: true,
        required: true,
      },
      representatives: {
        edit: true,
        show: true,
        required: true,
      },
      termsOfService: {
        edit: true,
        show: true,
        required: true,
      },
    },
    individual: {
      name: {
        show: false,
        edit: false,
        required: false,
      },
      address: {
        show: false,
        edit: false,
        required: false,
      },
      phone: {
        show: false,
        edit: false,
        required: false,
      },
      email: {
        show: false,
        edit: false,
        required: false,
      },
      ssn: {
        show: false,
        edit: false,
        required: false,
      },
      dateOfBirth: {
        show: false,
        edit: false,
        required: false,
      },
      termsOfService: {
        show: false,
        edit: false,
        required: false,
      },
    },
  },
  payorOnboardingOptions: {
    enableBusiness: true,
    enableIndividual: true,
    paymentMethod: true,
    business: {
      name: {
        edit: true,
        show: true,
        required: false,
      },
      address: {
        edit: true,
        show: true,
        required: false,
      },
      phone: {
        edit: true,
        show: true,
        required: false,
      },
      email: {
        edit: true,
        show: true,
        required: false,
      },
      ein: {
        edit: true,
        show: true,
        required: false,
      },
      website: {
        edit: true,
        show: true,
        required: false,
      },
      description: {
        edit: true,
        show: true,
        required: false,
      },
      doingBusinessAs: {
        edit: true,
        show: true,
        required: false,
      },
      type: {
        edit: true,
        show: true,
        required: false,
      },
      formationDate: {
        edit: true,
        show: true,
        required: false,
      },
      representatives: {
        edit: true,
        show: true,
        required: true,
      },
      termsOfService: {
        edit: true,
        show: true,
        required: true,
      },
    },
    individual: {
      name: {
        edit: true,
        show: true,
        required: true,
      },
      address: {
        edit: true,
        show: true,
        required: true,
      },
      phone: {
        edit: true,
        show: true,
        required: true,
      },
      email: {
        edit: true,
        show: true,
        required: true,
      },
      ssn: {
        edit: true,
        show: true,
        required: true,
      },
      dateOfBirth: {
        edit: true,
        show: true,
        required: true,
      },
      termsOfService: {
        edit: true,
        show: true,
        required: true,
      },
    },
  },
  metadataSchema: [
    {
      type: 'KEY_VALUE',
      key: 'propertyId',
      displayName: 'Property ID',
      description: 'Property associated with this invoice',
      allowMultiple: false,
      showConditions: {},
      lineItem: false,
    },
    {
      type: 'KEY_VALUE',
      key: 'glAccountId',
      displayName: 'GL Account',
      description: 'GL Account associated with this invoice line item',
      allowMultiple: false,
      showConditions: {},
      lineItem: true,
    },
  ],
}

export const payerEntity: Mercoa.EntityResponse = {
  id: 'ent_payer',
  isCustomer: true,
  accountType: Mercoa.AccountType.Business,
  name: '123 Biz',
  email: 'ap@123biz.com',
  emailTo: '123biz',
  emailToAlias: ['123Biz@yo.com'],
  foreignId: '888',
  isPayee: false,
  isNetworkPayee: false,
  isPayor: true,
  isNetworkPayor: false,
  profile: {
    business: {
      legalBusinessName: '123 Biz',
      email: 'ap@123biz.com',
      doingBusinessAs: '456 biz',
      description: 'this is a description',
      website: 'https://123biz.com',
      // @ts-ignore-next
      taxIDProvided: true,
      ownersProvided: false,
      phone: {
        number: '5555551010',
        countryCode: '1',
      },
      businessType: Mercoa.BusinessType.Llc,
      address: {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 1',
        city: 'San Francisco',
        stateOrProvince: 'CA',
        country: 'US',
        postalCode: '94105',
      },
    },
  },
  status: Mercoa.EntityStatus.Verified,
  acceptedTos: false,
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
}

export const vendorEntities: Mercoa.EntityResponse[] = [
  'Acme',
  'Globex',
  'Initech',
  'Umbrella',
  'Wayne Enterprises',
  'Wonka Industries',
  'Cyberdyne Systems',
  'Stark Industries',
  'LexCorp',
  'Oscorp',
].map((name, index) => ({
  id: 'ent_vendor_' + index,
  isCustomer: true,
  accountType: Mercoa.AccountType.Business,
  name,
  email: name + '@123biz.com',
  isPayee: true,
  isNetworkPayee: false,
  isPayor: false,
  isNetworkPayor: false,
  profile: {
    business: {
      legalBusinessName: name + ' Biz',
      description: 'this is a description',
      // @ts-ignore-next
      taxIDProvided: false,
      taxIdProvided: false,
    },
  },
  status: Mercoa.EntityStatus.Unverified,
  acceptedTos: false,
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
}))

const user: Mercoa.EntityUserResponse = {
  id: 'user_123',
  email: 'ap@123biz.com',
  name: 'Joey Jackrabbit',
  roles: ['admin'],
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
}

export const payerBankAccount: Mercoa.PaymentMethodResponse.BankAccount = {
  type: Mercoa.PaymentMethodType.BankAccount,
  id: 'pm_bank_1',
  accountName: '123 Main Street',
  accountNumber: '999998887766',
  routingNumber: '12345678',
  bankName: 'Bank of America',
  supportedCurrencies: [Mercoa.CurrencyCode.Usd],
  accountType: Mercoa.BankType.Checking,
  status: Mercoa.BankStatus.Verified,
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
  isDefaultDestination: true,
  isDefaultSource: true,
  checkOptions: {
    enabled: true,
    initialCheckNumber: 1000,
    signatoryName: 'Joey Jackrabbit',
  },
}

export const payerBankAccount2: Mercoa.PaymentMethodResponse.BankAccount = {
  type: Mercoa.PaymentMethodType.BankAccount,
  id: 'pm_bank_2',
  accountName: 'Business Checking',
  accountNumber: '0098',
  routingNumber: '12345678',
  bankName: 'Wells Fargo',
  supportedCurrencies: [Mercoa.CurrencyCode.Usd],
  accountType: Mercoa.BankType.Checking,
  status: Mercoa.BankStatus.New,
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
  isDefaultDestination: false,
  isDefaultSource: false,
  checkOptions: {
    enabled: true,
    initialCheckNumber: 1000,
    signatoryName: 'Joey Jackrabbit',
  },
}

export const payerCreditCard: Mercoa.PaymentMethodResponse.Card = {
  type: Mercoa.PaymentMethodType.Card,
  id: 'pm_card_1',
  cardBrand: Mercoa.CardBrand.Visa,
  cardType: Mercoa.CardType.Credit,
  lastFour: '3333',
  expMonth: '3',
  expYear: '2026',
  supportedCurrencies: [Mercoa.CurrencyCode.Usd],
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
  isDefaultDestination: false,
  isDefaultSource: false,
}

export const payerCreditCard2: Mercoa.PaymentMethodResponse.Card = {
  type: Mercoa.PaymentMethodType.Card,
  id: 'pm_card_2',
  cardBrand: Mercoa.CardBrand.AmericanExpress,
  cardType: Mercoa.CardType.Credit,
  lastFour: '5555',
  expMonth: '3',
  expYear: '2026',
  supportedCurrencies: [Mercoa.CurrencyCode.Usd],
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
  isDefaultDestination: false,
  isDefaultSource: false,
}

export const vendorCheck: Mercoa.PaymentMethodResponse.Check = {
  type: Mercoa.PaymentMethodType.Check,
  id: 'pm_check_1',
  payToTheOrderOf: 'Bob Biscuits',
  addressLine1: '44 Main Street',
  addressLine2: 'Suite 33',
  city: 'San Francisco',
  stateOrProvince: 'CA',
  postalCode: '94105',
  country: 'US',
  supportedCurrencies: [Mercoa.CurrencyCode.Usd],
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
  isDefaultDestination: false,
  isDefaultSource: false,
}

export const vendorCheck2: Mercoa.PaymentMethodResponse.Check = {
  type: Mercoa.PaymentMethodType.Check,
  id: 'pm_check_2',
  payToTheOrderOf: 'Betty Biscuits',
  addressLine1: '33 Main Street',
  city: 'San Francisco',
  stateOrProvince: 'CA',
  postalCode: '94105',
  country: 'US',
  supportedCurrencies: [Mercoa.CurrencyCode.Usd],
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
  isDefaultDestination: false,
  isDefaultSource: false,
}

export const vendorPaymentMethods: Mercoa.PaymentMethodResponse[] = vendorEntities.map((vendor, index) => ({
  type: Mercoa.PaymentMethodType.BankAccount,
  id: 'pm_bank_' + index,
  accountName: `${vendor.name} account`,
  accountNumber: index + '000000' + index,
  routingNumber: '12345678',
  bankName: 'Chase',
  supportedCurrencies: [Mercoa.CurrencyCode.Usd],
  accountType: Mercoa.BankType.Checking,
  status: Mercoa.BankStatus.New,
  createdAt: new Date('2021-01-01'),
  updatedAt: new Date('2021-01-02'),
  isDefaultDestination: true,
  isDefaultSource: true,
}))

export const mockToken = sign(
  {
    entityId: payerEntity.id,
    userId: user.id,
    moov: {
      accountId: 'sandbox',
      token: 'sandbox',
    },
  },
  '',
)
const findEntity: Mercoa.FindEntityResponse = {
  hasMore: false,
  count: 1,
  data: [payerEntity],
}

export const approvalPolicy: Mercoa.ApprovalPolicyResponse = {
  id: 'ap_123',
  upstreamPolicyId: 'root',
  trigger: [],
  rule: {
    type: 'approver',
    numApprovers: 1,
    identifierList: {
      type: 'userList',
      value: [user.id],
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const inv_draft_incomplete: Mercoa.InvoiceResponse = {
  id: 'inv_draft_incomplete',
  creatorUser: user,
  payer: payerEntity,
  payerId: payerEntity.id,
  status: Mercoa.InvoiceStatus.Draft,
  paymentDestinationConfirmed: false,
  hasDocuments: false,
  hasSourceEmail: false,
  approvers: [
    {
      eligibleUserIds: [user.id],
      eligibleRoles: ['admin'],
      approvalPolicyId: approvalPolicy.id,
      approvalSlotId: 'slot_123',
      action: 'NONE',
      date: new Date(),
    },
  ],
  approvalPolicy: [approvalPolicy],
  metadata: {
    projectId: 'proj_123',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const inv_draft_ready: Mercoa.InvoiceResponse = {
  ...inv_draft_incomplete,
  id: 'inv_draft_ready',
  vendorId: vendorEntities[0].id,
  vendor: vendorEntities[0],
  invoiceDate: new Date(),
  dueDate: new Date(),
  amount: 100,
  metadata: {
    projectId: 'proj_456',
  },
}

export const inv_new_incomplete: Mercoa.InvoiceResponse = {
  ...inv_draft_ready,
  id: 'inv_new_incomplete',
  vendorId: vendorEntities[2].id,
  vendor: vendorEntities[2],
  status: Mercoa.InvoiceStatus.New,
  metadata: {
    projectId: 'proj_789',
  },
}

export const inv_new_ready: Mercoa.InvoiceResponse = {
  ...inv_new_incomplete,
  id: 'inv_new_ready',
  paymentSourceId: payerBankAccount.id,
  paymentSource: payerBankAccount,
  vendorId: vendorEntities[3].id,
  vendor: vendorEntities[3],
  paymentDestinationId: vendorPaymentMethods[3].id,
  paymentDestination: vendorPaymentMethods[3],
  metadata: {
    projectId: 'proj_101',
  },
  approvers: [
    {
      eligibleUserIds: [user.id],
      eligibleRoles: ['admin'],
      approvalPolicyId: approvalPolicy.id,
      approvalSlotId: 'slot_123',
      assignedUserId: user.id,
      action: 'NONE',
      date: new Date(),
    },
  ],
}

export const inv_approved: Mercoa.InvoiceResponse = {
  ...inv_new_ready,
  id: 'inv_approved',
  status: Mercoa.InvoiceStatus.Approved,
  vendorId: vendorEntities[4].id,
  vendor: vendorEntities[4],
  paymentDestinationId: vendorPaymentMethods[4].id,
  paymentDestination: vendorPaymentMethods[4],
  metadata: {
    projectId: 'proj_012',
  },
  approvers: [
    {
      eligibleUserIds: [user.id],
      eligibleRoles: ['admin'],
      approvalPolicyId: approvalPolicy.id,
      approvalSlotId: 'slot_123',
      assignedUserId: user.id,
      action: 'APPROVE',
      date: new Date(),
    },
  ],
}

export const inv_rejected: Mercoa.InvoiceResponse = {
  ...inv_new_ready,
  id: 'inv_rejected',
  status: Mercoa.InvoiceStatus.Refused,
  vendorId: vendorEntities[5].id,
  vendor: vendorEntities[5],
  paymentDestinationId: vendorPaymentMethods[5].id,
  paymentDestination: vendorPaymentMethods[5],
  metadata: {
    projectId: 'proj_123_' + Math.floor(Math.random() * 100),
  },
  approvers: [
    {
      eligibleUserIds: [user.id],
      eligibleRoles: ['admin'],
      approvalPolicyId: approvalPolicy.id,
      approvalSlotId: 'slot_123',
      assignedUserId: user.id,
      action: 'REJECT',
      date: new Date(),
    },
  ],
}

export const inv_scheduled: Mercoa.InvoiceResponse = {
  ...inv_approved,
  id: 'inv_scheduled',
  status: Mercoa.InvoiceStatus.Scheduled,
  deductionDate: new Date(),
  vendorId: vendorEntities[6].id,
  vendor: vendorEntities[6],
  paymentDestinationId: vendorPaymentMethods[6].id,
  paymentDestination: vendorPaymentMethods[6],
  metadata: {
    projectId: 'proj_123_' + Math.floor(Math.random() * 100),
  },
}

export const inv_pending: Mercoa.InvoiceResponse = {
  ...inv_scheduled,
  id: 'inv_pending',
  status: Mercoa.InvoiceStatus.Pending,
  vendorId: vendorEntities[7].id,
  vendor: vendorEntities[7],
  paymentDestinationId: vendorPaymentMethods[7].id,
  paymentDestination: vendorPaymentMethods[7],
  metadata: {
    projectId: 'proj_123_' + Math.floor(Math.random() * 100),
  },
}

export const inv_paid: Mercoa.InvoiceResponse = {
  ...inv_pending,
  id: 'inv_paid',
  status: Mercoa.InvoiceStatus.Paid,
  vendorId: vendorEntities[8].id,
  vendor: vendorEntities[8],
  paymentDestinationId: vendorPaymentMethods[8].id,
  paymentDestination: vendorPaymentMethods[8],
  metadata: {
    projectId: 'proj_123_' + Math.floor(Math.random() * 100),
  },
}

export const inv_canceled: Mercoa.InvoiceResponse = {
  ...inv_paid,
  id: 'inv_cancelled',
  status: Mercoa.InvoiceStatus.Canceled,
  vendorId: vendorEntities[9].id,
  vendor: vendorEntities[9],
  paymentDestinationId: vendorPaymentMethods[9].id,
  paymentDestination: vendorPaymentMethods[9],
  metadata: {
    projectId: 'proj_123_' + Math.floor(Math.random() * 100),
  },
}

export const inv_failed: Mercoa.InvoiceResponse = {
  ...inv_paid,
  id: 'in_failed',
  status: Mercoa.InvoiceStatus.Failed,
  vendorId: vendorEntities[1].id,
  vendor: vendorEntities[1],
  paymentDestinationId: vendorPaymentMethods[1].id,
  paymentDestination: vendorPaymentMethods[1],
  metadata: {
    projectId: 'proj_123_' + Math.floor(Math.random() * 100),
  },
  failureType: 'INSUFFICIENT_FUNDS',
}

export const inv_archived: Mercoa.InvoiceResponse = {
  ...inv_paid,
  id: 'inv_archived',
  status: Mercoa.InvoiceStatus.Archived,
  vendorId: vendorEntities[3].id,
  vendor: vendorEntities[3],
  paymentDestinationId: vendorPaymentMethods[3].id,
  paymentDestination: vendorPaymentMethods[3],
}

export const invoices: Mercoa.InvoiceResponse[] = [
  inv_draft_incomplete,
  inv_draft_ready,
  inv_new_incomplete,
  inv_new_ready,
  inv_approved,
  inv_rejected,
  inv_scheduled,
  inv_pending,
  inv_paid,
  inv_canceled,
  inv_failed,
  inv_archived,
]

export const representatives: Mercoa.RepresentativeResponse[] = [
  {
    id: 'rep_123',
    name: {
      firstName: 'Joey',
      lastName: 'Jackrabbit',
    },
    email: 'ap@123biz.com',
    phone: {
      countryCode: '1',
      number: '4155551212',
    },
    address: {
      addressLine1: '123 Main Street',
      city: 'San Francisco',
      stateOrProvince: 'CA',
      postalCode: '94105',
      country: 'US',
    },
    birthDateProvided: true,
    // @ts-ignore:next-line
    governmentIDProvided: true,
    governmentIdProvided: true,
    responsibilities: {
      isController: true,
      isOwner: true,
    },
    createdOn: new Date(),
    updatedOn: new Date(),
  },
]

const entityMetadata = [
  {
    key: 'propertyId',
    value: ["{key: 'prop_123', value: 'Beach Rental'}", "{key: 'prop_456', value: 'City Rental'}"],
  },
  {
    key: 'projectId',
    value: ['proj_123'],
  },
]

const pmSchemas = [
  {
    id: 'cpms_4794d597-70dc-4fec-b6ec-c5988e759769',
    name: 'Wire',
    isSource: false,
    isDestination: true,
    estimatedProcessingTime: 0,
    supportedCurrencies: ['USD', 'EUR'],
    fields: [
      {
        name: 'bankName',
        type: 'text',
        optional: false,
        displayName: 'Bank Name',
      },
      {
        name: 'recipientName',
        type: 'text',
        optional: false,
        displayName: 'Recipient Name',
      },
      {
        name: 'accountNumber',
        type: 'number',
        optional: false,
        displayName: 'Account Number',
        useAsAccountNumber: true,
      },
      {
        name: 'routingNumber',
        type: 'number',
        optional: false,
        displayName: 'Routing Number',
      },
    ],
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2021-01-01T00:00:00Z',
  },
  {
    id: 'cpms_14f78dcd-4614-426e-a37a-7af262431d41',
    name: 'Check',
    isSource: false,
    isDestination: true,
    estimatedProcessingTime: 14,
    supportedCurrencies: ['USD'],
    fields: [
      {
        name: 'payToTheOrderOf',
        type: 'text',
        optional: false,
        displayName: 'Pay To The Order Of',
      },
      {
        name: 'accountNumber',
        type: 'number',
        optional: false,
        displayName: 'Account Number',
        useAsAccountNumber: true,
      },
      {
        name: 'routingNumber',
        type: 'number',
        optional: false,
        displayName: 'Routing Number',
      },
      {
        name: 'address',
        type: 'address',
        optional: false,
        displayName: 'Address',
      },
    ],
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2021-01-01T00:00:00Z',
  },
]

const emailLogs: Mercoa.EmailLogResponse = {
  hasMore: false,
  count: 3,
  data: [
    {
      id: '123456',
      subject: 'Invoice #123456',
      from: 'vendor1@test.com',
      to: payerEntity.emailTo + '@ap.yourdomain.com',
      textBody: 'This is a test email',
      htmlBody: '<p>This is a test email</p>',
      createdAt: new Date(),
    },
    {
      id: '123457',
      subject: 'Invoice #123457',
      from: 'vendor2@test.com',
      to: payerEntity.emailTo + '@ap.yourdomain.com',
      textBody: 'This is another test email',
      htmlBody: '<p>This is another test email</p>',
      createdAt: new Date(),
    },
    {
      id: '567890',
      subject: 'Invoice #234234',
      from: 'vendor3@test.com',
      to: payerEntity.emailTo + '@ap.yourdomain.com',
      textBody: 'This is yet another test email',
      htmlBody: '<p>This is yet another test email</p>',
      createdAt: new Date(),
    },
  ],
}

export const mswHandlers = [
  // Org
  http.get(`${basePath}/organization`, () => {
    return HttpResponse.json(organization)
  }),
  // Entity
  http.get(`${basePath}/entity`, () => {
    return HttpResponse.json(findEntity)
  }),
  http.get(`${basePath}/entity/${payerEntity.id}`, () => {
    return HttpResponse.json(payerEntity)
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/invoices`, ({ request }) => {
    const filteredInvoices = getFilteredInvoices({ request })
    return HttpResponse.json({
      hasMore: false,
      count: filteredInvoices.length,
      data: filteredInvoices,
    })
  }),
  http.post(`${basePath}/entity/${payerEntity.id}/token`, () => {
    return HttpResponse.json(mockToken)
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/approval-policies`, () => {
    return HttpResponse.json([approvalPolicy])
  }),
  http.post(`${basePath}/entity/${payerEntity.id}/approval-policy/ap_123`, () => {
    return HttpResponse.json(approvalPolicy)
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/representatives`, () => {
    return HttpResponse.json(representatives)
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/emailLogs`, () => {
    return HttpResponse.json(emailLogs)
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/metadata`, () => {
    return HttpResponse.json(entityMetadata)
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/metadata/*`, ({ request }) => {
    const url = new URL(request.url)
    const key = url.pathname.split('/').pop() ?? ''
    console.log(entityMetadata.find((m) => m.key === key))
    return HttpResponse.json(entityMetadata.find((m) => m.key === key)?.value ?? [])
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/invoice-metrics`, ({ request }) => {
    const filteredInvoice = getFilteredInvoices({ request })?.[0]
    if (filteredInvoice?.id) {
      return HttpResponse.json([
        {
          averageAmount: filteredInvoice.amount ?? 0,
          totalAmount: filteredInvoice.amount ?? 0,
          totalCount: 1,
          currency: 'USD',
          dates: {
            '2021-01-01T00:00:00Z': {
              date: '2021-01-01T00:00:00Z',
              averageAmount: filteredInvoice.amount ?? 0,
              totalAmount: filteredInvoice.amount ?? 0,
              totalCount: 1,
              currency: 'USD',
            },
            '2021-01-02T00:00:00Z': {
              date: '2021-01-02T00:00:00Z',
              averageAmount: filteredInvoice.amount ?? 0,
              totalAmount: filteredInvoice.amount ?? 0,
              totalCount: 2,
              currency: 'USD',
            },
            '2021-01-03T00:00:00Z': {
              date: '2021-01-03T00:00:00Z',
              averageAmount: filteredInvoice.amount ?? 0,
              totalAmount: filteredInvoice.amount ?? 0,
              totalCount: 3,
              currency: 'USD',
            },
            '2021-01-04T00:00:00Z': {
              date: '2021-01-04T00:00:00Z',
              averageAmount: filteredInvoice.amount ?? 0,
              totalAmount: filteredInvoice.amount ?? 0,
              totalCount: 1,
              currency: 'USD',
            },
            '2021-01-05T00:00:00Z': {
              date: '2021-01-05T00:00:00Z',
              averageAmount: filteredInvoice.amount ?? 0,
              totalAmount: filteredInvoice.amount ?? 0,
              totalCount: 2,
              currency: 'USD',
            },
          },
        },
      ])
    } else {
      return HttpResponse.json([])
    }
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/paymentMethods`, ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('type') === Mercoa.PaymentMethodType.BankAccount) {
      return HttpResponse.json([payerBankAccount, payerBankAccount2])
    } else if (url.searchParams.get('type') === Mercoa.PaymentMethodType.Card) {
      return HttpResponse.json([payerCreditCard, payerCreditCard2])
    } else if (url.searchParams.get('type') === Mercoa.PaymentMethodType.Check) {
      return HttpResponse.json([vendorCheck, vendorCheck2])
    }
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/counterparties/payees`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('name')?.toLocaleLowerCase()
    const filteredVendors = vendorEntities.filter((entity) => {
      if (search && !entity?.name.toLocaleLowerCase().startsWith(search)) return false
      return true
    })
    return HttpResponse.json({
      hasMore: false,
      count: filteredVendors.length,
      data: filteredVendors.map((entity, index) => ({
        ...entity,
        paymentMethods: [vendorPaymentMethods[index]],
        invoiceMetrics: {
          totalAmount: 1000,
          totalCount: 10,
          totalInvoices: 10,
          statuses: [],
        },
        counterpartyType: [Mercoa.CounterpartyNetworkType.Entity],
      })),
    })
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/counterparties/payors`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('name')?.toLocaleLowerCase()
    const filteredVendors = vendorEntities.filter((entity) => {
      if (search && !entity?.name.toLocaleLowerCase().startsWith(search)) return false
      return true
    })
    return HttpResponse.json({
      hasMore: false,
      count: filteredVendors.length,
      data: filteredVendors.map((entity, index) => ({
        ...entity,
        paymentMethods: [vendorPaymentMethods[index]],
        invoiceMetrics: {
          totalAmount: 1000,
          totalCount: 10,
          totalInvoices: 10,
          statuses: [],
        },
        counterpartyType: [Mercoa.CounterpartyNetworkType.Entity],
      })),
    })
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/paymentMethods`, () => {
    return HttpResponse.json([payerBankAccount, payerBankAccount2, payerCreditCard, payerCreditCard2])
  }),
  ...vendorEntities.map((vendorEntity, index) =>
    http.get(`${basePath}/entity/${vendorEntity.id}`, () => {
      return HttpResponse.json(vendorEntity)
    }),
  ),
  ...vendorEntities.map((vendorEntity, index) =>
    http.get(`${basePath}/entity/${vendorEntity.id}/paymentMethods`, ({ request }) => {
      return HttpResponse.json([vendorPaymentMethods[index]])
    }),
  ),
  http.get(`${basePath}/entity/${payerEntity.id}/users`, () => {
    return HttpResponse.json({
      hasMore: false,
      count: 1,
      data: [user],
    })
  }),
  http.put(`${basePath}/entity/${payerEntity.id}/users`, () => {
    return HttpResponse.json({
      hasMore: false,
      count: 1,
      data: [user],
    })
  }),
  http.get(`${basePath}/entity/${payerEntity.id}/user/${user.id}`, () => {
    return HttpResponse.json(user)
  }),
  // Invoice
  http.get(`${basePath}/invoice/inv_new_ready`, () => {
    return HttpResponse.json(inv_new_ready)
  }),
  // PMS
  http.get(`${basePath}/paymentMethod/schema`, () => {
    return HttpResponse.json(pmSchemas)
  }),

  // Fees
  http.post(`${basePath}/fees`, () => {
    return HttpResponse.json({
      sourcePlatformMarkupFee: 1,
      sourcePaymentMethodFee: 1,
      destinationPlatformMarkupFee: 1,
      destinationPaymentMethodFee: 1,
    })
  }),
]

// helper functions

// Invoice Filters
function getFilteredInvoices({ request }: { request: StrictRequest<DefaultBodyType> }) {
  console.log(JSON.stringify(request.url))
  const url = new URL(request.url)
  const statues = url.searchParams.getAll('status')
  const search = url.searchParams.get('search')
  const metadata = request.url.toString().includes('metadata')
  const filteredInvoices = invoices.filter((invoice) => {
    if (!statues.includes(invoice.status)) return false
    if (search && !invoice.vendor?.name.startsWith(search)) return false
    if (metadata && invoice.metadata?.projectId != 'proj_456') return false
    return true
  })
  return filteredInvoices
}
