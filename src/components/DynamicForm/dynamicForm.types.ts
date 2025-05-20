import React from 'react';
// Import LayoutConfig and FormGroupConfig if they are not already globally available or part of NormalizedFormField
import { NormalizedFormField, LayoutConfig, FormGroupConfig } from '../../utils/formSchemaParser'; 

// Props for individual field rendering plugins
export interface FieldPluginProps {
  fieldSchema: NormalizedFormField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  error?: string;
  // Optional: if a field needs access to the full form data or other global state
  // formData?: any; 
}

// Structure for the plugins object
export interface FormPlugins {
  [fieldTypeOrWidget: string]: React.ComponentType<FieldPluginProps>;
}

// Props for the main DynamicForm component
export interface DynamicFormProps {
  schema: NormalizedFormField[];
  onSubmit: (formData: any) => void;
  initialValues?: Record<string, any>;
  plugins?: FormPlugins;
  // layoutComponent is being replaced by LayoutRenderer integration
  // layoutComponent?: React.ComponentType<{ children: React.ReactNode }>; 
  fieldWrapperComponent?: React.ComponentType<FieldWrapperProps>;
  // Root level layout and group configurations
  layout?: LayoutConfig;
  groups?: FormGroupConfig[];
}

// Props for the FieldWrapper component
export interface FieldWrapperProps {
  label: string;
  htmlFor?: string; // for associating label with input
  helpText?: string;
  error?: string;
  children: React.ReactNode; // The actual input field
  isRequired?: boolean;
  // Add any other layout-related props, e.g., for styling based on field state
}

// Type for form data state
export type FormData = Record<string, any>;

// Type for form errors state
export type FormErrors = Record<string, string | undefined>;
