import { usePayableDetails } from '../../../../../../components'
import { RecurringScheduleBase } from '../../../../../common/components/recurring-schedule-base'

export function PayableRecurringSchedule() {
  const { formContextValue } = usePayableDetails()
  return <RecurringScheduleBase formContextValue={formContextValue} />
}
