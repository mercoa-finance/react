import { MercoaSession } from '@mercoa/react'
import '@mercoa/react/dist/style.css'
import { setupWorker } from 'msw/browser'
import { useEffect, useState } from 'react'
import { mockToken, mswHandlers } from '../mockData'
import '../styles/globals.css'
import { useRouter } from 'next/router'

export default function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()
  const pathname = router.pathname

  useEffect(() => {
    const worker = setupWorker(...mswHandlers)
    worker.start().then(() => {
      console.log('msw started')
      setIsLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!pathname.startsWith('/docs') && !pathname.startsWith('/guides-and-examples')) {
      console.log('redirecting to docs', `/docs${pathname}`, pathname)
      router.replace(`/docs${pathname}`)
    }
  }, [pathname])

  if (!isLoaded) return <></>
  return (
    <MercoaSession token={mockToken}>
      <Component {...pageProps} />
    </MercoaSession>
  )
}
