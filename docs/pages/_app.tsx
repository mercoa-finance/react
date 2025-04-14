import { MercoaSession } from '@mercoa/react'
import '@mercoa/react/dist/style.css'
import { setupWorker } from 'msw/browser'
import { useEffect, useState } from 'react'
import { mockToken, mswHandlers } from '../mockData'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    const worker = setupWorker(...mswHandlers)
    worker.start().then(() => {
      console.log('msw started')
      setIsLoaded(true)
    })
  }, [])
  if (!isLoaded) return <></>
  return (
    <MercoaSession token={mockToken}>
      <div style={{  }}>
        <Component {...pageProps} />
      </div>
    </MercoaSession>
  )
}
