## PayablesRenderCustom Type and Custom Search Bar Support

The `PayablesDashboard` part now supports advanced customization via the `renderCustom` prop. This allows consumers to inject custom React parts into key areas of the dashboard, providing greater flexibility and integration with your app's UI.

### Type Definition: `PayablesRenderCustom`

The `PayablesRenderCustom` type now includes an optional `searchBar` property:

```ts
export type PayablesRenderCustom = {
  /**
   * Provide a custom search bar component for the Payables Dashboard.
   * Receives a setSearch callback to update the dashboard's search state.
   * If omitted, a default DebouncedSearch component will be used.
   */
  searchBar?: (setSearch: (search: string) => void) => React.ReactNode;
  // ...other optional customization points
};
```

### Customizing the Search Bar in PayablesDashboard

- Pass a `renderCustom` object as a prop to `PayablesDashboard`.
- If you give a `searchBar` property in `renderCustom`, your part replaces the default search bar.
- Your custom search bar receives a `setSearch` callback, which you should call with the new search string to update the dashboard state.
- If you don't give a custom `searchBar`, the dashboard renders its default `DebouncedSearch` part.

#### Usage Example

```tsx
import { PayablesDashboard } from '@mercoa/react';

const renderCustom = {
  searchBar: (setSearch) => (
    <input
      type="text"
      placeholder="Search payables..."
      onChange={e => setSearch(e.target.value)}
      style={{ padding: 8, width: 240 }}
    />
  ),
};

export default function MyPayablesPage() {
  return (
    <PayablesDashboard
      // ...other required props
      renderCustom={renderCustom}
    />
  );
}
```

- `searchBar` is optional: You only need to give this property to override the default search UI.
- Existing implementations of `PayablesDashboard` without the `renderCustom` or `searchBar` customization continue to work as before.
- Always use the provided `setSearch` function to update the search state so that the dashboard results update correctly.

### Note

- This customization applies only to the `PayablesDashboard` part and not to the earlier parts (`InvoiceInbox`, `InvoiceTable`, `InvoiceDetails`), which we renamed to `Payables`, `PayablesTable`, and `PayableDetails` respectively.
- For other customizable areas, refer to the full `PayablesRenderCustom` type definition in the source or API documentation.