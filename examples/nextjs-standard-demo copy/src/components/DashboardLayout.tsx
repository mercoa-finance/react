import { Menu, Transition } from '@headlessui/react'
import {
  BanknotesIcon,
  Bars3BottomLeftIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { EntitySelector } from '@mercoa/react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, ReactNode } from 'react'

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

const homeNav = [{ name: 'Home', href: '/', icon: HomeIcon }]

const apNav = [
  { name: 'Bills', href: '/bills', icon: DocumentTextIcon },
  { name: 'Vendors', href: '/vendors', icon: BuildingOffice2Icon },
  { name: 'Approval Policies', href: '/approvals', icon: CheckCircleIcon },
  { name: 'Payment Methods', href: '/paymentmethods', icon: BanknotesIcon },
]

const arNav = [
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { pathname } = useRouter()

  return (
    <div>
      <Head>
        <title>Mercoa</title>
      </Head>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <img
              src="https://i0.wp.com/www.writefromscratch.com/wp-content/uploads/2018/12/demo-logo.png?ssl=1"
              className="h-8 w-auto m-auto"
              alt="Mercoa Demo"
            />
          </div>
          <nav className="flex flex-1 flex-col px-6 pb-4 mt-10">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {homeNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                      )}
                    >
                      <item.icon
                        className={classNames(
                          pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6',
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </ul>
              </li>
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  <div className="text-sm font-semibold leading-6 text-gray-500">Accounts Payable</div>
                  {apNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                      )}
                    >
                      <item.icon
                        className={classNames(
                          pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6',
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </ul>
              </li>
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  <div className="text-sm font-semibold leading-6 text-gray-500">Accounts Receivable</div>
                  {arNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                      )}
                    >
                      <item.icon
                        className={classNames(
                          pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6',
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Bar */}
        <div className={`sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow relative`}>
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 justify-between px-4 items-center">
            <div className="flex flex-1" />

            {/* Choose Entity in Entity Group */}
            <EntitySelector allowClear />

            <div className="ml-4 flex items-center md:ml-6">
              <div className="" />
              {/* Profile dropdown */}
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none">
                    <span className="sr-only">Open user menu</span>
                    <UserCircleIcon className="w-5 h-5" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      <span className={classNames('block px-4 py-2 text-sm text-gray-700')}>Your Profile</span>
                    </Menu.Item>
                    <hr />
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
        <main className="flex-1">
          <div className="mx-auto px-4 sm:px-6 md:px-8 mt-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
