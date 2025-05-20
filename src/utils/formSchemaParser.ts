// Input JSON Schema (simplified subset)
export interface JsonSchemaProperty {
  type: string;
  title?: string;
  default?: any;
  description?: string; // Can be used as helpText

  // Validation
  minLength?: number;
  maxLength?: number;
  minimum?: number; // JSON Schema validation keyword for numbers
  maximum?: number; // JSON Schema validation keyword for numbers
  pattern?: string;
  enum?: any[];
  format?: string; // e.g., "email", "date", "uri"
  minItems?: number; // For arrays
  maxItems?: number; // For arrays

  // Nested Schemas
  properties?: { [key: string]: JsonSchemaProperty };
  items?: JsonSchemaProperty | { type: string }; // Schema for array items
  required?: string[]; // For object type, lists required properties

  // UI Hints (common conventions, often prefixed with "ui:")
  'ui:widget'?: string; // e.g., "textarea", "radio", "select", "password", "date", "number"
  'ui:validationMessages'?: { [key: string]: string }; // Custom validation messages
  'ui:placeholder'?: string;
  'ui:options'?: { // For enums or select/radio options
    enumNames?: string[]; // Labels for enum values if `enum` provides values
    // e.g., { "inline": true } for radio buttons
    [key: string]: any;
  };
  'ui:order'?: string[]; // To specify order of fields
  'ui:disabled'?: boolean;
  'ui:readonly'?: boolean;
  'ui:help'?: string; // Alternative to description for help text
  'ui:emptyValue'?: any; // Value to use when field is empty (e.g. for a select)
  // Add any other ui hints you expect
  'ui:layout'?: LayoutConfig; // For overall layout of an object's properties or form root
  'ui:groups'?: FormGroupConfig[]; // For grouping fields within an object or form root
  'ui:fieldLayout'?: { className?: string; colSpan?: number; }; // For individual field styling within a layout
}

// Configuration for layout (grid, flex)
export interface LayoutConfig {
  type: 'grid' | 'flex' | 'default'; // 'default' implies simple vertical stacking
  columns?: number; // For grid layout: number of columns
  gap?: string | number; // Gap between items (e.g., '4', '1rem', or a number for theme-based spacing)
  // Flex properties
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'; // Renamed from justify
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  className?: string; // Custom CSS classes for the layout container
}

// Configuration for a group of fields
export interface FormGroupConfig {
  id: string; // Unique ID for the group
  title?: string; // Display title for the group
  fields: string[]; // Array of field IDs belonging to this group
  layout?: LayoutConfig; // Layout specific to this group
  className?: string; // Custom CSS classes for the group container
  description?: string; // Optional description for the group
}


export interface JsonSchema extends JsonSchemaProperty {
  $schema?: string;
  // Root schema is typically an object
  type: 'object';
  properties: { [key: string]: JsonSchemaProperty };
  required?: string[];
  // Root level layout hints
  'ui:layout'?: LayoutConfig;
  'ui:groups'?: FormGroupConfig[];
}

