import * as PopoverPrimitive from '@radix-ui/react-popover'

import { PopoverContent } from '@radix-ui/react-popover'
import { ComponentProps, FC, MutableRefObject, PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import { cn } from '../style'

export interface IPopoverProps {
  trigger: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor?: MutableRefObject<HTMLButtonElement | HTMLDivElement | null>
  align?: 'center' | 'start' | 'end'
  side?: 'bottom' | 'top' | 'right' | 'left'
}

export const Popover: FC<PropsWithChildren<IPopoverProps & ComponentProps<typeof PopoverContent>>> = ({
  anchor,
  trigger,
  open,
  align = 'start',
  side = 'bottom',
  onOpenChange,
  children,
  ...rest
}) => {
  const [anchorRef, setAnchorRef] = useState<MutableRefObject<HTMLButtonElement | HTMLDivElement | null> | undefined>(
    anchor,
  )

  useEffect(() => {
    if (!open) {
      setAnchorRef(anchor)
    }
  }, [anchor, open])

  return (
    <PopoverPrimitive.Root
      open={open}
      modal
      onOpenChange={(_open) => {
        onOpenChange(_open)
      }}
    >
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      {anchor && <PopoverPrimitive.PopoverAnchor virtualRef={anchorRef} />}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          autoFocus={false}
          align={align}
          side={side}
          {...rest}
          className={cn(
            'mercoa-p-[0 !important] mercoa-z-[2147483647] mercoa-rounded-md mercoa-outline-none mercoa-data-[state=open]:mercoa-data-[side=bottom]:mercoa-animate-slideUpAndFade mercoa-data-[state=open]:mercoa-data-[side=left]:mercoa-animate-slideRightAndFade mercoa-data-[state=open]:mercoa-data-[side=right]:mercoa-animate-slideLeftAndFade mercoa-data-[state=open]:mercoa-data-[side=top]:mercoa-animate-slideDownAndFade',
            'mercoa-font-lato',
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
