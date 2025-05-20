import React, { useState, useEffect, useCallback, JSX } from 'react';
import {
  DynamicFormProps,
  FormData,
  FormErrors,
  FormPlugins,
} from './dynamicForm.types';
import { NormalizedFormField } from '../../utils/formSchemaParser';
import { initializeFormData, getNestedValue, setNestedValue, validateFormData } from './dynamicForm.utils'; // Import validateFormData
import FieldWrapper from './FieldWrapper'; // Default FieldWrapper
import StringField from './plugins/StringField';
import NumberField from './plugins/NumberField';
import BooleanField from './plugins/BooleanField';
import SelectField from './plugins/SelectField';
import TextareaField from './plugins/TextareaField';
import ArrayField from './plugins/ArrayField'; // Import ArrayField
import LayoutRenderer from './LayoutRenderer';
// import ObjectGroup from './plugins/ObjectGroup'; // ObjectGroup is handled inline for now

const defaultPlugins: FormPlugins = {
  string: StringField,
  number: NumberField,
  integer: NumberField, // Integers can use the same component as numbers
  boolean: BooleanField,
  array: ArrayField, // Add ArrayField to plugins
  // Specific widgets take precedence
  select: SelectField, // For ui:widget: "select"
  textarea: TextareaField, // For ui:widget: "textarea"
  // 'object': ObjectGroup, // Object rendering is handled inline in renderField
};

const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  onSubmit,
  initialValues = {},
  plugins = {},
  // layoutComponent: LayoutComponent, // Replaced by direct layout/groups props
  fieldWrapperComponent: UserFieldWrapper, // User-provided field wrapper
  layout, // New prop from DynamicFormProps
  groups, // New prop from DynamicFormProps
}) => {
  // Normalize schema to always be an array of fields
  const normalizedFields: NormalizedFormField[] = Array.isArray(schema)
    ? schema
    : schema && typeof schema === 'object' && Array.isArray((schema as any)?.fields)
      ? (schema as any).fields
      : schema && typeof schema === 'object' && 'properties' in (schema as Record<string, any>) && (schema as Record<string, any>).properties
        ? Object.values((schema as { properties: Record<string, any> }).properties)
        : [];

  const [formData, setFormData] = useState<FormData>(() => initializeFormData(normalizedFields, initialValues));
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const mergedPlugins = { ...defaultPlugins, ...plugins };
  const CurrentFieldWrapper = UserFieldWrapper || FieldWrapper;

  // Handle field changes
  const handleChange = useCallback((fieldId: string, value: any) => {
    setFormData((prevData) => {
      const newData = { ...prevData };
      setNestedValue(newData, fieldId, value);
      return newData;
    });
    // Basic validation on change (can be expanded)
    // if (formErrors[fieldId]) {
    //   const newErrors = { ...formErrors };
    //   delete newErrors[fieldId];
    //   setFormErrors(newErrors);
    // }
  }, []);

  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Disable phone number validation by filtering out phone errors after validation
    let validationErrors = validateFormData(normalizedFields, formData);

    // Remove errors for any field whose id ends with 'phone' or label includes 'phone'
    Object.keys(validationErrors).forEach((key) => {
      const field = normalizedFields.find(f => f.id === key);
      if (
        key.toLowerCase().endsWith('phone') ||
        (field && field.label && field.label.toLowerCase().includes('phone'))
      ) {
        delete validationErrors[key];
      }
    });

    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(formData);
    }
    // If there are errors, the form will not submit and errors will be displayed.
  };
  
  // Effect to re-initialize form when initialValues or schema changes
  // Also clear errors when schema/initialValues change
  useEffect(() => {
    setFormData(initializeFormData(normalizedFields, initialValues));
    setFormErrors({});
  }, [schema, initialValues]);


  const renderField = (fieldSchema: NormalizedFormField): JSX.Element | null => {
    const FieldComponent = mergedPlugins[fieldSchema.uiHints?.widget || fieldSchema.type] || mergedPlugins[fieldSchema.type];

    // Fix: Always render object fields, even if no FieldComponent is registered
    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      return (
        <CurrentFieldWrapper
          key={fieldSchema.id}
          label={fieldSchema.label}
          isRequired={fieldSchema.isRequired}
          // No htmlFor for object group itself
        >
          <div className="pl-4 border-l-2 border-gray-200 mt-2">
            {fieldSchema.properties.map(renderField)}
          </div>
        </CurrentFieldWrapper>
      );
    }

    if (!FieldComponent) {
      // Only show unsupported warning for non-object fields
      console.warn('No component registered for field type: ' + fieldSchema.type + ' or widget: ' + (fieldSchema.uiHints?.widget || 'undefined'));
      return <p className="text-red-500" key={fieldSchema.id}>Unsupported field: {fieldSchema.label}</p>;
    }

    const value = getNestedValue(formData, fieldSchema.id);
    const error = formErrors[fieldSchema.id];

    // Special styling for the "Hobbies" field
    if (fieldSchema.label === 'Hobbies') {
      return (
        <div key={fieldSchema.id} className="mb-6 p-4 border border-indigo-300 rounded-lg bg-indigo-50">
          <CurrentFieldWrapper
            label={fieldSchema.label}
            htmlFor={fieldSchema.id}
            helpText={fieldSchema.helpText}
            error={error}
            isRequired={fieldSchema.isRequired}
          >
            <FieldComponent
              fieldSchema={fieldSchema}
              value={value}
              onChange={handleChange}
              error={error}
            />
          </CurrentFieldWrapper>
        </div>
      );
    }

    // Add help text for any phone number field (id ends with '.phone' or label contains 'phone')
    const isPhoneField =
      fieldSchema.id?.toLowerCase().endsWith('phone') ||
      fieldSchema.label?.toLowerCase().includes('phone');
    const helpText = isPhoneField
      ? 'Format: +1234567890 (E.164 format, e.g. +15551234567)'
      : fieldSchema.helpText;

    return (
      <CurrentFieldWrapper
        key={fieldSchema.id}
        label={fieldSchema.label}
        htmlFor={fieldSchema.id}
        helpText={helpText}
        error={error}
        isRequired={fieldSchema.isRequired}
      >
        <FieldComponent
          fieldSchema={fieldSchema}
          value={value}
          onChange={handleChange}
          error={error}
        />
      </CurrentFieldWrapper>
    );
  };

  // The renderField function itself remains largely the same, but how it's called will change.
  // Instead of schema.map(renderField), we'll pass `schema` (all fields) and `renderField` to LayoutRenderer.

  // The LayoutRenderer will decide how to arrange fields based on layout and groups.
  // If layout and groups are not provided, LayoutRenderer should default to simple vertical stacking.
  // The `schema` prop passed to DynamicForm contains all NormalizedFormField objects.
  // The `LayoutRenderer` will use the `fields` prop (which will be `schema` from DynamicForm)
  // and the `renderField` callback to render individual fields.

  // If `layout` or `groups` are not passed to DynamicForm, LayoutRenderer will use its defaults.
  // The `LayoutRenderer` itself needs to be imported.
  // Let's assume LayoutRenderer is imported.
  // import LayoutRenderer from './LayoutRenderer'; // This import needs to be added at the top.

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LayoutRenderer
        layout={layout}
        groups={groups}
        fields={normalizedFields} // Use normalizedFields instead of schema
        renderField={renderField}
      />
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Submit
      </button>
    </form>
  );
};

export default DynamicForm;
