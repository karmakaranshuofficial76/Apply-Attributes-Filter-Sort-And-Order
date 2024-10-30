import { evaluateNestedFilterLogicalExpression } from "./evaluate";

export const applyStringEqualsFilter = (recordValue: string, filter: any) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? filter.isCaseSensitive
      ? filter.values === recordValue
      : filter.values
          .map((val) => val.toLowerCase())
          .includes(recordValue?.toLowerCase())
    : true;

export const applyContainsFilter = (recordValue: string, filter: any) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? filter.isCaseSensitive
      ? recordValue.includes(filter.value)
      : recordValue?.toLowerCase().includes(filter.value?.toLowerCase())
    : true;

export const applyTimeRangeFilter = (recordValue: string, filter: any) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? new Date(recordValue) >= new Date(filter.range.left) &&
      new Date(recordValue) <= new Date(filter.range.right)
    : true;

export const checkAndApplyStringEqualsFilter = (
  recordValue: string,
  filter: any
) =>
  recordValue !== undefined
    ? applyStringEqualsFilter(recordValue, filter)
    : false;

export const checkAndApplyContainsFilter = (recordValue: string, filter: any) =>
  recordValue !== undefined ? applyContainsFilter(recordValue, filter) : false;

export const checkAndApplyTimeRangeFilter = (
  recordValue: string,
  filter: any
) =>
  recordValue !== undefined ? applyTimeRangeFilter(recordValue, filter) : false;

export const checkAndApplyIsNullFilters = (recordValue: string, filter: any) =>
  filter.shouldApply === undefined || filter.shouldApply === true
    ? filter.value
      ? recordValue === null
      : recordValue !== null
    : true;

export const skipPropertiesToCheck = <T>(
  filters: Array<T>,
  indexOfPropertyNameToSkip: number
) => ({
  ...filters[indexOfPropertyNameToSkip],
  shouldApply: false,
});

export const checkAndApplyNestedFilters = (
  recordValue: any,
  filters: any,
  logicalExpression: string,
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
