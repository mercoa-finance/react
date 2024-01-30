import { MercoaClient } from '@mercoa/javascript'
import { MercoaSession } from '@mercoa/react'

export async function getServerSideProps() {
  // This is your Mercoa API Key
  const apiKey = process.env.MERCOA_API_KEY
  const entityId = process.env.MERCOA_ENTITY_ID

  if (!apiKey || !entityId) {
    return {
      props: {
        token: '',
      },
    }
  }

  const mercoa = new MercoaClient({
    token: apiKey,
  })

  console.log({ apiKey, entityId })

  const entities = await mercoa.entity.find()

  console.log({ entities: entities.data.map((e) => e.id) })

  const token = await mercoa.entity.getToken(entityId, {
    // Optional iFrame Options
    // See: https://mercoa.com/dashboard/developers#iframe
    pages: {
      paymentMethods: true,
    },
  })

  console.log(token)

  return {
    props: {
      token: token,
    },
  }
}

export default function Home({ token }: { token?: string }) {
  return (
    <main className="flex flex-col items-center gap-y-2 pt-5">
      <h1 className="text-xl font-bold hover:text-gray-700">Mercoa Next.js Example</h1>

      <div className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 mr-2 whitespace-nowrap py-4 px-1 text-sm font-medium sm:mr-0 sm:border-b-2">
        hello
      </div>
      {token}
      {token ? (
        <MercoaSession token={token} />
      ) : (
        <p className="text-lg">
          Please set your Mercoa API Key in the MERCOA_API_KEY environment variable and an EntityId in the
          MERCOA_ENTITY_ID environment variable.
        </p>
      )}
    </main>
  )
}
