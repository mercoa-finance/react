import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { getInvoiceClient, useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { useMutation } from '../../../lib/react-query/use-mutation'

export const useDeletePayable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<any, { invoiceId: string; invoiceType?: 'invoice' | 'invoiceTemplate' }>({
    mutationKey: ['deletePayable'],
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
          queryKey: ['payables'],
        })
      },
    },
  })
}

export const useBulkDeletePayables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<any, { invoiceIds: string[]; invoiceType?: 'invoice' | 'invoiceTemplate' }>({
    mutationKey: ['bulkDeletePayables'],
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
          queryKey: ['payables'],
        })
      },
      onError: (error) => {
        console.error('Bulk delete failed:', error)
      },
    },
  })
}

export const useApprovePayableN = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<any, { invoiceId: string; invoiceType?: 'invoice' | 'invoiceTemplate' }>({
    mutationKey: ['approvePayable'],
    mutationFn: async ({ invoiceId, invoiceType = 'invoice' }) => {
      if (!mercoaSession.token) {
        throw new Error('Client not found')
      }
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      return await client.approval.approve(invoiceId, { userId: mercoaSession.user?.id ?? '' })
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
      },
      onError: (error) => {
        console.error('Approve failed:', error)
      },
    },
  })
}

export const useBulkApprovePayables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<any, { invoiceIds: string[]; invoiceType?: 'invoice' | 'invoiceTemplate' }>({
    mutationKey: ['bulkApprovePayables'],
    mutationFn: async ({ invoiceIds, invoiceType = 'invoice' }) => {
      if (!mercoaSession.token) {
        throw new Error('Client not found')
      }
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      const approvePromises = invoiceIds.map((invoiceId) =>
        client.approval
          .approve(invoiceId, { userId: mercoaSession.user?.id ?? '' })
          .then(() => ({ status: 'fulfilled', invoiceId }))
          .catch(() => ({ status: 'rejected', invoiceId })),
      )

      const results = await Promise.all(approvePromises)
      const failedApprovals = results.filter((result) => result.status === 'rejected').map((result) => result.invoiceId)

      if (failedApprovals.length > 0) {
        throw new Error(`Failed to approve invoices: ${failedApprovals.join(', ')}`)
      }

      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
      },
      onError: (error) => {
        console.error('Bulk approve failed:', error)
      },
    },
  })
}

export const useSchedulePayment = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['schedulePayment'],
    mutationFn: async ({
      invoice,
      deductionDate,
      invoiceType = 'invoice',
    }: {
      invoice: Mercoa.InvoiceResponse
      deductionDate: Date
      invoiceType?: 'invoice' | 'invoiceTemplate'
    }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      return await client.update(invoice.id, {
        deductionDate,
        ...(invoice.status === Mercoa.InvoiceStatus.Approved || invoice.status === Mercoa.InvoiceStatus.Failed
          ? { status: Mercoa.InvoiceStatus.Scheduled }
          : {}),
      })
    },
    options: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
      },
      onError: (error) => {
        console.error('Schedule payment failed:', error)
      },
    },
  })
}
export const useBulkSchedulePayment = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkSchedulePayment'],
    mutationFn: async ({
      invoiceIds,
      invoices,
      deductionDate,
      invoiceType = 'invoice',
    }: {
      invoiceIds: string[]
      invoices: Mercoa.InvoiceResponse[]
      deductionDate: Date
      invoiceType?: 'invoice' | 'invoiceTemplate'
    }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      const schedulePromises = invoices.map((invoice) =>
        client
          .update(invoice.id, {
            deductionDate,
            ...(invoice.status === Mercoa.InvoiceStatus.Approved || invoice.status === Mercoa.InvoiceStatus.Failed
              ? { status: Mercoa.InvoiceStatus.Scheduled }
              : {}),
          })
          .then(() => ({ status: 'fulfilled', invoiceId: invoice.id }))
          .catch((error) => ({ status: 'rejected', invoiceId: invoice.id, error })),
      )

      const results = await Promise.all(schedulePromises)
      const failedSchedules = results.filter((result) => result.status === 'rejected')
      const successfulSchedules = results.filter((result) => result.status === 'fulfilled')

      return {
        success: true, // Always return success
        successfulInvoices: successfulSchedules.map((result) => result.invoiceId),
        failedInvoices: failedSchedules.map((result) => result.invoiceId),
        errors: failedSchedules.map((result) => ({
          invoiceId: result.invoiceId,
          error: 'error' in result ? result.error : undefined,
        })),
      }
    },
    options: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })

        if (result.successfulInvoices.length > 0) {
          // Show success toast with count of successes and failures
          toast.success(
            `Successfully scheduled ${result.successfulInvoices.length} payment${
              result.successfulInvoices.length === 1 ? '' : 's'
            }${result.failedInvoices.length > 0 ? ` (${result.failedInvoices.length} failed)` : ''}`,
          )
        } else {
          // Show error toast when all failed
          toast.error(
            `Failed to schedule ${result.failedInvoices.length} payment${
              result.failedInvoices.length === 1 ? '' : 's'
            }`,
          )
        }
      },
      onError: (error) => {
        console.error('Bulk schedule payment failed:', error)
        toast.error('Failed to schedule payments')
      },
    },
  })
}

