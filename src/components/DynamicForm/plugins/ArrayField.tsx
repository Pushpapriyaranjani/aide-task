import React from 'react';
import { FieldPluginProps } from '../dynamicForm.types';
import { NormalizedFormField } from '../../../utils/formSchemaParser';
// import { getNestedValue, setNestedValue } from '../dynamicForm.utils'; // Removed for now, simplify item handling

// Simplified props for now
interface ArrayFieldProps extends FieldPluginProps {
  // The following props are part of a more complex implementation for rendering nested items
  // renderField: (fieldSchema: NormalizedFormField, basePath: string, index?: number) => JSX.Element | null;
  // formData: Record<string, any>; 
  // setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const ArrayField: React.FC<ArrayFieldProps> = ({
  fieldSchema,
  value, // Will be defaulted below
  onChange,
}) => {
  const currentArrayValue = Array.isArray(value) ? value : [];
  const itemSchema = fieldSchema.itemSchema as NormalizedFormField | undefined; // Cast for easier access

  const handleAddItem = () => {
    let newItem: any;
    if (itemSchema && itemSchema.type === 'object' && itemSchema.properties) {
      newItem = {};
      itemSchema.properties.forEach(prop => {
        if (prop.defaultValue !== undefined) {
          newItem[prop.id] = prop.defaultValue;
        } else if (prop.type === 'object') {
          newItem[prop.id] = {}; 
        } else if (prop.type === 'array') {
          newItem[prop.id] = [];
        }
        // else, property will be undefined initially
      });
    } else if (itemSchema && itemSchema.defaultValue !== undefined) {
      // For simple type items (string, number, boolean) with a default value
      newItem = itemSchema.defaultValue;
    } else {
      // Fallback for simple types without default or if itemSchema is very basic
      newItem = undefined; 
    }
    
    const newArray = [...currentArrayValue, newItem];
    onChange(fieldSchema.id, newArray);
  };

  const handleRemoveItem = (index: number) => {
    const newArray = [...currentArrayValue];
    newArray.splice(index, 1);
    onChange(fieldSchema.id, newArray);
  };

  // Simplified item change handler: assumes item is a simple value or direct replacement
  const handleItemChange = (itemIndex: number, itemValue: any) => {
    const newArray = [...currentArrayValue];
    newArray[itemIndex] = itemValue;
    onChange(fieldSchema.id, newArray);
  };

  if (!itemSchema) {
    return <p className="text-red-500">Array field '{fieldSchema.label}' has no item schema defined.</p>;
  }

  return (
    <div className={fieldSchema.label === 'Hobbies' ? "hobbies-array-field" : ""}>
      {value && Array.isArray(value) && value.map((item, idx) => (
        <div key={idx} className={fieldSchema.label === 'Hobbies' ? "hobby-item" : ""}>
          {/* Render textarea/input for each hobby */}
          {itemSchema?.type === 'string' && fieldSchema.label === 'Hobbies' ? (
            <textarea
              className="resize-none w-64 min-h-[2.5rem] max-w-full border border-gray-300 rounded px-2 py-1"
              value={item}
              onChange={e => handleItemChange(idx, e.target.value)}
              placeholder={itemSchema?.label || "Hobby"}
            />
          ) : (
            // Item is a simple type (string, number, boolean)
            <input 
              type={itemSchema.type === 'integer' || itemSchema.type === 'number' ? 'number' : 'text'}
              value={item === undefined ? '' : item}
              onChange={(e) => {
                let val: any = e.target.value;
                if (itemSchema.type === 'integer' || itemSchema.type === 'number') {
                  val = parseFloat(e.target.value);
                  if (isNaN(val)) val = undefined;
                }
                handleItemChange(idx, val);
              }}
              placeholder={itemSchema.label || `Item ${idx + 1}`}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          )}
          <button
            type="button"
            className={fieldSchema.label === 'Hobbies' ? "hobby-remove-btn" : ""}
            onClick={() => handleRemoveItem(idx)}
            aria-label="Remove"
            style={{ minWidth: '1.5rem', minHeight: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>&times;</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddItem}
        className="mt-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add {fieldSchema.label || 'Item'}
      </button>
    </div>
  );
};

export default ArrayField;
