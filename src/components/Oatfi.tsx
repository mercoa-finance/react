import * as Slider from '@radix-ui/react-slider'
import accounting from 'accounting'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { MercoaApi as Mercoa } from 'sdks/typescript'
import { currencyCodeToSymbol } from '../lib/currency'

export const FinanceWithOatfi: React.FC<{
  paymentMethods: Mercoa.PaymentMethodResponse[]
  setShowBNPL: (val: boolean) => void
}> = ({ paymentMethods, setShowBNPL }) => {
  const { watch } = useFormContext()
  const paymentId = watch('paymentSourceId')
  const amount = watch('amount')
  const cleanAmount = amount?.toString()?.replace(/,/g, '') // Remove commas
  const afterScheduledStatus = [
    Mercoa.InvoiceStatus.Pending,
    Mercoa.InvoiceStatus.Paid,
    Mercoa.InvoiceStatus.Canceled,
    Mercoa.InvoiceStatus.Archived,
    Mercoa.InvoiceStatus.Refused,
  ]
  const afterApprovedStatus = [...afterScheduledStatus, Mercoa.InvoiceStatus.Scheduled]
  const [currentSelectedRepaymentSchedule, setRepaymentSchedule] = useState(30)
  const status = watch('status')
  const readOnly = afterApprovedStatus.includes(status)

  const sliderValue =
    {
      0: 0,
      30: 33.33,
      60: 66.66,
      90: 99.99,
    }[currentSelectedRepaymentSchedule] ?? 30

  const handleSliderChange = (val: number[]) => {
    const sliderPosition = val[0]

    if (sliderPosition === 0) {
      setShowBNPL(false)
      return
    }

    if (sliderPosition <= 33.33) {
      setRepaymentSchedule(30)
    } else if (sliderPosition === 66.66) {
      setRepaymentSchedule(60)
    } else if (sliderPosition === 99.99) {
      setRepaymentSchedule(90)
    } else {
      setRepaymentSchedule(90)
    }
  }

  const getFee = (days: number) => {
    switch (days) {
      case 30:
        return { fee: (amount ? cleanAmount * 0.01 : 0) as number, percentage: '1.0%' }
      case 60:
        return { fee: (amount ? cleanAmount * 0.02 : 0) as number, percentage: '2.0%' }
      case 90:
        return { fee: (amount ? cleanAmount * 0.03 : 0) as number, percentage: '3.0%' }
      default:
        return { fee: 0 as number, percentage: '0%' }
    }
  }

  const selectedPaymentMethod = paymentMethods.find((ele) => ele.id === paymentId)
  const account = selectedPaymentMethod as Mercoa.PaymentMethodResponse.BankAccount
  const paymentDate = dayjs().add(currentSelectedRepaymentSchedule, 'day').format('D MMM, YYYY')
  const deductionDate = watch('deductionDate')

  return (
    <div className="mercoa-w-full mercoa-p-4 mercoa-bg-white mercoa-rounded-md mercoa-my-4 mercoa-border mercoa-border-solid">
      <>
        <p className="mercoa-text-gray-700 mercoa-text-sm">
          When do you want to repay the bill amount,{' '}
          {accounting.formatMoney(watch('amount'), currencyCodeToSymbol(watch('currencyCode')))}?
        </p>

        <div className="mercoa-mt-4">
          <div className="mercoa-w-full mercoa-flex mercoa-justify-center">
            <div className="mercoa-w-full">
              {/* Pass the sliderValue and onValueChange */}
              <SliderDemo val={sliderValue} onValueChange={handleSliderChange} />
            </div>
          </div>
          <div className="mercoa-flex mercoa-justify-between mercoa-items-start mercoa-text-sm mercoa-relative">
            <div className="mercoa-text-left mercoa-cursor-pointer mercoa-flex mercoa-flex-col mercoa-z-20 mercoa-text-gray-600 mercoa-font-semibold w-[25%]">
              <p className="mercoa-text-left">{dayjs(deductionDate).format('D MMM YYYY')}</p>
              <p className="mercoa-text-left">Scheduled Date</p>
            </div>
            <div
              className={`mercoa-cursor-pointer mercoa-flex mercoa-flex-col mercoa-items-center w-[25%]  mercoa-translate-x-[-10px] ${
                currentSelectedRepaymentSchedule === 30
                  ? 'mercoa-text-gray-800 mercoa-font-semibold'
                  : 'mercoa-text-gray-400 mercoa-font-semibold'
              }`}
              onClick={() => handleSliderChange([33.33])}
            >
              <p>30 Days</p>
              <p>${getFee(30).fee.toFixed(2)} (1.0%) </p>
              <p>fee</p>
            </div>

            <div
              className={`mercoa-cursor-pointer mercoa-flex mercoa-flex-col mercoa-items-center w-[25%] mercoa-translate-x-[20px] ${
                currentSelectedRepaymentSchedule === 60
                  ? 'mercoa-text-gray-800 mercoa-font-semibold'
                  : 'mercoa-text-gray-400 mercoa-font-semibold'
              }`}
              onClick={() => handleSliderChange([66.66])}
            >
              <p>60 Days</p>
              <p>${getFee(60).fee.toFixed(2)} (2.0%)</p>
              <p>fee</p>
            </div>

            <div
              className={`mercoa-cursor-pointer mercoa-flex mercoa-flex-col mercoa-text-right w-[25%] ${
                currentSelectedRepaymentSchedule === 90
                  ? 'mercoa-text-gray-800 mercoa-font-semibold'
                  : 'mercoa-text-gray-400 mercoa-font-semibold'
              }`}
              onClick={() => handleSliderChange([99.99])}
            >
              <p>90 Days</p>
              <p>${getFee(90).fee.toFixed(2)} (3.0%)</p>
              <p>fee</p>
            </div>
          </div>
        </div>
      </>

      <div className={`mt-4 mercoa-bg-gray-100 mercoa-p-4 mercoa-rounded-md`}>
        <p className="mercoa-text-gray-700 mercoa-text-sm">
          Mercoa will charge {account.accountType.toLocaleLowerCase()} (•••• {account.accountNumber.slice(-4)}) on{' '}
          {paymentDate} for {accounting.formatMoney(watch('amount'), currencyCodeToSymbol(watch('currencyCode')))}{' '}
          Principal + ${getFee(currentSelectedRepaymentSchedule).fee.toFixed(2)} Fee
        </p>
      </div>
    </div>
  )
}

function SliderDemo({ val, onValueChange }: { val: number; onValueChange: (val: number[]) => void }) {
  return (
    <form>
      <Slider.Root
        className="mercoa-relative mercoa-flex mercoa-items-center mercoa-select-none mercoa-touch-none mercoa-w-full mercoa-h-5"
        value={[val + 3]}
        onValueChange={onValueChange}
        max={100}
        min={0}
        step={33.33}
      >
        <Slider.Track className="mercoa-bg-gray-500 mercoa-relative mercoa-grow mercoa-h-[9px]">
          <Slider.Range className="mercoa-absolute mercoa-bg-mercoa-primary-light mercoa-rounded-full mercoa-h-full" />
        </Slider.Track>
        <Slider.Thumb aria-label="Custom Slider">
          <div className="mercoa-bg-white mercoa-flex mercoa-items-center mercoa-justify-center mercoa-w-[20px] mercoa-h-[20px] mercoa-rounded-full mercoa-border-[1.5px] mercoa-border-mercoa-primary-light">
            <div className="mercoa-w-[12px] mercoa-h-[12px] mercoa-rounded-full mercoa-bg-mercoa-primary-light"></div>
          </div>
        </Slider.Thumb>
      </Slider.Root>
    </form>
  )
}
