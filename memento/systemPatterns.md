# System Patterns

*This document describes the system architecture, key technical decisions, design patterns in use, and component relationships.*

## System Architecture Overview
The system revolves around dynamic form generation based on a JSON schema.
1.  A JSON schema defines the structure, validation, and UI hints for a form.
2.  The `formSchemaParser.ts` utility normalizes this JSON schema into a consistent structure (`NormalizedFormField[]`) suitable for rendering.
3.  The `DynamicForm.tsx` React component consumes this normalized schema and dynamically renders form controls.
4.  A plugin-based architecture allows for extensible and customizable rendering of different field types.

## Key Technical Decisions
- **Schema-Driven UI**: Forms are defined declaratively via JSON schema, promoting separation of concerns.
- **Normalization Layer**: The `formSchemaParser` acts as an adapter between raw JSON schema and the form rendering components, simplifying the renderer's logic.
- **Plugin-Based Rendering**: Field rendering is handled by plugins, making it easy to add support for new field types or override existing ones without modifying the core `DynamicForm` component.
- **Tailwind CSS for Styling**: Utility-first CSS framework for consistent and maintainable styling.

## Design Patterns
- **Adapter Pattern**: `formSchemaParser.ts` adapts the JSON schema to the `NormalizedFormField` interface expected by `DynamicForm`.
- **Strategy Pattern / Plugin Pattern**: The field rendering mechanism, where different field types (strategies/plugins) can be swapped in and out.
- **Composition**: React components are composed to build the form and its fields.
- **State Management**: Centralized form state (`formData`, `formErrors`) within the `DynamicForm` component.

## Component Relationships
```mermaid
graph TD
    A[JSON Schema] --> B(formSchemaParser.ts);
    B -- Normalized Schema (NormalizedFormField[]) --> C{DynamicForm Component};

    subgraph DynamicForm Component
        C -- Manages --> FormDataState[formData (State)];
        C -- Manages --> FormErrorsState[formErrors (State)];
        C -- Uses --> RenderLogic[Field Rendering Logic];
        RenderLogic -- Uses --> PluginSystem[Plugin System];
        PluginSystem -- Selects --> FieldPlugin[Field Rendering Plugin (e.g., StringField, ArrayField)];
        FieldPlugin -- Renders --> UIControl[UI Control (e.g., input, select)];
        UIControl -- onChange --> C;
        C -- onSubmit --> SubmissionHandler;
        SubmissionHandler -- Validates --> ValidationLogic;
        ValidationLogic -- Updates --> FormErrorsState;
    end

    UserPlugins[Custom User Plugins] --> PluginSystem;
    DefaultPlugins[Default Field Plugins] --> PluginSystem;

    style B fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style PluginSystem fill:#lightgreen,stroke:#333,stroke-width:2px
```
