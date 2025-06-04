## PayablesDashboard Customization & Part Updates (June 2024)

### Overview & Part Renames

Recent updates have introduced significant improvements and new features across payables and receivables components. Notably, several part names have changed to better reflect their capabilities:

- `<InvoiceInbox />` is now `<Payables />`
- `<InvoiceTable />` is now `<PayablesTable />`
- `<InvoiceDetails />` is now `<PayableDetails />`
- New components:
  - `<Receivables />`: Displays receivables for an entity.
  - `<ReceivableDetails />`: View and create receivable details.
  - `<GroupPayablesTable />`: Displays unassigned invoices at the group level.

For a full part reference, see the [React Part Documentation](https://react.mercoa.com/).

---

### New Feature: Custom Search Bar Support in PayablesDashboard

The `PayablesDashboard` part now supports injecting a custom search bar via the `renderCustom.searchBar` prop. This allows full control over the search input UI and logic within the dashboard.

#### `renderCustom.searchBar` Prop

- **Type:**
  ```ts
  searchBar?: (setSearch: (search: string) => void) => React.ReactNode
  ```
- **Description:**
  If provided, this function receives a `setSearch` callback (a function accepting a search string). Your function should return your custom search bar part. You are responsible for calling `setSearch` when the search input value changes.

#### Example Usage

```tsx
import { PayablesDashboard } from '@mercoa/react';
// Example custom search bar component
function MyCustomSearchBar({ onChange }: { onChange: (value: string) => void }) {
  return (
    <input
      type="search"
      placeholder="Search payables..."
      onChange={e => onChange(e.target.value)}
    />
  );
}

<PayablesDashboard
  renderCustom={{
    searchBar: (setSearch) => (
      <MyCustomSearchBar onChange={setSearch} />
    ),
  }}
  // ...other props
/>
```

If `renderCustom.searchBar` isn't provided, the dashboard falls back to the default search UI (`DebouncedSearch`).

---

### Type Definition Update

The `PayablesRenderCustom` type now includes the optional `searchBar` property:

```ts
export type PayablesRenderCustom = {
  searchBar?: (setSearch: (search: string) => void) => React.ReactNode;
  // ...other custom renderers
};
```

---

### SDK Import Change

If you are customizing advanced integrations, note that the `Mercoa` import has changed. Replace:
```ts
import { Mercoa } from '@mercoa/javascript';
```
with:
```ts
import { MercoaApi } from 'sdks/typescript';
```

---

### Migration & Compatibility Notes

**Part Renames & Usage**
- Update all part references:
  - `<InvoiceInbox />` → `<Payables />`
  - `<InvoiceTable />` → `<PayablesTable />`
  - `<InvoiceDetails />` → `<PayableDetails />`
- New components are available: `<Receivables />`, `<ReceivableDetails />`, `<GroupPayablesTable />`.

**Custom Search Bar**
- No breaking changes: The custom search bar is optional.
- To add a custom search bar, give the `searchBar` function in `renderCustom` as shown in the preceding section.

**Entity Creation & Required Props**
- When creating entities, the following fields are **required**:
  - `isPayor` (boolean): Set to `true` if the entity is a payor.
  - `isPayee` (boolean): Set to `true` if the entity is a payee (vendor).
  - `isCustomer` (boolean): Now required when creating entities (remains optional for updates).
- Be sure to update any entity creation logic to include these required fields.

**Invoice Metrics Filters**
- The `<InvoiceMetrics />` part now supports:
  - `excludePayables?: boolean`
  - `excludeReceivables?: boolean`
- **Defaults:** If neither filter nor any entity/invoice filter exists, `excludeReceivables` defaults to `true`.

**Other Compatibility Notes**
- The `paymentMethod` prop is now a discriminated union.
- The `fundedDate` property is now called `settlementDate`.
- The `ownedByOrg` entity property is now `isCustomer`.
- We've removed the `createdById` property from invoice objects.
- Approval policy triggers are now arrays, not single objects.

---

### More Part/Prop Notes

- **PayableOverview:** Now supports the `supportedSchedulePaymentDates` prop for payment date control.
- **PayableDetails & Counterparty:** Now support the `vendorCredits` and `counterpartyPreSubmit` props for more customization and validation.
- **PayableDetails:** Supports `batchPayment` via the `<PaymentOptions/>` sub-part.
- **PayableDetails:** Exposes new customization options for `<PayableForm />` and `<PayableDocument />`.
- **All Components:** The `onRedirect` prop is now renamed to `onUpdate` and is optional.
- **Headless Components:**
  - `<HeadlessInvoiceTable />` requires the `statuses` prop (`InvoiceStatus`).
  - `<HeadlessInvoice />` requires the `invoiceId` prop (`InvoiceId`).

---

For a full list of customization options and props, see the [PayablesDashboard documentation](https://react.mercoa.com/Payables/PayablesDashboard/).

If you are migrating to the latest version, ensure you update your part references and required props as outlined in the preceding section. The new `renderCustom.searchBar` prop is fully backward compatible and optional.