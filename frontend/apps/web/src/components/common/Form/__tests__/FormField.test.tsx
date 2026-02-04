import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField, FormInput, FormTextarea } from '../FormField';

// Wrapper component to provide form context
function FormWrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: Record<string, unknown> }) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

// Wrapper with validation errors
function FormWrapperWithError({
  children,
  fieldName,
  errorMessage,
}: {
  children: React.ReactNode;
  fieldName: string;
  errorMessage: string;
}) {
  const methods = useForm();
  methods.setError(fieldName, { message: errorMessage });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('FormField', () => {
  it('should render with label', () => {
    render(
      <FormWrapper>
        <FormField name="testField" label="Test Label" />
      </FormWrapper>
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should render required indicator when required is true', () => {
    render(
      <FormWrapper>
        <FormField name="testField" label="Required Field" required />
      </FormWrapper>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should not render required indicator when required is false', () => {
    render(
      <FormWrapper>
        <FormField name="testField" label="Optional Field" required={false} />
      </FormWrapper>
    );

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <FormWrapper>
        <FormField name="testField" label="Field" description="This is a description" />
      </FormWrapper>
    );

    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('should render error message when field has error', () => {
    render(
      <FormWrapperWithError fieldName="testField" errorMessage="This field is required">
        <FormField name="testField" label="Field" />
      </FormWrapperWithError>
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should not render description when error exists', () => {
    render(
      <FormWrapperWithError fieldName="testField" errorMessage="Error message">
        <FormField name="testField" label="Field" description="Description text" />
      </FormWrapperWithError>
    );

    expect(screen.queryByText('Description text')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render default input when no children provided', () => {
    render(
      <FormWrapper>
        <FormField name="testField" label="Field" />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render custom children when provided', () => {
    render(
      <FormWrapper>
        <FormField name="testField" label="Field">
          <select data-testid="custom-select">
            <option>Option 1</option>
          </select>
        </FormField>
      </FormWrapper>
    );

    expect(screen.getByTestId('custom-select')).toBeInTheDocument();
  });

  it('should render function children with field props', () => {
    render(
      <FormWrapper defaultValues={{ testField: 'initial' }}>
        <FormField name="testField" label="Field">
          {(field) => <input data-testid="custom-input" value={field.value} onChange={field.onChange} />}
        </FormField>
      </FormWrapper>
    );

    expect(screen.getByTestId('custom-input')).toHaveValue('initial');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FormWrapper>
        <FormField name="testField" label="Field" className="custom-class" />
      </FormWrapper>
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should apply error styling to label when error exists', () => {
    render(
      <FormWrapperWithError fieldName="testField" errorMessage="Error">
        <FormField name="testField" label="Field Label" />
      </FormWrapperWithError>
    );

    const label = screen.getByText('Field Label');
    expect(label).toHaveClass('text-destructive');
  });
});

describe('FormInput', () => {
  it('should render text input by default', () => {
    render(
      <FormWrapper>
        <FormInput name="textField" label="Text Input" />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  it('should render email input', () => {
    render(
      <FormWrapper>
        <FormInput name="emailField" label="Email" type="email" />
      </FormWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render password input', () => {
    render(
      <FormWrapper>
        <FormInput name="passwordField" label="Password" type="password" />
      </FormWrapper>
    );

    // Password inputs don't have role="textbox"
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(
      <FormWrapper>
        <FormInput name="field" label="Field" placeholder="Enter value" />
      </FormWrapper>
    );

    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <FormWrapper>
        <FormInput name="field" label="Field" disabled />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should update value on input', async () => {
    const user = userEvent.setup();

    render(
      <FormWrapper>
        <FormInput name="field" label="Field" />
      </FormWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    expect(input).toHaveValue('test value');
  });

  it('should render with autoComplete attribute', () => {
    render(
      <FormWrapper>
        <FormInput name="email" label="Email" autoComplete="email" />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
  });
});

describe('FormTextarea', () => {
  it('should render textarea', () => {
    render(
      <FormWrapper>
        <FormTextarea name="textArea" label="Description" />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  it('should render with placeholder', () => {
    render(
      <FormWrapper>
        <FormTextarea name="textArea" label="Description" placeholder="Enter description" />
      </FormWrapper>
    );

    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('should render with custom rows', () => {
    render(
      <FormWrapper>
        <FormTextarea name="textArea" label="Description" rows={5} />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
  });

  it('should use default rows of 3', () => {
    render(
      <FormWrapper>
        <FormTextarea name="textArea" label="Description" />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <FormWrapper>
        <FormTextarea name="textArea" label="Description" disabled />
      </FormWrapper>
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should update value on input', async () => {
    const user = userEvent.setup();

    render(
      <FormWrapper>
        <FormTextarea name="textArea" label="Description" />
      </FormWrapper>
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test description');

    expect(textarea).toHaveValue('test description');
  });
});
