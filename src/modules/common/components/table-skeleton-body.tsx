import { Table } from '@tanstack/react-table'
import { SkeletonLoader } from '../../../lib/components'

export const TableSkeletonBody: React.FC<{ table: Table<any> }> = ({ table }) => {
  const headers = table.getFlatHeaders()

  return (
    <tbody>
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="mercoa-border-b mercoa-border-gray-200">
          {headers.map((header, headerIndex) => (
            <td
              key={header.id}
              className="mercoa-whitespace-nowrap mercoa-border-r mercoa-px-4 mercoa-text-gray-800 mercoa-text-sm last:mercoa-border-r-0 mercoa-h-[48px]"
            >
              <SkeletonLoader width={`${header.getSize()}px`} height={'30px'} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
