import { SortOrder } from 'mongoose';
import { PaginationSort } from '../type/pagination-sort.type';

export type SortObject = Record<string, SortOrder>;

/** `_id` is unique, so appending it turns any sort into a total order. */
const TIEBREAKER_FIELD = '_id';

/**
 * Mongoose only strips a leading `-` from a sort string, so `+name` reaches
 * MongoDB as a field literally called `+name` that no document has and the
 * sort silently does nothing. Parsing the prefix here is what makes ascending
 * sorts work at all.
 *
 * The `_id` tiebreaker matters just as much: `skip`/`limit` over a sort with
 * equal values has no defined order between pages, so the same document can
 * come back on two pages while another is never returned.
 */
export function toSortObject(sort?: PaginationSort): SortObject {
  const sortObject = parseSort(sort);

  // Newest first is the only ordering every entity can offer, `createdAt`
  // being declared on BaseEntity
  if (!Object.keys(sortObject).length) sortObject.createdAt = -1;

  if (!(TIEBREAKER_FIELD in sortObject)) sortObject[TIEBREAKER_FIELD] = -1;

  return sortObject;
}

/**
 * Only the paths the caller asked for, without the default or the
 * tiebreaker, which is what has to be checked against the filterable props.
 * `id` is sorted as `_id`, the same mapping `ModifyArgument` applies to
 * filters: no stored document has an `id` path.
 */
export function parseSort(sort?: PaginationSort): SortObject {
  const sortObject: SortObject = {};

  for (const token of String(sort ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)) {
    const direction: SortOrder = token.startsWith('-') ? -1 : 1;
    const path = token.replace(/^[+-]/, '');
    if (path) sortObject[path === 'id' ? '_id' : path] = direction;
  }

  return sortObject;
}
