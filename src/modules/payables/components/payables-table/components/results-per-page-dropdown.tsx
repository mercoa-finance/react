import { FC, useState } from 'react'
import { Popover } from '../../../../../lib/components'

interface ResultsPerPageDropdownProps {
  resultsPerPage: number
  setResultsPerPage: (value: number) => void
}

export const ResultsPerPageDropdown: FC<ResultsPerPageDropdownProps> = ({ resultsPerPage, setResultsPerPage }) => {
  const [open, setOpen] = useState(false)
  const options = [10, 20, 50, 100]

  return (
    <div className="mercoa-flex mercoa-gap-4 mercoa-items-center">
      <Popover
        open={open}
        onOpenChange={setOpen}
        sideOffset={5}
        trigger={
          <button
            className="mercoa-rounded-mercoa  mercoa-flex mercoa-items-center mercoa-text-[14px] mercoa-px-4 mercoa-py-2 mercoa-bg-white mercoa-border"
            onClick={() => setOpen(true)}
          >
            {resultsPerPage}
            <svg
              className="mercoa-ml-2 mercoa-h-4 mercoa-w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        }
      >
        <div className="mercoa-rounded-mercoa  mercoa-flex mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-max-h-[calc(100vh-2rem)] mercoa-min-w-[12rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
          {options.map((option) => (
            <div
              key={option}
              className="mercoa-justify-between mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
              onClick={() => {
                setResultsPerPage(option)
                setOpen(false) // Close the dropdown after selection
              }}
            >
              <span>{option}</span>
              {resultsPerPage === option && (
                <svg
                  className="mercoa-h-4 mercoa-w-4 mercoa-text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </Popover>
      <div className="mercoa-text-[14px]"> Results per page</div>
    </div>
  )
}
