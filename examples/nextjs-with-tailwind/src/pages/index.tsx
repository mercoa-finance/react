import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <div className="mt-10">
      <h1>Mercoa example app with Next.js and Tailwind</h1>
      <Link href="/bills" className="text-blue-500 hover:text-blue-800">
        Mercoa Invoice Table Page
      </Link>
    </div>
  )
}
