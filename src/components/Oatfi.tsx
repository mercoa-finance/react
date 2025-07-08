import accounting from 'accounting'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import { Popover } from '../lib/components/popover'
import { currencyCodeToSymbol } from '../lib/currency'
import { usePayableDetails } from '../modules/payables'
import { PayablePaymentMethodList } from '../modules/payables/components/payable-form/components/payable-payment/payable-select-payment-method'
import { BankAccount } from './BankAccounts'

export const BnplOffer: React.FC<{
  paymentMethods: Mercoa.PaymentMethodResponse[]
}> = ({ paymentMethods }) => {
  const {
    formContextValue: { bnplContextValue, paymentMethodContextValue },
  } = usePayableDetails()
  const {
    bnplInstallmentsStartDate,
    setBnplInstallmentsStartDate,
    bnplDefermentWeeks,
    setBnplDefermentWeeks,
    bnplAcceptedTerms,
    setBnplAcceptedTerms,
    bnplOffer,
    bnplOfferLoading,
  } = bnplContextValue ?? {}

  const { sourcePaymentMethods, setSelectedSourcePaymentMethodId } = paymentMethodContextValue
  const { watch, control } = useFormContext()
  const invoiceId = watch('id')
  const deductionDate = watch('deductionDate')
  const paymentSourceId = watch('paymentSourceId')
  const status = watch('status')

  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const defermentOptions = [
    { value: 4, label: '4 weeks' },
    { value: 8, label: '8 weeks' },
    { value: 12, label: '12 weeks' },
    { value: 16, label: '16 weeks' },
  ]

  const readOnlyDefermentWeeks = defermentOptions.find((opt) => opt.value === bnplDefermentWeeks)?.label
  const readOnlyInstallmentStartDate = bnplInstallmentsStartDate
    ? dayjs(bnplInstallmentsStartDate).format('MMMM D, YYYY')
    : 'Not set'

  return (
    <div className="mercoa-p-6 mercoa-bg-white mercoa-rounded-lg mercoa-my-4 mercoa-border mercoa-border-gray-200">
      <div className="mercoa-mb-6">
        <h3 className="mercoa-text-lg mercoa-font-medium mercoa-text-gray-900">Pay Later</h3>
        <p className="mercoa-text-sm mercoa-text-gray-500 mercoa-mt-1">
          Choose when the invoice is paid, defer the repayment by up to 16 weeks, and split into weekly installments.
        </p>
      </div>

      <div className="mercoa-space-y-4">
        <div className="mercoa-space-y-4">
          <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
            <label className="mercoa-text-sm mercoa-text-[#191A17]">Pay invoice on</label>
            <div className="mercoa-text-sm mercoa-font-medium">
              {deductionDate ? dayjs(deductionDate).format('MMMM D, YYYY') : 'Not set'}
            </div>
          </div>

          <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
            <label className="mercoa-text-sm mercoa-text-[#191A17]">Start installments on</label>
            {status === 'DRAFT' ? (
              <div className="mercoa-w-48">
                <Controller
                  control={control}
                  name="paymentSourceOptions.installmentsStartDate"
                  render={({ field }) => (
                    <input
                      type="date"
                      placeholder="Select date"
                      value={field.value || ''}
                      min={dayjs(deductionDate).add(1, 'day').format('YYYY-MM-DD')}
                      className="mercoa-block mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 placeholder:mercoa-text-gray-400 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6"
                      onChange={(e) => {
                        if (e.target.value) {
                          const dateString = dayjs(e.target.value).format('YYYY-MM-DD')
                          field.onChange(dateString)
                          setBnplInstallmentsStartDate?.(dateString)
                        }
                      }}
                    />
                  )}
                />
              </div>
            ) : (
              <div className="mercoa-text-sm mercoa-font-medium">{readOnlyInstallmentStartDate}</div>
            )}
          </div>

          <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
            <label className="mercoa-text-sm mercoa-text-[#191A17]">Defer repayment by</label>
            {status === 'DRAFT' ? (
              <Popover
                sideOffset={5}
                trigger={
                  <button className="mercoa-flex mercoa-items-center mercoa-gap-2 mercoa-h-7 mercoa-rounded-md mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-px-2 mercoa-text-xs mercoa-text-gray-900 hover:mercoa-bg-gray-50 focus:mercoa-outline-none">
                    {readOnlyDefermentWeeks}
                    <svg
                      className="mercoa-h-4 mercoa-w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                }
                open={isPopoverOpen}
                onOpenChange={setIsPopoverOpen}
                align="end"
              >
                <div className="mercoa-bg-white  mercoa-rounded-lg mercoa-shadow-lg mercoa-border mercoa-border-gray-200 mercoa-w-fit">
                  <div className="mercoa-py-1">
                    {defermentOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className="mercoa-w-full mercoa-text-left mercoa-px-2 mercoa-py-2 mercoa-text-xs mercoa-text-gray-900 hover:mercoa-bg-gray-50"
                        onClick={() => {
                          setBnplDefermentWeeks?.(opt.value)
                          setIsPopoverOpen(false)
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Popover>
            ) : (
              <div className="mercoa-text-sm mercoa-font-medium">{readOnlyDefermentWeeks}</div>
            )}
          </div>

          {bnplOfferLoading ? (
            <>
              {[...Array(7)].map((_, i) => (
                <div key={i} className="mercoa-flex mercoa-justify-between mercoa-items-center mercoa-animate-pulse">
                  <div className="mercoa-h-4 mercoa-w-24 mercoa-bg-gray-200 mercoa-rounded"></div>
                  <div className="mercoa-h-4 mercoa-w-32 mercoa-bg-gray-200 mercoa-rounded"></div>
                </div>
              ))}
            </>
          ) : (
            bnplOffer && (
              <>
                <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
                  <label className="mercoa-text-sm mercoa-text-[#191A17]">Invoice amount</label>
                  <div className="mercoa-text-sm mercoa-font-medium">
                    {accounting.formatMoney(bnplOffer.invoiceAmount / 100, currencyCodeToSymbol(bnplOffer.currency))}
                  </div>
                </div>

                <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
                  <label className="mercoa-text-sm mercoa-text-[#191A17]">Total fee</label>
                  <div className="mercoa-text-sm mercoa-font-medium">
                    {accounting.formatMoney(
                      (bnplOffer.totalRepaymentAmount - bnplOffer.invoiceAmount) / 100,
                      currencyCodeToSymbol(bnplOffer.currency),
                    )}
                  </div>
                </div>

                <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
                  <label className="mercoa-text-sm mercoa-text-[#191A17]">Total repayment amount</label>
                  <div className="mercoa-text-sm mercoa-font-medium">
                    {accounting.formatMoney(
                      bnplOffer.totalRepaymentAmount / 100,
                      currencyCodeToSymbol(bnplOffer.currency),
                    )}
                  </div>
                </div>

                <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
                  <label className="mercoa-text-sm mercoa-text-[#191A17]">Payment schedule</label>
                  <div className="mercoa-text-sm mercoa-font-medium">
                    {accounting.formatMoney(
                      bnplOffer.installmentAmount / 100,
                      currencyCodeToSymbol(bnplOffer.currency),
                    )}{' '}
                    weekly every{' '}
                    {bnplOffer.paymentDayOfWeek.charAt(0) + bnplOffer.paymentDayOfWeek.slice(1).toLowerCase()}
                  </div>
                </div>

                <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
                  <label className="mercoa-text-sm mercoa-text-[#191A17]">Number of payments</label>
                  <div className="mercoa-text-sm fmercoa-font-medium">{bnplOffer.numberOfPayments}</div>
                </div>

                <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
                  <label className="mercoa-text-sm mercoa-text-[#191A17]">First payment date</label>
                  <div className="mercoa-text-sm mercoa-font-medium">
                    {dayjs(bnplOffer.firstPaymentDate).format('MMMM D, YYYY')}
                  </div>
                </div>

                <div className="mercoa-flex mercoa-justify-between mercoa-items-center">
                  <label className="mercoa-text-sm mercoa-text-[#191A17]">Final payment date</label>
                  <div className="mercoa-text-sm mercoa-font-medium">
                    {dayjs(bnplOffer.finalPaymentDate).format('MMMM D, YYYY')}
                  </div>
                </div>
              </>
            )
          )}
        </div>

        <div>
          <label className="mercoa-text-sm mercoa-text-[#191A17]">Bank account to use for repayment</label>
          <PayablePaymentMethodList
            paymentMethods={sourcePaymentMethods ?? []}
            paymentId={paymentSourceId}
            readOnly={status !== 'DRAFT'}
            setPaymentId={setSelectedSourcePaymentMethodId}
            type={Mercoa.PaymentMethodType.BankAccount}
            Component={BankAccount}
          />
          <p className="mercoa-text-xs mercoa-text-gray-500 mercoa-mt-1">
            Your payments will be automatically debited on each due date. You can make early repayments at any time.
          </p>
        </div>

        {bnplOffer?.termsLink && (
          <>
            <div className="mercoa-pt-4">
              <label className="mercoa-flex mercoa-items-center mercoa-gap-x-3">
                <input
                  type="checkbox"
                  checked={bnplAcceptedTerms || false}
                  onChange={(e) => setBnplAcceptedTerms?.(e.target.checked)}
                  className="mercoa-h-[18px] mercoa-w-[18px] mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary"
                />
                <span className="mercoa-text-sm mercoa-text-gray-500">
                  By agreeing, I accept the loan{' '}
                  <a
                    href={bnplOffer?.termsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mercoa-text-mercoa-text-primary mercoa-underline"
                  >
                    terms and conditions
                  </a>
                  , and acknowledge responsibility to repay the loan as specified.
                </span>
              </label>
            </div>
            <div className="mercoa-flex mercoa-justify-center">
              <a
                href={bnplOffer.termsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mercoa-mt-6 mercoa-w-[80%] mercoa-flex mercoa-items-center mercoa-justify-center mercoa-gap-x-2 mercoa-rounded-lg mercoa-border mercoa-border-gray-300 mercoa-bg-white mercoa-px-4 mercoa-py-3 mercoa-text-sm mercoa-font-medium mercoa-text-gray-700 mercoa-shadow-sm hover:mercoa-bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="mercoa-w-5 mercoa-h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                View Agreement
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
