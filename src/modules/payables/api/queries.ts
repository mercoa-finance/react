import { useMemo } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { useInfiniteQuery } from '../../../lib/react-query/use-infinite-query'
import { useQuery } from '../../../lib/react-query/use-query'
import { getInvoiceClient } from '../../common/utils'

export interface PayablesResponse {
  count: number
  invoices: Mercoa.InvoiceResponse[]
  nextCursor?: string
}

export interface UsePayablesRequestOptions {
  currentStatuses?: Mercoa.InvoiceStatus[]
  search?: string
  startDate?: Date
  endDate?: Date
  orderBy?: Mercoa.InvoiceOrderByField
  orderDirection?: Mercoa.OrderDirection
  excludeReceivables?: boolean
  resultsPerPage: number
  paymentType?: Mercoa.PaymentType[]
  metadata?: Mercoa.MetadataFilter | Mercoa.MetadataFilter[]
  dateType?: Mercoa.InvoiceDateFilter
  approverId?: string[]
  approverActions?: Mercoa.ApproverAction[]
  returnPaymentTiming?: boolean
}

export function usePayablesQuery({
  currentStatuses,
  search,
  startDate,
  endDate,
  orderBy = Mercoa.InvoiceOrderByField.CreatedAt,
  orderDirection = Mercoa.OrderDirection.Desc,
  excludeReceivables = true,
  resultsPerPage,
  paymentType,
  metadata,
  dateType = Mercoa.InvoiceDateFilter.CreatedAt,
  approverId,
  approverActions,
  returnPaymentTiming,
}: UsePayablesRequestOptions) {
  const mercoaSession = useMercoaSession()

  return useInfiniteQuery<PayablesResponse, string>({
    queryKey: [
      'payables',
      mercoaSession?.entityId,
      currentStatuses,
      search,
      startDate,
      endDate,
      orderBy,
      orderDirection,
      resultsPerPage,
      paymentType,
      dateType,
      approverId,
      approverActions,
      returnPaymentTiming,
    ],
    queryFn: async ({ pageParam = undefined }) => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entityId) {
        return {
          count: 0,
          invoices: [],
          nextCursor: undefined,
        }
      }

      const filter: Mercoa.entity.EntityGetInvoicesRequest = {
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        limit: resultsPerPage,
        startingAfter: pageParam,
        excludeReceivables,
        metadata,
        paymentType,
        dateType,
        approverId,
        approverAction: approverActions,
        returnPaymentTiming,
      }

      const response = await mercoaSession.client.entity.invoice.find(mercoaSession.entityId, filter)

      return {
        count: response?.count ?? 0,
        invoices: response?.data || [],
        nextCursor:
          response?.data.length > 0 && response.hasMore ? response?.data[response?.data.length - 1].id : undefined,
      }
    },
    options: {
      initialPageParam: undefined,
      refetchInterval: 30000,
      getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    },
  })
}

export function useRecurringPayablesQuery({
  currentStatuses,
  search,
  startDate,
  endDate,
  orderBy = Mercoa.InvoiceOrderByField.CreatedAt,
  orderDirection = Mercoa.OrderDirection.Desc,
  resultsPerPage,
  paymentType,
  metadata,
  dateType = Mercoa.InvoiceDateFilter.CreatedAt,
  approverId,
  approverActions,
}: UsePayablesRequestOptions) {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceTemplateResponse[] | undefined>({
    queryKey: [
      'recurringPayables',
      mercoaSession?.entityId,
      currentStatuses,
      search,
      startDate,
      endDate,
      orderBy,
      orderDirection,
      resultsPerPage,
      paymentType,
      dateType,
      approverId,
      approverActions,
    ],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entity?.id) {
        return undefined
      }

      // TODO: Replace with the entity-level invoice template endpoint once it exists to use excludeReceivables
      // Entity > Invoice > Get All and Get Metrics currently exist
      // Entity > Invoice Template > Get All and Get Metrics should be added
      const filter: Mercoa.invoiceTemplate.GetAllInvoiceTemplatesRequest = {
        entityId: mercoaSession.entity.id,
        payerId: mercoaSession.entity.id, // Functionally the same as entityId + excludeReceivables
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        limit: resultsPerPage,
        metadata: metadata,
        paymentType: paymentType,
        dateType: dateType,
        approverId: approverId,
        approverAction: approverActions,
      }

      const response = await mercoaSession.client.invoiceTemplate.find(filter)

      return response.data
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entity?.id,
    },
  })
}

