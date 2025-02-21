import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'react-toastify'
import { MercoaButton, useMercoaSession, usePayableDetailsContext } from '../../../../../../components'
import { afterApprovedStatus } from '../../constants'
import { PayableSelectPaymentMethod } from './payable-select-payment-method'

export function PayablePaymentDestination({ readOnly }: { readOnly?: boolean }) {
  const {
    watch,
    formState: { errors },
  } = useFormContext()

  const { getVendorPaymentLink } = usePayableDetailsContext()

  const mercoaSession = useMercoaSession()
  const [vendorLink, setVendorLink] = useState<string>()

  const status = watch('status')
  readOnly = readOnly || (!!status && afterApprovedStatus.includes(status))

  const paymentSourceType = watch('paymentSourceType')
  const vendorId = watch('vendorId')
  const vendorName = watch('vendorName')
  const id = watch('id')

  useEffect(() => {
    if (id && mercoaSession.organization?.paymentMethods?.backupDisbursements?.find((e) => e.type === 'na')?.active) {
      getVendorPaymentLink(id).then((link) => {
        setVendorLink(link)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mercoaSession.organization?.paymentMethods?.backupDisbursements])

  return (
    <>
      {vendorId && vendorName && paymentSourceType !== 'offPlatform' && (
        <div className="mercoa-col-span-full">
          <h2 className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700 mercoa-mb-5">
            {readOnly ? (
              `Paying to ${vendorName}:`
            ) : (
              <>
                How does <span className="mercoa-text-gray-800 mercoa-underline">{vendorName}</span> want to get paid?
              </>
            )}
          </h2>
          <PayableSelectPaymentMethod isDestination readOnly={readOnly} />
          {vendorLink && (
            <div className="mercoa-flex mercoa-items-center mercoa-space-x-2 mercoa-mt-2">
              <div className="mercoa-flex-auto" />
              <MercoaButton
                size="sm"
                type="button"
                isEmphasized
                onClick={async () => {
                  await mercoaSession.client?.invoice.paymentLinks.sendVendorEmail(id)
                  toast.success('Email sent to vendor')
                }}
              >
                Send Vendor Email
              </MercoaButton>

              <MercoaButton
                size="sm"
                type="link"
                isEmphasized
                href={vendorLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vendor Portal
              </MercoaButton>
            </div>
          )}
          {errors.paymentDestinationId?.message && (
            <p className="mercoa-text-sm mercoa-text-red-500">{errors.paymentDestinationId?.message.toString()}</p>
          )}
        </div>
      )}
    </>
  )
}
