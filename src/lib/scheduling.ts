import fedHolidays from '@18f/us-federal-holidays'
import dayjs from 'dayjs'
const holidays = fedHolidays.allForYear()

export function subtractWeekdays(input: dayjs.Dayjs, days: number) {
  let date = dayjs(input)
  while (days > 0) {
    date = date.subtract(1, 'day')
    if (date.day() !== 0 && date.day() !== 6 && !holidays.find((holiday) => date.isSame(holiday.date, 'day'))) {
      days--
    }
  }
  return date
}

export function addWeekdays(input: dayjs.Dayjs, days: number) {
  let date = dayjs(input)
  while (days > 0) {
    date = date.add(1, 'day')
    if (date.day() !== 0 && date.day() !== 6 && !holidays.find((holiday) => date.isSame(holiday.date, 'day'))) {
      days--
    }
  }
  return date
}

export function isWeekday(date: Date) {
  const day = dayjs(date).day()
  if (day === 0 || day === 6) {
    return false
  }
  if (holidays.find((holiday) => dayjs(holiday.date).isSame(date, 'day'))) {
    return false
  }
  return true
}

export function isSupportedScheduleDate(supportedScheduleDate: Array<'Weekend' | 'Past' | 'Holiday'>) {
  return (date: Date) => {
    const day = dayjs(date).day()
    if ((day === 0 || day === 6) && !supportedScheduleDate.includes('Weekend')) {
      return false
    }
    if (
      holidays.find((holiday) => dayjs(holiday.date).isSame(date, 'day')) &&
      !supportedScheduleDate.includes('Holiday')
    ) {
      return false
    }
    return true
  }
}
