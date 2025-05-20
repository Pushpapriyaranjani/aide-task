import React, { JSX } from 'react';
import { LayoutConfig, FormGroupConfig } from '../../utils/formSchemaParser';
import { NormalizedFormField } from '../../utils/formSchemaParser';

interface LayoutRendererProps {
  layout?: LayoutConfig;
  groups?: FormGroupConfig[];
  fields: NormalizedFormField[];
  renderField: (fieldSchema: NormalizedFormField) => JSX.Element | null;
}

const LayoutRenderer: React.FC<LayoutRendererProps> = ({
  layout,
  groups,
  fields,
  renderField,
}) => {
  const findFieldById = (id: string): NormalizedFormField | undefined => {
    const searchFields = (currentFields: NormalizedFormField[], targetId: string): NormalizedFormField | undefined => {
      for (const field of currentFields) {
        if (field.id === targetId) return field;
        if (field.properties) {
          const foundInProperties = searchFields(field.properties, targetId);
          if (foundInProperties) return foundInProperties;
        }
      }
      return undefined;
    };
    return searchFields(fields, id);
  };

  if (groups && groups.length > 0) {
    return (
      <>
        {groups.map((group) => {
          const groupFields = group.fields
            .map(fieldId => findFieldById(fieldId))
            .filter(Boolean) as NormalizedFormField[];
          
          const groupLayout = group.layout || layout;

          let currentGroupContainerClasses = "mb-6 p-4 border border-gray-200 rounded-md";
          if (group.className) {
            currentGroupContainerClasses += ' ' + group.className;
          }

          let currentGroupFieldContainerClasses = "";
          if (groupLayout?.type === 'grid' && groupLayout.columns) {
            currentGroupFieldContainerClasses = 'grid grid-cols-' + groupLayout.columns + ' gap-' + (groupLayout.gap || 4);
          } else if (groupLayout?.type === 'flex') {
            currentGroupFieldContainerClasses = 'flex flex-' + (groupLayout.direction || 'col') + ' flex-wrap gap-' + (groupLayout.gap || 4);
          }
          if (groupLayout?.className) {
            currentGroupFieldContainerClasses += ' ' + groupLayout.className;
          }

          return (
            <fieldset key={group.id} className={currentGroupContainerClasses}>
              {group.title && <legend className="text-lg font-medium text-gray-900 mb-2">{group.title}</legend>}
              {group.description && <p className="text-sm text-gray-500 mb-3">{group.description}</p>}
              <div className={currentGroupFieldContainerClasses || "space-y-4"}>
                {groupFields.map((field) => renderField(field))}
              </div>
            </fieldset>
          );
        })}
      </>
    );
  }

  let currentRootFieldContainerClasses = "space-y-4";
  if (layout) {
    if (layout.type === 'grid' && layout.columns) {
      currentRootFieldContainerClasses = 'grid grid-cols-' + layout.columns + ' gap-' + (layout.gap || 4);
    } else if (layout.type === 'flex') {
      currentRootFieldContainerClasses = 'flex flex-' + (layout.direction || 'col') + ' flex-wrap gap-' + (layout.gap || 4);
    }
    if (layout.className) {
        currentRootFieldContainerClasses += ' ' + layout.className;
    }
  }
  
  return (
    <div className={currentRootFieldContainerClasses}>
      {fields.map((field) => renderField(field))}
    </div>
  );
};

export default LayoutRenderer;