// Output Normalized Form Field Structure
export interface NormalizedFormField {
  id: string; // Unique identifier, typically the path (e.g., "user.name", "addresses.0.street")
  type: string; // "string", "number", "integer", "boolean", "array", "object"
  label: string;
  defaultValue?: any;
  isRequired: boolean;
  placeholder?: string;
  format?: string; // e.g., "email", "date", "uri"
  helpText?: string;
  validationMessages?: { [key: string]: string }; // For custom validation messages
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number; // Consistent naming for min/max in normalized output
    max?: number;
    pattern?: string;
    enum?: Array<{ label: string; value: any } | string | number>; // Enum can be simple values or label/value pairs
    format?: string;
    minItems?: number; // For arrays
    maxItems?: number; // For arrays
  };
  uiHints?: {
    widget?: string;
    order?: number; // For field ordering if 'ui:order' was used
    disabled?: boolean;
    readonly?: boolean;
    options?: { [key: string]: any }; // Pass through ui:options
    emptyValue?: any;
    placeholder?: string; // For placeholder text
    // any other UI specific hints
  };
  fieldLayout?: { // Layout hints specific to this field when rendered in a parent layout
    className?: string; 
    colSpan?: number; // e.g., for grid layout
  };
  // For 'object' type fields: an array of their properties, normalized
  properties?: NormalizedFormField[];
  // Layout and grouping information if this field is an object or represents the root
  layout?: LayoutConfig;
  groups?: FormGroupConfig[];
  // For 'array' type fields: schema for a single item
  // If item is a simple type (string, number), itemSchema is a single NormalizedFormField.
  // If item is an object, itemSchema is an array of NormalizedFormField (describing the object's properties).
  itemSchema?: NormalizedFormField | NormalizedFormField[]; // This was NormalizedFormField | NormalizedFormField[], should be just NormalizedFormField for a single item schema, or the parser needs to handle array of types for items. Let's assume itemSchema is a single NormalizedFormField structure describing the item.
  // If items can be of different types (oneOf, anyOf), itemSchema would be more complex. For now, assume uniform item type.
}

export interface ParsedSchemaOutput {
  fields: NormalizedFormField[];
  layout?: LayoutConfig;
  groups?: FormGroupConfig[];
}

/**
 * Parses a JSON schema and outputs a normalized structure suitable for dynamic form generation.
 * @param schema The JSON schema object.
 * @returns An object containing normalized fields and root layout/group configurations.
 */
export function parseJsonSchemaToFormFields(schema: JsonSchema): ParsedSchemaOutput {
  if (schema.type !== 'object' || !schema.properties) {
    console.warn('Root schema type must be "object" with "properties".');
    return { fields: [] };
  }
  const fields = processProperties(schema.properties, '', schema.required || [], schema);
  return {
    fields,
    layout: schema['ui:layout'],
    groups: schema['ui:groups'],
  };
}

// Helper to get field order, respecting 'ui:order' if available
// Moved this function before processProperties
function getSchemaPropertyOrder(
  properties: { [key: string]: JsonSchemaProperty },
  schema?: JsonSchemaProperty // Pass the parent schema if ui:order is defined on it
): string[] {
  // A common pattern is schema['ui:order'] = ["fieldA", "fieldC", "fieldB"]
  // Check if ui:order exists on the schema object itself
  if (Array.isArray(schema?.['ui:order'])) {
    // Filter out keys not in properties and add remaining keys from properties
    const orderedKeys = schema['ui:order'].filter(key => properties.hasOwnProperty(key));
    const remainingKeys = Object.keys(properties).filter(key => !orderedKeys.includes(key));
    return [...orderedKeys, ...remainingKeys];
  }
  return Object.keys(properties);
}

