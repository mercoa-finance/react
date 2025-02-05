import classNames from 'classnames'
import React from 'react'

export type SkeletonLoaderProps = {
  height: string
  width: string
  scale?: boolean
  className?: string
  children?: React.ReactNode
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ height, width, scale = true, className, children }) => {
  const scaledWidth = () => {
    const actualWidth = Number(width.replace(/\D/g, ''))
    if (!scale) {
      return actualWidth
    }
    if (actualWidth < 400) {
      return actualWidth
    }
    return (actualWidth / 1440) * (window.innerWidth - 100)
  }

  return (
    <div
      className={classNames('mercoa-bg-black mercoa-animate-animatedBackground', className)}
      style={{
        height,
        width: `${scaledWidth()}px`,
      }}
    >
      {children}
    </div>
  )
}