export const usePayableMetricsByStatusQuery = ({
  startDate,
  endDate,
  dateType,
  search,
  statuses,
  returnByDate,
  excludeReceivables = true,
}: {
  startDate?: Date
  endDate?: Date
  dateType?: Mercoa.InvoiceDateFilter
  search?: string
  statuses?: Mercoa.InvoiceStatus[]
  returnByDate?: Mercoa.InvoiceMetricsPerDateGroupBy | undefined
  excludeReceivables?: boolean
}) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceMetricsResponse[] | undefined>({
    queryKey: [
      'payableMetrics',
      search,
      statuses,
      returnByDate,
      excludeReceivables,
      mercoaSession?.entityId,
      startDate,
      endDate,
      dateType,
    ],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entityId) {
        return undefined
      }

      const response = await mercoaSession.client.entity.invoice.metrics(mercoaSession.entityId, {
        search,
        status: statuses,
        startDate,
        endDate,
        dateType,
        returnByDate,
        excludeReceivables,
        groupBy: ['STATUS'],
      })

      return response
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entityId,
    },
  })
}

export const usePayableApprovalPoliciesQuery = () => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.ApprovalPolicyResponse[] | undefined>({
    queryKey: ['approvalPolicies', mercoaSession?.entityId],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entityId) {
        return undefined
      }

      const response = await mercoaSession.client.entity.approvalPolicy.getAll(mercoaSession.entityId)
      return response
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entityId,
    },
  })
}

export const usePayableStatusTabsMetricsQuery = ({
  search,
  statuses,
  excludeReceivables,
  excludePayables,
  startDate,
  endDate,
  dateType,
}: {
  search?: string
  statuses: Mercoa.InvoiceStatus[]
  excludeReceivables?: boolean
  excludePayables?: boolean
  startDate?: Date
  endDate?: Date
  dateType?: Mercoa.InvoiceDateFilter
}) => {
  const mercoaSession = useMercoaSession()
  const { userPermissionConfig } = mercoaSession

  const statusesByUser = useMemo(() => {
    return [
      Mercoa.InvoiceStatus.Draft,
      Mercoa.InvoiceStatus.New,
      Mercoa.InvoiceStatus.Approved,
      Mercoa.InvoiceStatus.Scheduled,
      Mercoa.InvoiceStatus.Pending,
      Mercoa.InvoiceStatus.Paid,
      Mercoa.InvoiceStatus.Canceled,
      Mercoa.InvoiceStatus.Refused,
      Mercoa.InvoiceStatus.Failed,
      Mercoa.InvoiceStatus.Archived,
    ].filter((status) =>
      userPermissionConfig
        ? userPermissionConfig?.invoice.view.statuses.includes(status) ||
          userPermissionConfig?.invoice.view.all ||
          userPermissionConfig?.invoice.all
        : true,
    )
  }, [userPermissionConfig])

  return useQuery<{ [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse } | undefined>({
    queryKey: [
      'payableStatusTabsMetrics',
      search,
      statusesByUser,
      excludeReceivables,
      excludePayables,
      mercoaSession?.entityId,
      startDate,
      endDate,
      dateType,
    ],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entityId) {
        return undefined
      }

      const metrics = await mercoaSession.client.entity.invoice.metrics(mercoaSession.entityId, {
        search,
        status: statusesByUser,
        excludeReceivables,
        excludePayables,
        groupBy: ['STATUS'],
        startDate,
        endDate,
        dateType,
      })

      const results = statusesByUser.map((status) => {
        const metric: Mercoa.InvoiceMetricsResponse = {
          totalAmount: 0,
          totalCount: 0,
          averageAmount: 0,
          currency: 'USD',
        }
        metrics.forEach((e) => {
          if (e.group?.some((e) => e.status === status)) {
            metric.totalAmount += Number(e.totalAmount)
            metric.totalCount += Number(e.totalCount)
          }
        })
        return [status, metric]
      })

      return Object.fromEntries(results) as { [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse }
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entity?.id,
    },
  })
}

