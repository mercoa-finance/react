import { useMemo, useState } from 'react'
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
  Wallet,
} from '../../../../../../components'
import { FinanceWithOatfi } from '../../../../../../components/Oatfi'
import { PayableFormAction } from '../../constants'
import { PayablesInlineForm } from './payables-inline-form'

const PaymentMethodList = ({
  paymentMethods,
  paymentId,
  readOnly,
  setPaymentId,
  type,
  schemaId,
  Component,
  showEntityConfirmation = false,
  showVerificationStatus = false,
}: {
  paymentMethods: Array<Mercoa.PaymentMethodResponse>
  paymentId: string | undefined
  readOnly: boolean | undefined
  setPaymentId: (id: string) => void
  type?: Mercoa.PaymentMethodType
  schemaId?: string
  Component: React.ComponentType<any>
  showEntityConfirmation?: boolean
  showVerificationStatus?: boolean
}) => {
  const filteredPaymentMethods = (paymentMethods ?? [])
    ?.filter(
      (paymentMethod) =>
        paymentMethod.type === type || (paymentMethod.type === 'custom' && paymentMethod.schemaId === schemaId),
    )
    .filter((e) => (readOnly ? e.id === paymentId : true))

  return (
    <div
      className={`mercoa-max-h-[240px] ${
        filteredPaymentMethods.length > 2 ? 'mercoa-overflow-y-scroll' : ''
      } mercoa-overflow-x-hidden`}
    >
      {filteredPaymentMethods.map((paymentMethod) => (
        <div key={paymentMethod.id} className="mercoa-mt-1">
          <Component
            account={paymentMethod}
            selected={paymentId === paymentMethod.id}
            hideVerificationButton={true}
            hideVerificationStatus={!showVerificationStatus}
            showVerification={showVerificationStatus}
            showEntityConfirmation={showEntityConfirmation}
            onSelect={() => {
              if (readOnly) return
              setPaymentId(paymentMethod.id)
            }}
          />
        </div>
      ))}
    </div>
  )
}

const BankAccountForm = ({
  readOnly,
  backupDisbursement,
  destinationOptions,
  setValue,
}: {
  readOnly: boolean | undefined
  backupDisbursement: Mercoa.PaymentRailResponse.BankAccount | undefined
  destinationOptions: Mercoa.PaymentDestinationOptions.BankAccount | undefined
  setValue: (name: string, value: any) => void
}) => (
  <>
    {!readOnly && (
      <div className="mercoa-col-span-full mercoa-mt-1">
        <PayablesInlineForm
          form={<AddBankAccountForm prefix="newBankAccount." />}
          name="Bank Account"
          addNewButton={<BankAccount />}
          formAction={PayableFormAction.CREATE_BANK_ACCOUNT}
        />
      </div>
    )}
    <div className="mercoa-mt-2" />
    <MercoaCombobox
      displaySelectedAs="pill"
      label="Payment Speed"
      showAllOptions
      options={
        backupDisbursement?.availableDeliveryMethods?.map((e) => ({
          value: {
            key: e,
            value: BankSpeedEnumToLabel(e),
          },
          disabled: false,
        })) ?? []
      }
      onChange={(selected) => {
        setValue('paymentDestinationOptions', {
          type: 'bankAccount',
          delivery: selected.key,
        })
      }}
      displayIndex="value"
      value={() => {
        const speed = destinationOptions?.delivery
        return { key: speed, value: BankSpeedEnumToLabel(speed) }
      }}
    />
  </>
)

