import dayjs from 'dayjs'
import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { invoicePaymentTypeMapper } from '../../common/invoice-payment-type'
import {
  useApprovePayable,
  useArchivePayable,
  useAssignApprover,
  useBulkApprovePayables,
  useBulkArchivePayables,
  useBulkAssignApprover,
  useBulkCancelPayables,
  useBulkDeletePayables,
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
  const { queryOptions } = payableProps
  const initialQueryOptions = queryOptions?.isInitial ? queryOptions : undefined
  const currentQueryOptions = queryOptions?.isInitial ? undefined : queryOptions
  const mercoaSession = useMercoaSession()
  const { getFilters } = usePayablesFilterStore()
  const { selectedStatusFilters, dateRange, dateType, selectedApprovers, selectedApproverActions } = getFilters(
    'payables',
    [Mercoa.InvoiceStatus.Draft],
    mercoaSession.user,
  )
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
  const [resultsPerPage, setResultsPerPage] = useState(initialQueryOptions?.resultsPerPage || 10)
  const [page, setPage] = useState(0)
  const [selectedInvoices, setSelectedInvoices] = useState<Mercoa.InvoiceResponse[]>([])

  const [selectedColumns, setSelectedColumns] = useState<InvoiceTableColumn[]>([
    { header: 'Vendor Name', field: 'vendor', orderBy: Mercoa.InvoiceOrderByField.VendorName },
    { header: 'Invoice Number', field: 'invoiceNumber', orderBy: Mercoa.InvoiceOrderByField.InvoiceNumber },
    { header: 'Due Date', field: 'dueDate', orderBy: Mercoa.InvoiceOrderByField.DueDate },
    { header: 'Invoice Date', field: 'invoiceDate', orderBy: Mercoa.InvoiceOrderByField.InvoiceDate },
    { header: 'Deduction Date', field: 'deductionDate', orderBy: Mercoa.InvoiceOrderByField.DeductionDate },
    { header: 'Amount', field: 'amount', orderBy: Mercoa.InvoiceOrderByField.Amount },
    { header: 'Status', field: 'status' },
    { header: 'Approvers', field: 'approvers' },
  ])

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

  const toggleSelectedColumn = (field: string) => {
    setSelectedColumns((prevColumns) =>
      prevColumns.some((column) => column.field === field)
        ? prevColumns.filter((column) => column.field !== field)
        : [...prevColumns, { field: field as keyof Mercoa.InvoiceResponse, header: '' }],
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
    queryClient.invalidateQueries({ queryKey: ['payables'] })
    queryClient.invalidateQueries({ queryKey: ['recurringPayables'] })
    queryClient.invalidateQueries({ queryKey: ['payableStatusTabsMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['payableMetrics'] })
    setPage(0)
  }

  const downloadInvoicesAsCSV = async () => {
    let allInvoicePages = data?.pages ?? []
    while (allInvoicePages[allInvoicePages.length - 1].nextCursor) {
      const resp = await fetchNextPage()
      allInvoicePages = resp.data?.pages ?? []
    }
    const allInvoices = allInvoicePages.flatMap((page) => page.invoices)
    const csv = Papa.unparse(
      allInvoices.map((invoice) => {
        return {
          'Invoice ID': invoice.id,
          'Invoice Number': invoice.invoiceNumber,
          Status: invoice.status,
          Amount: invoice.amount,
          Currency: invoice.currency,
          Note: invoice.noteToSelf,
          'Payer ID': invoice.payer?.id,
          'Payer Foreign ID': invoice.payer?.foreignId,
          'Payer Email': invoice.payer?.email,
          'Payer Name': invoice.payer?.name,
          'Vendor ID': invoice.vendor?.id,
          'Vendor Foreign ID': invoice.vendor?.foreignId,
          'Vendor Email': invoice.vendor?.email,
          'Vendor Name': invoice.vendor?.name,
          'Payment Type': invoicePaymentTypeMapper(invoice),
          Metadata: JSON.stringify(invoice.metadata),
          'Due Date': invoice.dueDate ? dayjs(invoice.dueDate).format('YYYY-MM-DD') : undefined,
          'Deduction Date': invoice.deductionDate ? dayjs(invoice.deductionDate).format('YYYY-MM-DD') : undefined,
          'Processed At': invoice.processedAt ? dayjs(invoice.processedAt).format('YYYY-MM-DD') : undefined,
          'Created At': invoice.createdAt ? dayjs(invoice.createdAt).format('YYYY-MM-DD') : undefined,
          'Updated At': invoice.updatedAt ? dayjs(invoice.updatedAt).format('YYYY-MM-DD') : undefined,
        }
      }),
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('mercoa-hidden', '')
    a.setAttribute('href', url)
    a.setAttribute(
      'download',
      `payable-invoice-export-${dayjs(startDate).format('YYYY-MM-DD')}-to-${dayjs(endDate).format('YYYY-MM-DD')}.csv`,
    )
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
      setSelectedColumns,
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
      activeInvoiceAction,
      setActiveInvoiceAction,
      downloadInvoicesAsCSV,
    },
  }

  return out
}
