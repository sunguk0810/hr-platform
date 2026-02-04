import type { Meta, StoryObj } from '@storybook/react';
import { MaskedField } from './MaskedField';

const meta: Meta<typeof MaskedField> = {
  title: 'Common/MaskedField',
  component: MaskedField,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['phone', 'email', 'name', 'residentNumber', 'ssn', 'bankAccount', 'cardNumber', 'custom'],
    },
    showToggle: { control: 'boolean' },
    canReveal: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof MaskedField>;

export const Phone: Story = {
  args: {
    value: '010-1234-5678',
    type: 'phone',
    showToggle: false,
  },
};

export const Email: Story = {
  args: {
    value: 'user@example.com',
    type: 'email',
    showToggle: false,
  },
};

export const Name: Story = {
  args: {
    value: '홍길동',
    type: 'name',
    showToggle: false,
  },
};

export const ResidentNumber: Story = {
  args: {
    value: '901231-1234567',
    type: 'residentNumber',
    showToggle: false,
  },
};

export const SSN: Story = {
  args: {
    value: '901231-1234567',
    type: 'ssn',
    showToggle: false,
  },
};

export const BankAccount: Story = {
  args: {
    value: '123-456-789012',
    type: 'bankAccount',
    showToggle: false,
  },
};

export const CardNumber: Story = {
  args: {
    value: '1234-5678-9012-3456',
    type: 'cardNumber',
    showToggle: false,
  },
};

export const WithToggle: Story = {
  args: {
    value: '010-1234-5678',
    type: 'phone',
    showToggle: true,
    canReveal: true,
  },
};

export const ToggleDisabled: Story = {
  args: {
    value: '010-1234-5678',
    type: 'phone',
    showToggle: true,
    canReveal: false,
  },
};

export const CustomMask: Story = {
  args: {
    value: 'ABCD1234',
    type: 'custom',
    customMask: (value: string) => value.replace(/./g, '*'),
    showToggle: false,
  },
};

export const AllTypes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">전화번호:</span>
        <MaskedField value="010-1234-5678" type="phone" showToggle={false} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">이메일:</span>
        <MaskedField value="user@example.com" type="email" showToggle={false} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">이름:</span>
        <MaskedField value="홍길동" type="name" showToggle={false} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">주민번호:</span>
        <MaskedField value="901231-1234567" type="residentNumber" showToggle={false} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">계좌번호:</span>
        <MaskedField value="123-456-789012" type="bankAccount" showToggle={false} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">카드번호:</span>
        <MaskedField value="1234-5678-9012-3456" type="cardNumber" showToggle={false} />
      </div>
    </div>
  ),
};

export const WithToggleAll: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">전화번호:</span>
        <MaskedField value="010-1234-5678" type="phone" showToggle canReveal />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">이메일:</span>
        <MaskedField value="user@example.com" type="email" showToggle canReveal />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">이름:</span>
        <MaskedField value="홍길동" type="name" showToggle canReveal />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">주민번호:</span>
        <MaskedField value="901231-1234567" type="residentNumber" showToggle canReveal />
      </div>
    </div>
  ),
};

export const AsyncReveal: StoryObj = {
  args: {
    value: '010-****-5678',
    type: 'phone',
    showToggle: true,
    canReveal: true,
    onRevealRequest: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return '010-1234-5678';
    },
  },
};
