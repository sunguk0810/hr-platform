import * as React from 'react';
import {
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
  type ControllerRenderProps,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  children?:
    | React.ReactNode
    | ((field: ControllerRenderProps<TFieldValues, TName>) => React.ReactNode);
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  required,
  disabled,
  className,
  labelClassName,
  children,
}: FormFieldProps<TFieldValues, TName>) {
  const { control, formState } = useFormContext<TFieldValues>();
  const error = formState.errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={cn('space-y-2', className)}>
          {label && (
            <Label
              htmlFor={name}
              className={cn(
                'text-sm font-medium',
                error && 'text-destructive',
                labelClassName
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {typeof children === 'function'
            ? children({ ...field, disabled: disabled || field.disabled })
            : children || (
                <Input
                  {...field}
                  id={name}
                  disabled={disabled}
                  className={cn(error && 'border-destructive')}
                />
              )}
          {description && !error && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error.message as string}</p>
          )}
        </div>
      )}
    />
  );
}

export interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormFieldProps<TFieldValues, TName>, 'children'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  autoComplete?: string;
}

export function FormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
  ...props
}: FormInputProps<TFieldValues, TName>) {
  return (
    <FormField name={name} disabled={disabled} {...props}>
      {(field) => (
        <Input
          {...field}
          id={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={field.disabled}
          value={field.value ?? ''}
        />
      )}
    </FormField>
  );
}

export interface FormTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormFieldProps<TFieldValues, TName>, 'children'> {
  placeholder?: string;
  rows?: number;
}

export function FormTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  placeholder,
  rows = 3,
  disabled,
  ...props
}: FormTextareaProps<TFieldValues, TName>) {
  return (
    <FormField name={name} disabled={disabled} {...props}>
      {(field) => (
        <Textarea
          {...field}
          id={name}
          placeholder={placeholder}
          rows={rows}
          disabled={field.disabled}
          value={field.value ?? ''}
        />
      )}
    </FormField>
  );
}
