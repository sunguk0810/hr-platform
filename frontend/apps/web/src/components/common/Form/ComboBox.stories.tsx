import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ComboBox, MultiComboBox, type ComboBoxOption } from './ComboBox';

const meta: Meta<typeof ComboBox> = {
  title: 'Common/Form/ComboBox',
  component: ComboBox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

const departmentOptions: ComboBoxOption[] = [
  { value: 'dept-1', label: '경영지원팀' },
  { value: 'dept-2', label: '개발팀' },
  { value: 'dept-3', label: '디자인팀' },
  { value: 'dept-4', label: '마케팅팀' },
  { value: 'dept-5', label: '영업팀' },
  { value: 'dept-6', label: '인사팀' },
  { value: 'dept-7', label: '재무팀' },
];

const employeeOptions: ComboBoxOption[] = [
  { value: 'emp-1', label: '홍길동', description: '개발팀 / 선임' },
  { value: 'emp-2', label: '김철수', description: '개발팀 / 책임' },
  { value: 'emp-3', label: '이영희', description: '디자인팀 / 선임' },
  { value: 'emp-4', label: '박민수', description: '마케팅팀 / 과장' },
  { value: 'emp-5', label: '최지원', description: '영업팀 / 부장' },
  { value: 'emp-6', label: '정수진', description: '인사팀 / 대리', disabled: true },
];

export const Default: Story = {
  args: {
    options: departmentOptions,
    placeholder: '부서 선택...',
    searchPlaceholder: '부서 검색...',
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>('dept-2');
    return (
      <ComboBox
        options={departmentOptions}
        value={value}
        onChange={setValue}
        placeholder="부서 선택..."
      />
    );
  },
};

export const Clearable: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>('dept-2');
    return (
      <ComboBox
        options={departmentOptions}
        value={value}
        onChange={setValue}
        placeholder="부서 선택..."
        clearable
      />
    );
  },
};

export const WithDescriptions: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    return (
      <ComboBox
        options={employeeOptions}
        value={value}
        onChange={setValue}
        placeholder="직원 선택..."
        searchPlaceholder="이름으로 검색..."
      />
    );
  },
};

export const WithDisabledOptions: Story = {
  args: {
    options: employeeOptions,
    placeholder: '직원 선택...',
    searchPlaceholder: '이름으로 검색...',
  },
};

export const Loading: Story = {
  args: {
    options: [],
    placeholder: '데이터 로딩 중...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    options: departmentOptions,
    value: 'dept-2',
    disabled: true,
  },
};

export const Empty: Story = {
  args: {
    options: [],
    emptyMessage: '검색 결과가 없습니다.',
  },
};

export const CustomSearchHandler: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<ComboBoxOption[]>([]);

    const handleSearch = async (query: string) => {
      if (!query) {
        setOptions([]);
        return;
      }

      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const filtered = departmentOptions.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase())
      );
      setOptions(filtered);
      setLoading(false);
    };

    return (
      <ComboBox
        options={options}
        value={value}
        onChange={setValue}
        onSearch={handleSearch}
        placeholder="부서 검색..."
        loading={loading}
        emptyMessage="검색어를 입력하세요"
      />
    );
  },
};

// MultiComboBox Stories
export const MultiSelect: StoryObj<typeof MultiComboBox> = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <MultiComboBox
        options={departmentOptions}
        value={value}
        onChange={setValue}
        placeholder="부서 선택 (복수)..."
      />
    );
  },
};

export const MultiSelectWithValues: StoryObj<typeof MultiComboBox> = {
  render: () => {
    const [value, setValue] = useState<string[]>(['dept-1', 'dept-2', 'dept-3']);
    return (
      <MultiComboBox
        options={departmentOptions}
        value={value}
        onChange={setValue}
        placeholder="부서 선택..."
      />
    );
  },
};

export const MultiSelectMaxSelections: StoryObj<typeof MultiComboBox> = {
  render: () => {
    const [value, setValue] = useState<string[]>(['dept-1']);
    return (
      <div className="space-y-2">
        <MultiComboBox
          options={departmentOptions}
          value={value}
          onChange={setValue}
          placeholder="부서 선택 (최대 3개)..."
          maxSelections={3}
        />
        <p className="text-xs text-muted-foreground">
          최대 3개까지 선택 가능합니다. ({value.length}/3)
        </p>
      </div>
    );
  },
};

export const MultiSelectWithDescriptions: StoryObj<typeof MultiComboBox> = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <MultiComboBox
        options={employeeOptions}
        value={value}
        onChange={setValue}
        placeholder="직원 선택..."
        searchPlaceholder="이름으로 검색..."
      />
    );
  },
};

export const MultiSelectDisabled: StoryObj<typeof MultiComboBox> = {
  args: {
    options: departmentOptions,
    value: ['dept-1', 'dept-2'],
    disabled: true,
    placeholder: '부서 선택...',
  },
};

// Interactive Example
export const InteractiveExample: Story = {
  render: () => {
    const [selectedDept, setSelectedDept] = useState<string | undefined>();
    const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>();
    const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

    return (
      <div className="w-[350px] space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">부서 선택</label>
          <ComboBox
            options={departmentOptions}
            value={selectedDept}
            onChange={setSelectedDept}
            placeholder="부서를 선택하세요"
            clearable
          />
          {selectedDept && (
            <p className="text-xs text-muted-foreground">
              선택된 부서: {departmentOptions.find((d) => d.value === selectedDept)?.label}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">담당자 선택</label>
          <ComboBox
            options={employeeOptions}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            placeholder="담당자를 선택하세요"
            clearable
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">협업 부서 선택 (복수)</label>
          <MultiComboBox
            options={departmentOptions}
            value={selectedDepts}
            onChange={setSelectedDepts}
            placeholder="협업 부서를 선택하세요"
            maxSelections={5}
          />
        </div>
      </div>
    );
  },
};
