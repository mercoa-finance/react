import { Dispatch, FC, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceTableColumn, MercoaButton, Tooltip } from '../../../../../components'
import { Popover } from '../../../../../lib/components'
import { ColumnIcon } from '../../../assets/icons'

const allColumnsDefault: InvoiceTableColumn[] = [
  { title: 'Vendor Name', field: 'vendor', orderBy: Mercoa.InvoiceOrderByField.VendorName },
  { title: 'Invoice Number', field: 'invoiceNumber', orderBy: Mercoa.InvoiceOrderByField.InvoiceNumber },
  { title: 'Due Date', field: 'dueDate' },
  { title: 'Invoice Date', field: 'invoiceDate' },
  { title: 'Amount', field: 'amount', orderBy: Mercoa.InvoiceOrderByField.Amount },
  { title: 'Status', field: 'status' },
]

interface SelectedColumnsDropdownProps {
  selectedColumns: { title: string; field: string }[]
  setSelectedColumns: Dispatch<React.SetStateAction<InvoiceTableColumn[]>>
  handleToggleSelectedColumn: (field: string) => void

  allColumns?: InvoiceTableColumn[]
}

export const ColumnFilterDropdown: FC<SelectedColumnsDropdownProps> = ({
  allColumns,
  selectedColumns,
  handleToggleSelectedColumn,
  setSelectedColumns,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover
      onOpenAutoFocus={(e) => {
        e.preventDefault()
      }}
      sideOffset={5}
      alignOffset={10}
      open={open}
      align="end"
      onOpenChange={setOpen}
      trigger={
        <div>
          <Tooltip title="Filter columns">
            <MercoaButton
              onClick={() => {
                setOpen(true)
              }}
              isEmphasized={true}
              className="mercoa-h-[32px] mercoa-w-[32px] mercoa-rounded-full mercoa-flex mercoa-items-center mercoa-justify-center"
            >
              <div className="mercoa-stroke-[#FFF]">
                <ColumnIcon />
              </div>
            </MercoaButton>
          </Tooltip>
        </div>
      }
    >
      <div className="mercoa-flex mercoa-flex-col mercoa-relative mercoa-max-w-[calc(100vw-4rem)] mercoa-max-h-[calc(100vh-2rem)] mercoa-min-w-[12rem] mercoa-bg-white mercoa-text-[#1A1919] mercoa-shadow-[rgba(0,0,0,0.15)_1px_4px_8px_0px,rgba(0,0,0,0.1)_2px_12px_24px_0px,rgba(163,157,153,0.2)_0px_0px_0px_1px]">
        {(allColumns ?? allColumnsDefault).map((column) => (
          <div
            key={column.field}
            className="mercoa-text-[14px] mercoa-flex mercoa-items-center mercoa-h-[44px] mercoa-gap-[0.5rem] mercoa-px-[0.75rem] mercoa-py-[0.5rem] mercoa-text-left mercoa-text-[#1A1919] mercoa-cursor-pointer mercoa-no-underline hover:mercoa-bg-[#F4F2F0]"
          >
            <input
              type="checkbox" 
              className="mercoa-size-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text focus:mercoa-ring-transprent mercoa-cursor-pointer"
              checked={selectedColumns.some((col) => col.field === column.field)}
              onChange={(e) => {
                e.stopPropagation()
                handleToggleSelectedColumn(column.field)
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span 
              className="mercoa-text-[14px] mercoa-color-[#1A1919]"
              onClick={() => handleToggleSelectedColumn(column.field)}
            >{column.title}</span>
          </div>
        ))}
        <div className="mercoa-z-[100] mercoa-relative mercoa-flex mercoa-w-full mercoa-justify-end mercoa-items-center mercoa-gap-4 mercoa-cursor-pointer mercoa-py-[0.75rem] mercoa-px-[0.75rem] mercoa-bg-[#fcfbfa] mercoa-border-t mercoa-border-[#e9e5e2]">
          <p
            onClick={() => {
              setSelectedColumns(allColumns ?? allColumnsDefault)
            }}
            className="hover:mercoa-underline mercoa-whitespace-nowrap mercoa-text-[12px] mercoa-capitalize mercoa-color-[#1A1919]"
          >
            Reset
          </p>
        </div>
      </div>
    </Popover>
  )
}
