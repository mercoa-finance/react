import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { useMutation } from '../../../lib/react-query/use-mutation'
import { getInvoiceClient, ToastClient } from '../../common/utils'

export const useDeleteReceivable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<any, { invoiceId: string; invoiceType?: 'invoice' | 'invoiceTemplate' }>({
    mutationKey: ['deleteReceivable'],
    mutationFn: async ({ invoiceId, invoiceType = 'invoice' }) => {
      if (!mercoaSession.token) {
        throw new Error('Client not found')
      }
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')
      return await client.delete(invoiceId)
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringReceivables'],
        })
      },
    },
  })
}

export const useBulkDeleteReceivables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<any, { invoiceIds: string[]; invoiceType?: 'invoice' | 'invoiceTemplate' }>({
    mutationKey: ['bulkDeleteReceivables'],
    mutationFn: async ({ invoiceIds, invoiceType = 'invoice' }) => {
      if (!mercoaSession.token) {
        throw new Error('Client not found')
      }
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      const deletePromises = invoiceIds.map((invoiceId) =>
        client
          .delete(invoiceId)
          .then(() => ({ status: 'fulfilled', invoiceId }))
          .catch(() => ({ status: 'rejected', invoiceId })),
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter((result) => result.status === 'rejected').map((result) => result.invoiceId)

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete invoices: ${failedDeletes.join(', ')}`)
      }

      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringReceivables'],
        })
      },
      onError: (error) => {
        console.error('Bulk delete failed:', error)
      },
    },
  })
}

// TODO: Refactor `useReceivableDetailsInternal` to use `useUpdateReceivable`
export const useUpdateReceivable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['updateReceivable'],
    mutationFn: async ({
      invoiceType,
      invoice,
      requestPayload,
      postAction,
      onInvoiceSubmit,
      refreshInvoice,
      setUploadedDocument,
      toast,
    }: {
      invoiceType: 'invoice' | 'invoiceTemplate'
      invoice: Mercoa.InvoiceResponse
      requestPayload: Mercoa.InvoiceCreationRequest
      postAction?: 'APPROVE' | 'REJECT'
      onInvoiceSubmit?: (resp: any) => void
      refreshInvoice: (id: string) => void
      setUploadedDocument: (doc?: string) => void
      toast: any
    }) => {
      try {
        if (!mercoaSession.client) throw new Error('Client not found')
        const client = getInvoiceClient(mercoaSession, invoiceType)
        if (!client) throw new Error('Invoice client not found')
        return await client.update(invoice.id, requestPayload)
      } catch (error) {
        console.error('Failed to update invoice:', error)
        throw error
      }
    },
    options: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: ['receivables', res.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringReceivables', res.id],
        })
      },
      onError: (error: any) => {
        console.error('Update failed:', error)
      },
    },
  })
}

// TODO: Refactor `useReceivableDetailsInternal` to use `useCreateReceivable`
export function useCreateReceivable() {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['createReceivable'],
    mutationFn: async ({
      invoice,
      invoiceType,
      toast,
    }: {
      invoice: Mercoa.InvoiceCreationRequest
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast: any
    }) => {
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Client not found')

      return await client.create({
        ...invoice,
        creatorUserId: mercoaSession.user?.id,
      })
    },
    options: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringReceivables'],
        })
      },
      onError: (error: any) => {
        console.error('Creation failed:', error)
      },
    },
  })
}

export const useRestoreAsDraftReceivable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['restoreAsDraftReceivable'],
    mutationFn: async ({
      invoice,
      invoiceType = 'invoice',
      toast,
    }: {
      invoice: Mercoa.InvoiceResponse
      invoiceType?: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    }) => {
      if (!invoice?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.Canceled) return

      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      try {
        await client.update(invoice.id, {
          status: Mercoa.InvoiceStatus.Draft,
        })
        toast?.success('Invoice restored as draft')
      } catch (e: any) {
        console.error(e)
        toast?.error(`There was an error restoring the invoice as draft.\n Error: ${e.body}`)
        throw e
      }
    },
    options: {
      onSuccess: (_, { invoice, invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['receivableDetail', invoice.id, invoiceType] })
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringReceivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Invoice restore as draft failed:', error)
      },
    },
  })
}

export const useBulkRestoreAsDraftReceivable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkRestoreAsDraftReceivable'],
    mutationFn: async ({
      invoiceIds,
      invoiceType = 'invoice',
    }: {
      invoiceIds: string[]
      invoiceType?: 'invoice' | 'invoiceTemplate'
    }) => {
      if (!mercoaSession.token) {
        throw new Error('Client not found')
      }
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      const restorePromises = invoiceIds.map((invoiceId) =>
        client
          .update(invoiceId, { status: Mercoa.InvoiceStatus.Draft })
          .then(() => ({ status: 'fulfilled', invoiceId }))
          .catch(() => ({ status: 'rejected', invoiceId })),
      )

      const results = await Promise.all(restorePromises)
      const failedRestores = results.filter((result) => result.status === 'rejected').map((result) => result.invoiceId)

      if (failedRestores.length > 0) {
        throw new Error(`Failed to restore invoices: ${failedRestores.join(', ')}`)
      }

      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringReceivables'],
        })
      },
      onError: (error) => {
        console.error('Bulk restore as draft failed:', error)
      },
    },
  })
}

export const useArchiveReceivable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['archiveReceivable'],
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, 'invoice')
      if (!client) throw new Error('Invoice client not found')

      return await client.update(invoiceId, { status: Mercoa.InvoiceStatus.Archived })
    },
    options: {
      onSuccess: (_, { invoiceId }) => {
        queryClient.invalidateQueries({ queryKey: ['receivableDetail', invoiceId, 'invoice'] })
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Archive receivable failed:', error)
      },
    },
  })
}

export const useBulkArchiveReceivables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkArchiveReceivables'],
    mutationFn: async ({ invoiceIds }: { invoiceIds: string[] }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, 'invoice')
      if (!client) throw new Error('Invoice client not found')

      const archivePromises = invoiceIds.map((invoiceId) =>
        client
          .update(invoiceId, { status: Mercoa.InvoiceStatus.Archived })
          .then(() => ({ status: 'fulfilled', invoiceId }))
          .catch(() => ({ status: 'rejected', invoiceId })),
      )

      const results = await Promise.all(archivePromises)
      const failedArchives = results.filter((result) => result.status === 'rejected').map((result) => result.invoiceId)

      if (failedArchives.length > 0) {
        throw new Error(`Failed to archive invoices: ${failedArchives.join(', ')}`)
      }

      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Bulk archive receivables failed:', error)
      },
    },
  })
}

export const useCancelReceivable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['cancelReceivable'],
    mutationFn: async ({ invoiceId, toast }: { invoiceId: string; toast?: ToastClient }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, 'invoice')
      if (!client) throw new Error('Invoice client not found')

      try {
        await client.update(invoiceId, { status: Mercoa.InvoiceStatus.Canceled })
        toast?.success('Invoice canceled')
        return { success: true }
      } catch (e: any) {
        console.error(e)
        toast?.error(`There was an error canceling the invoice.\n Error: ${e.body}`)
        throw e
      }
    },
    options: {
      onSuccess: (_, { invoiceId }) => {
        queryClient.invalidateQueries({ queryKey: ['receivableDetail', invoiceId, 'invoice'] })
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Cancel receivable failed:', error)
      },
    },
  })
}

export const useBulkCancelReceivables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkCancelReceivables'],
    mutationFn: async ({ invoiceIds, toast }: { invoiceIds: string[]; toast?: ToastClient }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, 'invoice')
      if (!client) throw new Error('Invoice client not found')

      const cancelPromises = invoiceIds.map((invoiceId) =>
        client
          .update(invoiceId, { status: Mercoa.InvoiceStatus.Canceled })
          .then(() => ({ status: 'fulfilled', invoiceId }))
          .catch(() => ({ status: 'rejected', invoiceId })),
      )

      const results = await Promise.all(cancelPromises)
      const failedCancellations = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.invoiceId)

      if (failedCancellations.length > 0) {
        const errorMessage = `Failed to cancel invoices: ${failedCancellations.join(', ')}`
        toast?.error(errorMessage)
        throw new Error(errorMessage)
      }

      toast?.success('Invoices canceled successfully')
      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['receivables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['receivableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Bulk cancel receivables failed:', error)
      },
    },
  })
}

export const useBulkDownloadReceivables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<
    Mercoa.BulkDownloadResponse,
    {
      format?: Mercoa.BulkDownloadFormat
      startDate?: Date
      endDate?: Date
      dateType?: Mercoa.InvoiceDateFilter
      orderBy?: Mercoa.InvoiceOrderByField
      orderDirection?: Mercoa.OrderDirection
      search?: string
      status?: Mercoa.InvoiceStatus[]
      toast?: ToastClient
    }
  >({
    mutationKey: ['bulkDownloadReceivables'],
    mutationFn: async ({
      format = 'CSV',
      startDate,
      endDate,
      dateType,
      orderBy,
      orderDirection,
      search,
      status,
      toast: customToast,
    }) => {
      if (!mercoaSession.token || !mercoaSession.entityId) {
        throw new Error('Client or entity not found')
      }

      // Use custom toast if provided, otherwise use react-toastify directly
      const toastClient = customToast || {
        success: (message: string) => toast.success(message),
        error: (message: string) => toast.error(message),
        info: (message: string) => toast.info(message),
      }

      try {
        const response = await mercoaSession.client?.entity.invoice.download(mercoaSession.entityId, {
          format,
          startDate,
          endDate,
          dateType,
          orderBy,
          orderDirection,
          search,
          status,
          excludePayables: true,
        })

        if (!response) {
          throw new Error('No response from bulk download API')
        }

        // Handle the download URL
        if (response.url.startsWith('file://')) {
          // Local file in non-production environment
          const filePath = response.url.replace('file://', '')
          toastClient.success(`File saved locally: ${filePath}`)
        } else {
          // Production environment - trigger download
          const a = document.createElement('a')
          a.setAttribute('mercoa-hidden', '')
          a.setAttribute('href', response.url)
          a.setAttribute(
            'download',
            `receivables-export-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.${format.toLowerCase()}`,
          )
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          toastClient.success('Download started')
        }

        return response
      } catch (error: any) {
        console.error('Bulk download failed:', error)
        toastClient.error(`Download failed: ${error.message}`)
        throw error
      }
    },
    options: {
      onError: (error) => {
        console.error('Bulk download receivables failed:', error)
      },
    },
  })
}
