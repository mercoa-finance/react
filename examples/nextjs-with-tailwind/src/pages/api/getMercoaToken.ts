import { Mercoa, MercoaClient } from '@mercoa/javascript'
import type { NextApiRequest, NextApiResponse } from 'next'

const mercoa = new MercoaClient({
  token: process.env.MERCOA_API_KEY ?? '',
})
export default async function handler(req: NextApiRequest, res: NextApiResponse<string>) {
  // Replace this with real code to get your customer ID from your database
  const yourCustomerId = process.env.CUSTOMER_ID
  // End Replace

  const entities = await mercoa.entity.find({
    foreignId: yourCustomerId,
  })

  let entity = entities.data?.[0]

  // Create entity if it does not exist
  if (!entity) {
    entity = await mercoa.entity.create({
      isCustomer: true,
      isPayor: true,
      isPayee: false,
      foreignId: yourCustomerId,
      accountType: Mercoa.AccountType.Business,
      profile: {
        business: {
          legalBusinessName: 'Test Business', // Get this from your database
          email: 'test@test.com', // Get this from your database
        },
      },
    })
  }

  const token = await mercoa.entity.getToken(entity.id, {
    entity: {
      enableMercoaPayments: true,
    },
    invoice: {
      lineItems: Mercoa.LineItemAvailabilities.Optional,
      status: [
        Mercoa.InvoiceStatus.Draft,
        Mercoa.InvoiceStatus.New,
        Mercoa.InvoiceStatus.Approved,
        Mercoa.InvoiceStatus.Scheduled,
        Mercoa.InvoiceStatus.Pending,
        Mercoa.InvoiceStatus.Paid,
        Mercoa.InvoiceStatus.Failed,
        Mercoa.InvoiceStatus.Canceled,
        Mercoa.InvoiceStatus.Archived,
      ],
    },
    vendors: {
      network: Mercoa.VendorNetwork.Entity,
    },
    pages: {
      paymentMethods: true,
      counterparties: true,
      approvals: true,
      notifications: true,
    },
  })
  res.send(token)
}
