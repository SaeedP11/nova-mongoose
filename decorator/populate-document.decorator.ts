import { assertMongooseService } from '../helper/assert-mongoose-service.helper';
import { PopulateOptions as MongoosePopulateOptions } from 'mongoose';
import { PopulateOptions } from '../type/populate-options.type';
import { isPaginationResult } from '../helper/is-pagination-result.helper';

export default function PopulateDocument() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function ({ populate, ...data }) {
      assertMongooseService(this);
      const result = await originalMethod.call(this, data);
      if (!result) return result;

      const populateOptions = resolvePopulateOptions(
        populate,
        this.defaultPopulate,
      );

      // Model.populate resolves every document in one query per path,
      // populating them one by one costs a query per document
      if (result instanceof Array) {
        await this.model.populate(result, populateOptions);
        return result;
      }

      if (isPaginationResult(result)) {
        await this.model.populate(result.items, populateOptions);
        return result;
      }

      return await result.populate(populateOptions);
    };
  };
}

function resolvePopulateOptions(
  populate: PopulateOptions | boolean,
  defaultPopulate: PopulateOptions,
): MongoosePopulateOptions[] {
  const selected =
    populate === false
      ? undefined
      : populate === true || populate === undefined
        ? defaultPopulate
        : (populate as PopulateOptions);

  const populateOptions = (
    !selected ? [] : selected instanceof Array ? [...selected] : [selected]
  ).map(toPopulateOption);

  // The owner is part of every document, so it is always populated
  if (!populateOptions.some(({ path }) => path === 'owner'))
    populateOptions.push({ path: 'owner' });

  return populateOptions;
}

function toPopulateOption(
  option: string | MongoosePopulateOptions,
): MongoosePopulateOptions {
  return typeof option === 'string' ? { path: option } : option;
}
