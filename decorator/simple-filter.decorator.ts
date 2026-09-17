import { BadRequestException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { assertMongooseService } from '../helper/assert-mongoose-service.helper';
import { isFilterableField } from '../helper/filterable-props.helper';
import { PaginateOptions } from '../type/paginate-options.type';
import { ISimpleFilter } from '../interface/simple-filter.interface';
import { SimpleFilterOperator } from '../enum/simple-filter-operator.enum';
import { MongooseErrorMessage } from '../constant/mongoose-error-message.const';

/**
 * A pattern is compiled and then matched against every scanned document, so
 * an unbounded one supplied by a client is a cheap way to burn CPU.
 */
const MAX_PATTERN_LENGTH = 256;

export default function SimpleFilter() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function ({
      simpleFilter,
      simpleSearch,
      ...arg
    }: PaginateOptions) {
      assertMongooseService(this);
      assertFilterableFields(
        this.filterableProps,
        this.model.modelName,
        simpleFilter,
        simpleSearch,
      );

      const conditions = simpleFilterMapper(simpleFilter, simpleSearch);
      if (!conditions.length) return await originalMethod.call(this, arg);

      return await originalMethod.call(this, {
        ...arg,
        filter: mergeFilter(arg.filter, conditions),
      });
    };
  };
}

/**
 * `field` becomes a MongoDB query key, so an unknown one is rejected rather
 * than passed through: it is either a client typo or an attempt to reach a
 * prop the model deliberately does not expose.
 */
function assertFilterableFields(
  filterableProps: Set<string>,
  modelName: string,
  ...filters: (ISimpleFilter[] | undefined)[]
): void {
  for (const filter of filters) {
    for (const { field } of filter ?? []) {
      if (!isFilterableField(filterableProps, String(field)))
        throw new BadRequestException(
          MongooseErrorMessage.unfilterableField(String(field), modelName),
        );
    }
  }
}

function mergeFilter(
  filter: FilterQuery<unknown>,
  conditions: FilterQuery<unknown>[],
): FilterQuery<unknown> {
  // An explicitly passed filter is kept, not replaced by the simple filter
  const currentFilter =
    filter && Object.keys(filter).length ? [filter] : ([] as const);

  return { $and: [...currentFilter, ...conditions] };
}

function simpleFilterMapper(
  simpleFilter: ISimpleFilter[],
  simpleSearch: ISimpleFilter[],
): FilterQuery<unknown>[] {
  const filter = (simpleFilter ?? []).map(buildCondition);

  // A field that is already filtered is not searched on as well
  const search = (simpleSearch ?? [])
    .filter(
      (searchItem) =>
        !(simpleFilter ?? []).some((item) => item.field === searchItem.field),
    )
    .map(buildCondition);

  return [...filter, ...(search.length ? [{ $or: search }] : [])];
}

function buildCondition({
  field,
  operator,
  value,
}: ISimpleFilter): FilterQuery<unknown> {
  const condition = (query: Record<string, unknown>) => ({ [field]: query });

  switch (operator) {
    case SimpleFilterOperator.EQ:
      return condition({ $eq: value });
    case SimpleFilterOperator.NE:
      return condition({ $ne: value });
    case SimpleFilterOperator.GT:
      return condition({ $gt: value });
    case SimpleFilterOperator.GTE:
      return condition({ $gte: value });
    case SimpleFilterOperator.LT:
      return condition({ $lt: value });
    case SimpleFilterOperator.LTE:
      return condition({ $lte: value });
    case SimpleFilterOperator.IN:
      return condition({ $in: toArray(value) });
    case SimpleFilterOperator.NOT_IN:
      return condition({ $nin: toArray(value) });
    case SimpleFilterOperator.BETWEEN: {
      const [min, max] = toRange(field, value);
      return condition({ $gte: min, $lte: max });
    }
    case SimpleFilterOperator.NOT_BETWEEN: {
      const [min, max] = toRange(field, value);
      return condition({ $not: { $gte: min, $lte: max } });
    }
    case SimpleFilterOperator.IS:
      return condition({ $eq: toBoolean(field, value) });
    case SimpleFilterOperator.NOT:
      return condition({ $ne: toBoolean(field, value) });
    case SimpleFilterOperator.ELM_MTC:
      return condition({ $elemMatch: toElementMatch(field, value) });
    // `LIKE` matches the value literally, `REGEXP` takes a pattern
    case SimpleFilterOperator.LIKE:
      return condition({ $regex: escapeRegExp(toPattern(field, value)) });
    case SimpleFilterOperator.ILIKE:
      return condition({
        $regex: escapeRegExp(toPattern(field, value)),
        $options: 'i',
      });
    case SimpleFilterOperator.NOT_LIKE:
      return condition({
        $not: toRegExp(field, escapeRegExp(toPattern(field, value))),
      });
    case SimpleFilterOperator.NOT_ILIKE:
      return condition({
        $not: toRegExp(field, escapeRegExp(toPattern(field, value)), 'i'),
      });
    case SimpleFilterOperator.REGEXP:
      return condition({ $regex: toRegExp(field, toPattern(field, value)) });
    case SimpleFilterOperator.IREGEXP:
      return condition({
        $regex: toRegExp(field, toPattern(field, value), 'i'),
      });
    case SimpleFilterOperator.NOT_REGEXP:
      return condition({ $not: toRegExp(field, toPattern(field, value)) });
    case SimpleFilterOperator.NOT_IREGEXP:
      return condition({
        $not: toRegExp(field, toPattern(field, value), 'i'),
      });
    default:
      throw new BadRequestException(
        MongooseErrorMessage.unsupportedFilterOperator(
          String(field),
          String(operator),
        ),
      );
  }
}

function toArray(value: unknown): unknown[] {
  return value instanceof Array ? value : [value];
}

function toRange(
  field: ISimpleFilter['field'],
  value: unknown,
): [unknown, unknown] {
  if (!(value instanceof Array) || value.length !== 2)
    throw new BadRequestException(
      MongooseErrorMessage.invalidFilterValue(
        String(field),
        'a [min, max] pair',
      ),
    );

  return [value[0], value[1]];
}

function toBoolean(field: ISimpleFilter['field'], value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 'false') return value === 'true';

  throw new BadRequestException(
    MongooseErrorMessage.invalidFilterValue(String(field), 'a boolean'),
  );
}

function toElementMatch(
  field: ISimpleFilter['field'],
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || value instanceof Array)
    throw new BadRequestException(
      MongooseErrorMessage.invalidFilterValue(String(field), 'an object'),
    );

  return value as Record<string, unknown>;
}

function toPattern(field: ISimpleFilter['field'], value: unknown): string {
  const pattern = String(value);
  if (pattern.length > MAX_PATTERN_LENGTH)
    throw new BadRequestException(
      MongooseErrorMessage.filterValueTooLong(
        String(field),
        MAX_PATTERN_LENGTH,
      ),
    );

  return pattern;
}

function toRegExp(
  field: ISimpleFilter['field'],
  pattern: string,
  flags?: string,
): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch {
    throw new BadRequestException(
      MongooseErrorMessage.invalidFilterValue(
        String(field),
        'a valid regular expression',
      ),
    );
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
