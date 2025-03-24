import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { useMutation } from '../../../lib/react-query/use-mutation'
import { getInvoiceClient } from '../../common/utils'

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
