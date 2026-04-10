/**
 * Configuration for a dynamic form field.
 */
export interface FormFieldConfig {
    /** Unique field name */
    name: string;
    /** Display label */
    label: string;
    /** HTML input type */
    type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'textarea' | 'date';
    /** Default value */
    defaultValue?: unknown;
    /** Whether the field is required */
    required?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Validation rules */
    validators?: FormValidator[];
    /** Options for select fields */
    options?: SelectOption[];
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Minimum value (number/date) */
    min?: number | string;
    /** Maximum value (number/date) */
    max?: number | string;
    /** CSS class for the field */
    cssClass?: string;
}

/**
 * A select dropdown option.
 */
export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    group?: string;
}

/**
 * A form validation rule.
 */
export interface FormValidator {
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: unknown;
    message: string;
}

/**
 * Complete form configuration.
 */
export interface FormConfig {
    fields: FormFieldConfig[];
    submitLabel?: string;
    cancelLabel?: string;
    layout?: 'vertical' | 'horizontal' | 'inline';
}

/**
 * Callback for form submission.
 */
export type FormSubmitHandler<T = Record<string, unknown>> = (values: T) => void | Promise<void>;
