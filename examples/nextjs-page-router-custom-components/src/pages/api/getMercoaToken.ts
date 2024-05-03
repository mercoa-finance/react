import { Mercoa, MercoaClient } from '@mercoa/javascript'
import type { NextApiRequest, NextApiResponse } from 'next'

const mercoa = new MercoaClient({
  token: process.env.MERCOA_API_KEY ?? '',
})
export default async function handler(req: NextApiRequest, res: NextApiResponse<string>) {
  // Replace this with real code to get your customer ID from your database
  const entityId = process.env.MERCOA_ENTITY_ID ?? ''
  // End Replace

  const token = await mercoa.entity.getToken(entityId, {
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
