/**
 * `-field` sorts descending and `+field` ascending. `toSortObject` is what
 * turns this into the sort mongoose actually understands — handing the string
 * to mongoose directly makes `+field` a no-op.
 */
export type PaginationSort = `+${string}` | `-${string}`;
