import dayjs from 'dayjs'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { MercoaButton } from '../../../../../components/generics'
import { Dialog } from '../../../../../lib/components'
import { isWeekday } from '../../../../../lib/scheduling'

interface EditPaymentDateDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: (date: Date) => void
  isLoading: boolean
  numberOfBills: number
}

export const EditPaymentDateDialog: React.FC<EditPaymentDateDialogProps> = ({
  open,
  setOpen,
  onConfirm,
  isLoading,
  numberOfBills,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  return (
    <Dialog open={open} onOpenChange={(_open) => setOpen(_open)}>
      <div className="mercoa-w-[320px] mercoa-flex mercoa-flex-col mercoa-relative mercoa-bg-white mercoa-text-[#1A1919] mercoa-p-[1rem] mercoa-rounded-[8px]">
        <div className="mercoa-text-left">
          <h3 className="mercoa-text-[16px] mercoa-font-semibold mercoa-text-[#1A1919]">
            Edit payment date for {numberOfBills} bills?
          </h3>
          <p className="mercoa-mt-[8px] mercoa-text-[14px] mercoa-text-[#6E6A68]">
            Updating this field will override existing values for {numberOfBills} bills.
          </p>
        </div>
        <div className="mercoa-mt-[16px]">
          <DatePicker
            className="mercoa-block mercoa-w-full mercoa-rounded-mercoa mercoa-border-gray-300 focus:mercoa-border-mercoa-primary focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm"
            placeholderText="Select Payment Date"
            onChange={(date) => setSelectedDate(date)}
            selected={selectedDate}
            minDate={dayjs().add(1, 'day').toDate()}
            filterDate={isWeekday}
            peekNextMonth
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>
        <div className="mercoa-flex mercoa-justify-end mercoa-mt-[16px]">
          <MercoaButton
            onClick={() => setOpen(false)}
            isEmphasized={false}
            hideOutline={true}
            color="gray"
            className="mercoa-text-[14px] mercoa-font-medium mercoa-text-[#1A1919] hover:mercoa-underline"
          >
            Never mind
          </MercoaButton>
          <MercoaButton
            onClick={() => {
              if (selectedDate) onConfirm(selectedDate)
            }}
            isEmphasized={true}
            className="mercoa-w-[140px] mercoa-text-sm mercoa-justify-center mercoa-flex mercoa-whitespace-nowrap"
            disabled={!selectedDate || isLoading}
          >
            <div className="mercoa-flex mercoa-items-center mercoa-justify-center">
              {isLoading ? (
                <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400" />
              ) : (
                `Schedule payment`
              )}
            </div>
          </MercoaButton>
        </div>
      </div>
    </Dialog>
  )
}
