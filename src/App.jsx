import React from 'react';
import DynamicForm from './components/DynamicForm/DynamicForm'; // Adjust path as needed
import { parseJsonSchemaToFormFields } from './utils/formSchemaParser'; // Adjust path
import './index.css'; // Adjust path as needed

// Sample JSON Schema
const sampleSchema = {
  title: "User Registration Form",
  type: "object",
  required: ["fullName", "email", "age"],
  properties: {
    fullName: {
      type: "string",
      title: "Full Name",
      minLength: 3,
      description: "Please enter your full name.",
      'ui:placeholder': "John Doe",
      'ui:validationMessages': {
        required: "Full name is absolutely required!",
        minLength: "Name must be longer than 2 characters."
      }
    },
    email: {
      type: "string",
      title: "Email Address",
      format: "email",
      description: "We'll never share your email.",
      'ui:validationMessages': {
        required: "Email cannot be empty.",
        pattern: "Please enter a valid email address." // Assuming pattern validation for email format
      }
    },
    age: {
      type: "integer",
      title: "Age",
      minimum: 18,
      maximum: 99,
      description: "Must be 18 or older.",
      'ui:validationMessages': {
        minimum: "You must be at least 18 years old.",
        maximum: "Age cannot exceed 99."
      }
    },
    bio: {
      type: "string",
      title: "Biography",
      'ui:widget': "textarea",
      maxLength: 500,
      description: "Tell us a bit about yourself."
    },
    isStudent: {
      type: "boolean",
      title: "Are you currently a student?",
      default: false
    },
    country: {
      type: "string",
      title: "Country",
      enum: ["USA", "Canada", "UK", "Australia", "Other"],
      'ui:widget': "select",
      'ui:options': {
        enumNames: ["United States", "Canada", "United Kingdom", "Australia", "Other"]
      },
      'ui:emptyValue': "", // Explicitly set empty value for select
      'ui:placeholder': "Select your country"
    },
    contactDetails: {
      type: "object",
      title: "Contact Details",
      properties: {
        address: {
          type: "object",
          title: "Address",
          properties: {
            street: { type: "string", title: "Street" },
            city: { type: "string", title: "City" }
          }
        }
      }
    },
    hobbies: {
      type: "array",
      title: "Hobbies",
      minItems: 1,
      items: {
        type: "string",
        title: "Hobby",
        minLength: 2
      },
      'ui:validationMessages': {
        minItems: "Please list at least one hobby."
      }
    }
  }
};

function App() {
  // State for schema and initial values (to allow updating on import)
  const [schema, setSchema] = React.useState(sampleSchema);
  const [initialFormValues, setInitialFormValues] = React.useState({
    fullName: "Jane Doe",
    age: 30,
    isStudent: true,
    hobbies: ["reading", "hiking"]
  });

  // Export handler
  const handleExport = () => {
    const data = {
      schema,
      initialValues: initialFormValues
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "form-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import handler
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.schema) setSchema(data.schema);
        if (data.initialValues) setInitialFormValues(data.initialValues);
      } catch (err) {
        console.error("Error parsing imported JSON:", err);
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Normalize the schema
  // The parseJsonSchemaToFormFields expects a JsonSchema type, ensure sampleSchema conforms or cast
  const normalizedSchema = parseJsonSchemaToFormFields(schema);

  const handleSubmit = (formData) => {
    console.log("Form Submitted Data:", formData);
    alert("Form submitted! Check the console for the data.");
  };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>{schema.title}</h1>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={handleExport} className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          Export Config
        </button>
        <label className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 cursor-pointer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Import Config</span>
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </label>
      </div>
      <DynamicForm
        schema={normalizedSchema}
        onSubmit={handleSubmit}
        initialValues={initialFormValues}
      />
    </div>
  );
}

export default App;
