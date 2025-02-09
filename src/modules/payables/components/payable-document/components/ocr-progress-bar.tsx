import { useEffect, useState } from 'react'

export function OcrProgressBar({ ocrProcessing }: { ocrProcessing: boolean }) {
  const [progressPercentage, setProgressPercentage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressPercentage((prevProgressPercentage) => {
        if (prevProgressPercentage === 100) {
          return 0
        } else {
          return prevProgressPercentage + 1
        }
      })
    }, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`mercoa-text-center ${ocrProcessing ? 'mercoa-block mercoa-mb-5' : 'mercoa-hidden'}`}>
      <span className="mercoa-text-gray-800 mercoa-w-full"> Extracting Invoice Details </span>
      <div className="mercoa-h-2 mercoa-w-full mercoa-bg-gray-300">
        <div
          style={{ width: `${progressPercentage}%` }}
          className={`mercoa-rounded-sm mercoa-h-full mercoa-bg-mercoa-primary`}
        ></div>
      </div>
    </div>
  )
}
