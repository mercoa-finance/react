import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { Big } from 'big.js'
import { usePayableDetailsContext } from '../../../../../../components'

export function LineItemOptions() {
  const { updateTotalAmount, formMethods, lineItems } = usePayableDetailsContext()
  const { setValue } = formMethods

  //doubt: why it it setting lineItems to an empty array?
  function collapseLineItems() {
    let amount = new Big(0)
    lineItems?.forEach((lineItem, index) => {
      amount = amount.add(Number(lineItem.amount))
    })
    setValue('lineItems', [])
    setTimeout(() => {
      setValue(
        'lineItems',
        [
          {
            amount: amount.toNumber(),
            quantity: 1,
            unitPrice: amount.toNumber(),
            category: 'EXPENSE',
            description: lineItems[0].description,
            currency: lineItems[0].currency ?? 'USD',
            metadata: lineItems[0].metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { shouldDirty: true, shouldTouch: true },
      )
    }, 10)
  }

  return (
    <Menu as="div" className="mercoa-relative mercoa-inline-block mercoa-text-left">
      <div>
        <Menu.Button className="mercoa-inline-flex mercoa-w-full mercoa-justify-center mercoa-bg-gray-100 hover:mercoa-bg-gray-200 mercoa-rounded-full mercoa-p-1.5">
          <EllipsisVerticalIcon className="mercoa-size-5" aria-hidden="true" />
          <span className="mercoa-sr-only">More options</span>
        </Menu.Button>
      </div>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="mercoa-absolute mercoa-right-0 mercoa-z-10 mercoa-mt-2 mercoa-w-64 mercoa-origin-top-right mercoa-rounded-mercoa mercoa-bg-white mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none">
          <div className="mercoa-py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  onClick={() => {
                    if (confirm('Are you sure you want to collapse all line items into a single item?')) {
                      collapseLineItems()
                    }
                  }}
                  className={`${
                    active ? 'mercoa-bg-gray-100 mercoa-text-gray-900' : 'mercoa-text-gray-700'
                  } mercoa-block mercoa-px-4 mercoa-py-2 mercoa-text-sm`}
                >
                  Collapse line items
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
