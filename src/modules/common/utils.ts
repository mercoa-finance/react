import { MercoaContext } from '../../components'

export function getInvoiceClient(mercoaSession: MercoaContext, invoiceType: 'invoice' | 'invoiceTemplate') {
  if (invoiceType === 'invoice') {
    return mercoaSession.client?.invoice
  } else {
    return mercoaSession.client?.invoiceTemplate
  }
}

export type ToastClient = {
  success: (message: string) => void
  error: (message: string) => void
}

export function downloadAsCSV(data: any[], filename: string) {
  const csvContent = data.map((row) => Object.values(row).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
}
