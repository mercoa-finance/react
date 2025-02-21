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
