import {
  ArrowDownTrayIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  MapPinIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { currencyCodeToSymbol } from '../lib/currency'
import { AddBankAccount, LoadingSpinnerIcon, MercoaButton, useMercoaSession } from './index'

export function ReceivablePaymentPortal({
  complete,
  invoice,
  supportEmail,
  totalDisplay,
  selectedPaymentType,
  updateInvoice,
  setSelectedPaymentType,
}: {
  complete?: boolean
  invoice: Mercoa.InvoiceResponse
  supportEmail?: string
  totalDisplay: string
  selectedPaymentType: Mercoa.PaymentMethodType | string
  updateInvoice: (invoice: Mercoa.PaymentMethodResponse) => void
  setSelectedPaymentType: (paymentMethodType: Mercoa.PaymentMethodType | string) => void
}) {
  const logo = invoice.vendor?.logo ?? 'https://storage.googleapis.com/mercoa-partner-logos/mercoa-logo.png'

  const mercoaSession = useMercoaSession()

  return (
    <div className="mercoa-min-h-full">
      <div className="mercoa-h-28">
        <img src={logo} alt="logo" width={150} className="mercoa-pt-4 mercoa-pl-4" />
      </div>
      {complete ? (
        <PaymentComplete invoice={invoice} />
      ) : (
        <div className="mercoa-m-auto mercoa-grid sm:mercoa-grid-cols-12 sm:mercoa-max-w-5xl sm:mercoa-gap-x-4 mercoa-mt-5 mercoa-px-2 sm:mercoa-px-0 ">
          <div className="mercoa-col-span-12 sm:mercoa-col-span-8">
            <MainCard invoice={invoice} />
          </div>
          <aside className="mercoa-col-span-12 mercoa-mt-4 sm:mercoa-mt-0 sm:mercoa-col-span-4">
            <div className="mercoa-flex mercoa-flex-col mercoa-gap-y-5">
              <InvoiceDetailsCard invoice={invoice} />
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

  function InvoiceDetailsCard({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
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
          <span className="mercoa-text-gray-600">Due date</span>
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
            <a
              className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-blue-400"
              href={`tel:${phone}`}
            >
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

  function MainCard({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
    const payAction = (
      <div className="mercoa-w-full">
        <MercoaButton isEmphasized size="lg" className="mercoa-w-full">
          Pay {totalDisplay}
        </MercoaButton>
      </div>
    )

    return (
      <div className="mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-5 mercoa-py-6 mercoa-border mercoa-border-gray-300">
        <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-400 mercoa-text-sm">Payment Amount</p>
        <p className="mercoa-font-bold mercoa-leading-6 mercoa-text-gray-900 mercoa-text-3xl mercoa-mt-2">
          {totalDisplay}
        </p>

        <LineItems lineItems={invoice?.lineItems ?? []} />

        <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-400 mercoa-text-sm mercoa-mt-5">
          Payment Method
        </p>
        <SelectPaymentMethodButtons />
        <div className="mercoa-w-full mercoa-mt-5">
          {/* {selectedPaymentType === Mercoa.PaymentMethodType.Card && (
            <AddCard title={<></>} actions={payAction} onSubmit={updateInvoice} />
          )} */}
          {selectedPaymentType === Mercoa.PaymentMethodType.BankAccount && (
            <AddBankAccount title={<></>} actions={payAction} onSubmit={updateInvoice} />
          )}
        </div>
      </div>
    )
  }

  function LineItems({ lineItems }: { lineItems: Mercoa.InvoiceLineItemResponse[] }) {
    if (!lineItems.length) return <></>
    return (
      <>
        <p className="mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-400 mercoa-text-sm mercoa-mt-5">Details</p>
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
      </>
    )
  }

  function SelectPaymentMethodButtons() {
    return (
      <div className="mercoa-flex mercoa-gap-x-4 mercoa-justify-center mercoa-mt-5">
        <button
          className="mercoa-w-[150px]"
          onClick={() => {
            setSelectedPaymentType(Mercoa.PaymentMethodType.BankAccount)
          }}
        >
          <div
            className={
              'mercoa-rounded-mercoa mercoa-shadow-sm mercoa-p-3 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-border-t-4 mercoa-border mercoa-border-gray-100' +
              (selectedPaymentType === Mercoa.PaymentMethodType.BankAccount ? '  mercoa-border-t-primary' : '')
            }
          >
            <BuildingLibraryIcon className="mercoa-h-6 mercoa-w-6" />
          </div>
          <p
            className={
              'mercoa-mt-1 mercoa-text-gray-600' +
              (selectedPaymentType === Mercoa.PaymentMethodType.BankAccount ? ' mercoa-font-bold' : '')
            }
          >
            Bank Account
          </p>
        </button>
        {/* <button
          className="mercoa-w-[150px]"
          onClick={() => {
            setSelectedPaymentType(Mercoa.PaymentMethodType.Card)
          }}
        >
          <div
            className={
              'mercoa-rounded-mercoa mercoa-shadow-sm mercoa-p-3 mercoa-flex mercoa-items-center mercoa-justify-center mercoa-border-t-4 mercoa-border mercoa-border-gray-100' +
              (selectedPaymentType === Mercoa.PaymentMethodType.Card ? '  mercoa-border-t-primary' : '')
            }
          >
            <CreditCardIcon className="mercoa-h-6 mercoa-w-6" />
          </div>
          <p
            className={
              'mercoa-mt-1 mercoa-text-gray-600' +
              (selectedPaymentType === Mercoa.PaymentMethodType.Card ? ' mercoa-font-bold' : '')
            }
          >
            Card
          </p>
        </button> */}
      </div>
    )
  }

  function PaymentComplete({ invoice }: { invoice: Mercoa.InvoiceResponse }) {
    return (
      <div className="mercoa-max-w-2xl mercoa-m-auto">
        <div className="mercoa-shadow-sm mercoa-bg-white mercoa-rounded-mercoa mercoa-px-5 mercoa-py-6 mercoa-border mercoa-border-gray-300">
          <h2 className="mercoa-primary-text mercoa-font-bold mercoa-leading-6 mercoa-text-gray-900 mercoa-text-3xl mercoa-mt-2  mercoa-text-center">
            Success!
          </h2>
          <div className="mercoa-max-w-md mercoa-m-auto">
            <p className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 ">
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">Merchant</span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">
                {invoice.vendor?.name}
              </span>
            </p>
            <p className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 ">
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">
                Invoice Number
              </span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">
                {invoice.invoiceNumber}
              </span>
            </p>
            <p className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 ">
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">
                Payment Method
              </span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">
                Wells Fargo ****1234
              </span>
            </p>
            <p className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 ">
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">
                Transaction ID
              </span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">
                {invoice?.id}
              </span>
            </p>
            <p className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 ">
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">Due Date</span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">
                {dayjs(invoice.dueDate).format('MMM D, YYYY')}
              </span>
            </p>
            <p className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-mt-5 mercoa-text-center mercoa-text-gray-500 ">
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-700">
                Payment Amount
              </span>
              <span className="mercoa-text-sm mercoa-font-medium mercoa-leading-3 mercoa-text-gray-900">
                {totalDisplay}
              </span>
            </p>

            <MercoaButton isEmphasized size="lg" className="mercoa-w-full mercoa-mt-10">
              Download Receipt
            </MercoaButton>

            <MercoaButton isEmphasized={false} size="lg" className="mercoa-w-full mercoa-mt-2">
              Download Invoice
            </MercoaButton>
          </div>
        </div>
      </div>
    )
  }
}

export function ReceivablePaymentPdf({ invoice }: { invoice?: Mercoa.InvoiceResponse }) {
  const mercoaSession = useMercoaSession()

  if (!invoice) return <LoadingSpinnerIcon />

  const payerAddress = invoice.payer?.profile?.individual?.address ?? invoice.payer?.profile?.business?.address
  const vendorAddress = invoice.vendor?.profile?.individual?.address ?? invoice.vendor?.profile?.business?.address
  const logo = invoice.vendor?.logo

  const invoiceHeader = (
    <div className="mercoa-flex mercoa-justify-between mercoa-mt-10">
      <div>
        <p className="mercoa-text-2xl mercoa-font-bold">Bill To:</p>
        <p className="mercoa-text-xl">{invoice.payer?.name}</p>
        {payerAddress?.addressLine1 && (
          <>
            <p>
              {payerAddress.addressLine1} {payerAddress.addressLine2}
            </p>
            <p>
              {payerAddress.city}, {payerAddress.stateOrProvince}, {payerAddress.postalCode}
            </p>
          </>
        )}
      </div>

      <div className="mercoa-border-l-2 mercoa-border-gray-500 mercoa-pl-6">
        {logo && <img src={logo} alt="logo" width={150} />}
        <p className="mercoa-text-xl mercoa-mt-2">{invoice.vendor?.name}</p>
        {vendorAddress?.addressLine1 && (
          <>
            <p>
              {vendorAddress.addressLine1} {vendorAddress.addressLine2}
            </p>
            <p>
              {vendorAddress.city}, {vendorAddress.stateOrProvince}, {vendorAddress.postalCode}
            </p>
          </>
        )}
      </div>
    </div>
  )

  const invoiceNumberAndDate = (
    <div className="mercoa-flex mercoa-justify-between mercoa-mt-10">
      <div className="mercoa-text-5xl mercoa-font-medium">INVOICE</div>
      <div>
        <div className="mercoa-flex mercoa-justify-between">
          <span className="mercoa-text-gray-500">Invoice #</span>
          <span className="mercoa-text-gray-800 mercoa-pl-2">{invoice.invoiceNumber}</span>
        </div>
        <div className="mercoa-flex mercoa-justify-between">
          <span className="mercoa-text-gray-500">Date</span>
          <span className="mercoa-text-gray-800 mercoa-pl-2">{dayjs(invoice.invoiceDate).format('MMM DD, YYYY')}</span>
        </div>

        {mercoaSession.organization?.metadataSchema?.map((schema) => {
          if (invoice.metadata[schema.key]) {
            return (
              <div key={schema.key}>
                <span className="mercoa-text-gray-500">{schema.displayName}</span>
                {/* TODO: format based on schema type */}
                <span className="mercoa-text-gray-800 mercoa-pl-2">{invoice.metadata[schema.key]}</span>
              </div>
            )
          }
        })}
      </div>
    </div>
  )

  function LineItems({ lineItems }: { lineItems: Mercoa.InvoiceLineItemResponse[] }) {
    if (!lineItems.length) return <></>

    return (
      <div className="mercoa-overflow-hidden mercoa-rounded-t-lg mercoa-mt-10 mercoa-pb-5 mercoa-border-b-2 mercoa-border-gray-300 ">
        <table className="mercoa-min-w-full">
          <thead>
            <tr>
              <th
                scope="col"
                className="mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-6"
              >
                ITEM
              </th>
              <th
                scope="col"
                className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-font-semibold mercoa-text-gray-900"
              >
                PRICE
              </th>
              <th
                scope="col"
                className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-font-semibold mercoa-text-gray-900"
              >
                QTY
              </th>
              <th
                scope="col"
                className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-font-semibold mercoa-text-gray-900"
              >
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((lineItem) => (
              <tr key={lineItem.id}>
                <td className="mercoa-whitespace-nowrap mercoa-py-4 mercoa-pl-4 mercoa-pr-3 mercoa-font-medium mercoa-text-gray-900 sm:mercoa-pl-6">
                  <p className="mercoa-text-md mercoa-font-medium mercoa-text-gray-900">{lineItem.name}</p>
                  <p className="mercoa-text-xs mercoa-font-medium mercoa-text-gray-400">{lineItem.description}</p>
                </td>
                <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-gray-700">
                  {accounting.formatMoney(lineItem.unitPrice ?? 0, currencyCodeToSymbol(lineItem.currency))}
                </td>
                <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-gray-700">
                  {lineItem.quantity}
                </td>
                <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-gray-800 mercoa-font-bold">
                  {accounting.formatMoney(lineItem.amount ?? 0, currencyCodeToSymbol(lineItem.currency))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const invoiceTotal = (
    <div className="mercoa-flex mercoa-justify-end mercoa-mt-10 mercoa-text-xl">
      <div>
        {/* <div className="mercoa-flex mercoa-justify-between">
          <div className="mercoa-text-gray-500">Subtotal</div>
          <div className="mercoa-text-gray-800">
            {currencyCodeToSymbol(invoice.currency)}
            {invoice.subtotal}
          </div>
        </div>
        <div className="mercoa-flex mercoa-justify-between">
          <div className="mercoa-text-gray-500">Tax</div>
          <div className="mercoa-text-gray-800">
            {currencyCodeToSymbol(invoice.currency)}
            {invoice.tax}
          </div>
        </div> */}
        <div className="mercoa-flex mercoa-justify-between mercoa-items-baseline">
          <div className="mercoa-text-gray-500">Total</div>
          <div className="mercoa-text-gray-800 mercoa-ml-4 mercoa-mr-1">{`${accounting.formatMoney(
            invoice.amount ?? 0,
            currencyCodeToSymbol(invoice.currency),
          )}`}</div>
          <div className="mercoa-text-gray-500 mercoa-text-xs">{invoice.currency}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="mercoa-container mercoa-mx-auto mercoa-mt-10">
      {invoiceHeader}
      {invoiceNumberAndDate}
      <LineItems lineItems={invoice.lineItems ?? []} />
      {invoiceTotal}
      {invoice.paymentDestination?.type === Mercoa.PaymentMethodType.BankAccount && invoice.vendor && (
        <table>
          <tbody>
            <tr>
              <td className="mercoa-text-gray-500">Beneficiary Holder</td>
              <td className="mercoa-text-gray-800 mercoa-pl-2">{invoice.vendor.name}</td>
            </tr>
            <tr>
              <td className="mercoa-text-gray-500">Bank Name</td>
              <td className="mercoa-text-gray-800 mercoa-pl-2">{invoice.paymentDestination.bankName}</td>
            </tr>
            <tr>
              <td className="mercoa-text-gray-500">Account Number</td>
              <td className="mercoa-text-gray-800 mercoa-pl-2">{invoice.paymentDestination.accountNumber}</td>
            </tr>
            <tr>
              <td className="mercoa-text-gray-500">Routing Number</td>
              <td className="mercoa-text-gray-800 mercoa-pl-2">{invoice.paymentDestination.routingNumber}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
