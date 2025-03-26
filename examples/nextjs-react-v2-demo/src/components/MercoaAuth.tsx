import { LoadingSpinner, MercoaSession } from '@mercoa/react'
import { ReactNode, useEffect, useState } from 'react'

export function MercoaAuthProvider({ children }: { children: ReactNode }) {
  const [mercoaToken, setMercoaToken] = useState<string>()

  useEffect(() => {
    fetch('/api/getMercoaToken')
      .then((res) => res.text())
      .then((data) => {
        setMercoaToken(data)
      })
  }, [])

  return mercoaToken ? <MercoaSession token={mercoaToken}>{children}</MercoaSession> : <LoadingSpinner />
}
