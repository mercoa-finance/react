import { FC } from 'react'

interface ResultsInfoProps {
  currentPage: number
  resultsPerPage: number
  totalEntries: number
}

export const ResultsInfo: FC<ResultsInfoProps> = ({ currentPage, resultsPerPage, totalEntries }) => {
  const startEntry = totalEntries ? (currentPage - 1) * resultsPerPage + 1 : 0
  const endEntry = Math.min(currentPage * resultsPerPage, totalEntries)

  return (
    <div className="mercoa-text-[#717171] mercoa-text-[14px]">
      {`Showing ${startEntry} - ${endEntry} of ${totalEntries} results`}
    </div>
  )
}
