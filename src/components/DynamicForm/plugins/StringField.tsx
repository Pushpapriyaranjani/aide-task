import React from 'react';
import { FieldPluginProps } from '../dynamicForm.types';

const StringField: React.FC<FieldPluginProps> = ({ fieldSchema, value, onChange }) => {
  const specificType = fieldSchema.uiHints?.widget === 'password' ? 'password' : 
                       fieldSchema.format === 'email' ? 'email' :
                       fieldSchema.format === 'uri' ? 'url' :
                       fieldSchema.format === 'date' ? 'date' : // HTML5 date input
                       fieldSchema.format === 'date-time' ? 'datetime-local' : // HTML5 datetime-local input
                       'text';

  if (fieldSchema.uiHints?.widget === 'textarea') {
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
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    );
  }

  return (
    <input
      type={specificType}
      id={fieldSchema.id}
      value={value || ''}
      onChange={(e) => onChange(fieldSchema.id, e.target.value)}
      placeholder={fieldSchema.placeholder}
      disabled={fieldSchema.uiHints?.disabled}
      readOnly={fieldSchema.uiHints?.readonly}
      minLength={fieldSchema.validationRules?.minLength}
      maxLength={fieldSchema.validationRules?.maxLength}
      pattern={fieldSchema.validationRules?.pattern}
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  );
};

export default StringField;
