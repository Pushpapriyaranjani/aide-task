import React from 'react';
import { FieldWrapperProps } from './dynamicForm.types';

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  htmlFor,
  helpText,
  error,
  children,
  isRequired,
}) => {
  return (
    <div className="mb-4"> {/* Tailwind CSS: margin bottom for spacing */}
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FieldWrapper;
