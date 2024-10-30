const orderBy = require("lodash/orderBy");
const pick = require("lodash/pick");

const generateDefaultLogicalExpression = (filters) =>
  `(${filters.map((filter, index) => `$${index}`).join(` & `)})`;

const modifyLogicalExpression = (logicalExpression) => {
  logicalExpression = logicalExpression.replace("&", "&&");
  logicalExpression = logicalExpression.replace("|", "||");
  return logicalExpression;
};

const applyDirectAttributesMapping = (records, attributes) =>
  records?.length > 0 && attributes?.length > 0
    ? records.map((record) => pick(record, attributes))
    : records;

const applyAttributesToDataPathMapping = (
  records,
  attributes,
  attributesMapper
) =>
  records?.length > 0 && attributes?.length > 0 && attributesMapper
    ? records.map((record) => pick(record, attributes))
    : records;

const checkAndApplyAttributesMapping = (
  records,
  attributes,
  attributesMapper = null
) =>
  attributesMapper === null
    ? applyDirectAttributesMapping(records, attributes)
    : applyAttributesToDataPathMapping(records, attributes, attributesMapper);

const defaultSortAndOrtder = (record, properties, order) =>
  orderBy(record, properties, order);

const getInvertedOrderValue = (orderByValue) =>
  orderByValue === "DESC" ? "ASC" : "DESC";

const getInvertedOrderValues = (orderByCollection) =>
  orderByCollection.map((orderBy) => (orderBy === "DESC" ? "ASC" : "DESC"));

const mapOrderForDefaultSortWithoutInversion = (orderByCollection) =>
  orderByCollection.map((orderBy) => orderBy.toLowerCase());

const getPropertyNamesByPath = (propertyPath) =>
  propertyPath
    .replace(/\[([^\[\]]*)\]/g, ".$1.")
    .split(".")
    .filter((pathToken) => pathToken !== "");

const getPropertyValueForNestedProperties = (record, properties) =>
  properties.reduce(
    (accumulator, current) => accumulator?.[current] ?? undefined,
    record
  );

const getPropertyValue = (record, propertyPath) =>
  propertyPath
    ? getPropertyValueForNestedProperties(
        record,
        getPropertyNamesByPath(propertyPath)
      )
    : undefined;

const getMappedSortByPropertyNameForIndirectReferenceInData = (
  indirectReference = false,
  propertyPath,
  source,
  propertyNameMapper = null
) =>
  indirectReference
    ? propertyNameMapper[source[propertyPath]]
    : propertyNameMapper !== null
    ? propertyNameMapper[propertyPath]
    : propertyPath;

const mapOrderForDefaultSortWithInversion = (
  orderByCollection,
  sortByCollection,
  inversionOrderByPropertyName,
  orderToInvert,
  order
) =>
  orderByCollection.map(
    (orderBy, index) =>
      (orderBy =
        index ===
          sortByCollection.findIndex(
            (sortBy) => sortBy === inversionOrderByPropertyName
          ) && orderBy === orderToInvert
          ? order.toLowerCase()
          : orderBy.toLowerCase())
  );

const mapOrderForDefaultSort = (
  orderByCollection,
  sortByCollection = null,
  requireOrderInversion = false,
  inversionOrderByPropertyName = null,
  orderToInvert = null,
  order = null
) =>
  requireOrderInversion
    ? mapOrderForDefaultSortWithInversion(
        orderByCollection,
        sortByCollection,
        inversionOrderByPropertyName,
        orderToInvert,
        order
      )
    : mapOrderForDefaultSortWithoutInversion(orderByCollection);

const compareAndSortStringValues = (
  firstPropertyValue,
  secondPropertyValue,
  orderBy
) => {
  if (!firstPropertyValue) return orderBy === "DESC" ? -1 : 1;
  if (!secondPropertyValue) return orderBy === "DESC" ? 1 : -1;
  if (firstPropertyValue === secondPropertyValue) return 0;
  return orderBy === "DESC"
    ? secondPropertyValue.localeCompare(firstPropertyValue)
    : firstPropertyValue.localeCompare(secondPropertyValue);
};

const compareAndSortNumericValues = (
  firstPropertyValue,
  secondPropertyValue,
  orderBy
) => {
  if (!firstPropertyValue) return orderBy === "DESC" ? -1 : 1;
  if (!secondPropertyValue) return orderBy === "DESC" ? 1 : -1;
  if (firstPropertyValue === secondPropertyValue) return 0;
  return orderBy === "DESC"
    ? secondPropertyValue - firstPropertyValue
    : firstPropertyValue - secondPropertyValue;
};

const sortAndOrder = (
  record,
  propertyPath,
  orderBy,
  propertyNameMapper,
  indirectReference = false
) =>
  record.sort((a, b) => {
    let firstPropertyValue = getPropertyValue(
      a,
      getMappedSortByPropertyNameForIndirectReferenceInData(
        indirectReference,
        propertyPath,
        a,
        propertyNameMapper
      )
    );
    let secondPropertyValue = getPropertyValue(
      b,
      getMappedSortByPropertyNameForIndirectReferenceInData(
        indirectReference,
        propertyPath,
        b,
        propertyNameMapper
      )
    );
    if (
      typeof firstPropertyValue === "string" ||
      typeof secondPropertyValue === "string"
    ) {
      return compareAndSortStringValues(
        firstPropertyValue,
        secondPropertyValue,
        orderBy
      );
    } else if (
      typeof firstPropertyValue === "number" ||
      typeof secondPropertyValue === "number"
    ) {
      return compareAndSortNumericValues(
        firstPropertyValue,
        secondPropertyValue,
        orderBy
      );
    }
  });

