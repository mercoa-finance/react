import { FC } from 'react'

interface PaginationProps {
  isNextDisabled: boolean
  isPrevDisabled: boolean
  goToNextPage: () => void
  goToPrevPage: () => void
}

export const Pagination: FC<PaginationProps> = ({ isNextDisabled, isPrevDisabled, goToNextPage, goToPrevPage }) => {
  return (
    <div className="mercoa-flex mercoa-space-x-4">
      <button
        onClick={goToPrevPage}
        disabled={isPrevDisabled}
        className={`mercoa-px-4 mercoa-text-[14px] mercoa-py-2 mercoa-rounded-mercoa ${
          isPrevDisabled
            ? 'mercoa-border-mercoa-primary-border mercoa-bg-mercoa-primary-background mercoa-text-mercoa-primary-text-disabled mercoa-opacity-50'
            : 'mercoa-border-mercoa-primary-border mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
        }`}
      >
        Previous
      </button>
      <button
        onClick={goToNextPage}
        disabled={isNextDisabled}
        className={`mercoa-px-4 mercoa-text-[14px] mercoa-py-2 mercoa-rounded-mercoa ${
          isNextDisabled
            ? 'mercoa-border-mercoa-primary-border mercoa-bg-mercoa-primary-background mercoa-text-mercoa-primary-text-disabled mercoa-opacity-50'
            : 'mercoa-border-mercoa-primary-border mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
        }`}
      >
        Next
      </button>
    </div>
  )
}
