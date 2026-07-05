import type { Meta, StoryObj } from '@storybook/react';
import { QueryTable } from '../table/QueryTable';
import { DuckDBDecorator } from '../.storybook/DuckDBDecorator';

// created_at values are JS Date objects so apache-arrow infers a Timestamp<MILLISECOND>
// column, which DuckDB ingests as TIMESTAMP (reproduces reading a timestamp from parquet).
const SAMPLE_DATA = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 32, status: 'active', created_at: new Date('2024-01-15T09:24:11Z') },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 28, status: 'active', created_at: new Date('2024-02-20T14:05:47Z') },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 45, status: 'inactive', created_at: new Date('2024-03-10T23:59:02Z') },
  { id: 4, name: 'Diana', email: 'diana@example.com', age: 37, status: 'active', created_at: new Date('2024-04-05T06:12:38Z') },
  { id: 5, name: 'Eve', email: 'eve@example.com', age: 24, status: 'pending', created_at: new Date('2024-05-12T18:44:20Z') },
  { id: 6, name: 'Frank', email: 'frank@example.com', age: 52, status: 'active', created_at: new Date('2024-06-18T11:31:56Z') },
  { id: 7, name: 'Grace', email: 'grace@example.com', age: 29, status: 'inactive', created_at: new Date('2024-07-22T02:07:14Z') },
  { id: 8, name: 'Hank', email: 'hank@example.com', age: 41, status: 'active', created_at: new Date('2024-08-30T16:50:33Z') },
  { id: 9, name: 'Ivy', email: 'ivy@example.com', age: 33, status: 'pending', created_at: new Date('2024-09-14T20:18:09Z') },
  { id: 10, name: 'Jack', email: 'jack@example.com', age: 27, status: 'active', created_at: new Date('2024-10-01T08:03:41Z') },
];

const ORDERS_DATA = Array.from({ length: 100 }, (_, i) => ({
  order_id: i + 1,
  customer: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
  product: ['Widget', 'Gadget', 'Doohickey', 'Thingamajig'][i % 4],
  quantity: Math.floor(Math.random() * 20) + 1,
  price: +(Math.random() * 100).toFixed(2),
  total: +(Math.random() * 2000).toFixed(2),
  status: ['shipped', 'pending', 'delivered', 'cancelled'][i % 4],
  date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
}));

// Generated natively in DuckDB via range() rather than a 1M-element JS array — no
// giant Arrow round-trip. Passed as a SQL string, which QueryTable resolves as a query.
const MILLION_ROWS_SQL = `
  SELECT
    i AS order_id,
    ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][(i % 5) + 1] AS customer,
    ['Widget', 'Gadget', 'Doohickey', 'Thingamajig'][(i % 4) + 1] AS product,
    (i % 20) + 1 AS quantity,
    round(((i * 37) % 10000) / 100.0, 2) AS price,
    round(((i * 91) % 200000) / 100.0, 2) AS total,
    ['shipped', 'pending', 'delivered', 'cancelled'][(i % 4) + 1] AS status,
    TIMESTAMP '2024-01-01 00:00:00' + ((i % 525600) * INTERVAL 1 MINUTE) AS created_at
  FROM range(1, 1000001) AS t(i)
`;

const WIDE_COLUMN_COUNT = 30;
const WIDE_ROW_COUNT = 15;
const WIDE_DATA = Array.from({ length: WIDE_ROW_COUNT }, (_, row) => {
  const record: Record<string, string | number> = { id: row + 1 };
  for (let col = 1; col <= WIDE_COLUMN_COUNT; col++) {
    record[`col_${String(col).padStart(2, '0')}`] = `r${row + 1}c${col}`;
  }
  return record;
});

const meta: Meta<typeof QueryTable> = {
  title: 'Table/DataTable',
  component: QueryTable,
  decorators: [DuckDBDecorator],
  parameters: { layout: 'padded' },
  argTypes: {
    height: { control: { type: 'number', min: 200, max: 800, step: 20 } },
    compact: { control: 'boolean' },
    enableFilters: { control: 'boolean' },
    showRowNumbers: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof QueryTable>;

export const Default: Story = {
  args: {
    id: 'users',
    table: SAMPLE_DATA,
    height: 400,
  },
};

export const WithFilters: Story = {
  args: {
    id: 'users-filters',
    table: SAMPLE_DATA,
    height: 400,
    enableFilters: true,
  },
};

export const WithRowNumbers: Story = {
  args: {
    id: 'users-rownums',
    table: SAMPLE_DATA,
    height: 400,
    showRowNumbers: true,
  },
};

export const LargeDataset: Story = {
  args: {
    id: 'orders',
    table: ORDERS_DATA,
    height: 560,
    enableFilters: true,
  },
};

export const MillionRows: Story = {
  args: {
    id: 'orders-1m',
    table: MILLION_ROWS_SQL,
    height: 560,
    enableFilters: true,
  },
};

export const NotCompact: Story = {
  args: {
    id: 'users-relaxed',
    table: SAMPLE_DATA,
    height: 400,
    compact: false,
  },
};

export const CustomRowHeight: Story = {
  args: {
    id: 'users-tall',
    table: SAMPLE_DATA,
    height: 400,
    rowHeight: 36,
  },
};

export const Wide: Story = {
  args: {
    id: 'wide',
    table: WIDE_DATA,
    height: 400,
  },
};

