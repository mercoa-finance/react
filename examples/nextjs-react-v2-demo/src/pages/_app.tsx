import DashboardLayout from '@/components/DashboardLayout'
import { MercoaAuthProvider } from '@/components/MercoaAuth'
import '@/styles/globals.css'

import '@mercoa/react/dist/style.css'

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MercoaAuthProvider>
      <DashboardLayout>
        <Component {...pageProps} />
      </DashboardLayout>
    </MercoaAuthProvider>
  )
}
