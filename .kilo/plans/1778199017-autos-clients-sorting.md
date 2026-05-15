# Add Header Column Sorting to Autos and Clients

## Goal
Bring autos and clients (renters) tables in line with reservations by enabling click-to-sort on column headers.

## Current State

| Feature | Reservations | Autos | Clients (Renters) |
|---------|-------------|-------|-------------------|
| Controlled sorting state | ✅ `useState` | ✅ `useState` | ❌ `initialState` only |
| Header click sorting | ✅ `enableHeaderSorting` | ❌ not passed | ❌ not passed |
| Toolbar sort dropdown | ❌ | ✅ `sortableColumns` | ❌ no toolbar |
| `getFilteredRowModel` | ✅ | ✅ | ❌ |
| Actions column explicitly non-sortable | ✅ `enableSorting: false` | ❌ implicit | ❌ implicit |

## Plan

### Autos

The autos table already has controlled sorting and `getSortedRowModel`, but uses a toolbar dropdown instead of clickable headers. It also lists `nextReservation` as sortable even though that column is a `display` type with no accessor (sorting currently has no effect).

**Changes:**

1. **`src/features/autos/autos-table.tsx`**
   - Pass `enableHeaderSorting` to `<DataTable>`.
   - Remove `sortableColumns` from `<DataTableToolbar>` (header clicks replace the dropdown; keeps UI consistent with reservations).

2. **`src/features/autos/autos-columns.tsx`**
   - Convert `nextReservation` from `display` to `accessor` with a custom accessor that returns the next reservation's `startDate` string (or `''`). This makes the column actually sortable by date.
   - Update the `cell` to read the date from `getValue()` instead of recomputing from `row.original`.
   - Add `enableSorting: false` to the `actions` column for explicitness.

### Clients (Renters)

The renters table has `getSortedRowModel` and an `initialState` default sort, but no controlled state and no UI to trigger sorting.

**Changes:**

1. **`src/features/renters/renters-table.tsx`**
   - Replace `initialState` with controlled `sorting` state (`useState<SortingState>`) and `onSortingChange`.
   - Import and add `getFilteredRowModel` (needed for the search toolbar; also brings it in line with the other two tables).
   - Add `<DataTableToolbar>` with `searchKey="name"` and `searchPlaceholder="Search by name..."`.
   - Pass `enableHeaderSorting` to `<DataTable>`.

2. **`src/features/renters/renters-columns.tsx`**
   - Add `enableSorting: false` to the `actions` column.
   - Add `enableSorting: false` to the `details` column (it returns an object `{ type, res }`, so default sorting is meaningless).

## Files to Modify

1. `src/features/autos/autos-table.tsx`
2. `src/features/autos/autos-columns.tsx`
3. `src/features/renters/renters-table.tsx`
4. `src/features/renters/renters-columns.tsx`

## Detailed Changes

### File 1: `src/features/autos/autos-table.tsx`

```typescript
// In DataTableToolbar: remove sortableColumns prop
<DataTableToolbar
  table={table}
  searchKey="vehicle"
  searchPlaceholder="Search by auto name, color, or license plate"
  filterableColumns={[...]}
/>

// In DataTable: add enableHeaderSorting
<DataTable
  table={table}
  columns={columns}
  emptyMessage="No vehicles found."
  enableHeaderSorting
/>
```

Also remove the `sortableColumns` array definition at the top of the file.

### File 2: `src/features/autos/autos-columns.tsx`

Convert `nextReservation` from `display` to `accessor`:

```typescript
columnHelper.accessor((auto) => {
  const today = new Date();
  const nextRes = reservations
    .filter(r => r.autoId === auto.id)
    .filter(r => r.status !== 'cancelled' && isAfter(parseISO(r.startDate), today))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  return nextRes ? nextRes.startDate : '';
}, {
  id: 'nextReservation',
  header: 'Next Reservation',
  cell: ({ getValue }) => {
    const startDate = getValue();
    if (!startDate) {
      return <span className="text-muted-foreground">None</span>;
    }
    const dateStr = format(parseISO(startDate), 'MMM d, yyyy');
    return (
      <button
        type="button"
        className="text-left hover:underline text-sm"
        onClick={(e) => {
          e.stopPropagation();
          // Find the reservation object to pass to onReservationClick
          // (or pass startDate and let the parent resolve)
        }}
      >
        {dateStr}
      </button>
    );
  },
}),
```

**Note:** The `onReservationClick` callback currently expects a `Reservation` object. After converting to accessor, the cell only has the date string. Two options:
- **Option A (recommended):** Keep the reservation lookup inside the cell using `row.original` and the `reservations` array (still in closure scope).
- **Option B:** Change `onReservationClick` to accept a reservation ID and look it up in the parent.

Option A is minimal — the `cell` function can still reference `reservations` from the outer scope to find the full reservation object by matching the startDate.

Also add to `actions`:
```typescript
columnHelper.display({
  id: 'actions',
  header: () => <span className="ml-auto">Actions</span>,
  enableSorting: false,
  cell: ({ row }) => (
    <div className="ml-auto">
      <AutosRowActions auto={row.original} />
    </div>
  ),
}),
```

### File 3: `src/features/renters/renters-table.tsx`

```typescript
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { DataTableToolbar } from '@/components/data-table/toolbar';

export function RentersTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  // ... existing hooks ...

  const table = useReactTable({
    data: renters,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey="name"
        searchPlaceholder="Search by name..."
      />
      <DataTable
        table={table}
        columns={columns}
        emptyMessage="No clients found."
        onRowClick={(renter) => openMutateSheet('view', renter)}
        enableHeaderSorting
      />
    </div>
  );
}
```

### File 4: `src/features/renters/renters-columns.tsx`

```typescript
// Details column — disable sorting
columnHelper.accessor((renter) => { ... }, {
  id: 'details',
  header: () => <span className="text-foreground">{t('label.details')}</span>,
  enableSorting: false,
  cell: ({ getValue }) => { ... },
}),

// Actions column — disable sorting
columnHelper.display({
  id: 'actions',
  header: () => <div className="text-right">{t('label.actions')}</div>,
  enableSorting: false,
  cell: ({ row }) => <div className="text-right"><RentersRowActions renter={row.original} /></div>,
}),
```

## Testing Checklist

- [ ] Autos table: clicking Status header cycles through asc → desc → unsorted
- [ ] Autos table: clicking Name header cycles through asc → desc → unsorted
- [ ] Autos table: clicking Color header cycles through asc → desc → unsorted
- [ ] Autos table: clicking Next Reservation header sorts by date chronologically
- [ ] Autos table: Actions column header is not clickable
- [ ] Autos table: toolbar no longer shows a sort dropdown
- [ ] Clients table: clicking Name header cycles through asc → desc → unsorted
- [ ] Clients table: clicking Phone header cycles through asc → desc → unsorted
- [ ] Clients table: Details column header is not clickable
- [ ] Clients table: Actions column header is not clickable
- [ ] Clients table: toolbar search filters by name
- [ ] Default sorts preserved: autos by `status` asc, clients by `name` asc

## Implementation Status: PENDING
