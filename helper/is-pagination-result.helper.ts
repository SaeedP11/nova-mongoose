import { IPagination } from '../interface/pagination.interface';

/**
 * Tells a paginate envelope apart from a document that happens to own an
 * `items` prop.
 */
export function isPaginationResult(
  result: any,
): result is IPagination<unknown> {
  return (
    !!result &&
    typeof result.totalItems === 'number' &&
    result.items instanceof Array
  );
}
