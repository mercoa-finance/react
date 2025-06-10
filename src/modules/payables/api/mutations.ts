import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { useMutation } from '../../../lib/react-query/use-mutation'
import { getInvoiceClient, ToastClient } from '../../common/utils'

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
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
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
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
      },
      onError: (error) => {
        console.error('Bulk delete failed:', error)
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
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
      },
      onError: (error) => {
        console.error('Bulk approve failed:', error)
      },
    },
  })
}
export const useBulkRejectPayables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation<any, { invoiceIds: string[]; invoiceType?: 'invoice' | 'invoiceTemplate' }>({
    mutationKey: ['bulkRejectPayables'],
    mutationFn: async ({ invoiceIds, invoiceType = 'invoice' }) => {
      if (!mercoaSession.token) {
        throw new Error('Client not found')
      }
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      const rejectPromises = invoiceIds.map((invoiceId) =>
        client.approval
          .reject(invoiceId, { userId: mercoaSession.user?.id ?? '' })
          .then(() => ({ status: 'fulfilled', invoiceId }))
          .catch(() => ({ status: 'rejected', invoiceId })),
      )

      const results = await Promise.all(rejectPromises)
      const failedRejections = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.invoiceId)

      if (failedRejections.length > 0) {
        throw new Error(`Failed to reject invoices: ${failedRejections.join(', ')}`)
      }

      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
      },
      onError: (error) => {
        console.error('Bulk reject failed:', error)
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
      onSuccess: (_, { invoice, invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoice.id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoice.id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
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
      invoices,
      deductionDate,
      invoiceType = 'invoice',
    }: {
      invoices: Mercoa.InvoiceResponse[]
      deductionDate: Date
      invoiceType?: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
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
      onSuccess: (result, { toast }) => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })

        if (result.successfulInvoices.length > 0) {
          // Show success toast with count of successes and failures
          toast?.success(
            `Successfully scheduled ${result.successfulInvoices.length} payment${
              result.successfulInvoices.length === 1 ? '' : 's'
            }${result.failedInvoices.length > 0 ? ` (${result.failedInvoices.length} failed)` : ''}`,
          )
        } else {
          // Show error toast when all failed
          toast?.error(
            `Failed to schedule ${result.failedInvoices.length} payment${
              result.failedInvoices.length === 1 ? '' : 's'
            }`,
          )
        }
      },
      onError: (error, { toast }) => {
        console.error('Bulk schedule payment failed:', error)
        toast?.error('Failed to schedule payments')
      },
    },
  })
}

export const useSetPaymentDate = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['setPaymentDate'],
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
      })
    },
    options: {
      onSuccess: (_, { invoice, invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoice.id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoice.id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
      },
      onError: (error) => {
        console.error('Schedule payment failed:', error)
      },
    },
  })
}

export const useBulkSetPaymentDate = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkSetPaymentDate'],
    mutationFn: async ({
      invoices,
      deductionDate,
      invoiceType = 'invoice',
    }: {
      invoices: Mercoa.InvoiceResponse[]
      deductionDate: Date
      invoiceType?: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      const schedulePromises = invoices.map((invoice) =>
        client
          .update(invoice.id, {
            deductionDate,
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
      onSuccess: (result, { toast }) => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })

        if (result.successfulInvoices.length > 0) {
          // Show success toast with count of successes and failures
          toast?.success(
            `Successfully scheduled ${result.successfulInvoices.length} payment${
              result.successfulInvoices.length === 1 ? '' : 's'
            }${result.failedInvoices.length > 0 ? ` (${result.failedInvoices.length} failed)` : ''}`,
          )
        } else {
          // Show error toast when all failed
          toast?.error(
            `Failed to schedule ${result.failedInvoices.length} payment${
              result.failedInvoices.length === 1 ? '' : 's'
            }`,
          )
        }
      },
      onError: (error, { toast }) => {
        console.error('Bulk schedule payment failed:', error)
        toast?.error('Failed to schedule payments')
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
    }: {
      invoiceType: 'invoice' | 'invoiceTemplate'
      invoice: Mercoa.InvoiceResponse
      requestPayload: Mercoa.InvoiceCreationRequest
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
      onSuccess: ({ id }, { invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Invoice rejection failed:', error)
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
    }: {
      invoice: Mercoa.InvoiceCreationRequest
      invoiceType: 'invoice' | 'invoiceTemplate'
    }) => {
      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Client not found')

      return await client.create({
        ...invoice,
        creatorUserId: mercoaSession.user?.id,
      })
    },
    options: {
      onSuccess: ({ id }, { invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Invoice creation failed:', error)
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
    }: {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    }) => {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) return // can't approve an invoice that is not NEW

      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      try {
        await client.approval.approve(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        toast?.success('Invoice approved')
      } catch (e: any) {
        console.error(e)
        toast?.error(`There was an error approving the invoice.\n Error: ${e.body}`)
        throw e
      }
    },
    options: {
      onSuccess: (_, { invoice, invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoice.id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoice.id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Invoice approval failed:', error)
      },
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
    }: {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    }) => {
      if (!invoice?.id || !mercoaSession.user?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.New) return // can't reject an invoice that is not NEW

      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Client not found')

      try {
        await client.approval.reject(invoice.id, {
          userId: mercoaSession.user?.id,
        })
        toast?.success('Invoice rejected')
      } catch (e: any) {
        console.error(e)
        toast?.error(`There was an error rejecting the invoice.\n Error: ${e.body}`)
        throw e
      }
    },
    options: {
      onSuccess: (_, { invoice, invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoice.id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoice.id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Invoice rejection failed:', error)
      },
    },
  })
}

export function useRunOcr() {
  const mercoaSession = useMercoaSession()

  return useMutation<Mercoa.OcrAsyncResponse, any>({
    mutationKey: ['runOcr'],
    mutationFn: async ({ fileReaderObj, mimeType }: { fileReaderObj: string; mimeType: string }) => {
      if (!mercoaSession.client) {
        throw new Error('Client not found')
      }
      try {
        const response = await mercoaSession.client.ocr.runAsyncOcr({
          ...(mercoaSession.entityId && { entityId: mercoaSession.entityId }),
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

export const useRestoreAsDraft = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['restoreAsDraft'],
    mutationFn: async ({
      invoice,
      invoiceType = 'invoice',
      toast,
    }: {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
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
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoice.id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoice.id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Invoice restore as draft failed:', error)
      },
    },
  })
}

export const useBulkRestoreAsDraft = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkRestoreAsDraft'],
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
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
      },
      onError: (error) => {
        console.error('Bulk restore as draft failed:', error)
      },
    },
  })
}

export const useSubmitForApproval = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['submitForApproval'],
    mutationFn: async ({
      invoice,
      invoiceType = 'invoice',
      toast,
    }: {
      invoice: Mercoa.InvoiceResponse
      invoiceType: 'invoice' | 'invoiceTemplate'
      toast?: ToastClient
    }) => {
      if (!invoice?.id) return
      if (invoice.status !== Mercoa.InvoiceStatus.Draft) return

      const client = getInvoiceClient(mercoaSession, invoiceType)
      if (!client) throw new Error('Invoice client not found')

      try {
        await client.update(invoice.id, {
          status: Mercoa.InvoiceStatus.New,
        })
        toast?.success('Invoice submitted for approval')
      } catch (e: any) {
        console.error(e)
        toast?.error(`There was an error submitting the invoice for approval.\n Error: ${e.body}`)
        throw e
      }
    },
    options: {
      onSuccess: (_, { invoice, invoiceType }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoice.id, invoiceType] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoice.id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Invoice submission for approval failed:', error)
      },
    },
  })
}

