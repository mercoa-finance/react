import { Mercoa } from '@mercoa/javascript'
import { MercoaContext } from '../components'

/**
 * Utility function to check if off platform payments are enabled for an organization
 * @param mercoaSession - The Mercoa session context containing organization data
 * @returns boolean - True if off platform payments are enabled and active
 */
export function isOffPlatformEnabled(mercoaSession: MercoaContext): boolean {
  const offPlatform = mercoaSession.organization?.paymentMethods?.payerPayments?.find(
    (e: Mercoa.PaymentRailResponse) => e.type === Mercoa.PaymentMethodType.OffPlatform,
  )
  return !!(offPlatform && offPlatform.active)
}
