import React from 'react';
import { ButtonComponent } from './ButtonComponent';
import { NumberComponent } from './NumberComponent';
import { SliderComponent } from './SliderComponent';
import { EnumComponent } from './EnumComponent';
import { MethodComponent } from './MethodComponent';
import { AsyncMethodComponent } from './AsyncMethodComponent';
import { StringComponent } from './StringComponent';
import { ListComponent } from './ListComponent';
import { DataServiceComponent, DataServiceJSON } from './DataServiceComponent';
import { ImageComponent } from './ImageComponent';
import { ColouredEnumComponent } from './ColouredEnumComponent';

type AttributeType =
  | 'str'
  | 'bool'
  | 'float'
  | 'int'
  | 'Quantity'
  | 'list'
  | 'method'
  | 'DataService'
  | 'Enum'
  | 'NumberSlider'
  | 'Image'
  | 'ColouredEnum';

type ValueType = boolean | string | number | object;
export interface Attribute {
  type: AttributeType;
  value?: ValueType | ValueType[];
  readonly: boolean;
  doc?: string | null;
  parameters?: Record<string, string>;
  async?: boolean;
  enum?: Record<string, string>;
}
type GenericComponentProps = {
  attribute: Attribute;
  name: string;
  parentPath: string;
  isInstantUpdate: boolean;
  addNotification: (message: string) => void;
};

export const GenericComponent = React.memo(
  ({
    attribute,
    name,
    parentPath,
    isInstantUpdate,
    addNotification
  }: GenericComponentProps) => {
    if (attribute.type === 'bool') {
      return (
        <ButtonComponent
          name={name}
          parentPath={parentPath}
          docString={attribute.doc}
          readOnly={attribute.readonly}
          value={Boolean(attribute.value)}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'float' || attribute.type === 'int') {
      return (
        <NumberComponent
          name={name}
          type={attribute.type}
          parentPath={parentPath}
          docString={attribute.doc}
          readOnly={attribute.readonly}
          value={Number(attribute.value)}
          isInstantUpdate={isInstantUpdate}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'Quantity') {
      return (
        <NumberComponent
          name={name}
          type="float"
          parentPath={parentPath}
          docString={attribute.doc}
          readOnly={attribute.readonly}
          value={Number(attribute.value['magnitude'])}
          unit={attribute.value['unit']}
          isInstantUpdate={isInstantUpdate}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'NumberSlider') {
      return (
        <SliderComponent
          name={name}
          parentPath={parentPath}
          docString={attribute.doc}
          readOnly={attribute.readonly}
          value={attribute.value['value']['value']}
          min={attribute.value['min']['value']}
          max={attribute.value['max']['value']}
          stepSize={attribute.value['step_size']['value']}
          isInstantUpdate={isInstantUpdate}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'Enum') {
      return (
        <EnumComponent
          name={name}
          parentPath={parentPath}
          docString={attribute.doc}
          value={String(attribute.value)}
          enumDict={attribute.enum}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'method') {
      if (!attribute.async) {
        return (
          <MethodComponent
            name={name}
            parentPath={parentPath}
            docString={attribute.doc}
            parameters={attribute.parameters}
            addNotification={addNotification}
          />
        );
      } else {
        return (
          <AsyncMethodComponent
            name={name}
            parentPath={parentPath}
            docString={attribute.doc}
            parameters={attribute.parameters}
            value={attribute.value as Record<string, string>}
            addNotification={addNotification}
          />
        );
      }
    } else if (attribute.type === 'str') {
      return (
        <StringComponent
          name={name}
          value={attribute.value as string}
          readOnly={attribute.readonly}
          docString={attribute.doc}
          parentPath={parentPath}
          isInstantUpdate={isInstantUpdate}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'DataService') {
      return (
        <DataServiceComponent
          name={name}
          props={attribute.value as DataServiceJSON}
          parentPath={parentPath}
          isInstantUpdate={isInstantUpdate}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'list') {
      return (
        <ListComponent
          name={name}
          value={attribute.value as Attribute[]}
          docString={attribute.doc}
          parentPath={parentPath}
          isInstantUpdate={isInstantUpdate}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'Image') {
      return (
        <ImageComponent
          name={name}
          parentPath={parentPath}
          value={attribute.value['value']['value'] as string}
          readOnly={attribute.readonly}
          docString={attribute.doc}
          // Add any other specific props for the ImageComponent here
          format={attribute.value['format']['value'] as string}
          addNotification={addNotification}
        />
      );
    } else if (attribute.type === 'ColouredEnum') {
      console.log(attribute);
      return (
        <ColouredEnumComponent
          name={name}
          parentPath={parentPath}
          docString={attribute.doc}
          value={String(attribute.value)}
          readOnly={attribute.readonly}
          enumDict={attribute.enum}
          addNotification={addNotification}
        />
      );
    } else {
      return <div key={name}>{name}</div>;
    }
  }
);
