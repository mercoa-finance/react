import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import {
  useApprovePayable,
  useArchivePayable,
  useAssignApprover,
  useBulkApprovePayables,
  useBulkArchivePayables,
  useBulkAssignApprover,
  useBulkCancelPayables,
  useBulkDeletePayables,
  useBulkDownloadPayables,
  useBulkRejectPayables,
  useBulkRestoreAsDraft,
  useBulkSchedulePayment,
  useBulkSubmitForApproval,
  useCancelPayable,
  useDeletePayable,
  useRejectPayable,
  useRestoreAsDraft,
  useSchedulePayment,
  useSubmitForApproval,
} from '../api/mutations'
import {
  usePayableApprovalPoliciesQuery,
  usePayableMetricsByStatusQuery,
  usePayableStatusTabsMetricsQuery,
  usePayablesQuery,
  useRecurringPayablesQuery,
} from '../api/queries'
import { usePayablesFilterStore } from '../stores/payables-filter-store'
import { InvoiceTableColumn, PayablesContextValue, PayablesProps, PayablesTableActionProps } from '../types'

export function usePayablesInternal(payableProps: PayablesProps) {
  const { queryOptions, renderCustom } = payableProps
  const { columns } = renderCustom ?? {}
  const initialQueryOptions = queryOptions?.isInitial ? queryOptions : undefined
  const currentQueryOptions = queryOptions?.isInitial ? undefined : queryOptions
  const mercoaSession = useMercoaSession()
  const { getFilters, setFilters } = usePayablesFilterStore()
  const {
    selectedStatusFilters,
    dateRange,
    dateType,
    selectedApprovers,
    selectedApproverActions,
    resultsPerPage,
    selectedColumns,
  } = getFilters('payables', [Mercoa.InvoiceStatus.Draft], mercoaSession.user, columns)
  const [activeInvoiceAction, setActiveInvoiceAction] = useState<PayablesTableActionProps | null>(null)

  const memoizedStatusFilters = useMemo(() => selectedStatusFilters || [], [selectedStatusFilters])
  const memoizedApprovers = useMemo(() => selectedApprovers || [], [selectedApprovers])
  const memoizedApproverActions = useMemo(() => selectedApproverActions || [], [selectedApproverActions])
  const [currentStatuses, setCurrentStatuses] = useState<Mercoa.InvoiceStatus[]>(
    initialQueryOptions?.currentStatuses || [],
  )
  const [search, setSearch] = useState(initialQueryOptions?.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [startDate, setStartDate] = useState(initialQueryOptions?.startDate)
  const [endDate, setEndDate] = useState(initialQueryOptions?.endDate)
  const [orderBy, setOrderBy] = useState(initialQueryOptions?.orderBy || Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState(
    initialQueryOptions?.orderDirection || Mercoa.OrderDirection.Desc,
  )
  const [page, setPage] = useState(0)
  const [selectedInvoices, setSelectedInvoices] = useState<Mercoa.InvoiceResponse[]>([])

  const {
    data,
    isFetching,
    fetchNextPage,
    fetchPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isError,
  } = usePayablesQuery({
    currentStatuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    orderBy: currentQueryOptions?.orderBy ? currentQueryOptions.orderBy : orderBy,
    orderDirection: currentQueryOptions?.orderDirection ? currentQueryOptions.orderDirection : orderDirection,
    resultsPerPage: currentQueryOptions?.resultsPerPage ? currentQueryOptions.resultsPerPage : resultsPerPage,
    approverId: memoizedApprovers.length ? memoizedApprovers.map((e) => e.id) : undefined,
    approverActions: memoizedApproverActions.length ? memoizedApproverActions : undefined,
    excludeReceivables: true,
  })

  const { data: recurringPayablesData, isLoading: isRecurringPayablesLoading } = useRecurringPayablesQuery({
    resultsPerPage: 100,
  })

  const { data: metricsData, isLoading: isMetricsLoading } = usePayableMetricsByStatusQuery({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    excludeReceivables: true,
  })

  const { data: approvalPolicies, isLoading: isApprovalPoliciesLoading } = usePayableApprovalPoliciesQuery()
  const { data: statusTabsMetrics, isLoading: isStatusTabsMetricsLoading } = usePayableStatusTabsMetricsQuery({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    excludeReceivables: true,
  })

  const { mutate: deletePayable, isPending: isDeletePayableLoading } = useDeletePayable()
  const { mutate: bulkDeletePayables, isPending: isBulkDeletePayableLoading } = useBulkDeletePayables()

  const { mutate: approvePayable, isPending: isApprovePayableLoading } = useApprovePayable()
  const { mutate: bulkApprovePayables, isPending: isBulkApprovePayablesLoading } = useBulkApprovePayables()

  const { mutate: rejectPayable, isPending: isRejectPayableLoading } = useRejectPayable()
  const { mutate: bulkRejectPayables, isPending: isBulkRejectPayablesLoading } = useBulkRejectPayables()

  const { mutate: schedulePayment, isPending: isSchedulePaymentLoading } = useSchedulePayment()
  const { mutate: bulkSchedulePayment, isPending: isBulkSchedulePaymentLoading } = useBulkSchedulePayment()

  const { mutate: restoreAsDraft, isPending: isRestoreAsDraftLoading } = useRestoreAsDraft()
  const { mutate: bulkRestoreAsDraft, isPending: isBulkRestoreAsDraftLoading } = useBulkRestoreAsDraft()

  const { mutate: submitForApproval, isPending: isSubmitForApprovalLoading } = useSubmitForApproval()
  const { mutate: bulkSubmitForApproval, isPending: isBulkSubmitForApprovalLoading } = useBulkSubmitForApproval()

  const { mutate: assignApprover, isPending: isAssignApproverLoading } = useAssignApprover()
  const { mutate: bulkAssignApprover, isPending: isBulkAssignApproverLoading } = useBulkAssignApprover()

  const { mutate: archivePayable, isPending: isArchivePayableLoading } = useArchivePayable()
  const { mutate: bulkArchivePayables, isPending: isBulkArchivePayablesLoading } = useBulkArchivePayables()

  const { mutate: cancelPayable, isPending: isCancelPayableLoading } = useCancelPayable()
  const { mutate: bulkCancelPayables, isPending: isBulkCancelPayablesLoading } = useBulkCancelPayables()

  const { mutate: bulkDownloadPayables, isPending: isBulkDownloadPayablesLoading } = useBulkDownloadPayables()

  const currentPageData = useMemo(() => {
    return data?.pages[page]?.invoices || []
  }, [data?.pages, page])

  const allFetchedInvoices = useMemo(() => {
    return data?.pages.flatMap((page) => page.invoices) || []
  }, [data?.pages])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [search])

  useEffect(() => {
    setSelectedInvoices([])
    setPage(0)
  }, [
    currentQueryOptions?.currentStatuses,
    currentQueryOptions?.search,
    currentQueryOptions?.startDate,
    currentQueryOptions?.endDate,
    currentQueryOptions?.dateType,
    currentQueryOptions?.orderBy,
    currentQueryOptions?.orderDirection,
    currentQueryOptions?.resultsPerPage,
    debouncedSearch,
    dateRange.startDate,
    dateRange.endDate,
    dateType,
    orderBy,
    orderDirection,
    resultsPerPage,
    memoizedStatusFilters,
  ])

  const handleOrderByChange = (field: Mercoa.InvoiceOrderByField) => {
    if (orderBy === field) {
      setOrderDirection((prevDirection) =>
        prevDirection === Mercoa.OrderDirection.Asc ? Mercoa.OrderDirection.Desc : Mercoa.OrderDirection.Asc,
      )
    } else {
      setOrderBy(field)
      setOrderDirection(Mercoa.OrderDirection.Asc)
    }
  }

  const tableData = useMemo(() => {
    if (!currentPageData) {
      return []
    }
    return currentPageData.map((invoice) => ({
      select: '',
      id: invoice.id,
      invoice: invoice,
      invoiceNumber: invoice.invoiceNumber,
      currencyCode: invoice.currency,
      vendor: invoice.vendor,
      status: invoice.status,
      amount: invoice.amount,
      invoiceId: invoice.id,
      dueDate: invoice.dueDate,
      invoiceDate: invoice.invoiceDate,
      deductionDate: invoice.deductionDate,
      approvers: invoice.approvers,
      paymentDestination: invoice.paymentDestination,
      invoiceType: (invoice.paymentSchedule?.type === Mercoa.PaymentType.OneTime ? 'invoice' : 'invoiceTemplate') as
        | 'invoice'
        | 'invoiceTemplate',
      failureType: invoice.failureType,
      vendorId: invoice.vendorId,
      payerId: invoice.payerId,
      paymentDestinationId: invoice.paymentDestinationId,
      paymentSourceId: invoice.paymentSourceId,
    }))
  }, [currentPageData])

  const isAllSelected =
    allFetchedInvoices.length > 0 &&
    allFetchedInvoices.every((invoice) => selectedInvoices.some((e) => e.id === invoice.id))

  const handleSelectAll = () => {
    setSelectedInvoices((prev) => {
      const existingIds = prev.map((e) => e.id)
      const areAllSelected = allFetchedInvoices.every((fetchedInvoice) => existingIds.includes(fetchedInvoice.id))

      return areAllSelected ? [] : allFetchedInvoices
    })
  }

  const handleSelectRow = (invoice: Mercoa.InvoiceResponse) => {
    setSelectedInvoices((prev) => {
      if (prev.some((e) => e.id === invoice.id)) {
        return prev.filter((e) => e.id !== invoice.id)
      }
      return [...prev, invoice]
    })
  }

  const goToNextPage = async () => {
    if (isFetchingNextPage) {
      return
    }
    // If we're not on the last fetched page, just increment
    if (data?.pages && page < data.pages.length - 1) {
      setPage((prev) => prev + 1)
      return
    }
    // If we're on the last fetched page and there's more, fetch first then increment
    if (data?.pages && page === data.pages.length - 1 && hasNextPage) {
      await fetchNextPage()
      setPage((prev) => prev + 1)
    }
  }

  const goToPreviousPage = async () => {
    if (isFetchingPreviousPage) {
      return
    }
    if (page > 0) {
      setPage((prev) => prev - 1)
    }
  }

  const isNextDisabled = isFetchingNextPage || !data?.pages || (page === data.pages.length - 1 && !hasNextPage)
  const isPrevDisabled = page === 0

  const handleResultsPerPage = (rpp: number) => {
    setFilters('payables', { resultsPerPage: rpp })
    setPage(0)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['payables'] })
    queryClient.invalidateQueries({ queryKey: ['recurringPayables'] })
    queryClient.invalidateQueries({ queryKey: ['payableStatusTabsMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['payableMetrics'] })
    setPage(0)
  }

  const downloadInvoicesAsCSV = async () => {
    bulkDownloadPayables({
      format: 'CSV',
      startDate: dateRange.startDate ?? undefined,
      endDate: dateRange.endDate ?? undefined,
      dateType,
      orderBy,
      orderDirection,
      search: debouncedSearch,
      status: memoizedStatusFilters,
      toast: payableProps.renderCustom?.toast,
    })
  }

  const toggleSelectedColumn = (field: string) => {
    setFilters('payables', {
      selectedColumns: selectedColumns.some((column) => column.field === field)
        ? selectedColumns.filter((column) => column.field !== field)
        : [...selectedColumns, { field: field as keyof Mercoa.InvoiceResponse, header: '' }],
    })
  }

  const toggleSelectedStatus = (status: Mercoa.InvoiceStatus) => {
    setCurrentStatuses((prevStatuses) =>
      prevStatuses.includes(status) ? prevStatuses.filter((s) => s !== status) : [...prevStatuses, status],
    )
  }

  const out: PayablesContextValue = {
    propsContextValue: payableProps,
    dataContextValue: {
      tableData,
      infiniteData: data,
      allFetchedInvoices,
      isDataLoading: isLoading && !!mercoaSession.entityId,
      isFetching,
      isFetchingNextPage,
      isFetchingPreviousPage,
      isLoading,
      isError,
      isRefreshLoading: isFetching,
      handleRefresh,
      recurringPayablesData,
      isRecurringPayablesLoading,
      approvalPolicies,
      isApprovalPoliciesLoading,
      metricsData,
      isMetricsLoading,
      statusTabsMetrics,
      isStatusTabsMetricsLoading,
    },

    filtersContextValue: {
      currentStatuses,
      setCurrentStatuses,
      search,
      setSearch,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      selectedStatusFilters: {
        toggleSelectedStatus,
      },
    },

    paginationContextValue: {
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      resultsPerPage,
      setResultsPerPage: handleResultsPerPage,
      page,
      totalEntries: data?.pages[0]?.count || 0,
      goToNextPage,
      goToPreviousPage,
      isNextDisabled,
      isPrevDisabled,
      handleOrderByChange,
    },

    selectionContextValue: {
      selectedInvoices,
      setSelectedInvoices,
      isAllSelected,
      handleSelectAll,
      handleSelectRow,
      selectedColumns,
      setSelectedColumns: (columns: InvoiceTableColumn[]) => setFilters('payables', { selectedColumns: columns }),
      toggleSelectedColumn,
    },

    actionsContextValue: {
      deletePayable,
      isDeletePayableLoading,
      bulkDeletePayables,
      isBulkDeletePayableLoading,
      schedulePayment,
      isSchedulePaymentLoading,
      bulkSchedulePayment,
      isBulkSchedulePaymentLoading,
      approvePayable,
      isApprovePayableLoading,
      bulkApprovePayables,
      isBulkApprovePayablesLoading,
      rejectPayable,
      isRejectPayableLoading,
      bulkRejectPayables,
      isBulkRejectPayablesLoading,
      restoreAsDraft,
      isRestoreAsDraftLoading,
      bulkRestoreAsDraft,
      isBulkRestoreAsDraftLoading,
      submitForApproval,
      isSubmitForApprovalLoading,
      bulkSubmitForApproval,
      isBulkSubmitForApprovalLoading,
      assignApprover,
      isAssignApproverLoading,
      bulkAssignApprover,
      isBulkAssignApproverLoading,
      archivePayable,
      isArchivePayableLoading,
      bulkArchivePayables,
      isBulkArchivePayablesLoading,
      cancelPayable,
      isCancelPayableLoading,
      bulkCancelPayables,
      isBulkCancelPayablesLoading,
      bulkDownloadPayables,
      isBulkDownloadPayablesLoading,
      activeInvoiceAction,
      setActiveInvoiceAction,
      downloadInvoicesAsCSV,
    },
  }

  return out
}
