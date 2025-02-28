import { Mercoa } from '@mercoa/javascript'

export function InvoiceHeader({ invoice, logo }: { invoice: Mercoa.InvoiceResponse; logo: string }) {
  const payerAddress = invoice.payer?.profile?.individual?.address ?? invoice.payer?.profile?.business?.address
  const payerEmail = invoice.payer?.profile?.individual?.email ?? invoice.payer?.profile?.business?.email
  const vendorAddress = invoice.vendor?.profile?.individual?.address ?? invoice.vendor?.profile?.business?.address
  const vendorEmail = invoice.vendor?.profile?.individual?.email ?? invoice.vendor?.profile?.business?.email

  return (
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
        {payerEmail && <p>{payerEmail}</p>}
      </div>

      <div className="mercoa-border-l-2 mercoa-border-gray-500 mercoa-pl-6">
        {logo && <img src={logo} alt="logo" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }} />}
        <p className="mercoa-text-xl mercoa-mt-2">
          {invoice.vendor?.profile?.business?.doingBusinessAs ?? invoice.vendor?.name}
        </p>
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
        {vendorEmail && <p>{vendorEmail}</p>}
      </div>
    </div>
  )
}