export const useBulkSubmitForApproval = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkSubmitForApproval'],
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

      const submitPromises = invoiceIds.map((invoiceId) =>
        client
          .update(invoiceId, { status: Mercoa.InvoiceStatus.New })
          .then(() => ({ status: 'fulfilled', invoiceId }))
          .catch(() => ({ status: 'rejected', invoiceId })),
      )

      const results = await Promise.all(submitPromises)
      const failedSubmissions = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.invoiceId)

      if (failedSubmissions.length > 0) {
        throw new Error(`Failed to submit invoices: ${failedSubmissions.join(', ')}`)
      }

      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['recurringPayables'],
        })
      },
      onError: (error) => {
        console.error('Bulk submit for approval failed:', error)
      },
    },
  })
}

export const useAssignApprover = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['assignApprover'],
    mutationFn: async ({ invoice, userId }: { invoice: Mercoa.InvoiceResponse; userId: string }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, 'invoice')
      if (!client) throw new Error('Invoice client not found')

      return await client.approval.addApprover(invoice.id, { userId })
    },
    options: {
      onSuccess: (_, { invoice }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoice.id, 'invoice'] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoice.id] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Assign approver failed:', error)
      },
    },
  })
}

export const useBulkAssignApprover = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkAssignApprover'],
    mutationFn: async ({ invoices, userId }: { invoices: Mercoa.InvoiceResponse[]; userId: string }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, 'invoice')
      if (!client) throw new Error('Invoice client not found')

      const assignPromises = invoices.map((invoice) =>
        client.approval
          .addApprover(invoice.id, { userId })
          .then(() => ({ status: 'fulfilled', invoiceId: invoice.id }))
          .catch(() => ({ status: 'rejected', invoiceId: invoice.id })),
      )

      const results = await Promise.all(assignPromises)
      const failedAssignments = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.invoiceId)

      if (failedAssignments.length > 0) {
        throw new Error(`Failed to assign approver to invoices: ${failedAssignments.join(', ')}`)
      }

      return { success: true }
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Bulk assign approver failed:', error)
      },
    },
  })
}

export const useArchivePayable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['archivePayable'],
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      if (!mercoaSession.token) throw new Error('Client not found')
      const client = getInvoiceClient(mercoaSession, 'invoice')
      if (!client) throw new Error('Invoice client not found')

      return await client.update(invoiceId, { status: Mercoa.InvoiceStatus.Archived })
    },
    options: {
      onSuccess: (_, { invoiceId }) => {
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoiceId, 'invoice'] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoiceId] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Assign approver failed:', error)
      },
    },
  })
}

export const useBulkArchivePayables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkArchivePayables'],
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
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Bulk archive payables failed:', error)
      },
    },
  })
}

export const useCancelPayable = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['cancelPayable'],
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
        queryClient.invalidateQueries({ queryKey: ['payableDetail', invoiceId, 'invoice'] })
        queryClient.invalidateQueries({ queryKey: ['payableEvents', invoiceId] })
        queryClient.invalidateQueries({
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Cancel payable failed:', error)
      },
    },
  })
}

export const useBulkCancelPayables = () => {
  const mercoaSession = useMercoaSession()

  return useMutation({
    mutationKey: ['bulkCancelPayables'],
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
          queryKey: ['payables'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableStatusTabsMetrics'],
        })
        queryClient.invalidateQueries({
          queryKey: ['payableMetrics'],
        })
      },
      onError: (error) => {
        console.error('Bulk cancel payables failed:', error)
      },
    },
  })
}
