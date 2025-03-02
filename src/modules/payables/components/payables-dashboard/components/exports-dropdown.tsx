import { MercoaButton, Tooltip } from '../../../../../components/generics'
import { ExportIcon } from '../../../../common/assets/icons'

export const ExportsDropdown = () => {
  return (
    <Tooltip title="Export">
      <MercoaButton
        isEmphasized={true}
        className="mercoa-h-[32px] mercoa-w-[32px] mercoa-rounded-full mercoa-flex mercoa-items-center mercoa-justify-center"
      >
        <div className="mercoa-stroke-[#FFF]">
          <ExportIcon />
        </div>
      </MercoaButton>
    </Tooltip>
  )
}
