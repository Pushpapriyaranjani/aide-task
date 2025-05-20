import React from 'react';
import { FieldPluginProps } from '../dynamicForm.types';

const SelectField: React.FC<FieldPluginProps> = ({ fieldSchema, value, onChange }) => {
  const options = fieldSchema.validationRules?.enum || [];
  const emptyValue = fieldSchema.uiHints?.emptyValue !== undefined ? fieldSchema.uiHints.emptyValue : "";

  return (
    <select
      id={fieldSchema.id}
      value={value === undefined ? emptyValue : value}
      onChange={(e) => onChange(fieldSchema.id, e.target.value === "" && emptyValue === "" ? undefined : e.target.value)}
      disabled={fieldSchema.uiHints?.disabled}
      readOnly={fieldSchema.uiHints?.readonly} // Note: readonly on select is not standard HTML, might behave like disabled
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white shadow-sm"
    >
      {/* Add a placeholder option if the field is not required or if an emptyValue is explicitly defined */}
      {(fieldSchema.uiHints?.placeholder || !fieldSchema.isRequired || emptyValue !== undefined) && (
        <option value={emptyValue}>
          {fieldSchema.uiHints?.placeholder || 'Select...'}
        </option>
      )}
      {options.map((option, index) => {
        const optionValue = typeof option === 'object' ? option.value : option;
        const optionLabel = typeof option === 'object' ? option.label : String(option);
        return (
          <option key={index} value={optionValue}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  );
};

export default SelectField;
