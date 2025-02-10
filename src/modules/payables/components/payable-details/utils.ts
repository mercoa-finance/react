import { MercoaContext } from '../../../../components'

export function getInvoiceClient(mercoaSession: MercoaContext, invoiceType: 'invoice' | 'invoiceTemplate') {
  if (invoiceType === 'invoice') {
    return mercoaSession.client?.invoice
  } else {
    return mercoaSession.client?.invoiceTemplate
  }
}
