import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  placeholder: string;
  options: FormSelectOption[];
  description?: string;
  disabled?: boolean;
  required?: boolean;
  triggerClassName?: string;
}

/**
 * FormSelect - Integrated with react-hook-form for consistent form field styling
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   defaultValues: {
 *     roleName: '',
 *   },
 * });
 *
 * <FormSelect
 *   control={form.control}
 *   name="roleName"
 *   label={t('role.label')}
 *   placeholder={t('role.select')}
 *   options={[
 *     { value: 'TEAM_LEADER', label: t('role.teamLeader') },
 *     { value: 'HR_MANAGER', label: t('role.hrManager') },
 *   ]}
 *   required
 * />
 * ```
 */
export function FormSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  placeholder,
  options,
  description,
  disabled = false,
  required = false,
  triggerClassName = 'w-full',
}: FormSelectProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
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
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
