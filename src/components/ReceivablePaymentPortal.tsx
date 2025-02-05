import {
  ArrowDownTrayIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  MapPinIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { currencyCodeToSymbol } from '../lib/currency'
import {
  AddBankAccountButton,
  AddCardButton,
  BankAccount,
  Card,
  MercoaButton,
  PaymentMethodList,
  useMercoaSession,
} from './index'

export function ReceivablePaymentPortal({
  complete,
  invoice,
  supportEmail,
  totalDisplay,
  updateInvoice,
}: {
  complete?: boolean
  invoice: Mercoa.InvoiceResponse
  supportEmail?: string
  totalDisplay: string
  updateInvoice: (updateRequest: Mercoa.InvoiceUpdateRequest) => void
}) {
  const [selectedPaymentType, setSelectedPaymentType] = useState<Mercoa.PaymentMethodType | string>(
    Mercoa.PaymentMethodType.BankAccount,
  )

  const mercoaSession = useMercoaSession()

  const logo =
    invoice.vendor?.logo ??
    mercoaSession.organization?.logoUrl ??
    'https://storage.googleapis.com/mercoa-partner-logos/mercoa-logo.png'

  return (
    <div className="mercoa-min-h-full">
      <div className="mercoa-h-28 mercoa-flex mercoa-items-center">
        <img src={logo} alt="logo" width={150} className=" mercoa-object-contain mercoa-min-h-0" />
      </div>
      {complete ? (
        <PaymentComplete invoice={invoice} totalDisplay={totalDisplay} />
      ) : (
        <div className="mercoa-m-auto mercoa-grid sm:mercoa-grid-cols-12 sm:mercoa-max-w-5xl sm:mercoa-gap-x-4 mercoa-px-2 sm:mercoa-px-0 ">
          <div className="mercoa-col-span-12 sm:mercoa-col-span-8">
            <MainCard
              invoice={invoice}
              totalDisplay={totalDisplay}
              selectedPaymentType={selectedPaymentType}
              setSelectedPaymentType={setSelectedPaymentType}
              updateInvoice={updateInvoice}
            />
          </div>
          <aside className="mercoa-col-span-12 mercoa-mt-4 sm:mercoa-mt-0 sm:mercoa-col-span-4">
            <div className="mercoa-flex mercoa-flex-col mercoa-gap-y-5">
              <InvoiceDetailsCard invoice={invoice} totalDisplay={totalDisplay} />
              {invoice.vendor && <VendorDetailsCard vendor={invoice.vendor} />}
              <div className="mercoa-flex mercoa-items-center mercoa-border-t-2 mercoa-border-gray-200 mercoa-text-left mercoa-text-xs mercoa-text-gray-400">
                <LockClosedIcon className="mercoa-mr-2 mercoa-h-16 mercoa-w-16" />
                <span>
                  All your account information will remain private, secure, and hidden from{' '}
                  <b>{invoice.vendor?.name}</b> and other businesses.
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
      <div className="mercoa-mt-5 mercoa-p-2 mercoa-text-center mercoa-text-xs mercoa-text-gray-500">
        <b className="mercoa-mr-2">Have any questions?</b>
        <a href={`mailto:${supportEmail ?? 'support@mercoa.com'}`} target="_blank" rel="noreferrer">
          {supportEmail ?? 'support@mercoa.com'}
        </a>
      </div>
      <div className="mercoa-mt-5 mercoa-p-2 mercoa-text-center mercoa-text-xs mercoa-text-gray-500">
        <a href="https://mercoa.com/legal/privacy-policy" target="_blank" rel="noreferrer">
          Privacy Policy
        </a>{' '}
        |{' '}
        <a href="https://mercoa.com/legal/platform-agreement" target="_blank" rel="noreferrer">
          Terms of Service
        </a>
      </div>
    </div>
  )
}

function InvoiceDetailsCard({ invoice, totalDisplay }: { invoice: Mercoa.InvoiceResponse; totalDisplay: string }) {
  const mercoaSession = useMercoaSession()

  async function getPDFLink() {
    if (!invoice?.id) return
    const pdfLink = await mercoaSession.client?.invoice.document.generateInvoicePdf(invoice.id)
    if (pdfLink?.uri) {
      // open in new window
      window.open(pdfLink.uri, '_blank')
    } else {
      toast.error('There was an issue generating the Invoice PDF. Please refresh and try again.')
    }
  }

  return (
    <div className="mercoa-flex-1 mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-3 mercoa-py-4 mercoa-border mercoa-border-gray-300">
      <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900">
        {invoice.vendor?.name}
      </h3>
      <p className="mercoa-mt-5 mercoa-text-sm mercoa-font-medium mercoa-flex">
        <span className="mercoa-text-gray-600">Invoice</span>
        <span className="mercoa-ml-auto mercoa-text-gray-800">{invoice.invoiceNumber}</span>
      </p>
      <p className="mercoa-mt-1 mercoa-text-sm mercoa-font-medium mercoa-flex">
        <span className="mercoa-text-gray-600">Due Date</span>
        <span className="mercoa-ml-auto mercoa-text-gray-800">{dayjs(invoice.dueDate).format('MMM D, YYYY')}</span>
      </p>
      <p className="mercoa-mt-1 mercoa-text-sm mercoa-font-medium mercoa-flex">
        <span className="mercoa-text-gray-600">Invoice Amount</span>
        <span className="mercoa-ml-auto mercoa-text-gray-800">{totalDisplay}</span>
      </p>
      <hr className="mercoa-my-3" />
      <div className="mercoa-flex mercoa-items-center">
        <div className="mercoa-flex-1" />
        <MercoaButton isEmphasized={false} size="sm" onClick={getPDFLink}>
          <ArrowDownTrayIcon className="mercoa-size-4" />
        </MercoaButton>
        <MercoaButton isEmphasized={false} size="sm" className="mercoa-ml-3">
          <PrinterIcon className="mercoa-size-4" onClick={getPDFLink} />
        </MercoaButton>
      </div>
    </div>
  )
}

function VendorDetailsCard({ vendor }: { vendor: Mercoa.EntityResponse }) {
  const phoneNumber = vendor.profile?.business?.phone?.number ?? vendor.profile?.individual?.phone?.number
  const countryCode =
    vendor.profile?.business?.phone?.countryCode ?? vendor.profile?.individual?.phone?.countryCode ?? '1'
  const phone = `+${countryCode} ${phoneNumber}`
  const address = vendor.profile?.business?.address ?? vendor.profile?.individual?.address
  const addressString = `${address?.addressLine1 ?? ''} ${address?.addressLine2 ?? ''}, ${address?.city ?? ''}, ${
    address?.stateOrProvince ?? ''
  } ${address?.postalCode ?? ''}`
  return (
    <div className="mercoa-flex-1 mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-3 mercoa-py-4 mercoa-border mercoa-border-gray-300">
      <h3 className="mercoa-text-base mercoa-font-medium mercoa-leading-3 mercoa-text-gray-800">Merchant details</h3>
      <p className="mercoa-mt-1 mercoa-text-sm mercoa-flex mercoa-text-gray-600">Email: {vendor.email}</p>
      <hr className="mercoa-my-3" />
      {phoneNumber && (
        <p className="mercoa-flex mercoa-items-center mercoa-mt-3">
          <DevicePhoneMobileIcon className="mercoa-size-4 mercoa-inline-block mercoa-mr-2" />
          <a className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-blue-400" href={`tel:${phone}`}>
            {phone}
          </a>
        </p>
      )}
      {address?.addressLine1 && (
        <p className="mercoa-flex mercoa-items-center mercoa-mt-3">
          <MapPinIcon className="mercoa-size-4 mercoa-inline-block mercoa-mr-2" />
          <a
            className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-blue-400"
            href={`https://www.google.com/maps/search/?api=1&query=${addressString}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {addressString}
          </a>
        </p>
      )}
    </div>
  )
}

function MainCard({
  invoice,
  totalDisplay,
  selectedPaymentType,
  setSelectedPaymentType,
  updateInvoice,
}: {
  invoice: Mercoa.InvoiceResponse
  totalDisplay: string
  selectedPaymentType: Mercoa.PaymentMethodType | string
  setSelectedPaymentType: (paymentMethodType: Mercoa.PaymentMethodType | string) => void
  updateInvoice: (updateRequest: Mercoa.InvoiceUpdateRequest) => void
}) {
  const mercoaSession = useMercoaSession()
  const [bankAccounts, setBankAccounts] = useState<Array<Mercoa.PaymentMethodResponse.BankAccount>>()
  const [cards, setCards] = useState<Array<Mercoa.PaymentMethodResponse.Card>>()
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<Mercoa.PaymentMethodId | undefined>()

  // Get Payment Methods
  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
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
    }
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
        <LineItems lineItems={invoice?.lineItems ?? []} />
      </div>

      {/* Select Payment Method */}
      <div className="mercoa-w-full mercoa-mt-5">
        <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">
          Select a payment method
        </p>
        <SelectPaymentMethodTypeButtons
          methods={methods}
          selectedPaymentType={selectedPaymentType}
          setSelectedPaymentType={setSelectedPaymentType}
          setSelectedPaymentMethodId={setSelectedPaymentMethodId}
        />
      </div>

      {/* Bank Accounts List */}
      {selectedPaymentType === Mercoa.PaymentMethodType.BankAccount && bankAccounts && (
        <div className="mercoa-w-full mercoa-mt-5">
          <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-600 mercoa-text-sm">
            Select a bank account
          </p>
          <SelectBankAccountButtons
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
          <SelectCardButtons
            cards={cards}
            setCards={setCards}
            selectedPaymentMethodId={selectedPaymentMethodId}
            setSelectedPaymentMethodId={setSelectedPaymentMethodId}
          />
        </div>
      )}

      {/* Pay Button */}
      <div className="mercoa-w-full mercoa-mt-5">
        <MercoaButton
          isEmphasized
          size="lg"
          className="mercoa-w-full"
          onClick={() => {
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
            updateInvoice(updateRequest)
          }}
        >
          Pay {totalDisplay}
        </MercoaButton>
      </div>
    </div>
  )
}

function LineItems({ lineItems }: { lineItems: Mercoa.InvoiceLineItemResponse[] }) {
  if (!lineItems.length) return <></>
  return (
    <ul>
      {lineItems.map((lineItem) => (
        <li
          key={lineItem.id}
          className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-p-2 mercoa-border-b"
        >
          <div className="mercoa-flex mercoa-items-center">
            <div className="">
              <p className="mercoa-text-md mercoa-font-medium mercoa-text-gray-900">{lineItem.name}</p>
              <p className="mercoa-text-xs mercoa-font-medium mercoa-text-gray-400">{lineItem.description}</p>
              <p className="mercoa-text-sm mercoa-text-gray-500">
                {lineItem.quantity} x {currencyCodeToSymbol(lineItem.currency)}
                {lineItem.unitPrice}
              </p>
            </div>
          </div>
          <div className="mercoa-text-sm mercoa-text-gray-500">
            {currencyCodeToSymbol(lineItem.currency)}
            {lineItem.amount}
          </div>
        </li>
      ))}
    </ul>
  )
}

function SelectPaymentMethodTypeButtons({
  methods,
  selectedPaymentType,
  setSelectedPaymentType,
  setSelectedPaymentMethodId,
}: {
  methods: Array<{ type: Mercoa.PaymentMethodType | string; icon: React.ReactNode; text: string }>
  selectedPaymentType: Mercoa.PaymentMethodType | string
  setSelectedPaymentType: (paymentMethodType: Mercoa.PaymentMethodType | string) => void
  setSelectedPaymentMethodId: (paymentMethodId: string | undefined) => void
}) {
  let widthClass = 'mercoa-flex-grow'
  if (methods.length === 2) {
    widthClass = 'mercoa-w-1/2'
  } else if (methods.length === 3) {
    widthClass = 'mercoa-w-1/3'
  }
  return (
    <div className="mercoa-flex mercoa-gap-x-4 mercoa-justify-center mercoa-mt-5">
      {methods.map((method) => (
        <button
          key={method.text}
          className={`mercoa-cursor-pointer mercoa-rounded-mercoa mercoa-border ${widthClass} ${
            selectedPaymentType === method.type ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
          } mercoa-bg-white mercoa-shadow-sm hover:mercoa-shadow-md`}
          onClick={() => {
            setSelectedPaymentType(method.type)
            setSelectedPaymentMethodId(undefined)
          }}
        >
          <div className="mercoa-px-4 mercoa-py-5 mercoa-text-center sm:mercoa-p-6">
            <p className="mercoa-flex mercoa-gap-x-4 mercoa-items-center mercoa-justify-center mercoa-text-md mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
              <div
                className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
                  selectedPaymentType === method.type
                    ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
                    : 'mercoa-bg-gray-200 mercoa-text-gray-600'
                }`}
              >
                {method.icon}
              </div>
              {method.text}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

function SelectBankAccountButtons({
  bankAccounts,
  setBankAccounts,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
}: {
  bankAccounts: Array<Mercoa.PaymentMethodResponse.BankAccount>
  setBankAccounts: Dispatch<SetStateAction<Mercoa.PaymentMethodResponse.BankAccount[] | undefined>>
  selectedPaymentMethodId: string | undefined
  setSelectedPaymentMethodId: Dispatch<SetStateAction<string | undefined>>
}) {
  return (
    <PaymentMethodList
      accounts={bankAccounts}
      showDelete
      formatAccount={(bankAccount) => (
        <BankAccount
          key={bankAccount.id}
          showEdit
          account={bankAccount}
          selected={bankAccount.id === selectedPaymentMethodId}
          onSelect={() => {
            setSelectedPaymentMethodId(bankAccount.id)
          }}
          hideDefaultIndicator
          hideCheckSendStatus
        />
      )}
      addAccount={
        <AddBankAccountButton
          onSelect={(bankAccount: Mercoa.PaymentMethodResponse.BankAccount) => {
            if (
              !bankAccounts.find(
                (e) => e.accountNumber === bankAccount.accountNumber && e.routingNumber === bankAccount.routingNumber,
              )
            ) {
              setBankAccounts((prevBankAccounts) =>
                prevBankAccounts ? [...prevBankAccounts, bankAccount] : [bankAccount],
              )
              setSelectedPaymentMethodId(bankAccount.id)
            }
          }}
        />
      }
    />
  )
}

function SelectCardButtons({
  cards,
  setCards,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
}: {
  cards: Array<Mercoa.PaymentMethodResponse.Card>
  setCards: Dispatch<SetStateAction<Mercoa.PaymentMethodResponse.Card[] | undefined>>
  selectedPaymentMethodId: string | undefined
  setSelectedPaymentMethodId: Dispatch<SetStateAction<string | undefined>>
}) {
  return (
    <PaymentMethodList
      accounts={cards}
      showDelete
      formatAccount={(card) => (
        <Card
          key={card.id}
          showEdit
          account={card}
          selected={card.id === selectedPaymentMethodId}
          onSelect={() => {
            setSelectedPaymentMethodId(card.id)
          }}
          hideDefaultIndicator
        />
      )}
      addAccount={
        <AddCardButton
          onSelect={(card: Mercoa.PaymentMethodResponse.Card) => {
            if (!cards.find((e) => e.lastFour === card.lastFour)) {
              setCards((prevCards) => (prevCards ? [...prevCards, card] : [card]))
              setSelectedPaymentMethodId(card.id)
            }
          }}
        />
      }
    />
  )
}

function PaymentComplete({ invoice, totalDisplay }: { invoice: Mercoa.InvoiceResponse; totalDisplay: string }) {
  const mercoaSession = useMercoaSession()

  const sourcePaymentMethod = invoice.paymentSource
  const formattedPaymentMethod =
    sourcePaymentMethod?.type === Mercoa.PaymentMethodType.BankAccount
      ? formatBankAccount(sourcePaymentMethod as Mercoa.PaymentMethodResponse.BankAccount)
      : sourcePaymentMethod?.type

  async function getPDFLink() {
    if (!invoice?.id) return
    const pdfLink = await mercoaSession.client?.invoice.document.generateInvoicePdf(invoice.id)
    if (pdfLink?.uri) {
      // open in new window
      window.open(pdfLink.uri, '_blank')
    } else {
      toast.error('There was an issue generating the Invoice PDF. Please refresh and try again.')
    }
  }

  const receiptData: { name: string; value: string }[] = [
    { name: 'Merchant', value: invoice.vendor?.name ?? '' },
    { name: 'Invoice Number', value: invoice.invoiceNumber ?? '' },
    { name: 'Payment Method', value: formattedPaymentMethod ?? '' },
    { name: 'Invoice ID', value: invoice?.id ?? '' },
    { name: 'Due Date', value: dayjs(invoice.dueDate).format('MMM D, YYYY') },
    { name: 'Payment Amount', value: totalDisplay },
  ]

  return (
    <div className="mercoa-max-w-2xl mercoa-m-auto">
      <div className="mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-5 mercoa-py-6 mercoa-border mercoa-border-gray-300">
        <h2 className="mercoa-primary-text mercoa-font-bold mercoa-leading-6 mercoa-text-gray-900 mercoa-text-3xl mercoa-mt-2  mercoa-text-center">
          Success!
        </h2>
        <div className="mercoa-max-w-md mercoa-m-auto">
          {receiptData.map(({ name, value }) => (
            <p
              key={name}
              className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 mercoa-gap-x-6"
            >
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">{name}</span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">{value}</span>
            </p>
          ))}
          <MercoaButton isEmphasized size="lg" className="mercoa-w-full mercoa-mt-10" onClick={getPDFLink}>
            Download Invoice
          </MercoaButton>
        </div>
      </div>
    </div>
  )
}

function formatBankAccount(account: Mercoa.PaymentMethodResponse.BankAccount): string {
  const lastFour = String(account.accountNumber).slice(-4)
  return `${account.bankName} ****${lastFour}`
}
