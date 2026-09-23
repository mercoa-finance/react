import { Mercoa } from '@mercoa/javascript'

export function SelectPaymentMethodTypeButtonsV2({
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
  return (
    <div className="mercoa-flex mercoa-flex-wrap mercoa-gap-4 mercoa-justify-center mercoa-mt-5">
      {methods.map((method) => (
        <button
          key={method.type}
          type="button"
          className={`mercoa-cursor-pointer mercoa-rounded-mercoa mercoa-border mercoa-flex-1 mercoa-min-w-[140px] ${
            selectedPaymentType === method.type ? 'mercoa-border-mercoa-primary' : 'mercoa-border-gray-300'
          } mercoa-bg-white mercoa-shadow-sm hover:mercoa-shadow-md`}
          onClick={() => {
            setSelectedPaymentType(method.type)
            setSelectedPaymentMethodId(undefined)
          }}
        >
          <div className="mercoa-px-4 mercoa-py-5 mercoa-text-center sm:mercoa-p-6">
            <p className="mercoa-flex mercoa-gap-x-4 mercoa-items-center mercoa-justify-center mercoa-text-md mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
              <span
                className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
                  selectedPaymentType === method.type
                    ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
                    : 'mercoa-bg-gray-200 mercoa-text-gray-600'
                }`}
              >
                {method.icon}
              </span>
              {method.text}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