const applyStringEqualsFilter = (recordValue, filter) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? filter.isCaseSensitive
      ? filter.values === recordValue
      : filter.values
          .map((val) => val.toLowerCase())
          .includes(recordValue?.toLowerCase())
    : true;

const applyContainsFilter = (recordValue, filter) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? filter.isCaseSensitive
      ? recordValue.includes(filter.value)
      : recordValue?.toLowerCase().includes(filter.value?.toLowerCase())
    : true;

const applyTimeRangeFilter = (recordValue, filter) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? new Date(recordValue) >= new Date(filter.range.left) &&
      new Date(recordValue) <= new Date(filter.range.right)
    : true;

const checkAndApplyStringEqualsFilter = (recordValue, filter) =>
  recordValue !== undefined
    ? applyStringEqualsFilter(recordValue, filter)
    : false;

const checkAndApplyContainsFilter = (recordValue, filter) =>
  recordValue !== undefined ? applyContainsFilter(recordValue, filter) : false;

const checkAndApplyTimeRangeFilter = (recordValue, filter) =>
  recordValue !== undefined ? applyTimeRangeFilter(recordValue, filter) : false;

const checkAndApplyIsNullFilters = (recordValue, filter) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? filter.value
      ? recordValue === null
      : recordValue !== null
    : true;

const skipPropertiesToCheck = (filters, indexOfPropertyNameToSkip) => ({
  ...filters[indexOfPropertyNameToSkip],
  shouldApply: false,
});

const checkAndApplyNestedFilters = (
  recordValue,
  filters,
  logicalExpression,
  nestedFiltersPath
) => {
  return (filters?.length > 0 || logicalExpression) &&
    (filters.shouldApply === true || nestedFiltersPath)
    ? evaluateNestedFilterLogicalExpression(
        recordValue,
        logicalExpression,
        filters,
        nestedFiltersPath
      )
    : true;
};

evaluateFilterPath = (record, filter, dataPath, nestedFiltersPath) => {
  switch (filter.type) {
    case "contains":
      return checkAndApplyContainsFilter(
        getPropertyValue(record, dataPath[filter.propertyName]),
        filter
      );
    case "isNull":
      return checkAndApplyIsNullFilters(
        getPropertyValue(record, dataPath[filter.propertyName]),
        filter
      );
    case "stringEquals":
      return checkAndApplyStringEqualsFilter(
        getPropertyValue(record, dataPath[filter.propertyName]),
        filter
      );
    case "timeRange":
      return checkAndApplyTimeRangeFilter(
        getPropertyValue(record, dataPath[filter.propertyName]),
        filter
      );
    case "groupFilter":
      return checkAndApplyNestedFilters(
        record,
        filter.groupFilter.filters,
        modifyLogicalExpression(filter.groupFilter.logicalExpression),
        nestedFiltersPath
      );
  }
};

evaluateFilter = (record, filter, nestedFiltersPath) => {
  switch (filter.type) {
    case "contains":
      return checkAndApplyContainsFilter(record[filter.propertyName], filter);
    case "isNull":
      return checkAndApplyIsNullFilters(record[filter.propertyName], filter);
    case "stringEquals":
      return checkAndApplyStringEqualsFilter(
        record[filter.propertyName],
        filter
      );
    case "timeRange":
      return checkAndApplyTimeRangeFilter(record[filter.propertyName], filter);
    case "groupFilter":
      return checkAndApplyNestedFilters(
        record,
        filter.groupFilter.filters,
        modifyLogicalExpression(filter.groupFilter.logicalExpression),
        nestedFiltersPath
      );
  }
};

const evaluateNestedFilterLogicalExpression = (
  record,
  logicalExpression,
  filters,
  nestedFiltersPath
) => {
  if (nestedFiltersPath) {
    const filterResults = filters.reduce((acc, filter, index) => {
      acc[`$${index}`] = evaluateFilterPath(
        record,
        filter,
        nestedFiltersPath,
        null
      );
      return acc;
    }, {});
    const expression = logicalExpression.replace(/\$(\d+)/g, (match) =>
      filterResults[match] ? "true" : "false"
    );
    return new Function(" return " + expression)();
  }
};

const evaluateLogicalExpression = (
  record,
  logicalExpression,
  filters,
  dataPath,
  nestedFiltersPath
) => {
  const filterResults = filters.reduce((acc, filter, index) => {
    acc[`$${index}`] = dataPath
      ? evaluateFilterPath(record, filter, dataPath, nestedFiltersPath)
      : evaluateFilter(record, filter, nestedFiltersPath);
    return acc;
  }, {});
  const expression = logicalExpression.replace(/\$(\d+)/g, (match) =>
    filterResults[match] ? "true" : "false"
  );
  return new Function("return" + expression)();
};

const applyFilteringByExpressions = (
  records,
  filters,
  logicalExpression,
  dataPath,
  nestedFiltersPath
) =>
  records.filter((record) =>
    evaluateLogicalExpression(
      record,
      modifyLogicalExpression(logicalExpression),
      filters,
      dataPath,
      nestedFiltersPath
    )
  );

const checkAndApplyFiltering = (
  records,
  filters,
  logicalExpression,
  dataPath,
  nestedFiltersPath
) =>
  logicalExpression
    ? applyFilteringByExpressions(
        records,
        filters,
        logicalExpression,
        dataPath,
        nestedFiltersPath
      )
    : applyFilteringByExpressions(
        records,
        filters,
        generateDefaultLogicalExpression(logicalExpression),
        dataPath,
        nestedFiltersPath
      );

module.exports = {
  sortAndOrder,
  defaultSortAndOrtder,
  getInvertedOrderValue,
  mapOrderForDefaultSort,
  checkAndApplyFiltering,
  checkAndApplyAttributesMapping,
};
