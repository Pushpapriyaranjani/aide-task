import React from 'react';
import { FieldPluginProps } from '../dynamicForm.types';

const NumberField: React.FC<FieldPluginProps> = ({ fieldSchema, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
    onChange(fieldSchema.id, numValue);
  };

  return (
    <input
      type="number"
      id={fieldSchema.id}
      value={value === undefined ? '' : value}
      onChange={handleChange}
      placeholder={fieldSchema.placeholder}
      disabled={fieldSchema.uiHints?.disabled}
      readOnly={fieldSchema.uiHints?.readonly}
      min={fieldSchema.validationRules?.min}
      max={fieldSchema.validationRules?.max}
      step={fieldSchema.type === 'integer' ? 1 : fieldSchema.uiHints?.options?.step || 'any'}
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  );
};

export default NumberField;