export const usePayableDetailQuery = (
  invoiceId?: string,
  invoiceType: 'invoice' | 'invoiceTemplate' = 'invoice',
  invoice?: Mercoa.InvoiceResponse,
) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceResponse | undefined>({
    queryKey: ['payableDetail', invoiceId, invoiceType],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !invoiceId) {
        throw new Error('MercoaSession or invoiceId is missing')
      }

      let response: Mercoa.InvoiceResponse | Mercoa.InvoiceTemplateResponse | undefined = undefined
      try {
        response = invoice ? invoice : await getInvoiceClient(mercoaSession, invoiceType)?.get(invoiceId)
      } catch (error) {
        console.error('Error fetching invoice:', error)
        throw error
      }
      return response
    },
    options: {
      enabled: !!invoiceId && !!mercoaSession?.client,
    },
  })
}

export const usePayableDocumentsQuery = (
  invoiceId?: string,
  invoiceType: 'invoice' | 'invoiceTemplate' = 'invoice',
) => {
  const mercoaSession = useMercoaSession()

  return useQuery<{ uri: string; mimeType: string }[] | undefined>({
    queryKey: ['payableDocuments', invoiceId, invoiceType],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !invoiceId) {
        throw new Error('MercoaSession or invoiceId is missing')
      }

      const response = await getInvoiceClient(mercoaSession, invoiceType)?.document.getAll(invoiceId, {
        type: Mercoa.DocumentType.Invoice,
      })
      return response
    },
    options: {
      enabled: !!invoiceId && !!mercoaSession?.client,
    },
  })
}

export const usePayableSourceEmailQuery = (
  invoiceId?: string,
  invoiceType: 'invoice' | 'invoiceTemplate' = 'invoice',
) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.EmailLog[] | undefined>({
    queryKey: ['payableSourceEmail', invoiceId, invoiceType],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !invoiceId) {
        throw new Error('MercoaSession or invoiceId is missing')
      }

      const response = await getInvoiceClient(mercoaSession, invoiceType)?.document.getSourceEmail(invoiceId)
      return response?.data
    },
    options: {
      enabled: !!invoiceId && !!mercoaSession?.client,
    },
  })
}

export function useOcrJobQuery(ocrJobId?: string, refetchInterval?: number) {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.OcrJobResponse | undefined>({
    queryKey: ['ocrStatus', ocrJobId],
    queryFn: async () => {
      if (!mercoaSession.client || !ocrJobId) {
        throw new Error('Client or OCR job ID not found')
      }
      try {
        const response = await mercoaSession.client.ocr.getAsyncOcr(ocrJobId)
        return response
      } catch (e) {
        console.error('Failed to get OCR status:', e)
        throw e
      }
    },
    options: {
      enabled: !!ocrJobId && !!mercoaSession?.client,
      refetchInterval: refetchInterval ?? 2500,
    },
  })
}

export interface UsePayeesRequestOptions {
  search?: string
  networkType?: Mercoa.CounterpartyNetworkType[]
}

export const usePayeesQuery = ({ search, networkType }: UsePayeesRequestOptions) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.CounterpartyResponse[]>({
    queryKey: ['payees', search, networkType],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entity?.id) {
        throw new Error('MercoaSession or entity ID is missing')
      }

      let network: Mercoa.CounterpartyNetworkType[] = [Mercoa.CounterpartyNetworkType.Entity]
      if (
        mercoaSession.iframeOptions?.options?.vendors?.network === 'platform' ||
        mercoaSession.iframeOptions?.options?.vendors?.network === 'all'
      ) {
        network.push(Mercoa.CounterpartyNetworkType.Network)
      }

      if (networkType) {
        network = [...networkType]
      }

      const response = await mercoaSession.client.entity.counterparty.findPayees(mercoaSession.entity.id, {
        paymentMethods: true,
        networkType: network,
        search,
        returnMetadata: 'true',
      })
      return response.data
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entity?.id,
    },
  })
}

