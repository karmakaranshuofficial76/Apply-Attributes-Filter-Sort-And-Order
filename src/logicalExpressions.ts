export const generateDefaultLogicalExpression = (filters: Array<any>) =>
  `(${filters.map((filter, index) => `$${index}`).join(` & `)})`;

export const modifyLogicalExpression = (logicalExpression: string) => {
  logicalExpression = logicalExpression.replace("&", "&&");
  logicalExpression = logicalExpression.replace("|", "||");
  return logicalExpression;
};
