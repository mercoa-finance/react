import dayjs from 'dayjs'
import { UseFormReturn } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { inputClassName, MercoaInput } from '../../../components'
import { PayableRecurringScheduleContext } from '../../payables/types'
import { ReceivableRecurringScheduleContext } from '../../receivables/types'

// TODO: Unify duplicate types between payables/types.ts and receivables/types.ts into common/types.ts, import RecurringScheduleContext directly
interface RecurringScheduleBaseProps {
  formContextValue: {
    formMethods: UseFormReturn<any>
    recurringScheduleContextValue: PayableRecurringScheduleContext | ReceivableRecurringScheduleContext
  }
}

export function RecurringScheduleBase({ formContextValue }: RecurringScheduleBaseProps) {
  const { formMethods, recurringScheduleContextValue } = formContextValue
  const { type, repeatOn, repeatOnDay, repeatOnMonth, ends } = recurringScheduleContextValue
  const { register, setValue, control } = formMethods

  // Utility function to toggle a day in our selection
  const toggleDay = (day: Mercoa.DayOfWeek) => {
    return repeatOn?.includes(day) ? repeatOn.filter((d) => d !== day) : [...(repeatOn ?? []), day]
  }

  return (
    <div className="mercoa-col-span-full">
      <div className="mercoa-flex mercoa-pl-1">
        <div className="mercoa-flex mercoa-flex-col mercoa-w-full mercoa-max-w-md">
          {/* Repeat every */}
          <div className="mercoa-flex mercoa-items-center mercoa-gap-2 mercoa-pb-6">
            <label className="mercoa-font-medium mercoa-text-gray-800">Repeat every</label>
            <MercoaInput
              type="number"
              register={register}
              name="paymentSchedule.repeatEvery"
              className="mercoa-w-14"
              placeholder="1"
              min={1}
            />
            <select
              className={inputClassName({ width: 'mercoa-w-24' })}
              value={type}
              onChange={(e) => setValue('paymentSchedule.type', e.target.value as any)}
            >
              <option value="daily">Days</option>
              <option value="weekly">Weeks</option>
              <option value="monthly">Months</option>
              <option value="yearly">Years</option>
            </select>
            <div className="mercoa-flex-1" />
          </div>

          {/* Repeat on */}
          {type === 'weekly' && (
            <div className="mercoa-flex mercoa-flex-col mercoa-pt-6 mercoa-border-t mercoa-border-[#e3e3e3]">
              <label className="mercoa-font-medium mercoa-mb-2 mercoa-text-gray-800">Repeat on</label>
              <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                {[
                  { key: Mercoa.DayOfWeek.Sunday, value: 'Su' },
                  { key: Mercoa.DayOfWeek.Monday, value: 'Mo' },
                  { key: Mercoa.DayOfWeek.Tuesday, value: 'Tu' },
                  { key: Mercoa.DayOfWeek.Wednesday, value: 'We' },
                  { key: Mercoa.DayOfWeek.Thursday, value: 'Th' },
                  { key: Mercoa.DayOfWeek.Friday, value: 'Fr' },
                  { key: Mercoa.DayOfWeek.Saturday, value: 'Sa' },
                ].map((day) => (
                  <button
                    type="button"
                    key={day.key}
                    className={`mercoa-w-10 mercoa-h-10 mercoa-rounded-full ${
                      repeatOn?.includes(day.key)
                        ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
                        : 'mercoa-bg-gray-100 mercoa-text-gray-800'
                    }`}
                    onClick={() => setValue('paymentSchedule.repeatOn', toggleDay(day.key))}
                  >
                    {day.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'monthly' && (
            <div className="mercoa-flex mercoa-flex-col mercoa-pt-6 mercoa-border-t mercoa-border-[#e3e3e3] mercoa-gap-y-2">
              <label className="mercoa-font-medium mercoa-mb-2 mercoa-text-gray-800">Repeat on</label>
              <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                <input
                  type="radio"
                  value="start"
                  checked={repeatOnDay === 1}
                  onChange={() => {
                    setValue('paymentSchedule.repeatOnDay', 1)
                  }}
                  className="mercoa-size-4 mercoa-border-gray-400 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary"
                />
                <label className="mercoa-text-gray-800">First of the month</label>
              </div>
              <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                <input
                  type="radio"
                  value="end"
                  checked={repeatOnDay === -1}
                  onChange={() => {
                    setValue('paymentSchedule.repeatOnDay', -1)
                  }}
                  className="mercoa-size-4 mercoa-border-gray-400 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary"
                />
                <label className="mercoa-text-gray-800">Last of the month</label>
              </div>
              <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                <input
                  type="radio"
                  value="specific"
                  checked={!!repeatOnDay && repeatOnDay > 1}
                  onChange={() => {
                    setValue('paymentSchedule.repeatOnDay', 2)
                  }}
                  className="mercoa-size-4 mercoa-border-gray-400 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary"
                />
                <label className="mercoa-text-gray-800">Specific day of the month</label>
                {!!repeatOnDay && repeatOnDay !== 1 && repeatOnDay !== -1 && (
                  <input
                    className={inputClassName({ width: 'mercoa-w-14' })}
                    type="number"
                    value={repeatOnDay}
                    onChange={(e) => {
                      setValue('paymentSchedule.repeatOnDay', Number(e.target.value))
                    }}
                    placeholder="1"
                    min={2}
                    max={31}
                  />
                )}
              </div>
            </div>
          )}

          {type === 'yearly' && (
            <div className="mercoa-flex mercoa-flex-col mercoa-pt-6 mercoa-border-t mercoa-border-[#e3e3e3] mercoa-gap-y-2">
              <label className="mercoa-font-medium mercoa-mb-2 mercoa-text-gray-800">Repeat on</label>
              <div className="mercoa-flex mercoa-items-center mercoa-gap-2">
                <label className="mercoa-text-gray-800">The</label>
                <MercoaInput
                  type="number"
                  register={register}
                  name="paymentSchedule.repeatOnDay"
                  className="mercoa-w-14"
                  placeholder="1"
                  min={1}
                  max={31}
                />
                <label className="mercoa-text-gray-800">Of</label>
                <select
                  className={inputClassName({ width: 'mercoa-w-24' })}
                  value={repeatOnMonth}
                  onChange={(e) => setValue('paymentSchedule.repeatOnMonth', Number(e.target.value))}
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>
            </div>
          )}

          <label className="mercoa-relative mercoa-inline-flex mercoa-cursor-pointer mercoa-items-center mercoa-mt-5">
            <input
              type="checkbox"
              className="mercoa-peer mercoa-sr-only"
              checked={!!ends}
              onChange={(e) => {
                if (ends) {
                  setValue('paymentSchedule.ends', undefined)
                } else {
                  setValue('paymentSchedule.ends', new Date())
                }
              }}
            />
            <div
              className="mercoa-peer mercoa-h-6 mercoa-w-11 mercoa-rounded-full mercoa-bg-gray-300 after:mercoa-absolute after:mercoa-top-0.5 after:mercoa-left-[2px]
                  after:mercoa-h-5 after:mercoa-w-5 after:mercoa-rounded-full
                  after:border after:mercoa-border-gray-300 after:mercoa-bg-white after:mercoa-transition-all after:mercoa-content-[''] peer-checked:mercoa-bg-mercoa-primary peer-checked:after:mercoa-translate-x-full
                  peer-checked:after:mercoa-border-white peer-focus:mercoa-ring-4 peer-focus:mercoa-ring-mercoa-primary-300 peer-disabled:mercoa-bg-red-100 peer-disabled:after:mercoa-bg-red-50"
            />
            <span className="mercoa-ml-3 mercoa-flex mercoa-items-center mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">
              Set End Date
            </span>
          </label>
          {!!ends && (
            <MercoaInput
              type="date"
              name="paymentSchedule.ends"
              className="mercoa-mt-2"
              control={control}
              placeholder="End Date"
              dateOptions={{
                minDate: dayjs().toDate(),
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