function processProperties(
  properties: { [key: string]: JsonSchemaProperty },
  parentPath: string,
  parentRequired: string[],
  parentSchema?: JsonSchemaProperty // To access parent's ui:order
): NormalizedFormField[] {
  const fields: NormalizedFormField[] = [];
  // Pass parentSchema to getSchemaPropertyOrder if it might contain 'ui:order'
  const fieldOrder = getSchemaPropertyOrder(properties, parentSchema); // parentSchema here is JsonSchemaProperty

  // Extract layout and groups for the current level (object or root)
  const currentLevelLayout = parentSchema?.['ui:layout'];
  const currentLevelGroups = parentSchema?.['ui:groups'];


  for (const key of fieldOrder) {
    if (!properties.hasOwnProperty(key)) continue;

    const property = properties[key];
    let currentPath = key;
    if (parentPath) {
      currentPath = `${parentPath}.${key}`;
    }

    const field: NormalizedFormField = {
      id: currentPath,
      type: property.type,
      label: property.title || key, // Use title or fallback to key
      isRequired: parentRequired.includes(key),
      defaultValue: property.default,
      placeholder: property['ui:placeholder'] || property.description, // Prefer ui:placeholder, fallback to description
      helpText: property['ui:help'] || property.description, // Prefer ui:help, fallback to description
      validationRules: {},
      uiHints: {},
      // fieldLayout specific to this field
      fieldLayout: property['ui:fieldLayout'],
    };
    
    // If this is the first field being processed for the root schema, attach root layout/groups
    // This is a bit tricky. A better way might be for parseJsonSchemaToFormFields to return an object
    // { fields: NormalizedFormField[], layout?: LayoutConfig, groups?: FormGroupConfig[] }
    // For now, let's attach to the field if it's an object type itself.
    if (property.type === 'object') {
        field.layout = property['ui:layout'];
        field.groups = property['ui:groups'];
    }


    // Ensure validationRules is always an object
    field.validationRules = field.validationRules || {};

    // Populate validationRules
    if (property.minLength !== undefined) field.validationRules.minLength = property.minLength;
    if (property.maxLength !== undefined) field.validationRules.maxLength = property.maxLength;
    if (property.minimum !== undefined) field.validationRules.min = property.minimum; // from JsonSchemaProperty
    if (property.maximum !== undefined) field.validationRules.max = property.maximum; // from JsonSchemaProperty
    if (property.pattern) field.validationRules.pattern = property.pattern;
    if (property.format) field.validationRules.format = property.format;
    // For arrays:
    if (property.type === 'array') {
      if (property.minItems !== undefined) field.validationRules.minItems = property.minItems;
      if (property.maxItems !== undefined) field.validationRules.maxItems = property.maxItems;
    }
    if (property.enum) {
      if (property['ui:options']?.enumNames) {
        field.validationRules.enum = property.enum.map((value, index) => ({
          value,
          label: property['ui:options']?.enumNames?.[index] || String(value),
        }));
      } else {
        field.validationRules.enum = property.enum;
      }
    }

    // Populate uiHints
    if (property['ui:widget']) field.uiHints!.widget = property['ui:widget'];
    if (property['ui:disabled']) field.uiHints!.disabled = property['ui:disabled'];
    if (property['ui:readonly']) field.uiHints!.readonly = property['ui:readonly'];
    if (property['ui:options']) field.uiHints!.options = property['ui:options'];
    if (property['ui:emptyValue'] !== undefined) field.uiHints!.emptyValue = property['ui:emptyValue'];
    // ui:order is handled by iterating in `fieldOrder`
    
    // Populate validationMessages if provided in schema (e.g., via 'ui:validationMessages')
    if (property['ui:validationMessages']) {
      field.validationMessages = property['ui:validationMessages'];
    }
    
    // Populate field specific layout hints
    if (property['ui:fieldLayout']) {
        field.fieldLayout = property['ui:fieldLayout'];
    }

    // Handle nested objects
    if (property.type === 'object' && property.properties) {
      // Pass the property itself as parentSchema for its properties' ordering and layout hints
      field.properties = processProperties(property.properties, currentPath, property.required || [], property);
      // Also assign layout and groups if defined on this object property itself
      field.layout = property['ui:layout'];
      field.groups = property['ui:groups'];
    }

    // Handle arrays
    if (property.type === 'array' && property.items) {
      // property.items can be JsonSchemaProperty or { type: string }
      const itemSchema = property.items;
      if (
        typeof itemSchema === 'object' &&
        itemSchema.type === 'object' &&
        (itemSchema as JsonSchemaProperty).properties
      ) {
        // Array of complex objects
        // Pass itemSchema as parentSchema for its properties' ordering
        field.itemSchema = processProperties(
          (itemSchema as JsonSchemaProperty).properties!,
          '',
          (itemSchema as JsonSchemaProperty).required || [],
          itemSchema as JsonSchemaProperty
        );
      } else if (typeof itemSchema === 'object') {
        // Array of simple types (string, number, etc.) or a basic object without further nesting for this example
        field.itemSchema = {
          id: '$item', // Placeholder ID for array item schema
          type: itemSchema.type,
          label: (itemSchema as JsonSchemaProperty).title || 'Item', // Generic label for array item
          isRequired: false, // Item itself isn't "required" in the same way a field is, but its properties might be
          defaultValue: (itemSchema as JsonSchemaProperty).default,
          placeholder: (itemSchema as JsonSchemaProperty)['ui:placeholder'] || (itemSchema as JsonSchemaProperty).description,
          helpText: (itemSchema as JsonSchemaProperty)['ui:help'] || (itemSchema as JsonSchemaProperty).description,
          validationRules: {
            ...(typeof (itemSchema as JsonSchemaProperty).minLength === 'number' && { minLength: (itemSchema as JsonSchemaProperty).minLength }),
            ...(typeof (itemSchema as JsonSchemaProperty).maxLength === 'number' && { maxLength: (itemSchema as JsonSchemaProperty).maxLength }),
            ...(typeof (itemSchema as JsonSchemaProperty).minimum === 'number' && { min: (itemSchema as JsonSchemaProperty).minimum }),
            ...(typeof (itemSchema as JsonSchemaProperty).maximum === 'number' && { max: (itemSchema as JsonSchemaProperty).maximum }),
            ...((itemSchema as JsonSchemaProperty).pattern && { pattern: (itemSchema as JsonSchemaProperty).pattern }),
            ...((itemSchema as JsonSchemaProperty).format && { format: (itemSchema as JsonSchemaProperty).format }),
            ...((itemSchema as JsonSchemaProperty).enum && { enum: (itemSchema as JsonSchemaProperty).enum }),
            // minItems/maxItems for items of an array (if items are themselves arrays - less common for simple forms)
            ...((itemSchema as JsonSchemaProperty).minItems !== undefined && { minItems: (itemSchema as JsonSchemaProperty).minItems }),
            ...((itemSchema as JsonSchemaProperty).maxItems !== undefined && { maxItems: (itemSchema as JsonSchemaProperty).maxItems }),
          },
          uiHints: {
            ...((itemSchema as JsonSchemaProperty)['ui:widget'] && { widget: (itemSchema as JsonSchemaProperty)['ui:widget'] }),
            ...((itemSchema as JsonSchemaProperty)['ui:disabled'] && { disabled: (itemSchema as JsonSchemaProperty)['ui:disabled'] }),
            ...((itemSchema as JsonSchemaProperty)['ui:readonly'] && { readonly: (itemSchema as JsonSchemaProperty)['ui:readonly'] }),
            ...((itemSchema as JsonSchemaProperty)['ui:options'] && { options: (itemSchema as JsonSchemaProperty)['ui:options'] }),
          },
        };
      }
    }
    fields.push(field);
  }
  return fields;
}

