// First import the base tailwind.css file
// If you are already using tailwind in your project, you can skip this step
import '@mercoa/react/dist/tailwind.base.css'

// Import the Mercoa styles after the base tailwind.css file
import '@mercoa/react/dist/style.css'

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