export const useUpdatePayable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['updatePayable'],
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
      requestPayload: Mercoa.InvoiceCreationRequest | Mercoa.InvoiceUpdateRequest
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
          queryKey: ['payables', res?.id],
        })
      },
      onError: (error: any) => {
        console.error('Update failed:', error)
      },
    },
  })
}

export function useCreatePayable() {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['createPayable'],
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
          queryKey: ['payables', res.id],
        })
      },
      onError: (error: any) => {
        console.error('Creation failed:', error)
      },
    },
  })
}

export function useApprovePayable() {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['approvePayable'],
    mutationFn: async ({
      invoice,
      invoiceType,
      toast,
      refreshInvoice,
    }: {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast: any
      refreshInvoice?: (invoiceId: string) => void
    }) => {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) {
        refreshInvoice?.(invoice.id)
        return
      }

      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Client not found')

      try {
        await client.approval.approve(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        refreshInvoice?.(invoice.id)
        toast.success('Invoice approved')
      } catch (e: any) {
        console.error(e)
        toast.error(`There was an error approving the invoice.\n Error: ${e.body}`)
        throw e
      }
    },
  })
}

export function useRejectPayable() {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['rejectPayable'],
    mutationFn: async ({
      invoice,
      invoiceType,
      toast,
      refreshInvoice,
    }: {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast: any
      refreshInvoice: (invoiceId: string) => void
    }) => {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) {
        refreshInvoice(invoice.id)
        return
      }

      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Client not found')

      try {
        await client.approval.reject(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        refreshInvoice?.(invoice.id)
        toast.success('Invoice rejected')
      } catch (e: any) {
        console.error(e)
        toast.error(`There was an error rejecting the invoice.\n Error: ${e.body}`)
        throw e
      }
    },
  })
}

export function useRunOcr() {
  const mercoaSession = useMercoaSession()

  return useMutation<Mercoa.OcrAsyncResponse, any>({
    mutationKey: ['runOcr'],
    mutationFn: async ({ fileReaderObj, mimeType }: { fileReaderObj: string; mimeType: string }) => {
      if (!mercoaSession.client || !mercoaSession.entityId) {
        throw new Error('Client or entity ID not found')
      }
      try {
        const response = await mercoaSession.client.ocr.runAsyncOcr({
          entityId: mercoaSession.entityId,
          image: fileReaderObj,
          mimeType,
        })
        return response
      } catch (e) {
        console.error('OCR failed:', e)
        throw e
      }
    },
  })
}