export const usePayableFeeQuery = ({
  amount,
  creatorEntityId,
  paymentSourceId,
  paymentDestinationId,
  paymentDestinationOptions,
}: {
  amount?: number
  creatorEntityId?: string
  paymentSourceId?: string
  paymentDestinationId?: string
  paymentDestinationOptions?: Mercoa.PaymentDestinationOptions
}) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceFeesResponse>({
    queryKey: ['payableFee', amount, creatorEntityId, paymentSourceId, paymentDestinationId, paymentDestinationOptions],
    queryFn: async () => {
      if (!mercoaSession?.client || !amount || !paymentSourceId || !paymentDestinationId || !creatorEntityId) {
        throw new Error('Missing required parameters')
      }

      return await mercoaSession.client.calculate.fee({
        amount,
        creatorEntityId,
        paymentSourceId,
        paymentDestinationId,
        paymentDestinationOptions: paymentDestinationOptions?.type ? paymentDestinationOptions : undefined,
      })
    },
    options: {
      enabled: !!mercoaSession?.client && !!amount && !!paymentSourceId && !!paymentDestinationId && !!creatorEntityId,
    },
  })
}

export const useVendorCreditUsageQuery = ({
  amount,
  payerId,
  vendorId,
  invoiceId,
  status,
  vendorCreditIds,
}: {
  amount?: number
  payerId?: string
  vendorId?: string
  invoiceId?: string
  status?: Mercoa.InvoiceStatus
  vendorCreditIds?: Mercoa.VendorCreditId[]
}) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.CalculateVendorCreditUsageResponse>({
    queryKey: ['vendorCreditUsage', amount, payerId, vendorId, invoiceId, status, vendorCreditIds],
    queryFn: async () => {
      if (!mercoaSession?.client || !amount || !payerId || !vendorId) {
        throw new Error('Missing required parameters')
      }

      const vendorCreditApplicationIsFixed =
        status &&
        ![
          Mercoa.InvoiceStatus.Unassigned,
          Mercoa.InvoiceStatus.Draft,
          Mercoa.InvoiceStatus.New,
          Mercoa.InvoiceStatus.Approved,
        ].includes(status as any)

      return await mercoaSession.client.entity.counterparty.vendorCredit.estimateUsage(payerId, vendorId, {
        amount,
        currency: 'USD',
        ...(invoiceId && { excludedInvoiceIds: [invoiceId] }),
        ...(vendorCreditApplicationIsFixed && { includedVendorCreditIds: vendorCreditIds ?? [] }),
      })
    },
    options: {
      enabled: !!mercoaSession?.client && !!amount && !!payerId && !!vendorId,
    },
  })
}

export const usePaymentTimingQuery = ({
  invoiceId,
  processedAt,
  estimatedDeductionDate,
  paymentSourceId,
  paymentDestinationId,
  paymentDestinationOptions,
}: {
  invoiceId?: string
  processedAt?: Date
  estimatedDeductionDate?: Date
  paymentSourceId?: string
  paymentDestinationId?: string
  paymentDestinationOptions?: Mercoa.PaymentDestinationOptions
}) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.CalculatePaymentTimingResponse>({
    queryKey: [
      'paymentTiming',
      invoiceId,
      processedAt,
      estimatedDeductionDate,
      paymentSourceId,
      paymentDestinationId,
      paymentDestinationOptions,
    ],
    queryFn: async () => {
      if (
        !mercoaSession?.client ||
        !paymentSourceId ||
        !paymentDestinationId ||
        !(processedAt || estimatedDeductionDate)
      ) {
        throw new Error('Missing required parameters')
      }

      const payload: Mercoa.CalculatePaymentTimingRequest = {
        invoiceId,
        ...(processedAt ? { processedAt } : { estimatedDeductionDate }),
        paymentSourceId,
        paymentDestinationId,
        paymentDestinationOptions,
      }

      return await mercoaSession.client.calculate.paymentTiming(payload)
    },
    options: {
      enabled:
        !!mercoaSession?.client &&
        !!paymentSourceId &&
        !!paymentDestinationId &&
        !!(processedAt || estimatedDeductionDate),
    },
  })
}

export const usePaymentMethodsQuery = ({ entityId, type }: { entityId?: string; type?: Mercoa.PaymentMethodType }) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Array<Mercoa.PaymentMethodResponse>>({
    queryKey: ['paymentMethods', entityId, type],
    queryFn: async () => {
      if (!mercoaSession?.client || !entityId) {
        throw new Error('Missing required parameters')
      }
      return await mercoaSession.client.entity.paymentMethod.getAll(entityId, { type })
    },
    options: {
      enabled: !!mercoaSession?.client && !!entityId,
    },
  })
}
