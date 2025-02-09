import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ComponentProps, FC, PropsWithChildren, ReactNode } from 'react'
import { cn } from '../style'

export interface IDialogProps {
  trigger?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  isBackgroundHidden?: boolean
  source?: string
}

export const Dialog: FC<PropsWithChildren<IDialogProps & ComponentProps<typeof DialogPrimitive.Content>>> = ({
  trigger,
  open,
  onOpenChange,
  isBackgroundHidden,
  children,
  ...rest
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'mercoa-bg-black mercoa-bg-opacity-50 mercoa-data-[state=open]:mercoa-animate-overlayShow mercoa-fixed mercoa-inset-0 mercoa-z-[2147483499]',
            isBackgroundHidden && 'mercoa-bg-opacity-100',
          )}
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => event.preventDefault()}
          autoFocus={false}
          {...rest}
          className="mercoa-data-[state=open]:mercoa-animate-contentShow mercoa-fixed mercoa-top-[50%] mercoa-left-[50%] mercoa-translate-x-[-50%] mercoa-translate-y-[-50%] mercoa-rounded-[8px] mercoa-bg-white mercoa-shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] mercoa-focus:mercoa-outline-none mercoa-font-lato mercoa-z-[2147483499]"
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
