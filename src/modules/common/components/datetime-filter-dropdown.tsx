import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton, Tooltip } from '../../../components/generics'
import { Popover } from '../../../lib/components'
import { usePayablesFilterStore } from '../../payables/stores/payables-filter-store'
import { useReceivablesFilterStore } from '../../receivables/stores/receivables-filter-store'
import { RightArrowIcon } from '../assets/icons'

enum DateTimeFilterView {
  PRESET = 'PRESET',
  DATE_TYPE = 'DATE_TYPE',
  CUSTOM_RANGE = 'CUSTOM_RANGE',
}

interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

interface DateTimeFilterDropdownProps {
  tableId: string
}

export const DateTimeFilterDropdown: React.FC<DateTimeFilterDropdownProps> = ({ tableId }) => {
  const store = tableId === 'payables' ? usePayablesFilterStore : useReceivablesFilterStore
  const { getFilters, setFilters } = store()
  const {
    dateRange: storeDateRange,
    dateType: storeDateType,
    dateRangeLabel: storeDateRangeLabel,
  } = getFilters(tableId)
  const [view, setView] = useState<DateTimeFilterView>(DateTimeFilterView.PRESET)

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Parse stored dates if they exist
    if (storeDateRange) {
      return {
        startDate: storeDateRange.startDate ? new Date(storeDateRange.startDate) : null,
        endDate: storeDateRange.endDate ? new Date(storeDateRange.endDate) : null,
      }
    }
    return {
      startDate: null,
      endDate: null,
    }
  })
  const [dateRangeLabel, setDateRangeLabel] = useState(storeDateRangeLabel ?? '')
  const [dateType, setDateType] = useState<Mercoa.InvoiceDateFilter>(
    storeDateType ?? Mercoa.InvoiceDateFilter.CreatedAt,
  )
  const [open, setOpen] = useState(false)

  const handlePresetSelect = (preset: { startDate: Date; endDate: Date }) => {
    setDateRange({
      startDate: dayjs(preset.startDate).startOf('day').toDate(),
      endDate: dayjs(preset.endDate).endOf('day').toDate(),
    })
  }

  const handleDateTypeSelect = (type: Mercoa.InvoiceDateFilter) => {
    setDateType(type)
    setView(DateTimeFilterView.PRESET)
  }

  const renderContent = () => {
    switch (view) {
      case DateTimeFilterView.PRESET:
        return (
          <div className="mercoa-flex mercoa-flex-col mercoa-w-[280px]">
            <div className="mercoa-z-[100] mercoa-relative mercoa-flex mercoa-w-full mercoa-items-center mercoa-gap-2 mercoa-cursor-pointer mercoa-py-[0.75rem] mercoa-px-[0.75rem] mercoa-bg-[#fcfbfa] mercoa-border-b mercoa-border-[#e9e5e2]">
              <p className="mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-color-[#1A1919]">Filter by</p>
              <button onClick={() => setView(DateTimeFilterView.DATE_TYPE)} className="mercoa-underline">
                <p className="mercoa-font-medium mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-capitalize mercoa-color-[#1A1919]">
                  {dateType.replace('_', ' ').toLowerCase()}
                </p>
              </button>
            </div>
            <div>
              <div
                className="mercoa-text-[14px] mercoa-flex mercoa-flex-col mercoa-items-start mercoa-justify-between mercoa-h-[60px] mercoa-gap-1 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                onClick={() => {
                  setDateRangeLabel('Today')
                  handlePresetSelect({ startDate: dayjs().toDate(), endDate: dayjs().toDate() })
                  setOpen(false)
                }}
              >
                <span>Today</span>
                <span className="mercoa-text-[#6E6A68] mercoa-text-[0.75rem] mercoa-leading-[1rem] mercoa-font-light">
                  {dayjs().format('MMM D, YYYY')}
                </span>
              </div>
              <div
                className="mercoa-text-[14px] mercoa-flex mercoa-flex-col mercoa-items-start mercoa-justify-between mercoa-h-[60px] mercoa-gap-1 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                onClick={() => {
                  setDateRangeLabel('Yesterday')
                  handlePresetSelect({
                    startDate: dayjs().subtract(1, 'day').toDate(),
                    endDate: dayjs().subtract(1, 'day').toDate(),
                  })
                  setOpen(false)
                }}
              >
                <span>Yesterday</span>
                <span className="mercoa-text-[#6E6A68] mercoa-text-[0.75rem] mercoa-leading-[1rem] mercoa-font-light">
                  {dayjs().subtract(1, 'day').format('MMM D, YYYY')}
                </span>
              </div>
              <div
                className="mercoa-text-[14px] mercoa-flex mercoa-flex-col mercoa-items-start mercoa-justify-between mercoa-h-[60px] mercoa-gap-1 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                onClick={() => {
                  setDateRangeLabel('This Month')
                  handlePresetSelect({
                    startDate: dayjs().startOf('month').toDate(),
                    endDate: dayjs().endOf('month').toDate(),
                  })
                  setOpen(false)
                }}
              >
                <span>This month</span>
                <span className="mercoa-text-[#6E6A68] mercoa-text-[0.75rem] mercoa-leading-[1rem] mercoa-font-light">
                  {`${dayjs().startOf('month').format('MMM D')} - ${dayjs().endOf('month').format('MMM D')}`}
                </span>
              </div>
              <div
                className="mercoa-text-[14px] mercoa-flex mercoa-flex-col mercoa-items-start mercoa-justify-between mercoa-h-[60px] mercoa-gap-1 mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                onClick={() => {
                  setDateRangeLabel('Last Month')
                  handlePresetSelect({
                    startDate: dayjs().subtract(1, 'month').startOf('month').toDate(),
                    endDate: dayjs().subtract(1, 'month').endOf('month').toDate(),
                  })
                  setOpen(false)
                }}
              >
                <span>Last month</span>
                <span className="mercoa-text-[#6E6A68] mercoa-text-[0.75rem] mercoa-leading-[1rem] mercoa-font-light">
                  {`${dayjs().subtract(1, 'month').startOf('month').format('MMM D')} - ${dayjs()
                    .subtract(1, 'month')
                    .endOf('month')
                    .format('MMM D')}`}
                </span>
              </div>
              <div
                className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-between mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
                onClick={() => setView(DateTimeFilterView.CUSTOM_RANGE)}
              >
                Custom range
                <RightArrowIcon />
              </div>
            </div>
            <div className="mercoa-z-[100] mercoa-relative mercoa-flex mercoa-w-full mercoa-justify-end mercoa-items-center mercoa-gap-4 mercoa-cursor-pointer mercoa-py-[0.75rem] mercoa-px-[0.75rem] mercoa-bg-[#fcfbfa] mercoa-border-t mercoa-border-[#e9e5e2]">
              <p
                onClick={() => {
                  setDateRange({
                    startDate: null,
                    endDate: null,
                  })
                  setDateRangeLabel('')
                  handleReset()
                }}
                className="hover:mercoa-underline mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-capitalize mercoa-color-[#1A1919]"
              >
                Reset
              </p>
            </div>
          </div>
        )
      case DateTimeFilterView.DATE_TYPE:
        return (
          <div className="mercoa-flex mercoa-flex-col mercoa-w-[280px]">
            <div className="mercoa-z-[100] mercoa-relative mercoa-flex mercoa-w-full mercoa-items-center mercoa-gap-4 mercoa-cursor-pointer mercoa-py-[0.75rem] mercoa-px-[0.75rem] mercoa-bg-[#fcfbfa] mercoa-border-b mercoa-border-[#e9e5e2]">
              <button
                className="mercoa-text-sm mercoa-text-gray-900 hover:mercoa-underline"
                onClick={() => setView(DateTimeFilterView.PRESET)}
              >
                <BackIcon />
              </button>
              <p className="mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-capitalize mercoa-color-[#1A1919]">
                {dateType.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <div
              className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-between mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
              onClick={() => handleDateTypeSelect(Mercoa.InvoiceDateFilter.CreatedAt)}
            >
              Creation Date
            </div>
            <div
              className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-between mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
              onClick={() => handleDateTypeSelect(Mercoa.InvoiceDateFilter.DeductionDate)}
            >
              Deduction Date
            </div>
            <div
              className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-between mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
              onClick={() => handleDateTypeSelect(Mercoa.InvoiceDateFilter.DueDate)}
            >
              Due Date
            </div>
            <div
              className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-between mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
              onClick={() => handleDateTypeSelect(Mercoa.InvoiceDateFilter.InvoiceDate)}
            >
              Invoice Date
            </div>
            <div
              className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-justify-between mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
              onClick={() => handleDateTypeSelect(Mercoa.InvoiceDateFilter.SettlementDate)}
            >
              Settlement Date
            </div>
            <div className="mercoa-z-[100] mercoa-relative mercoa-flex mercoa-w-full mercoa-justify-end mercoa-items-center mercoa-gap-4 mercoa-cursor-pointer mercoa-py-[0.75rem] mercoa-px-[0.75rem] mercoa-bg-[#fcfbfa] mercoa-border-t mercoa-border-[#e9e5e2]">
              <p
                onClick={() => {
                  setDateRange({
                    startDate: null,
                    endDate: null,
                  })
                  setDateRangeLabel('')
                  handleReset()
                }}
                className="hover:mercoa-underline mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-capitalize mercoa-color-[#1A1919]"
              >
                Reset
              </p>
            </div>
          </div>
        )
      case DateTimeFilterView.CUSTOM_RANGE:
        return (
          <div className="mercoa-flex mercoa-flex-col mercoa-gap-2">
            <div className="mercoa-z-[100] mercoa-relative mercoa-flex mercoa-w-full mercoa-items-center mercoa-gap-4 mercoa-cursor-pointer mercoa-py-[0.75rem] mercoa-px-[0.75rem] mercoa-bg-[#fcfbfa] mercoa-border-b mercoa-border-[#e9e5e2]">
              <button
                className="mercoa-text-sm mercoa-text-gray-900 hover:mercoa-underline"
                onClick={() => setView(DateTimeFilterView.PRESET)}
              >
                <BackIcon />
              </button>
              <p className="mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-capitalize mercoa-color-[#1A1919]">
                {dateType.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <div className="mercoa-z-[10] custom-date-range mercoa-w-[485px] mercoa-flex mercoa-justify-center mercoa-items-center mercoa-translate-y-[-10px]">
              <DatePicker
                selected={dateRange.startDate}
                onChange={(dates: [Date | null, Date | null]) => {
                  setDateRange({
                    startDate: dates[0] ? dayjs(dates[0]).startOf('day').toDate() : null,
                    endDate: dates[1] ? dayjs(dates[1]).endOf('day').toDate() : null,
                  })
                  if (dates[0] && dates[1]) {
                    setDateRangeLabel(
                      `${dayjs(dates[0]).format('MMM D, YYYY')} - ${dayjs(dates[1]).format('MMM D, YYYY')}`,
                    )
                    setOpen(false)
                  } else if (dates[0]) {
                    setDateRangeLabel(`${dayjs(dates[0]).format('MMM D, YYYY')}`)
                  }
                }}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                selectsRange
                inline
                monthsShown={2}
                className="mercoa-flex mercoa-gap-4 mercoa-p-0 mercoa-border-none"
              />
            </div>
            <div className="mercoa-mt-[-20px] mercoa-z-[100] mercoa-relative mercoa-flex mercoa-w-full mercoa-justify-end mercoa-items-center mercoa-gap-4 mercoa-cursor-pointer mercoa-py-[0.75rem] mercoa-px-[0.75rem] mercoa-bg-[#fcfbfa] mercoa-border-t mercoa-border-[#e9e5e2]">
              <p
                onClick={() => {
                  setDateRange({
                    startDate: null,
                    endDate: null,
                  })
                  setDateRangeLabel('')
                  handleReset()
                }}
                className="hover:mercoa-underline mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-capitalize mercoa-color-[#1A1919]"
              >
                Reset
              </p>
            </div>
          </div>
        )
    }
  }

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate && dateType) {
      setFilters(tableId, {
        dateRange: dateRange,
        dateType: dateType,
        dateRangeLabel: dateRangeLabel,
      })
    }
  }, [dateRange, dateType, setFilters])

  const handleReset = () => {
    setFilters(tableId, {
      dateRange: {
        startDate: null,
        endDate: null,
      },
      dateRangeLabel: '',
      dateType: Mercoa.InvoiceDateFilter.CreatedAt,
    })
  }

  return (
    <Popover
      align="end"
      open={open}
      sideOffset={5}
      alignOffset={10}
      onOpenChange={(_open) => setOpen(_open)}
      trigger={
        <div>
          {!dateRangeLabel ? (
            <Tooltip title="Filter by date">
              <MercoaButton
                onClick={() => {
                  setOpen(true)
                }}
                isEmphasized={true}
                className="mercoa-h-[32px] mercoa-w-[32px] mercoa-rounded-full mercoa-flex mercoa-items-center mercoa-justify-center"
              >
                <div className="mercoa-stroke-[#FFF]">
                  <CalendarIcon />
                </div>
              </MercoaButton>
            </Tooltip>
          ) : (
            <MercoaButton
              isEmphasized={true}
              onClick={() => {
                setOpen(true)
              }}
              className="mercoa-h-[32px] mercoa-w-fit mercoa-px-[8px] mercoa-flex mercoa-gap-2 mercoa-items-center mercoa-justify-center mercoa-rounded-[20vmin] mercoa-border mercoa-border-solid mercoa-border-[#d2cecB] mercoa-bg-[#E9E5E2]"
            >
              <div className="mercoa-stroke-[#FFF]">
                <CalendarIcon />
              </div>
              <p className="mercoa-color-[#1A1919] mercoa-text-[13px] mercoa-whitespace-nowrap">{dateRangeLabel}</p>
            </MercoaButton>
          )}
        </div>
      }
    >
      <div className="mercoa-w-fit mercoa-rounded-mercoa mercoa-flex  mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-max-h-[calc(100vh-2rem)] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
        {renderContent()}
      </div>
    </Popover>
  )
}

DateTimeFilterDropdown.displayName = 'DateTimeFilterDropdown'

export const CalendarIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
}

export const BackIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  )
}
