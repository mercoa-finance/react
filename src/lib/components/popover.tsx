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
            'p-[0 !important] z-[2147483647] rounded-md outline-none data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade shadow-[0px_1px_2px_0px_rgba(0,0,0,0.18)]',
            'font-lato',
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
