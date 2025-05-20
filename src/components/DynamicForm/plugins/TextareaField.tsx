import React from 'react';
import { FieldPluginProps } from '../dynamicForm.types';

const TextareaField: React.FC<FieldPluginProps> = ({ fieldSchema, value, onChange }) => {
  return (
    <textarea
      id={fieldSchema.id}
      value={value || ''}
      onChange={(e) => onChange(fieldSchema.id, e.target.value)}
      placeholder={fieldSchema.placeholder}
      disabled={fieldSchema.uiHints?.disabled}
      readOnly={fieldSchema.uiHints?.readonly}
      minLength={fieldSchema.validationRules?.minLength}
      maxLength={fieldSchema.validationRules?.maxLength}
      rows={fieldSchema.uiHints?.options?.rows || 3} // Default to 3 rows, configurable via ui:options
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  );
};

export default TextareaField;
