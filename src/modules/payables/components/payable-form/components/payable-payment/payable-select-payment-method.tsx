import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import {
  AddBankAccountForm,
  AddCheckForm,
  AddCounterpartyAccount,
  AddCustomPaymentMethodForm,
  BankAccount,
  Card,
  Check,
  CounterpartyAccount,
  CustomPaymentMethod,
  MercoaButton,
  MercoaCombobox,
  NoSession,
  useMercoaSession,
  usePayableDetails,
} from '../../../../../../components'
import { FinanceWithOatfi } from '../../../../../../components/Oatfi'
import { PayableFormAction } from '../../constants'
import { PayablesInlineForm } from './payables-inline-form'

export function PayableSelectPaymentMethod({
  isSource,
  isDestination,
  disableCreation,
  readOnly,
}: {
  isSource?: boolean
  isDestination?: boolean
  disableCreation?: boolean
  readOnly?: boolean
}) {
  const mercoaSession = useMercoaSession()

  const {
    sourcePaymentMethods,
    destinationPaymentMethods,
    selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId,
    setSelectedSourcePaymentMethodId,
    setSelectedDestinationPaymentMethodId,
    availableSourceTypes,
    selectedSourceType,
    setSelectedSourceType,
    availableDestinationTypes,
    selectedDestinationType,
    setSelectedDestinationType,
  } = usePayableDetails()

  const paymentMethods = (isSource ? sourcePaymentMethods : destinationPaymentMethods) ?? []

  const [showBNPL, setShowBNPL] = useState(false)

  const { watch, setValue, clearErrors } = useFormContext()

  const vendorId = watch('vendorId')

  const paymentMethodTypeKey = isDestination ? 'paymentDestinationType' : 'paymentSourceType'

  const availableTypes = isSource ? availableSourceTypes : availableDestinationTypes

  const selectedType = watch(paymentMethodTypeKey)
  const paymentId = isSource ? selectedSourcePaymentMethodId : selectedDestinationPaymentMethodId
  const setPaymentId = isSource ? setSelectedSourcePaymentMethodId : setSelectedDestinationPaymentMethodId
  const setPaymentType = isSource ? setSelectedSourceType : setSelectedDestinationType
  const destinationOptions = watch('paymentDestinationOptions')
  const counterpartyAccounts: Array<Mercoa.CounterpartyCustomizationAccount> = watch('vendor.accounts')

  const enableBNPL = mercoaSession.organization?.paymentMethods?.payerPayments.find(
    (e) => e.type === 'bnpl' && e.active,
  )

  if (!mercoaSession.client) return <NoSession componentName="SelectPaymentMethod" />
  return (
    <div>
      {!readOnly && (
        <MercoaCombobox
          options={availableTypes.map((type) => ({ value: type, disabled: false }))}
          onChange={(selected) => {
            setPaymentType(selected.key as Mercoa.PaymentMethodType)
          }}
          value={availableTypes.find((type) => type.key === selectedType)}
          displayIndex="value"
          showAllOptions
        />
      )}
      {selectedType === Mercoa.PaymentMethodType.BankAccount && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.BankAccount)
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <BankAccount
                    account={paymentMethod as Mercoa.PaymentMethodResponse.BankAccount}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setPaymentId(paymentMethod.id)
                    }}
                  />
                </div>
              ))}
          </div>
          {isSource && enableBNPL && (
            <>
              {showBNPL ? (
                <FinanceWithOatfi paymentMethods={paymentMethods} setShowBNPL={setShowBNPL} />
              ) : (
                <div className="mercoa-flex mercoa-items-center mercoa-justify-end mercoa-mt-1">
                  <MercoaButton isEmphasized={false} onClick={() => setShowBNPL(true)} size="sm">
                    Extend payment terms
                  </MercoaButton>
                </div>
              )}
            </>
          )}
          {isDestination &&
            !disableCreation &&
            !readOnly &&
            vendorId &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <>
                <div className="mercoa-col-span-full mercoa-mt-1">
                  <PayablesInlineForm
                    form={<AddBankAccountForm prefix="newBankAccount." />}
                    name="Bank Account"
                    addNewButton={<BankAccount />}
                    formAction={PayableFormAction.CREATE_BANK_ACCOUNT}
                  />
                </div>
                <div className="mercoa-mt-2" />
                <MercoaCombobox
                  displaySelectedAs="pill"
                  label="Payment Speed"
                  showAllOptions
                  options={[
                    {
                      value: {
                        key: 'ACH_SAME_DAY',
                        value: 'Same-Day ACH (2 Days)',
                      },
                      disabled: false,
                    },
                    {
                      value: {
                        key: 'ACH_STANDARD',
                        value: 'Standard ACH (3-5 Days)',
                      },
                      disabled: false,
                    },
                  ]}
                  onChange={(selected) => {
                    setValue('paymentDestinationOptions', {
                      type: 'bankAccount',
                      delivery: selected.key,
                    })
                  }}
                  displayIndex="value"
                  value={() => {
                    return (destinationOptions as Mercoa.PaymentDestinationOptions.BankAccount)?.delivery ===
                      'ACH_STANDARD'
                      ? { key: 'ACH_STANDARD', value: 'Standard ACH (3-5 Days)' }
                      : { key: 'ACH_SAME_DAY', value: 'Same-Day ACH (2 Days)' }
                  }}
                />
              </>
            )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Check && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Check)
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <Check
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Check}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setPaymentId(paymentMethod.id)
                    }}
                  />
                </div>
              ))}
          </div>
          {isDestination &&
            !disableCreation &&
            !readOnly &&
            vendorId &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <>
                <div className="mercoa-col-span-full mercoa-mt-1">
                  <PayablesInlineForm
                    form={<AddCheckForm prefix="newCheck." />}
                    name="Check Address"
                    addNewButton={<Check />}
                    formAction={PayableFormAction.CREATE_CHECK}
                  />
                </div>
                <div className="mercoa-mt-2" />
                <MercoaCombobox
                  label="Check Delivery Method"
                  showAllOptions
                  displaySelectedAs="pill"
                  options={[
                    {
                      value: {
                        key: 'MAIL',
                        value: 'Mail it for me',
                      },
                      disabled: false,
                    },
                    {
                      value: {
                        key: 'PRINT',
                        value: 'Print it myself',
                      },
                      disabled: false,
                    },
                  ]}
                  onChange={(selected) => {
                    setValue('paymentDestinationOptions.type', 'check')
                    setValue('paymentDestinationOptions.delivery', selected.key)
                  }}
                  displayIndex="value"
                  value={
                    (destinationOptions as Mercoa.PaymentDestinationOptions.Check)?.delivery === 'PRINT'
                      ? { key: 'PRINT', value: 'Print it myself' }
                      : { key: 'MAIL', value: 'Mail it for me' }
                  }
                />
              </>
            )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Card && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter((paymentMethod) => paymentMethod.type === Mercoa.PaymentMethodType.Card)
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <Card
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Card}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setPaymentId(paymentMethod.id)
                    }}
                  />
                </div>
              ))}
          </div>
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.Utility && (
        <>
          {readOnly && (
            <>
              <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
                <div
                  className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border mercoa-border-gray-300
  mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2`}
                >
                  <div className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900`}>Automated Utility Pay</div>
                </div>
              </div>
            </>
          )}
          {isDestination && !disableCreation && !readOnly && vendorId && (
            <>
              <div className="mercoa-mt-4">
                <MercoaCombobox
                  label="Utility Account"
                  showAllOptions
                  displaySelectedAs="pill"
                  options={counterpartyAccounts.map((account) => ({
                    value: {
                      accountId: account.accountId,
                      displayName: `${account.accountId} - ${account.nameOnAccount}`,
                    },
                    disabled: false,
                  }))}
                  onChange={(selected) => {
                    setValue('paymentDestinationOptions', {
                      type: 'utility',
                      accountId: selected.accountId,
                    })
                  }}
                  displayIndex="displayName"
                />
              </div>

              <div className="mercoa-col-span-full mercoa-mt-1">
                <PayablesInlineForm
                  form={<AddCounterpartyAccount prefix="newCounterpartyAccount." />}
                  name="Utility Account"
                  addNewButton={<CounterpartyAccount />}
                  formAction={PayableFormAction.CREATE_COUNTERPARTY_ACCOUNT}
                />
              </div>
              <div className="mercoa-mt-2" />
            </>
          )}
        </>
      )}
      {selectedType.startsWith('cpms_') && (
        <>
          <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
            {paymentMethods
              ?.filter(
                (paymentMethod) => (paymentMethod as Mercoa.PaymentMethodResponse.Custom).schemaId === selectedType,
              )
              .filter((e) => (readOnly ? e.id === paymentId : true))
              .map((paymentMethod) => (
                <div key={paymentMethod.id} className="mercoa-mt-1">
                  <CustomPaymentMethod
                    account={paymentMethod as Mercoa.PaymentMethodResponse.Custom}
                    selected={paymentId === paymentMethod.id}
                    onSelect={() => {
                      if (readOnly) return
                      setPaymentId(paymentMethod.id)
                    }}
                  />
                </div>
              ))}
          </div>
          {isDestination &&
            !disableCreation &&
            !readOnly &&
            vendorId &&
            mercoaSession.organization?.paymentMethods?.backupDisbursements.some((e) => {
              if (!e.active) return false
              if (e.type === 'custom') return e.name === selectedType
              return e.type === selectedType
            }) && (
              <>
                <div className="mercoa-col-span-full mercoa-mt-1">
                  <PayablesInlineForm
                    form={
                      <AddCustomPaymentMethodForm
                        schema={mercoaSession.customPaymentMethodSchemas.find((e) => e.id === selectedType)}
                      />
                    }
                    name={mercoaSession.customPaymentMethodSchemas.find((e) => e.id === selectedType)?.name ?? 'Other'}
                    addNewButton={
                      <CustomPaymentMethod
                        schema={mercoaSession.customPaymentMethodSchemas.find((e) => e.id === selectedType)}
                      />
                    }
                    formAction={PayableFormAction.CREATE_CUSTOM}
                  />
                </div>
              </>
            )}
        </>
      )}
      {selectedType === Mercoa.PaymentMethodType.OffPlatform && (
        <>
          {readOnly && (
            <div className="mercoa-max-h-[240px] mercoa-overflow-y-auto">
              <div
                className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border mercoa-border-gray-300
  mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2`}
              >
                <div className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900`}>Off Platform</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
