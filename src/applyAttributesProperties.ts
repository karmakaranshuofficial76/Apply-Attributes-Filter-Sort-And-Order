import { pick } from "lodash";
export const applyDirectAttributesMapping = <T>(records: Array<T>, attributes: Array<string>) =>
  records?.length > 0 && attributes?.length > 0
    ? records.map((record) => pick(record, attributes))
    : records;

export const applyAttributesToDataPathMapping = <T>(
  records: Array<T>,
  attributes: Array<string>,
  attributesMapper
) =>
  records?.length > 0 && attributes?.length > 0 && attributesMapper
    ? records.map((record) => pick(record, attributes.map(attribute => attributesMapper[attribute])))
    : records;

export const checkAndApplyAttributesMapping = <T>(
  records: Array<T>,
  attributes: Array<string>,
  attributesMapper = null
) =>
  attributesMapper === null
    ? applyDirectAttributesMapping(records, attributes)
    : applyAttributesToDataPathMapping(records, attributes, attributesMapper);
