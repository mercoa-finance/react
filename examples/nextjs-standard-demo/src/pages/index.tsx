import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <div className="mt-10 max-w-2xl m-auto text-gray-800 space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">Mercoa example app with Next.js and Tailwind</h1>
      <h1 className="text-lg font-semibold text-red-800">
        The MERCOA_API_KEY and (MERCOA_ENTITY_ID or MERCOA_ENTITY_GROUP_ID) env variables need to be set for this
        example app to work!
      </h1>
      <p>This is an example app that uses Mercoa React Components. It is built with Next.js and Tailwind CSS.</p>
      <p>Here are a few things to note:</p>
      <ul className="space-y-3 list-disc list-outside">
        <li>
          All pages are wrapped in a <pre className="inline">MercoaSession</pre> context provider. This provides all
          Mercoa components with session information like the current user and the current organization.
        </li>
        {/* <li>
          Some pages, like the{' '}
          <a href="/approvals" className="underline text-blue-700">
            approval rules builder
          </a>
          , use out-of-the-box Mercoa components with zero customization. Mercoa automatically styles these components
          with your organization's colors.
        </li>
        <li>
          Other pages like the{' '}
          <a href="/bills" className="underline text-blue-700">
            Bills
          </a>{' '}
          page are a mix pre-styled Mercoa components, Mercoa components customized with props, and fully custom
          components using hooks and data from Mercoa helper components.
        </li> */}
        <li>
          The complete Mercoa component library is available at{' '}
          <a href="https://react.mercoa.com" className="underline text-blue-700">
            react.mercoa.com
          </a>
          .
        </li>
      </ul>
    </div>
  )
}
