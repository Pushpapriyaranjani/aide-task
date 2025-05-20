import React from 'react';
import { FieldPluginProps } from '../dynamicForm.types';

const BooleanField: React.FC<FieldPluginProps> = ({ fieldSchema, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fieldSchema.id, e.target.checked);
  };

  // For boolean, the label is usually part of the checkbox itself or closely associated.
  // The FieldWrapper will provide the main label. Here we might render the checkbox
  // and optionally a sub-label if provided by ui:options or similar.

  return (
    <div className="flex items-center mt-1">
      <input
        type="checkbox"
        id={fieldSchema.id}
        checked={!!value} // Ensure value is explicitly boolean for 'checked' prop
        onChange={handleChange}
        disabled={fieldSchema.uiHints?.disabled}
        readOnly={fieldSchema.uiHints?.readonly}
        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
      />
      {/* Optional: If you want a label text right next to the checkbox,
          you could use fieldSchema.uiHints.options.label or similar */}
      {fieldSchema.uiHints?.options?.label && (
         <label htmlFor={fieldSchema.id} className="ml-2 block text-sm text-gray-900">
            {fieldSchema.uiHints.options.label}
         </label>
      )}
    </div>
  );
};

export default BooleanField;
