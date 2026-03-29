import type { Meta, StoryObj } from '@storybook/react';
import { QueryTable } from '../table/QueryTable';
import { DuckDBDecorator } from '../.storybook/DuckDBDecorator';

const SAMPLE_DATA = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 32, status: 'active', created_at: '2024-01-15' },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 28, status: 'active', created_at: '2024-02-20' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 45, status: 'inactive', created_at: '2024-03-10' },
  { id: 4, name: 'Diana', email: 'diana@example.com', age: 37, status: 'active', created_at: '2024-04-05' },
  { id: 5, name: 'Eve', email: 'eve@example.com', age: 24, status: 'pending', created_at: '2024-05-12' },
  { id: 6, name: 'Frank', email: 'frank@example.com', age: 52, status: 'active', created_at: '2024-06-18' },
  { id: 7, name: 'Grace', email: 'grace@example.com', age: 29, status: 'inactive', created_at: '2024-07-22' },
  { id: 8, name: 'Hank', email: 'hank@example.com', age: 41, status: 'active', created_at: '2024-08-30' },
  { id: 9, name: 'Ivy', email: 'ivy@example.com', age: 33, status: 'pending', created_at: '2024-09-14' },
  { id: 10, name: 'Jack', email: 'jack@example.com', age: 27, status: 'active', created_at: '2024-10-01' },
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

