import { DevicePhoneMobileIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'

export function VendorDetailsCard({ vendor }: { vendor: Mercoa.EntityResponse }) {
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