const CheckForm = ({
  readOnly,
  backupDisbursement,
  destinationOptions,
  setValue,
}: {
  readOnly: boolean | undefined
  backupDisbursement: Mercoa.PaymentRailResponse.Check | undefined
  destinationOptions: Mercoa.PaymentDestinationOptions.Check | undefined
  setValue: (name: string, value: any) => void
}) => (
  <>
    {!readOnly && (
      <div className="mercoa-col-span-full mercoa-mt-1">
        <PayablesInlineForm
          form={<AddCheckForm prefix="newCheck." />}
          name="Check Address"
          addNewButton={<Check />}
          formAction={PayableFormAction.CREATE_CHECK}
        />
      </div>
    )}
    <div className="mercoa-mt-2" />
    <MercoaCombobox
      label="Check Delivery Method"
      showAllOptions
      displaySelectedAs="pill"
      options={
        backupDisbursement?.availableDeliveryMethods
          ?.sort((a, b) => CheckSpeedSort(a) - CheckSpeedSort(b))
          .map((e) => ({
            value: {
              key: e,
              value: CheckSpeedEnumToLabel(e),
            },
            disabled: false,
          })) ?? []
      }
      onChange={(selected) => {
        setValue('paymentDestinationOptions.type', 'check')
        setValue('paymentDestinationOptions.delivery', selected.key)
      }}
      displayIndex="value"
      value={() => {
        const speed = destinationOptions?.delivery
        return { key: speed, value: CheckSpeedEnumToLabel(speed) }
      }}
    />
  </>
)

