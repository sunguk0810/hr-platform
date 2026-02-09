import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

/**
 * FilterSelect - Standardized dropdown for search/filter scenarios
 *
 * @example
 * ```tsx
 * <FilterSelect
 *   value={searchState.status}
 *   onValueChange={setStatus}
 *   placeholder={t('common.allStatus')}
 *   options={[
 *     { value: 'ACTIVE', label: t('common.statusActive') },
 *     { value: 'INACTIVE', label: t('common.statusInactive') },
 *   ]}
 * />
 * ```
 */
export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  triggerClassName = 'h-10 w-[180px]',
  contentClassName,
  disabled = false,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
