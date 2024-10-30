import {
  checkAndApplyContainsFilter,
  checkAndApplyIsNullFilters,
  checkAndApplyStringEqualsFilter,
  checkAndApplyTimeRangeFilter,
  checkAndApplyNestedFilters,
} from "./applyFilters";
import { getPropertyValue } from "./getPropertyValue";
import { modifyLogicalExpression } from "./logicalExpressions";

/**
 *
 * @param record
 * @param filter
 * @param dataPath
 * @param nestedFiltersPath
 * @returns
 */
export const evaluateFilterPath = (
  record: any,
  filter: any,
  dataPath: { [x: string]: any },
  nestedFiltersPath: any
) => {
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

/**
 *
 * @param record
 * @param filter
 * @param nestedFiltersPath
 * @returns
 */
export const evaluateFilter = (
  record: { [x: string]: any },
  filter: {
    type: any;
    propertyName: string | number;
    groupFilter: { filters: any; logicalExpression: any };
  },
  nestedFiltersPath: any
) => {
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

/**
 *
 * @param record
 * @param logicalExpression
 * @param filters
 * @param dataPath
 * @param nestedFiltersPath
 * @returns
 */
export const evaluateLogicalExpression = (
  record: Array<any>,
  logicalExpression: string,
  filters: Array<any>,
  dataPath: { [x: string]: any },
  nestedFiltersPath: any
) => {
  const filterResults = filters.reduce(
    (acc: { [x: string]: any }, filter: any, index: number) => {
      acc[`$${index}`] = dataPath
        ? evaluateFilterPath(record, filter, dataPath, nestedFiltersPath)
        : evaluateFilter(record, filter, nestedFiltersPath);
      return acc;
    },
    {}
  );
  const expression = logicalExpression.replace(/\$(\d+)/g, (match) =>
    filterResults[match] ? "true" : "false"
  );
  return new Function("return" + expression)();
};

export const evaluateNestedFilterLogicalExpression = (
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
