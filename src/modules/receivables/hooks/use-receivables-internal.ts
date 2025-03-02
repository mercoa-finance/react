import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceTableColumn, useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import {
  useReceivableMetricsByStatus,
  useReceivables as useReceivablesQuery,
  useReceivableStatusTabsMetricsQuery,
} from '../api/queries'
import { ReceivablesProps } from '../components/receivables/types'
import { useReceivablesFilterStore } from '../stores/receivables-filter-store'

export function useReceivablesInternal(receivableProps: ReceivablesProps) {
  const mercoaSession = useMercoaSession()
  const { queryOptions } = receivableProps
  const initialQueryOptions = queryOptions?.isInitial ? queryOptions : undefined
  const currentQueryOptions = queryOptions?.isInitial ? undefined : queryOptions
  const { getFilters, setFilters } = useReceivablesFilterStore()
  const { selectedStatusFilters, dateRange, dateType } = getFilters('receivables')

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
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])

  const [selectedColumns, setSelectedColumns] = useState<InvoiceTableColumn[]>([
    { title: 'Payer', field: 'payer', orderBy: Mercoa.InvoiceOrderByField.PayerName },
    { title: 'Invoice Number', field: 'invoiceNumber', orderBy: Mercoa.InvoiceOrderByField.InvoiceNumber },
    { title: 'Due Date', field: 'dueDate', orderBy: Mercoa.InvoiceOrderByField.DueDate },
    { title: 'Invoice Date', field: 'invoiceDate', orderBy: Mercoa.InvoiceOrderByField.InvoiceDate },
    { title: 'Amount', field: 'amount', orderBy: Mercoa.InvoiceOrderByField.Amount },
    { title: 'Status', field: 'status' },
  ])

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

  const { data: metricsData, isLoading: isMetricsLoading } = useReceivableMetricsByStatus({
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

  //   const { data: recurringReceivablesData, isLoading: isRecurringReceivablesLoading } = useRecurringReceivables({
  //     resultsPerPage: 100,
  //   })

  const [isExporting, setIsExporting] = useState(false)

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
    setSelectedInvoiceIds([])
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
      payer: invoice.payer?.name,
      invoiceNumber: invoice.invoiceNumber,
      currencyCode: invoice.currency,
      payerName: invoice.payer?.name,
      payerEmail: invoice.payer?.email,
      amount: invoice.amount,
      status: invoice.status,
      invoiceId: invoice.id,
      dueDate: invoice.dueDate,
      invoiceDate: invoice.invoiceDate,
      paymentDestination: invoice.paymentDestination,
      invoiceType: invoice.paymentSchedule?.type === Mercoa.PaymentType.OneTime ? 'One Time' : 'Recurring',
      failureType: invoice.failureType,
      vendorId: invoice.vendorId,
      payerId: invoice.payerId,
      paymentDestinationId: invoice.paymentDestinationId,
      paymentSourceId: invoice.paymentSourceId,
    }))
  }, [currentPageData])

  const isAllSelected =
    allFetchedInvoices.length > 0 && allFetchedInvoices.every((invoice) => selectedInvoiceIds.includes(invoice.id))

  const handleSelectAll = () => {
    setSelectedInvoiceIds((prev) => {
      const allIds = allFetchedInvoices.map((invoice) => invoice.id)
      const areAllSelected = allIds.every((id) => prev.includes(id))

      return areAllSelected ? [] : allIds
    })
  }

  const handleSelectRow = (invoiceId: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId],
    )
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
    queryClient.invalidateQueries({ queryKey: ['receivableMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['receivableStatusTabsMetrics'] })
    setPage(0)
  }

  useEffect(() => {
    setFilters('receivables', {
      selectedStatusFilters: currentStatuses,
    })
  }, [currentStatuses])


  type ReceivablesInternalReturn = {
    propsContextValue: ReceivablesProps
    dataContextValue: {
      tableData: Array<{
        select: string
        id: string
        invoice: Mercoa.InvoiceResponse
        payer: string | undefined
        invoiceNumber: string | undefined
        currencyCode: string | undefined
        payerName?: string
        payerEmail?: string
        amount: number | undefined
        status: Mercoa.InvoiceStatus
        invoiceId: string
        dueDate: Date | undefined
        invoiceDate: Date | undefined
        paymentDestination: Mercoa.PaymentMethodResponse | undefined
        invoiceType: string
        failureType?: string | undefined
        vendorId: string | undefined
        payerId: string | undefined
        paymentDestinationId?: string | undefined
        paymentSourceId?: string | undefined
      }>
      infiniteData: any
      allFetchedInvoices: Mercoa.InvoiceResponse[]
      totalItems: number
      isDataLoading: boolean
      isFetching: boolean
      isFetchingNextPage: boolean
      isFetchingPreviousPage: boolean
      isLoading: boolean
      isError: boolean
      isRefreshLoading: boolean
      handleRefresh: () => void
      metricsData: Mercoa.InvoiceMetricsResponse[] | undefined
      isMetricsLoading: boolean
      statusTabsMetrics: any
      isStatusTabsMetricsLoading: boolean
    }
    filtersContextValue: {
      search: string
      setSearch: (search: string) => void
      startDate: Date | undefined
      setStartDate: (date: Date | undefined) => void
      endDate: Date | undefined
      setEndDate: (date: Date | undefined) => void
      currentStatuses: Mercoa.InvoiceStatus[]
      setCurrentStatuses: (statuses: Mercoa.InvoiceStatus[]) => void
      toggleSelectedStatus: (status: Mercoa.InvoiceStatus) => void
    }
    sortingContextValue: {
      orderBy: Mercoa.InvoiceOrderByField
      setOrderBy: (field: Mercoa.InvoiceOrderByField) => void
      orderDirection: Mercoa.OrderDirection
      setOrderDirection: (direction: Mercoa.OrderDirection) => void
      handleOrderByChange: (field: Mercoa.InvoiceOrderByField) => void
    }
    paginationContextValue: {
      page: number
      resultsPerPage: number
      setResultsPerPage: (perPage: number) => void
      goToNextPage: () => void
      goToPreviousPage: () => void
      totalEntries: number
      isNextDisabled: boolean
      isPrevDisabled: boolean
    }
    selectionContextValue: {
      selectedInvoiceIds: string[]
      setSelectedInvoiceIds: (ids: string[]) => void
      isAllSelected: boolean
      handleSelectAll: () => void
      handleSelectRow: (invoiceId: string) => void
      selectedColumns: InvoiceTableColumn[]
      setSelectedColumns: (columns: InvoiceTableColumn[]) => void
      toggleSelectedColumn: (column: InvoiceTableColumn) => void
    }
  }

  return {
    propsContextValue: {
      ...receivableProps,
    },

    dataContextValue: {
      tableData,
      infiniteData: data,
      allFetchedInvoices,
      totalItems: data?.pages[0]?.count || 0,
      isDataLoading: isLoading && !!mercoaSession.entityId,
      isFetching,
      isFetchingNextPage,
      isFetchingPreviousPage,
      isLoading,
      isError,
      isRefreshLoading: isFetching,
      handleRefresh,
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
      page,
      resultsPerPage,
      setResultsPerPage: handleResultsPerPage,
      goToNextPage,
      goToPreviousPage,
      totalEntries: data?.pages[0]?.count || 0,
      isNextDisabled,
      isPrevDisabled,
    },

    selectionContextValue: {
      selectedInvoiceIds,
      setSelectedInvoiceIds,
      isAllSelected,
      handleSelectAll,
      handleSelectRow,
      selectedColumns,
      setSelectedColumns,
      toggleSelectedColumn,
    },
  } satisfies ReceivablesInternalReturn
}
