import { useReceivableDetails } from '../../../../../components'
import { RecurringScheduleBase } from '../../../../common/components/recurring-schedule-base'

export function ReceivableRecurringSchedule() {
  const { formContextValue } = useReceivableDetails()
  return <RecurringScheduleBase formContextValue={formContextValue} />
}
