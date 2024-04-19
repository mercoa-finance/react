import { Mercoa } from '@mercoa/javascript'
import { RestRequest, rest } from 'msw'
const sign = require('jwt-encode')

const basePath = 'https://api.mercoa.com'

const organization: Mercoa.OrganizationResponse = {
  id: 'org_test_70b8b77d-9cbc-4871-948e-235417c16677',
  name: 'Animorphs Inc.',
  logoUrl: '',
  websiteUrl: 'https://animorphs.com',
  supportEmail: 'support@animorphs.com',
  sandbox: true,
  paymentMethods: {
    payerPayments: [
      {
        available: false,
        type: 'bankAccount',
        name: 'Bank Account',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'ACH',
      },
      {
        available: false,
        type: 'card',
        name: 'Card',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'Credit and Debit Card. Coming soon.',
      },
      {
        available: false,
        type: 'bnpl',
        name: 'BNPL',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'Buy Now Pay Later. Coming soon.',
      },
      {
        available: false,
        type: 'offPlatform',
        name: 'Off-Platform',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'Paid outside of Mercoa',
      },
      {
        available: false,
        type: 'custom',
        name: 'cpms_0968a2ec-f59e-49b4-b6b0-bfd46133ed7a',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: '',
      },
    ],
    backupDisbursements: [
      {
        available: false,
        type: 'bankAccount',
        name: 'Bank Account',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'ACH',
      },
      {
        available: false,
        type: 'check',
        name: 'Check',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'Paper check',
      },
      {
        available: false,
        type: 'offPlatform',
        name: 'Off-Platform',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'Paid outside of Mercoa',
      },
      {
        available: false,
        type: 'custom',
        name: 'cpms_0968a2ec-f59e-49b4-b6b0-bfd46133ed7a',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: '',
      },
    ],
    vendorDisbursements: [
      {
        available: false,
        type: 'bankAccount',
        name: 'Bank Account',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'ACH',
      },
      {
        available: false,
        type: 'check',
        name: 'Check',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'Paper check',
      },
      {
        available: false,
        type: 'virtualCard',
        name: 'Virtual Card',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: 'Virtual Discover Card. Coming soon.',
      },
      {
        available: false,
        type: 'custom',
        name: 'cpms_0968a2ec-f59e-49b4-b6b0-bfd46133ed7a',
        active: true,
        markup: {
          type: 'flat',
          amount: 0,
        },
        description: '',
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
  isPayor: true,
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
  isPayor: false,
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
}

export const inv_draft_incomplete: Mercoa.InvoiceResponse = {
  id: 'inv_draft_incomplete',
  creatorUser: user,
  payer: payerEntity,
  payerId: payerEntity.id,
  status: Mercoa.InvoiceStatus.Draft,
  paymentDestinationConfirmed: false,
  hasDocuments: false,
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

export const mswHandlers = [
  // Org
  rest.get(`${basePath}/organization`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(organization))
  }),
  // Entity
  rest.get(`${basePath}/entity`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(findEntity))
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(payerEntity))
  }),
  rest.get(`${basePath}/entity/${vendorEntities[0].id}`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(vendorEntities[0]))
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}/invoices`, (req, res, ctx) => {
    const filteredInvoices = getFilteredInvoices({ req })
    return res(
      ctx.status(200),
      ctx.json({
        hasMore: false,
        count: filteredInvoices.length,
        data: filteredInvoices,
      }),
    )
  }),
  rest.post(`${basePath}/entity/${payerEntity.id}/token`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockToken))
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}/approval-policies`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([approvalPolicy]))
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}/invoice-metrics`, (req, res, ctx) => {
    const filteredInvoice = getFilteredInvoices({ req })?.[0]
    if (filteredInvoice?.id) {
      return res(
        ctx.status(200),
        ctx.json([
          {
            averageAmount: filteredInvoice.amount ?? 0,
            totalAmount: filteredInvoice.amount ?? 0,
            totalCount: 1,
            currency: 'USD',
          },
        ]),
      )
    } else {
      return res(ctx.status(200), ctx.json([]))
    }
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}/paymentMethods`, (req, res, ctx) => {
    if (req.url.searchParams.get('type') === Mercoa.PaymentMethodType.BankAccount) {
      return res(ctx.status(200), ctx.json([payerBankAccount, payerBankAccount2]))
    } else if (req.url.searchParams.get('type') === Mercoa.PaymentMethodType.Card) {
      return res(ctx.status(200), ctx.json([payerCreditCard, payerCreditCard2]))
    } else if (req.url.searchParams.get('type') === Mercoa.PaymentMethodType.Check) {
      return res(ctx.status(200), ctx.json([vendorCheck, vendorCheck2]))
    }
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}/counterparties/payees`, (req, res, ctx) => {
    const search = req.url.searchParams.get('name')?.toLocaleLowerCase()
    const filteredVendors = vendorEntities.filter((entity) => {
      if (search && !entity?.name.toLocaleLowerCase().startsWith(search)) return false
      return true
    })
    return res(
      ctx.status(200),
      ctx.json({
        hasMore: false,
        count: filteredVendors.length,
        data: filteredVendors.map((entity, index) => ({
          ...entity,
          paymentMethods: [vendorPaymentMethods[index]],
          counterpartyType: [Mercoa.CounterpartyNetworkType.Entity],
        })),
      }),
    )
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}/users`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([user]))
  }),
  rest.get(`${basePath}/entity/${payerEntity.id}/user/${user.id}`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(user))
  }),
  // Invoice
  rest.get(`${basePath}/invoice/*`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(inv_new_ready))
  }),
]

// helper functions

// Invoice Filters
function getFilteredInvoices({ req }: { req: RestRequest<any> }) {
  console.log(JSON.stringify(req.url))
  const statues = req.url.searchParams.getAll('status')
  const search = req.url.searchParams.get('search')
  const metadata = req.url.toString().includes('metadata')
  const filteredInvoices = invoices.filter((invoice) => {
    if (!statues.includes(invoice.status)) return false
    if (search && !invoice.vendor?.name.startsWith(search)) return false
    if (metadata && invoice.metadata?.projectId != 'proj_456') return false
    return true
  })
  return filteredInvoices
}
