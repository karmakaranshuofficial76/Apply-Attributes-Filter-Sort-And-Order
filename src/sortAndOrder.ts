import { orderBy } from "lodash";
import { getPropertyValue } from "./getPropertyValue";
import { Order } from "./models/models";

/**
 * 
 * @param record 
 * @param properties 
 * @param order 
 * @returns 
 */
export const defaultSortAndOrtder = <T>(record: Array<T>, properties: string[], order: [Order.asc | Order.desc]) =>
  orderBy(record, properties, order);

export const getInvertedOrderValue = (orderByValue: string) =>
  orderByValue === "DESC" ? "ASC" : "DESC";

export const getInvertedOrderValues = <T>(orderByCollection:Array<T>) =>
  orderByCollection.map((orderBy) => (orderBy === "DESC" ? "ASC" : "DESC"));

export const mapOrderForDefaultSortWithoutInversion = (
  orderByCollection: Array<string>
) => orderByCollection.map((orderBy) => orderBy.toLowerCase());

export const getMappedSortByPropertyNameForIndirectReferenceInData = <T>(
  indirectReference = false,
  propertyPath: string,
  source: T,
  propertyNameMapper = null
) =>
  indirectReference
    ? propertyNameMapper[source[propertyPath]]
    : propertyNameMapper !== null
    ? propertyNameMapper[propertyPath]
    : propertyPath;

export const mapOrderForDefaultSortWithInversion = (
  orderByCollection: Array<string>,
  sortByCollection: Array<string>,
  inversionOrderByPropertyName: string,
  orderToInvert: string,
  order: string
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

export const mapOrderForDefaultSort = (
  orderByCollection: string[],
  sortByCollection: string[] = null,
  requireOrderInversion = false,
  inversionOrderByPropertyName: string = null,
  orderToInvert: string = null,
  order: string = null
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

export const compareAndSortStringValues = (
  firstPropertyValue: string,
  secondPropertyValue: string,
  orderBy: string
) => {
  if (!firstPropertyValue) return orderBy === "DESC" ? -1 : 1;
  if (!secondPropertyValue) return orderBy === "DESC" ? 1 : -1;
  if (firstPropertyValue === secondPropertyValue) return 0;
  return orderBy === "DESC"
    ? secondPropertyValue.localeCompare(firstPropertyValue)
    : firstPropertyValue.localeCompare(secondPropertyValue);
};

export const compareAndSortNumericValues = (
  firstPropertyValue: number,
  secondPropertyValue: number,
  orderBy: string
) => {
  if (!firstPropertyValue) return orderBy === "DESC" ? -1 : 1;
  if (!secondPropertyValue) return orderBy === "DESC" ? 1 : -1;
  if (firstPropertyValue === secondPropertyValue) return 0;
  return orderBy === "DESC"
    ? secondPropertyValue - firstPropertyValue
    : firstPropertyValue - secondPropertyValue;
};

export const sortAndOrder = <T>(
  record: Array<T>,
  propertyPath: string,
  orderBy: string,
  propertyNameMapper: any,
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
