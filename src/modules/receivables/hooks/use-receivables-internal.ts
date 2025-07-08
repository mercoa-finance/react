import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { InvoiceTableColumn } from '../../payables/types'
import {
  useArchiveReceivable,
  useBulkArchiveReceivables,
  useBulkCancelReceivables,
  useBulkDeleteReceivables,
  useBulkDownloadReceivables,
  useBulkRestoreAsDraftReceivable,
  useCancelReceivable,
  useDeleteReceivable,
  useRestoreAsDraftReceivable,
} from '../api/mutations'
import {
  useReceivableMetricsByStatusQuery,
  useReceivablesQuery,
  useReceivableStatusTabsMetricsQuery,
  useRecurringReceivablesQuery,
} from '../api/queries'
import { ReceivablesTableAction } from '../components/receivables-table/constants'
import { useReceivablesFilterStore } from '../stores/receivables-filter-store'
import { ReceivablesContextValue, ReceivablesProps } from '../types'

export function useReceivablesInternal(receivableProps: ReceivablesProps) {
  const mercoaSession = useMercoaSession()
  const { queryOptions, renderCustom } = receivableProps
  const { columns } = renderCustom ?? {}
  const initialQueryOptions = queryOptions?.isInitial ? queryOptions : undefined
  const currentQueryOptions = queryOptions?.isInitial ? undefined : queryOptions
  const { getFilters, setFilters } = useReceivablesFilterStore()
  const { selectedStatusFilters, dateRange, dateType } = getFilters('receivables')
  const [activeInvoiceAction, setActiveInvoiceAction] = useState<{
    invoiceId: string[] | string
    action: ReceivablesTableAction
    mode: 'single' | 'multiple'
  } | null>(null)

  const memoizedStatusFilters = useMemo(() => selectedStatusFilters || [], [selectedStatusFilters])
  const [currentStatuses, setCurrentStatuses] = useState<Mercoa.InvoiceStatus[]>(
    initialQueryOptions?.currentStatuses || [Mercoa.InvoiceStatus.Draft],
  )
  const [search, setSearch] = useState(initialQueryOptions?.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [startDate, setStartDate] = useState(initialQueryOptions?.startDate)
  const [endDate, setEndDate] = useState(initialQueryOptions?.endDate)
  const [orderBy, setOrderBy] = useState(initialQueryOptions?.orderBy || Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState(
    initialQueryOptions?.orderDirection || Mercoa.OrderDirection.Desc,
  )
  const [resultsPerPage, setResultsPerPage] = useState(initialQueryOptions?.resultsPerPage || 10)
  const [page, setPage] = useState(0)
  const [selectedInvoices, setSelectedInvoices] = useState<Mercoa.InvoiceResponse[]>([])

  const [selectedColumns, setSelectedColumns] = useState<InvoiceTableColumn[]>(
    columns ?? [
      { header: 'Payer Name', field: 'payer' },
      { header: 'Invoice Number', field: 'invoiceNumber' },
      { header: 'Amount', field: 'amount' },
      { header: 'Due Date', field: 'dueDate' },
      { header: 'Invoice Date', field: 'invoiceDate' },
      { header: 'Payment Initiated', field: 'processedAt' },
      { header: 'Status', field: 'status' },
    ],
  )

  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isError,
  } = useReceivablesQuery({
    currentStatuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    orderBy: currentQueryOptions?.orderBy ? currentQueryOptions.orderBy : orderBy,
    orderDirection: currentQueryOptions?.orderDirection ? currentQueryOptions.orderDirection : orderDirection,
    resultsPerPage: currentQueryOptions?.resultsPerPage ? currentQueryOptions.resultsPerPage : resultsPerPage,
  })

  const { data: recurringReceivablesData, isLoading: isRecurringReceivablesLoading } = useRecurringReceivablesQuery({
    resultsPerPage: 100,
  })

  const { data: metricsData, isLoading: isMetricsLoading } = useReceivableMetricsByStatusQuery({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    returnByDate: Mercoa.InvoiceMetricsPerDateGroupBy.CreationDate,
    excludePayables: true,
  })

  const { data: statusTabsMetrics, isLoading: isStatusTabsMetricsLoading } = useReceivableStatusTabsMetricsQuery({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    excludePayables: true,
  })

  const { mutate: deleteReceivable, isPending: isDeleteReceivableLoading } = useDeleteReceivable()
  const { mutate: bulkDeleteReceivables, isPending: isBulkDeleteReceivableLoading } = useBulkDeleteReceivables()
  const { mutate: restoreAsDraft, isPending: isRestoreAsDraftReceivableLoading } = useRestoreAsDraftReceivable()
  const { mutate: bulkRestoreAsDraft, isPending: isBulkRestoreAsDraftReceivableLoading } =
    useBulkRestoreAsDraftReceivable()
  const { mutate: archiveReceivable, isPending: isArchiveReceivableLoading } = useArchiveReceivable()
  const { mutate: bulkArchiveReceivables, isPending: isBulkArchiveReceivablesLoading } = useBulkArchiveReceivables()
  const { mutate: cancelReceivable, isPending: isCancelReceivableLoading } = useCancelReceivable()
  const { mutate: bulkCancelReceivables, isPending: isBulkCancelReceivablesLoading } = useBulkCancelReceivables()
  const { mutate: bulkDownloadReceivables, isPending: isBulkDownloadReceivablesLoading } = useBulkDownloadReceivables()

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
      status: invoice.status,
      payer: invoice.payer?.name,
      invoiceNumber: invoice.invoiceNumber,
      currencyCode: invoice.currency,
      payerName: invoice.payer?.name,
      payerEmail: invoice.payer?.email,
      amount: invoice.amount,

      invoiceId: invoice.id,
      dueDate: invoice.dueDate,
      invoiceDate: invoice.invoiceDate,
      processedAt: invoice.processedAt,
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
    allFetchedInvoices.every((invoice) => selectedInvoices.map((e) => e.id).includes(invoice.id))

  const handleSelectAll = () => {
    setSelectedInvoices((prev) => {
      const existingIds = prev.map((e) => e.id)
      const areAllSelected = allFetchedInvoices.every((fetchedInvoice) => existingIds.includes(fetchedInvoice.id))

      return areAllSelected ? [] : allFetchedInvoices
    })
  }

  const handleSelectRow = (invoice: Mercoa.InvoiceResponse) => {
    setSelectedInvoices((prev) => {
      console.log('invoice', invoice)
      console.log('prev', prev)
      if (prev.some((e) => e.id === invoice.id)) {
        return prev.filter((e) => e.id !== invoice.id)
      }
      return [...prev, invoice]
    })
  }

  const goToNextPage = () => {
    if (isFetchingNextPage) {
      return
    }
    if (data?.pages && page === data.pages.length - 1 && hasNextPage) {
      fetchNextPage()
    }
    setPage((prev) => prev + 1)
  }

  const goToPreviousPage = () => {
    if (page > 0) {
      setPage((prev) => prev - 1)
    }
  }

  const isNextDisabled = isFetchingNextPage || !data?.pages || (page === data.pages.length - 1 && !hasNextPage)
  const isPrevDisabled = page === 0

  const toggleSelectedColumn = (field: any) => {
    setSelectedColumns((prevColumns) =>
      prevColumns.some((column) => column.field === field)
        ? prevColumns.filter((column) => column.field !== field)
        : [...prevColumns, { field, title: '' }],
    )
  }

  const toggleSelectedStatus = (status: Mercoa.InvoiceStatus) => {
    setCurrentStatuses((prevStatuses) =>
      prevStatuses.includes(status) ? prevStatuses.filter((s) => s !== status) : [...prevStatuses, status],
    )
  }

  const handleResultsPerPage = (rpp: number) => {
    setResultsPerPage(rpp)
    setPage(0)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['receivables'] })
    queryClient.invalidateQueries({ queryKey: ['recurringReceivables'] })
    queryClient.invalidateQueries({ queryKey: ['receivableMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['receivableStatusTabsMetrics'] })
    setPage(0)
  }

  const downloadInvoicesAsCSV = async () => {
    bulkDownloadReceivables({
      format: 'CSV',
      startDate: dateRange.startDate ?? undefined,
      endDate: dateRange.endDate ?? undefined,
      dateType,
      orderBy,
      orderDirection,
      search: debouncedSearch,
      status: memoizedStatusFilters,
      toast: receivableProps.renderCustom?.toast,
    })
  }

  useEffect(() => {
    setFilters('receivables', {
      selectedStatusFilters: currentStatuses,
    })
  }, [currentStatuses])

  const out: ReceivablesContextValue = {
    propsContextValue: {
      ...receivableProps,
    },

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
      recurringReceivablesData,
      isRecurringReceivablesLoading,
      metricsData,
      isMetricsLoading,
      statusTabsMetrics,
      isStatusTabsMetricsLoading,
    },

    filtersContextValue: {
      search,
      setSearch,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      currentStatuses,
      setCurrentStatuses,
      toggleSelectedStatus,
    },

    sortingContextValue: {
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      handleOrderByChange,
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
      setSelectedColumns,
      toggleSelectedColumn,
    },

    actionsContextValue: {
      deleteReceivable,
      isDeleteReceivableLoading,
      bulkDeleteReceivables,
      isBulkDeleteReceivableLoading,
      activeInvoiceAction,
      setActiveInvoiceAction,
      downloadInvoicesAsCSV,
      restoreAsDraft,
      isBulkRestoreAsDraftReceivableLoading,
      bulkRestoreAsDraft,
      isRestoreAsDraftReceivableLoading,
      archiveReceivable,
      isArchiveReceivableLoading,
      bulkArchiveReceivables,
      isBulkArchiveReceivablesLoading,
      cancelReceivable,
      isCancelReceivableLoading,
      bulkCancelReceivables,
      isBulkCancelReceivablesLoading,
      bulkDownloadReceivables,
      isBulkDownloadReceivablesLoading,
    },
  }

  return out
}
