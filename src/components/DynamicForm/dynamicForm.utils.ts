import { FormData, FormErrors } from './dynamicForm.types'; // Added FormErrors
import { NormalizedFormField } from '../../utils/formSchemaParser';

/**
 * Helper function to deeply set a value in a nested object based on a path string.
 */
export function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = /^\d+$/.test(keys[index + 1]) ? [] : {};
      }
      current = current[key];
    }
  });
}

/**
 * Helper function to deeply get a value from a nested object based on a path string.
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Initializes form data based on schema defaults and initial values.
 */
export function initializeFormData(
  schema: NormalizedFormField[],
  initialValues?: Record<string, any>
): FormData {
  const formData: FormData = {};
  schema.forEach(field => {
    const initialValue = initialValues ? getNestedValue(initialValues, field.id) : undefined;
    if (initialValue !== undefined) {
      setNestedValue(formData, field.id, initialValue);
    } else if (field.defaultValue !== undefined) {
      setNestedValue(formData, field.id, field.defaultValue);
    } else if (field.type === 'object' && field.properties) {
      const nestedObject = {};
      setNestedValue(formData, field.id, nestedObject);
      initializeProperties(field.properties, field.id, initialValues, nestedObject);
    } else if (field.type === 'array') {
      const arrayInitialValue = initialValues ? getNestedValue(initialValues, field.id) : undefined;
      setNestedValue(formData, field.id, Array.isArray(arrayInitialValue) ? arrayInitialValue : []);
    }
  });
  return formData;
}

function initializeProperties(
  properties: NormalizedFormField[],
  parentPath: string,
  initialValues: Record<string, any> | undefined,
  targetObject: Record<string, any>
) {
  properties.forEach(prop => {
    const fullPathForInitialValueLookup = parentPath + '.' + prop.id;
    const initialValue = initialValues ? getNestedValue(initialValues, fullPathForInitialValueLookup) : undefined;
    if (initialValue !== undefined) {
      targetObject[prop.id] = initialValue;
    } else if (prop.defaultValue !== undefined) {
      targetObject[prop.id] = prop.defaultValue;
    } else if (prop.type === 'object' && prop.properties) {
      const nestedObject = {};
      targetObject[prop.id] = nestedObject;
      initializeProperties(prop.properties, fullPathForInitialValueLookup, initialValues, nestedObject);
    } else if (prop.type === 'array') {
      const arrayInitialValue = initialValues ? getNestedValue(initialValues, fullPathForInitialValueLookup) : undefined;
      targetObject[prop.id] = Array.isArray(arrayInitialValue) ? arrayInitialValue : [];
    }
  });
}

/**
 * Validates form data against the schema.
 */
export function validateFormData(
  schema: NormalizedFormField[],
  formData: FormData
): FormErrors {
  const errors: FormErrors = {};

  function validateRule(value: any, ruleValue: any, defaultMessage: string, condition: boolean, customMessage?: string) {
    if (condition) {
      return customMessage || defaultMessage;
    }
    return undefined; // Explicitly return undefined
  }
  
  function validateRequired(field: NormalizedFormField, value: any, path: string): boolean {
    if (field.isRequired && (value === undefined || value === null || value === '')) {
      errors[path] = field.validationMessages?.required || 'This field is required.';
      return true;
    }
    if (!field.isRequired && (value === undefined || value === null || value === '')) {
      return true;
    }
    return false;
  }

  function validateString(field: NormalizedFormField, value: any, path: string, rules: any): boolean {
    let errorMessage: string | undefined;
    if (typeof value === 'string') {
      errorMessage = validateRule(
        value.length,
        rules.minLength,
        'Should be at least ' + rules.minLength + ' characters.',
        rules.minLength !== undefined && value.length < rules.minLength,
        field.validationMessages?.minLength
      );
      if (errorMessage) { errors[path] = errorMessage; return true; }

      errorMessage = validateRule(
        value.length,
        rules.maxLength,
        'Should be at most ' + rules.maxLength + ' characters.',
        rules.maxLength !== undefined && value.length > rules.maxLength,
        field.validationMessages?.maxLength
      );
      if (errorMessage) { errors[path] = errorMessage; return true; }

      errorMessage = validateRule(
        value,
        rules.pattern,
        'Invalid format.',
        rules.pattern !== undefined && !new RegExp(rules.pattern).test(value),
        field.validationMessages?.pattern
      );
      if (errorMessage) { errors[path] = errorMessage; return true; }
    }
    return false;
  }

  function validateNumber(field: NormalizedFormField, value: any, path: string, rules: any): boolean {
    let errorMessage: string | undefined;
    if (typeof value === 'number') {
      errorMessage = validateRule(
        value,
        rules.min,
        'Should be at least ' + rules.min + '.',
        rules.min !== undefined && value < rules.min,
        field.validationMessages?.min
      );
      if (errorMessage) { errors[path] = errorMessage; return true; }

      errorMessage = validateRule(
        value,
        rules.max,
        'Should be at most ' + rules.max + '.',
        rules.max !== undefined && value > rules.max,
        field.validationMessages?.max
      );
      if (errorMessage) { errors[path] = errorMessage; return true; }

      if (field.type === 'integer' && !Number.isInteger(value)) {
        errors[path] = field.validationMessages?.type || 'Should be an integer.';
        return true;
      }
    }
    return false;
  }

  function validateArray(field: NormalizedFormField, value: any, path: string, rules: any): boolean {
    let errorMessage: string | undefined;
    if (Array.isArray(value)) {
      errorMessage = validateRule(
        value.length,
        rules.minItems,
        'Should have at least ' + rules.minItems + ' items.',
        rules.minItems !== undefined && value.length < rules.minItems,
        field.validationMessages?.minItems
      );
      if (errorMessage) { errors[path] = errorMessage; return true; }

      errorMessage = validateRule(
        value.length,
        rules.maxItems,
        'Should have at most ' + rules.maxItems + ' items.',
        rules.maxItems !== undefined && value.length > rules.maxItems,
        field.validationMessages?.maxItems
      );
      if (errorMessage) { errors[path] = errorMessage; return true; }
    }
    return false;
  }

  function validateField(field: NormalizedFormField, value: any, path: string) {
    if (validateRequired(field, value, path)) {
      return;
    }
    const rules = field.validationRules;
    if (rules) {
      if (validateString(field, value, path, rules)) return;
      if (validateNumber(field, value, path, rules)) return;
      if (validateArray(field, value, path, rules)) return;
    }
  }

  function traverseSchema(currentFields: NormalizedFormField[], currentPathPrefix: string = '') {
    currentFields.forEach(field => {
      const path = currentPathPrefix ? currentPathPrefix + '.' + field.id : field.id; // Using string concatenation
      const value = getNestedValue(formData, path);
      
      validateField(field, value, path);

      if (field.type === 'object' && field.properties && typeof value === 'object' && value !== null) {
        traverseSchema(field.properties, path);
      }
      // Array item validation (conceptual)
      // if (field.type === 'array' && field.itemSchema && Array.isArray(value)) {
      //   value.forEach((item, index) => {
      //     const itemPath = \`\${path}[\${index}]\`;
      //     if (typeof field.itemSchema === 'object' && !Array.isArray(field.itemSchema)) { // Check if itemSchema is NormalizedFormField
      //        validateField(field.itemSchema as NormalizedFormField, item, itemPath);
      //     }
      //   });
      // }
    });
  }

  traverseSchema(schema);
  return errors;
}
