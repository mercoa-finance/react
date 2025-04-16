import { XMarkIcon } from '@heroicons/react/24/outline'
import { ReactNode, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ButtonLoadingSpinner, MercoaButton } from '../../../../../../components'
import { PayableFormAction } from '../../constants'

export function PayablesInlineForm({
  name,
  formAction,
  addNewButton,
  form,
}: {
  name: string
  formAction: string
  addNewButton: ReactNode
  form: ReactNode
}) {
  const [open, setOpen] = useState(false)

  const { setValue, watch } = useFormContext()

  const status = watch('formAction')

  useEffect(() => {
    if (status === PayableFormAction.CLOSE_INLINE_FORM) {
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
              className="mercoa-mt-2 mercoa-whitespace-nowrap"
              isEmphasized
              onClick={() => {
                setValue('formAction', formAction)
              }}
              disabled={status === formAction}
            >
              <ButtonLoadingSpinner isLoading={status === formAction}>Add {name}</ButtonLoadingSpinner>
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
