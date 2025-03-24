import { FC } from 'react'

interface EntriesInfoProps {
  currentPage: number
  resultsPerPage: number
  totalEntries: number
}

export const EntriesInfo: FC<EntriesInfoProps> = ({ currentPage, resultsPerPage, totalEntries }) => {
  const startEntry = totalEntries ? (currentPage - 1) * resultsPerPage + 1 : 0
  const endEntry = Math.min(currentPage * resultsPerPage, totalEntries)

  return (
    <div className="mercoa-text-[#717171] mercoa-text-[14px]">
      {`Showing ${startEntry} - ${endEntry} of ${totalEntries} entries`}
    </div>
  )
}
