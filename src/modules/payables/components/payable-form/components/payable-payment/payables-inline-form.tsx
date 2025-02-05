import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { MercoaButton } from '../../../../../../components'

export function PayablesInlineForm({
  name,
  formAction,
  addNewButton,
  form,
}: {
  name: string
  formAction: string
  addNewButton: JSX.Element
  form: JSX.Element
}) {
  const [open, setOpen] = useState(false)

  const { setValue, watch } = useFormContext()

  const status = watch('formAction')

  useEffect(() => {
    if (status === 'CLOSE_INLINE_FORM') {
      setOpen(false)
    }
  }, [status])

  return (
    <div className={'mercoa-bg-gray-100 mercoa-rounded-mercoa mercoa-border-gray-200'}>
      {open ? (
        <>
          <div className="mercoa-flex mercoa-flex-row-reverse -mercoa-mb-2">
            <MercoaButton
              isEmphasized={false}
              color="gray"
              type="button"
              size="sm"
              hideOutline
              onClick={() => {
                setOpen(false)
              }}
            >
              <span className="mercoa-sr-only">Close</span>
              <XMarkIcon className="mercoa-size-5" aria-hidden="true" />
            </MercoaButton>
          </div>
          <div className={'mercoa-px-2 mercoa-pb-2'}>
            {form}
            <MercoaButton
              size="md"
              className="mercoa-mt-2"
              isEmphasized
              onClick={() => {
                setValue('formAction', formAction)
              }}
            >
              <div className="mercoa-w-[130px] mercoa-h-6 mercoa-flex mercoa-items-center mercoa-justify-center">
                {status === formAction ? (
                  <div className="mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-white" />
                ) : (
                  `Add ${name}`
                )}
              </div>
            </MercoaButton>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mercoa-w-full">
          {addNewButton}
        </button>
      )}
    </div>
  )
}