const hasBackupDisbursement = ({
  organization,
  selectedType,
}: {
  organization: Mercoa.OrganizationResponse | undefined
  selectedType: string
}) =>
  organization?.paymentMethods?.backupDisbursements.some((e) => {
    if (!e.active) return false
    if (e.type === 'custom') return e.name === selectedType
    return e.type === selectedType
  })

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
  const { formContextValue } = usePayableDetails()
  const { paymentMethodContextValue } = formContextValue

  const {
    sourcePaymentMethods,
    destinationPaymentMethods,
    selectedSourcePaymentMethodId,
    selectedDestinationPaymentMethodId,
    showDestinationPaymentMethodConfirmation,
    setSelectedSourcePaymentMethodId,
    setSelectedDestinationPaymentMethodId,
    availableSourceTypes,
    setSelectedSourceType,
    availableDestinationTypes,
    setSelectedDestinationType,
  } = paymentMethodContextValue

  const paymentMethods = (isSource ? sourcePaymentMethods : destinationPaymentMethods) ?? []

  const [showBNPL, setShowBNPL] = useState(false)

  const { watch, setValue } = useFormContext()

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

  const backupDisbursement = useMemo(
    () =>
      mercoaSession.organization?.paymentMethods?.backupDisbursements.find((e) => {
        if (!e.active) return false
        if (e.type === 'custom') return e.name === selectedType
        return e.type === selectedType
      }),
    [mercoaSession.organization, selectedType],
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
          <PaymentMethodList
            paymentMethods={paymentMethods}
            paymentId={paymentId}
            readOnly={readOnly}
            setPaymentId={setPaymentId}
            type={Mercoa.PaymentMethodType.BankAccount}
            Component={BankAccount}
            showEntityConfirmation={showDestinationPaymentMethodConfirmation && isDestination}
            showVerificationStatus={!!isSource}
          />
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
            vendorId &&
            hasBackupDisbursement({
              organization: mercoaSession.organization,
              selectedType,
            }) && (
              <BankAccountForm
                readOnly={readOnly}
                backupDisbursement={backupDisbursement as Mercoa.PaymentRailResponse.BankAccount}
                destinationOptions={destinationOptions as Mercoa.PaymentDestinationOptions.BankAccount}
                setValue={setValue}
              />
            )}
        </>
      )}

      {selectedType === Mercoa.PaymentMethodType.Check && (
        <>
          <PaymentMethodList
            paymentMethods={paymentMethods}
            paymentId={paymentId}
            readOnly={readOnly}
            setPaymentId={setPaymentId}
            type={Mercoa.PaymentMethodType.Check}
            Component={Check}
            showEntityConfirmation={showDestinationPaymentMethodConfirmation && isDestination}
          />
          {isDestination &&
            !disableCreation &&
            vendorId &&
            hasBackupDisbursement({
              organization: mercoaSession.organization,
              selectedType,
            }) && (
              <CheckForm
                readOnly={readOnly}
                backupDisbursement={backupDisbursement as Mercoa.PaymentRailResponse.Check}
                destinationOptions={destinationOptions as Mercoa.PaymentDestinationOptions.Check}
                setValue={setValue}
              />
            )}
        </>
      )}

      {selectedType === Mercoa.PaymentMethodType.Card && (
        <PaymentMethodList
          paymentMethods={paymentMethods}
          paymentId={paymentId}
          readOnly={readOnly}
          setPaymentId={setPaymentId}
          type={Mercoa.PaymentMethodType.Card}
          Component={Card}
          showEntityConfirmation={showDestinationPaymentMethodConfirmation && isDestination}
        />
      )}

      {selectedType === Mercoa.PaymentMethodType.Utility && (
        <>
          {readOnly && (
            <div className="mercoa-max-h-[240px]">
              <div className="mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2">
                <div className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">Automated Utility Pay</div>
              </div>
            </div>
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

      {selectedType === Mercoa.PaymentMethodType.Wallet && (
        <>
          <PaymentMethodList
            paymentMethods={paymentMethods}
            paymentId={paymentId}
            readOnly={readOnly}
            setPaymentId={setPaymentId}
            type={Mercoa.PaymentMethodType.Wallet}
            Component={Wallet}
          />
        </>
      )}

      {selectedType.startsWith('cpms_') && (
        <>
          <PaymentMethodList
            paymentMethods={paymentMethods}
            paymentId={paymentId}
            readOnly={readOnly}
            setPaymentId={setPaymentId}
            schemaId={selectedType}
            Component={CustomPaymentMethod}
            showEntityConfirmation={showDestinationPaymentMethodConfirmation && isDestination}
          />
          {isDestination &&
            !disableCreation &&
            !readOnly &&
            vendorId &&
            hasBackupDisbursement({
              organization: mercoaSession.organization,
              selectedType,
            }) && (
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
            )}
        </>
      )}

      {selectedType === Mercoa.PaymentMethodType.OffPlatform && readOnly && (
        <div className="mercoa-max-h-[240px]">
          <div className="mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2">
            <div className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">Off Platform</div>
          </div>
        </div>
      )}
    </div>
  )
}

function BankSpeedEnumToLabel(speed?: Mercoa.BankDeliveryMethod) {
  if (speed === Mercoa.BankDeliveryMethod.AchAccelerated) return 'Accelerated ACH (Same Day)'
  if (speed === Mercoa.BankDeliveryMethod.AchSameDay) return 'Fast ACH (2 Days)'
  if (speed === Mercoa.BankDeliveryMethod.AchStandard) return 'Standard ACH (3-5 Days)'
  return 'Fast ACH (2 Days)'
}

function CheckSpeedEnumToLabel(speed?: Mercoa.CheckDeliveryMethod) {
  if (speed === Mercoa.CheckDeliveryMethod.Print) return 'Print it myself'
  if (speed === Mercoa.CheckDeliveryMethod.Mail) return 'Mail (USPS First Class)'
  if (speed === Mercoa.CheckDeliveryMethod.MailPriority) return 'Mail (USPS Priority)'
  if (speed === Mercoa.CheckDeliveryMethod.MailUpsNextDay) return 'Mail (UPS Next Day)'
  return 'Mail (USPS First Class)'
}

function CheckSpeedSort(speed?: Mercoa.CheckDeliveryMethod) {
  if (speed === Mercoa.CheckDeliveryMethod.Print) return 0
  if (speed === Mercoa.CheckDeliveryMethod.Mail) return 1
  if (speed === Mercoa.CheckDeliveryMethod.MailPriority) return 2
  if (speed === Mercoa.CheckDeliveryMethod.MailUpsNextDay) return 3
  return 4
}
