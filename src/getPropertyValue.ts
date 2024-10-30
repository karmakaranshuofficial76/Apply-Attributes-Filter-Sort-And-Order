const getPropertyValueForNestedProperties = <T>(record: T, properties) =>
  properties.reduce(
    (accumulator, current) => accumulator?.[current] ?? undefined,
    record
  );

const getPropertyNamesByPath = (propertyPath) =>
  propertyPath
    .replace(/\[([^\[\]]*)\]/g, ".$1.")
    .split(".")
    .filter((pathToken) => pathToken !== "");

export const getPropertyValue = <T>(record: T, propertyPath) =>
  propertyPath
    ? getPropertyValueForNestedProperties(
        record,
        getPropertyNamesByPath(propertyPath)
      )
    : undefined;
