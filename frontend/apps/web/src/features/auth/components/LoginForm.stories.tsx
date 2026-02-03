import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './LoginForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof LoginForm> = {
  title: 'Features/Auth/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="mx-auto max-w-md p-8">
            <div className="rounded-lg border bg-card p-8 shadow-lg">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  HR Platform
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  인사관리 시스템에 로그인하세요
                </p>
              </div>
              <Story />
            </div>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'muted',
      values: [
        {
          name: 'muted',
          value: '#f5f5f5',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};