// Example Usage (can be moved to a test file)
/*
const sampleSchema: JsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Test Form",
  type: "object",
  required: ["name", "age"],
  properties: {
    name: {
      type: "string",
      title: "Full Name",
      minLength: 3,
      'ui:widget': "text",
      description: "Please enter your full name."
    },
    age: {
      type: "integer",
      title: "Age",
      minimum: 18,
      default: 25,
      'ui:placeholder': "Enter your age"
    },
    bio: {
      type: "string",
      title: "Biography",
      'ui:widget': "textarea",
      'ui:help': "Tell us something about yourself."
    },
    isStudent: {
      type: "boolean",
      title: "Are you a student?",
      default: false
    },
    contact: {
      type: "object",
      title: "Contact Information",
      required: ["email"],
      properties: {
        email: {
          type: "string",
          format: "email",
          title: "Email Address"
        },
        phone: {
          type: "string",
          title: "Phone Number"
        }
      }
    },
    hobbies: {
      type: "array",
      title: "Hobbies",
      items: {
        type: "string",
        title: "Hobby",
        'ui:widget': "text"
      }
    },
    favoriteColor: {
      type: "string",
      title: "Favorite Color",
      enum: ["red", "green", "blue"],
      'ui:widget': "select",
      'ui:options': {
        enumNames: ["Red", "Green", "Blue"]
      }
    }
  }
};

const normalizedFields = parseJsonSchemaToFormFields(sampleSchema);
console.log(JSON.stringify(normalizedFields, null, 2));
*/
