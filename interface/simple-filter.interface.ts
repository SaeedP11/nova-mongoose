import { SimpleFilterOperator } from '../enum/simple-filter-operator.enum';

/**
 * Most operators take a scalar, `IN` / `NOT_IN` / `BETWEEN` take an array and
 * `ELM_MTC` takes an object, so the shape is only settled per operator when
 * the condition is built. It stays `any` rather than becoming that union so a
 * filter built against this interface is still assignable to the narrower
 * `value` the published `nova-api-client` declares.
 */
export type SimpleFilterValue = any;

export interface ISimpleFilter<T = unknown> {
  field: keyof T;
  operator: SimpleFilterOperator;
  value: SimpleFilterValue;
}
