export const MongooseErrorMessage = {
  defaultDtoValidation: (serviceName: string) =>
    `defaultDto argument in ${serviceName} is not a class constructor`,
  toDtoValidation: (methodName: string) =>
    `toDto argument in calling ${methodName} method is not a class constructor`,
  modelNotFound: (
    methodName: string,
    modelName: string,
    decription: string = '',
  ) =>
    `${methodName} ::: ${modelName} not found ${decription !== '' ? ` => ${decription}` : ''}`,
  serviceInstance: (className: string) =>
    `Object is not instance of ${className}`,
  modelDuplicate: (methodName: string, modelName: string) =>
    `${methodName} ::: ${modelName} is duplicated ::: Pls check model indexes`,
  unsupportedFilterOperator: (field: string, operator: string) =>
    `${operator} operator on field ${field} is not supported`,
  invalidFilterValue: (field: string, expected: string) =>
    `value of the filter on field ${field} must be ${expected}`,
  unfilterableField: (field: string, modelName: string) =>
    `${field} is not a filterable field of ${modelName}`,
  unsortableField: (field: string, modelName: string) =>
    `${field} is not a sortable field of ${modelName}`,
  filterValueTooLong: (field: string, max: number) =>
    `value of the filter on field ${field} must be at most ${max} characters`,
  emptyBulkPayload: (methodName: string) =>
    `${methodName} ::: data argument must be a non empty array`,
};
