import { BuildingLibraryIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton, useMercoaSession } from '../../../../../../../../../../components'
import { LineItemsV2 } from './line-items'
import { SelectBankAccountButtonsV2 } from './select-bank-account-buttons'
import { SelectCardButtonsV2 } from './select-card-buttons'
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
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<Mercoa.PaymentMethodId | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isPreview || !mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.paymentMethod
      .getAll(mercoaSession.entity?.id, { type: ['bankAccount', 'card'] })
      .then((resp) => {
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
        if (!selectedPaymentMethodId && respBankAccounts.length > 0) {
          setSelectedPaymentMethodId(respBankAccounts[0].id)
        }
      })
  }, [mercoaSession.token, mercoaSession.entity?.id, mercoaSession.refreshId])

  const methods = [
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
  ].filter((method) =>
    mercoaSession.organization?.paymentMethods?.payerPayments?.find((pm) => pm.type === method.type && pm.active),
  )

  const handlePayment = async () => {
    if (isLoading || isPreview) return
    setIsLoading(true)
    try {
      if (!selectedPaymentMethodId || !bankAccounts) {
        toast.error('Please select a payment method')
        return
      }
      const selectedPaymentMethod = bankAccounts.find((account) => account.id === selectedPaymentMethodId)
      if (!selectedPaymentMethod) {
        toast.error('Selected payment method not found')
        return
      }
      if (selectedPaymentMethod.status !== Mercoa.BankStatus.Verified) {
        toast.error('The selected payment method is not verified')
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
        <SelectPaymentMethodTypeButtonsV2
          methods={methods}
          selectedPaymentType={selectedPaymentType}
          setSelectedPaymentType={setSelectedPaymentType}
          setSelectedPaymentMethodId={setSelectedPaymentMethodId}
        />
      </div>

      {/* Bank Accounts List */}
      {selectedPaymentType === Mercoa.PaymentMethodType.BankAccount && (
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
      {selectedPaymentType === Mercoa.PaymentMethodType.Card && cards && (
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

      <div className="mercoa-w-full mercoa-mt-5">
        <MercoaButton
          isEmphasized
          size="lg"
          className="mercoa-w-full"
          disabled={isLoading || !acceptingPayments}
          onClick={handlePayment}
        >
          {payButtonText}
        </MercoaButton>
      </div>
    </div>
  )
}
