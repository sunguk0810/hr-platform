import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface ComboBoxOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface ComboBoxProps {
  options: ComboBoxOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  className?: string;
}

export function ComboBox({
  options,
  value,
  onChange,
  onSearch,
  placeholder = '선택...',
  searchPlaceholder = '검색...',
  emptyMessage = '결과가 없습니다.',
  disabled = false,
  loading = false,
  clearable = false,
  className,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? undefined : selectedValue;
    onChange?.(newValue);
    setOpen(false);
    setInputValue('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  const handleInputChange = (search: string) => {
    setInputValue(search);
    onSearch?.(search);
  };

  const filteredOptions = onSearch
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedOption && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {clearable && selectedOption && !disabled && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <CommandPrimitive className="overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3">
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={handleInputChange}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <CommandPrimitive.List className="max-h-[200px] overflow-y-auto p-1">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandPrimitive.Empty>
            {filteredOptions.map((option) => (
              <CommandPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                onSelect={handleSelect}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                  'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
                  'aria-selected:bg-accent aria-selected:text-accent-foreground',
                  value === option.value && 'bg-accent'
                )}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === option.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1 overflow-hidden">
                  <span className="block truncate">{option.label}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </CommandPrimitive.Item>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}

export interface MultiComboBoxProps extends Omit<ComboBoxProps, 'value' | 'onChange'> {
  value?: string[];
  onChange?: (value: string[]) => void;
  maxSelections?: number;
}

export function MultiComboBox({
  options,
  value = [],
  onChange,
  onSearch,
  placeholder = '선택...',
  searchPlaceholder = '검색...',
  emptyMessage = '결과가 없습니다.',
  disabled = false,
  loading = false,
  maxSelections,
  className,
}: MultiComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  const handleSelect = (selectedValue: string) => {
    const newValue = value.includes(selectedValue)
      ? value.filter((v) => v !== selectedValue)
      : maxSelections && value.length >= maxSelections
        ? value
        : [...value, selectedValue];
    onChange?.(newValue);
  };

  const handleRemove = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== valueToRemove));
  };

  const handleInputChange = (search: string) => {
    setInputValue(search);
    onSearch?.(search);
  };

  const filteredOptions = onSearch
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full min-h-10 h-auto justify-between font-normal',
            selectedOptions.length === 0 && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs"
                >
                  {option.label}
                  {!disabled && (
                    <X
                      className="h-3 w-3 cursor-pointer hover:opacity-75"
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  )}
                </span>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <CommandPrimitive className="overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3">
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={handleInputChange}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <CommandPrimitive.List className="max-h-[200px] overflow-y-auto p-1">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandPrimitive.Empty>
            {filteredOptions.map((option) => {
              const isSelected = value.includes(option.value);
              const isDisabled =
                option.disabled ||
                (maxSelections !== undefined &&
                  value.length >= maxSelections &&
                  !isSelected);

              return (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={isDisabled}
                  onSelect={handleSelect}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                    'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
                    'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    isSelected && 'bg-accent'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex-1 overflow-hidden">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandPrimitive.Item>
              );
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
