import { MercoaClient } from '@mercoa/javascript'
import type { NextApiRequest, NextApiResponse } from 'next'

const mercoa = new MercoaClient({
  token: process.env.MERCOA_API_KEY ?? '',
})
export default async function handler(req: NextApiRequest, res: NextApiResponse<string>) {
  // Replace this with real code to get your customer ID from your database
  const entityId = process.env.MERCOA_ENTITY_ID ?? ''
  const entityGroupId = process.env.MERCOA_ENTITY_GROUP_ID ?? ''
  // End Replace

  if (!entityId && !entityGroupId) {
    return res.status(403).send('No entity ID or entity group ID provided')
  }
  try {
    const token = entityId
      ? await mercoa.entity.getToken(entityId, {})
      : await mercoa.entityGroup.getToken(entityGroupId, {})
    res.send(token)
  } catch (error) {
    console.error('Error getting Mercoa token:', error)
    res.status(500).send('Error retrieving token')
  }
}
