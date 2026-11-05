import { BuildingLibraryIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton, useMercoaSession } from '../../../../../../../../../../components'
import { LineItemsV2 } from './line-items'
import { SelectBankAccountButtonsV2 } from './select-bank-account-buttons'
import { SelectCardButtonsV2 } from './select-card-buttons'
import { SelectCustomPaymentMethodButtonsV2 } from './select-custom-payment-method-buttons'
import { SelectPaymentMethodTypeButtonsV2 } from './select-payment-method-type-buttons'

export function MainCardV2({
  isPreview,
  invoice,
  totalDisplay,
  selectedPaymentType,
  setSelectedPaymentType,
  updateInvoice,
}: {
  isPreview?: boolean
  invoice: Mercoa.InvoiceResponse
  totalDisplay: string
  selectedPaymentType: Mercoa.PaymentMethodType | string
  setSelectedPaymentType: (paymentMethodType: Mercoa.PaymentMethodType | string) => void
  updateInvoice: (updateRequest: Mercoa.InvoiceUpdateRequest) => Promise<void>
}) {
  const mercoaSession = useMercoaSession()
  const [bankAccounts, setBankAccounts] = useState<Array<Mercoa.PaymentMethodResponse.BankAccount>>([])
  const [cards, setCards] = useState<Array<Mercoa.PaymentMethodResponse.Card>>([])
  const [customPaymentMethods, setCustomPaymentMethods] = useState<Array<Mercoa.PaymentMethodResponse.Custom>>([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<Mercoa.PaymentMethodId | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const payerPayments = mercoaSession.organization?.paymentMethods?.payerPayments ?? []
  const activeCustomRails = useMemo(
    () =>
      payerPayments.filter(
        (pm): pm is Mercoa.PaymentRailResponse.Custom =>
          pm.type === Mercoa.PaymentMethodType.Custom && pm.active && !!pm.schemaId,
      ),
    [payerPayments],
  )
  const hasActiveCustomSchemas = activeCustomRails.length > 0

  // When any custom schema is shown, hide Mercoa ACH/card processing.
  const methods = useMemo(() => {
    if (hasActiveCustomSchemas) {
      return activeCustomRails.map((rail) => {
        const schemaName =
          mercoaSession.customPaymentMethodSchemas.find((schema) => schema.id === rail.schemaId)?.name ??
          rail.name ??
          'Other'
        return {
          type: rail.schemaId,
          icon: <BuildingLibraryIcon className="mercoa-size-5" />,
          text: schemaName,
        }
      })
    }

    return [
      {
        type: Mercoa.PaymentMethodType.BankAccount,
        icon: <BuildingLibraryIcon className="mercoa-size-5" />,
        text: 'Bank Account',
      },
      {
        type: Mercoa.PaymentMethodType.Card,
        icon: <CreditCardIcon className="mercoa-size-5" />,
        text: 'Card',
      },
    ].filter((method) => payerPayments.find((pm) => pm.type === method.type && pm.active))
  }, [hasActiveCustomSchemas, activeCustomRails, mercoaSession.customPaymentMethodSchemas, payerPayments])

  const selectedCustomSchema = useMemo(
    () => mercoaSession.customPaymentMethodSchemas.find((schema) => schema.id === selectedPaymentType),
    [mercoaSession.customPaymentMethodSchemas, selectedPaymentType],
  )

  const customPaymentMethodsForSchema = useMemo(
    () => customPaymentMethods.filter((pm) => pm.schemaId === selectedPaymentType),
    [customPaymentMethods, selectedPaymentType],
  )

  useEffect(() => {
    if (isPreview || !mercoaSession.token || !mercoaSession.entity?.id) return

    const types: Array<'bankAccount' | 'card' | 'custom'> = hasActiveCustomSchemas
      ? ['custom']
      : ['bankAccount', 'card']

    mercoaSession.client?.entity.paymentMethod.getAll(mercoaSession.entity.id, { type: types }).then((resp) => {
      if (hasActiveCustomSchemas) {
        const respCustom = resp
          .filter((e) => e.type === Mercoa.PaymentMethodType.Custom)
          .map((e) => e as Mercoa.PaymentMethodResponse.Custom)
          .reverse()
        setCustomPaymentMethods(respCustom)
        setBankAccounts([])
        setCards([])

        const firstSchemaId = activeCustomRails[0]?.schemaId
        const firstForSchema = firstSchemaId ? respCustom.find((pm) => pm.schemaId === firstSchemaId) : undefined
        if (!selectedPaymentMethodId && firstForSchema) {
          setSelectedPaymentMethodId(firstForSchema.id)
        }
        return
      }

      const respBankAccounts = resp
        .filter((e) => e.type === Mercoa.PaymentMethodType.BankAccount)
        .map((e) => e as Mercoa.PaymentMethodResponse.BankAccount)
        .reverse()
      setBankAccounts(respBankAccounts)
      const respCards = resp
        .filter((e) => e.type === Mercoa.PaymentMethodType.Card)
        .map((e) => e as Mercoa.PaymentMethodResponse.Card)
        .reverse()
      setCards(respCards)
      setCustomPaymentMethods([])
      if (!selectedPaymentMethodId && respBankAccounts.length > 0) {
        setSelectedPaymentMethodId(respBankAccounts[0].id)
      }
    })
  }, [
    mercoaSession.token,
    mercoaSession.entity?.id,
    mercoaSession.refreshId,
    hasActiveCustomSchemas,
    activeCustomRails,
  ])

  const activePaymentTypes = methods.map((method) => method.type).join(',')

  useEffect(() => {
    if (!activePaymentTypes) return
    const activeTypes = activePaymentTypes.split(',')
    if (!activeTypes.includes(selectedPaymentType)) {
      setSelectedPaymentType(activeTypes[0])
      setSelectedPaymentMethodId(undefined)
    }
  }, [activePaymentTypes, selectedPaymentType, setSelectedPaymentType])

  // When switching custom schema tabs, prefer first PM of that schema
  useEffect(() => {
    if (!selectedPaymentType.startsWith('cpms_')) return
    const match = customPaymentMethods.find((pm) => pm.schemaId === selectedPaymentType)
    if (match && selectedPaymentMethodId !== match.id) {
      const stillValid = customPaymentMethods.some(
        (pm) => pm.id === selectedPaymentMethodId && pm.schemaId === selectedPaymentType,
      )
      if (!stillValid) {
        setSelectedPaymentMethodId(match.id)
      }
    }
  }, [selectedPaymentType, customPaymentMethods, selectedPaymentMethodId])

  const handlePayment = async () => {
    if (isLoading || isPreview) return
    setIsLoading(true)
    try {
      if (methods.length === 0) {
        toast.error('No payment methods are enabled for this organization')
        return
      }
      if (!selectedPaymentMethodId) {
        toast.error('Please select a payment method')
        return
      }

      const selectedPaymentMethod = [...bankAccounts, ...cards, ...customPaymentMethods].find(
        (account) => account.id === selectedPaymentMethodId,
      )
      if (!selectedPaymentMethod) {
        toast.error('Selected payment method not found')
        return
      }
      if (
        selectedPaymentMethod.type === Mercoa.PaymentMethodType.BankAccount &&
        selectedPaymentMethod.status !== Mercoa.BankStatus.Verified
      ) {
        toast.error('The selected payment method is not verified')
        return
      }
      if (
        selectedPaymentMethod.type === Mercoa.PaymentMethodType.Custom &&
        selectedPaymentMethod.schemaId !== selectedPaymentType
      ) {
        toast.error('Please select a payment method for the chosen type')
        return
      }

      const updateRequest: Mercoa.InvoiceUpdateRequest = {
        status: Mercoa.InvoiceStatus.Scheduled,
        paymentSourceId: selectedPaymentMethodId,
        deductionDate: dayjs().toDate(),
      }
      await updateInvoice(updateRequest)
    } catch (error) {
      console.error('Payment failed:', error)
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const acceptingPayments = invoice.status === Mercoa.InvoiceStatus.Approved
  const payButtonText = isLoading
    ? 'Processing...'
    : !acceptingPayments
    ? 'Invoice not ready for payment'
    : `Pay ${totalDisplay}`

  const showBankAccounts =
    !hasActiveCustomSchemas &&
    methods.some((method) => method.type === Mercoa.PaymentMethodType.BankAccount) &&
    selectedPaymentType === Mercoa.PaymentMethodType.BankAccount

  const showCards =
    !hasActiveCustomSchemas &&
    methods.some((method) => method.type === Mercoa.PaymentMethodType.Card) &&
    selectedPaymentType === Mercoa.PaymentMethodType.Card

  const showCustom = hasActiveCustomSchemas && !!selectedCustomSchema && selectedPaymentType.startsWith('cpms_')

  return (
    <div className="mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-5 mercoa-py-6 mercoa-border mercoa-border-gray-300">
      {/* Payment Amount */}
      <div className="mercoa-w-full">
        <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">Payment Amount</p>
        <p className="mercoa-font-bold mercoa-leading-6 mercoa-text-gray-900 mercoa-text-3xl mercoa-mt-2">
          {totalDisplay}
        </p>
      </div>

      {/* Details */}
      <div className="mercoa-w-full mercoa-mt-5">
        <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">Details</p>
        <LineItemsV2 lineItems={invoice?.lineItems ?? []} />
      </div>

      {/* Select Payment Method */}
      <div className="mercoa-w-full mercoa-mt-5">
        <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">
          Select a payment method
        </p>
        {methods.length === 0 ? (
          <p className="mercoa-mt-2 mercoa-text-sm mercoa-text-red-600">
            No payment methods are enabled for this organization. Please contact support.
          </p>
        ) : (
          <SelectPaymentMethodTypeButtonsV2
            methods={methods}
            selectedPaymentType={selectedPaymentType}
            setSelectedPaymentType={setSelectedPaymentType}
            setSelectedPaymentMethodId={setSelectedPaymentMethodId}
          />
        )}
      </div>

      {/* Bank Accounts List */}
      {showBankAccounts && (
        <div className="mercoa-w-full mercoa-mt-5">
          <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">
            Select a bank account
          </p>
          <SelectBankAccountButtonsV2
            isPreview={isPreview}
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
            selectedPaymentMethodId={selectedPaymentMethodId}
            setSelectedPaymentMethodId={setSelectedPaymentMethodId}
          />
        </div>
      )}

      {/* Card List */}
      {showCards && cards && (
        <div className="mercoa-w-full mercoa-mt-5">
          <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">Select a card</p>
          <SelectCardButtonsV2
            isPreview={isPreview}
            cards={cards}
            setCards={setCards}
            selectedPaymentMethodId={selectedPaymentMethodId}
            setSelectedPaymentMethodId={setSelectedPaymentMethodId}
          />
        </div>
      )}

      {/* Custom Payment Methods */}
      {showCustom && selectedCustomSchema && (
        <div className="mercoa-w-full mercoa-mt-5">
          <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">
            Select a {selectedCustomSchema.name}
          </p>
          <SelectCustomPaymentMethodButtonsV2
            isPreview={isPreview}
            schema={selectedCustomSchema}
            customPaymentMethods={customPaymentMethodsForSchema}
            setCustomPaymentMethods={setCustomPaymentMethods}
            selectedPaymentMethodId={selectedPaymentMethodId}
            setSelectedPaymentMethodId={setSelectedPaymentMethodId}
          />
        </div>
      )}

      <div className="mercoa-w-full mercoa-mt-5">
        <MercoaButton
          isEmphasized
          size="lg"
          className="mercoa-w-full"
          disabled={isLoading || !acceptingPayments || methods.length === 0}
          onClick={handlePayment}
        >
          {payButtonText}
        </MercoaButton>
      </div>
    </div>
  )
}
