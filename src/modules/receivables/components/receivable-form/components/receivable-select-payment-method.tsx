import { Mercoa } from '@mercoa/javascript'
import { BankAccount, Card, Check, MercoaCombobox, NoSession, useMercoaSession } from '../../../../../components'
import { useReceivableDetails } from '../../../hooks/use-receivable-details'

export function ReceivableSelectPaymentMethod({
  isSource,
  isDestination,
  readOnly,
}: {
  isSource?: boolean
  isDestination?: boolean
  readOnly?: boolean
}) {
  const mercoaSession = useMercoaSession()
  const { formContextValue } = useReceivableDetails()
  const { formMethods, paymentMethodContextValue } = formContextValue
  const {
    availableSourceTypes,
    availableDestinationTypes,
    selectedSourceType,
    selectedDestinationType,
    selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId,
    setMethodOnTypeChange,
    sourcePaymentMethods,
    destinationPaymentMethods,
  } = paymentMethodContextValue

  const paymentMethods = isSource ? sourcePaymentMethods : destinationPaymentMethods
  const availableTypes = isSource ? availableSourceTypes : availableDestinationTypes
  const selectedType = isSource ? selectedSourceType : selectedDestinationType
  const paymentId = isSource ? selectedSourcePaymentMethodId : selectedDestinationPaymentMethodId

  const { setValue, clearErrors } = formMethods

  if (isSource === isDestination) {
    throw new Error('Must specify exactly one of isSource or isDestination')
  }

  const paymentMethodTypeKey = isSource ? 'paymentSourceType' : 'paymentDestinationType'
  const sourceOrDestination = isSource ? 'paymentSourceId' : 'paymentDestinationId'

  const bankAccountJsx = (
    <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
      {paymentMethods
        ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount)
        .filter((paymentMethod) => (readOnly ? paymentMethod.id === paymentId : true))
        .map((paymentMethod) => (
          <div key={paymentMethod.id} className="mercoa-mt-1">
            <BankAccount
              account={paymentMethod as Mercoa.PaymentMethodResponse.BankAccount}
              selected={paymentId === paymentMethod.id}
              onSelect={() => {
                if (readOnly) return
                setValue(sourceOrDestination, paymentMethod.id)
                clearErrors(sourceOrDestination)
              }}
            />
          </div>
        ))}
    </div>
  )

  const checkJsx = (
    <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
      {paymentMethods
        ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Check)
        .filter((paymentMethod) => (readOnly ? paymentMethod.id === paymentId : true))
        .map((paymentMethod) => (
          <div key={paymentMethod.id} className="mercoa-mt-1">
            <Check
              account={paymentMethod as Mercoa.PaymentMethodResponse.Check}
              selected={paymentId === paymentMethod.id}
              onSelect={() => {
                if (readOnly) return
                setValue(sourceOrDestination, paymentMethod.id)
                clearErrors(sourceOrDestination)
              }}
            />
          </div>
        ))}
    </div>
  )

  const cardJsx = (
    <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
      {paymentMethods
        ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Card)
        .filter((paymentMethod) => (readOnly ? paymentMethod.id === paymentId : true))
        .map((paymentMethod) => (
          <div key={paymentMethod.id} className="mercoa-mt-1">
            <Card
              account={paymentMethod as Mercoa.PaymentMethodResponse.Card}
              selected={paymentId === paymentMethod.id}
              onSelect={() => {
                if (readOnly) return
                setValue(sourceOrDestination, paymentMethod.id)
                clearErrors(sourceOrDestination)
              }}
            />
          </div>
        ))}
    </div>
  )

  const offPlatformJsx = (
    <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
      <div className="mercoa-mt-4 mercoa-p-4 mercoa-text-gray-700 mercoa-bg-white mercoa-shadow-sm mercoa-rounded-lg mercoa-border mercoa-border-gray-200">
        Off Platform
      </div>
    </div>
  )

  const unknownJsx = (
    <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
      <div className="mercoa-mt-4 mercoa-p-4 mercoa-text-gray-700 mercoa-bg-white mercoa-shadow-sm mercoa-rounded-lg mercoa-border mercoa-border-gray-200">
        Collect data from customer
      </div>
    </div>
  )

  if (!mercoaSession.client) return <NoSession componentName="SelectPaymentMethod" />
  return (
    <div>
      {!readOnly && (
        <MercoaCombobox
          options={availableTypes.map((type) => ({ value: type, disabled: false }))}
          onChange={(selected) => {
            mercoaSession.debug('selected', selected)
            setValue(paymentMethodTypeKey, selected.key)
            setMethodOnTypeChange(selected.key, isSource ? 'source' : 'destination')

            // if the selected type is offPlatform, and is the destination, set the source type to offPlatform
            if (selected.key === Mercoa.PaymentMethodType.OffPlatform && isDestination) {
              setValue('paymentSourceType', Mercoa.PaymentMethodType.OffPlatform)
              setValue(
                'paymentSourceId',
                sourcePaymentMethods?.find((method) => method.type === Mercoa.PaymentMethodType.OffPlatform)?.id,
              )
            }
          }}
          value={availableTypes.find((type) => type.key === selectedType)}
          displayIndex="value"
          showAllOptions
        />
      )}
      {selectedType === Mercoa.PaymentMethodType.BankAccount && bankAccountJsx}
      {selectedType === Mercoa.PaymentMethodType.Check && checkJsx}
      {selectedType === Mercoa.PaymentMethodType.Card && cardJsx}
      {readOnly && selectedType === ('unknown' as any) && unknownJsx}
      {readOnly && selectedType === Mercoa.PaymentMethodType.OffPlatform && offPlatformJsx}
    </div>
  )
}
