import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Common/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    page: { control: 'number' },
    totalPages: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    page: 0,
    totalPages: 10,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
};

export const FirstPage: Story = {
  args: {
    page: 0,
    totalPages: 10,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
};

export const MiddlePage: Story = {
  args: {
    page: 4,
    totalPages: 10,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
};

export const LastPage: Story = {
  args: {
    page: 9,
    totalPages: 10,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
};

export const FewPages: Story = {
  args: {
    page: 0,
    totalPages: 3,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
};

export const SinglePage: Story = {
  args: {
    page: 0,
    totalPages: 1,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
};

export const NoPages: Story = {
  args: {
    page: 0,
    totalPages: 0,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
};

// Interactive example
export const Interactive: StoryObj = {
  render: function Interactive() {
    const [page, setPage] = useState(0);
    const totalPages = 10;

    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">페이지 {page + 1}의 내용</h3>
          <p className="text-muted-foreground">
            현재 {page + 1}페이지를 보고 있습니다. (총 {totalPages}페이지)
          </p>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    );
  },
};

// With data list example
export const WithDataList: StoryObj = {
  render: function WithDataList() {
    const [page, setPage] = useState(0);
    const itemsPerPage = 5;
    const allItems = Array.from({ length: 23 }, (_, i) => `항목 ${i + 1}`);
    const totalPages = Math.ceil(allItems.length / itemsPerPage);
    const currentItems = allItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    return (
      <div className="space-y-4">
        <ul className="space-y-2">
          {currentItems.map((item) => (
            <li key={item} className="p-2 border rounded">
              {item}
            </li>
          ))}
        </ul>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    );
  },
};
