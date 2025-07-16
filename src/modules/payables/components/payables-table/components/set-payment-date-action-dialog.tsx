import dayjs from 'dayjs'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { isWeekday } from '../../../../../lib/scheduling'
import { CommonActionDialog } from './common-action-dialog'

interface SetPaymentDateDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: (date: Date) => void
  isLoading: boolean
  invoiceCount: number
}

export const SetPaymentDateDialog: React.FC<SetPaymentDateDialogProps> = ({
  open,
  setOpen,
  onConfirm,
  isLoading,
  invoiceCount,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate)
    }
  }

  return (
    <CommonActionDialog
      open={open}
      setOpen={setOpen}
      onConfirm={handleConfirm}
      isLoading={isLoading}
      title={`Update payment date for ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'}?`}
      description={`Updating this field will override existing values for ${invoiceCount} invoice${
        invoiceCount === 1 ? '' : 's'
      }.`}
      confirmButtonText="Set payment date"
      disabled={!selectedDate}
    >
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
    </CommonActionDialog>
  )
}
