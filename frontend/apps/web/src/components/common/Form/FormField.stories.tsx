import type { Meta, StoryObj } from '@storybook/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField, FormInput, FormTextarea } from './FormField';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FormWrapper = ({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: Record<string, unknown> }) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const meta: Meta<typeof FormField> = {
  title: 'Common/Form/FormField',
  component: FormField,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <FormWrapper>
        <Story />
      </FormWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    name: 'name',
    label: '이름',
  },
};

export const Required: Story = {
  args: {
    name: 'email',
    label: '이메일',
    required: true,
  },
};

export const WithDescription: Story = {
  args: {
    name: 'username',
    label: '사용자명',
    description: '영문, 숫자, 밑줄만 사용할 수 있습니다.',
  },
};

export const Disabled: Story = {
  args: {
    name: 'readOnly',
    label: '읽기 전용',
    disabled: true,
  },
};

export const WithCustomChildren: Story = {
  render: () => (
    <FormWrapper defaultValues={{ department: '' }}>
      <FormField name="department" label="부서" required>
        {(field) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="부서 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">개발팀</SelectItem>
              <SelectItem value="hr">인사팀</SelectItem>
              <SelectItem value="marketing">마케팅팀</SelectItem>
            </SelectContent>
          </Select>
        )}
      </FormField>
    </FormWrapper>
  ),
};

// FormInput stories
export const TextInput: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormInput name="name" label="이름" placeholder="이름을 입력하세요" />
    </FormWrapper>
  ),
};

export const EmailInput: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormInput
        name="email"
        label="이메일"
        type="email"
        placeholder="example@company.com"
        required
      />
    </FormWrapper>
  ),
};

export const PasswordInput: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormInput
        name="password"
        label="비밀번호"
        type="password"
        placeholder="비밀번호를 입력하세요"
        required
      />
    </FormWrapper>
  ),
};

export const NumberInput: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormInput
        name="age"
        label="나이"
        type="number"
        placeholder="나이를 입력하세요"
      />
    </FormWrapper>
  ),
};

export const PhoneInput: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormInput
        name="phone"
        label="전화번호"
        type="tel"
        placeholder="010-0000-0000"
        autoComplete="tel"
      />
    </FormWrapper>
  ),
};

// FormTextarea stories
export const TextareaDefault: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormTextarea
        name="description"
        label="설명"
        placeholder="설명을 입력하세요"
      />
    </FormWrapper>
  ),
};

export const TextareaWithRows: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormTextarea
        name="content"
        label="내용"
        placeholder="내용을 입력하세요"
        rows={6}
      />
    </FormWrapper>
  ),
};

export const TextareaRequired: StoryObj = {
  render: () => (
    <FormWrapper>
      <FormTextarea
        name="reason"
        label="사유"
        placeholder="사유를 입력하세요"
        required
      />
    </FormWrapper>
  ),
};

// Error state example
export const WithError: StoryObj = {
  render: function WithError() {
    const schema = z.object({
      email: z.string().email('유효한 이메일을 입력해주세요'),
    });

    const methods = useForm({
      resolver: zodResolver(schema),
      defaultValues: { email: 'invalid' },
    });

    // Trigger validation on mount
    methods.trigger('email');

    return (
      <FormProvider {...methods}>
        <FormInput name="email" label="이메일" type="email" required />
      </FormProvider>
    );
  },
};

// Complete form example
export const CompleteForm: StoryObj = {
  render: function CompleteForm() {
    const schema = z.object({
      name: z.string().min(2, '이름은 2글자 이상이어야 합니다'),
      email: z.string().email('유효한 이메일을 입력해주세요'),
      department: z.string().min(1, '부서를 선택해주세요'),
      phone: z.string().optional(),
      description: z.string().optional(),
    });

    type FormValues = z.infer<typeof schema>;

    const methods = useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: '',
        email: '',
        department: '',
        phone: '',
        description: '',
      },
    });

    const onSubmit = (data: FormValues) => {
      console.log('Form submitted:', data);
      alert(JSON.stringify(data, null, 2));
    };

    return (
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <FormInput name="name" label="이름" placeholder="이름을 입력하세요" required />

          <FormInput
            name="email"
            label="이메일"
            type="email"
            placeholder="example@company.com"
            required
          />

          <FormField name="department" label="부서" required>
            {(field) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">개발팀</SelectItem>
                  <SelectItem value="hr">인사팀</SelectItem>
                  <SelectItem value="marketing">마케팅팀</SelectItem>
                  <SelectItem value="finance">재무팀</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormInput
            name="phone"
            label="전화번호"
            type="tel"
            placeholder="010-0000-0000"
          />

          <FormTextarea
            name="description"
            label="자기소개"
            placeholder="자기소개를 입력하세요"
            rows={4}
          />

          <Button type="submit">제출</Button>
        </form>
      </FormProvider>
    );
  },
};

// Multiple fields example
export const MultipleFields: StoryObj = {
  render: () => (
    <FormWrapper defaultValues={{ firstName: '', lastName: '', email: '' }}>
      <div className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <FormInput name="firstName" label="성" placeholder="홍" required />
          <FormInput name="lastName" label="이름" placeholder="길동" required />
        </div>
        <FormInput
          name="email"
          label="이메일"
          type="email"
          placeholder="example@company.com"
          required
        />
        <FormInput name="phone" label="전화번호" type="tel" placeholder="010-0000-0000" />
      </div>
    </FormWrapper>
  ),
};
